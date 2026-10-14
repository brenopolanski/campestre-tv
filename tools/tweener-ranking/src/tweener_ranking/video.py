from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from tweener_ranking.layout import (
    NAME_X0,
    NAME_X1,
    ROW_CENTER_MAX,
    ROW_CENTER_MIN,
    scale_for,
)

# Center-to-center spacing of ranking rows on the 392×850 recording.
REFERENCE_ROW_PITCH = 82
# A name band this soft is not readable, whatever the running baseline is.
ABSOLUTE_BLUR = 8.0

class VideoError(Exception):
    """The video could not be read."""


@dataclass(frozen=True)
class VideoDetails:
    width: int
    height: int
    fps: float
    frame_count: int
    duration_seconds: float


def classify_sample(
    *,
    motion: float,
    shift: float,
    sharpness: float,
    baseline_sharpness: float | None,
    changed_from_keep: float,
    has_keep: bool,
    motion_threshold: float,
    still_threshold: float,
    row_advance: float,
    blur_ratio: float,
) -> str:
    """Decide whether a candidate frame is worth reading.

    ``motion`` is the change since the previous candidate. ``shift`` is how far
    the list has moved since the last kept frame, in pixels. A sharp frame is
    kept when the list has advanced by about a row, and also when a new resting
    screen appears. A soft frame is rejected even if the list moved. A resting
    screen that repeats the last kept frame is skipped.
    """

    if sharpness < ABSOLUTE_BLUR:
        return "blurry"
    if baseline_sharpness is not None and sharpness < baseline_sharpness * blur_ratio:
        return "blurry"
    if not has_keep:
        return "keep"
    if abs(shift) >= row_advance:
        return "keep"
    if motion > motion_threshold:
        return "waiting"
    if changed_from_keep < still_threshold:
        return "repeated"
    return "keep"


def frame_sharpness(gray: np.ndarray) -> float:
    """Laplacian variance of the name band, scaled to the reference frame."""

    scale = scale_for(gray.shape[1], gray.shape[0])
    y0 = min(gray.shape[0], max(0, scale.sy(ROW_CENTER_MIN)))
    y1 = min(gray.shape[0], max(y0 + 1, scale.sy(ROW_CENTER_MAX)))
    x0 = min(gray.shape[1], max(0, scale.sx(NAME_X0)))
    x1 = min(gray.shape[1], max(x0 + 1, scale.sx(NAME_X1)))
    band = gray[y0:y1, x0:x1]
    if band.size == 0:
        return 0.0
    small = cv2.resize(
        band,
        (max(1, NAME_X1 - NAME_X0), max(1, ROW_CENTER_MAX - ROW_CENTER_MIN)),
        interpolation=cv2.INTER_AREA,
    )
    return float(cv2.Laplacian(small, cv2.CV_64F).var())


def row_advance_px(height: int, rows: float) -> float:
    return rows * REFERENCE_ROW_PITCH * (height / 850)


def badge_column(gray: np.ndarray) -> np.ndarray:
    scale = scale_for(gray.shape[1], gray.shape[0])
    x0 = max(0, scale.sx(12))
    x1 = min(gray.shape[1], max(x0 + 1, scale.sx(54)))
    y0 = max(0, scale.sy(ROW_CENTER_MIN))
    y1 = min(gray.shape[0], max(y0 + 1, scale.sy(ROW_CENTER_MAX)))
    return gray[y0:y1, x0:x1].mean(axis=1).astype(np.float32)


def vertical_shift(previous: np.ndarray, current: np.ndarray) -> float:
    """Pixels the list moved between two badge columns. Positive is downward."""

    if previous.shape != current.shape or previous.size < 10:
        return 0.0
    left = previous - float(previous.mean())
    right = current - float(current.mean())
    correlation = np.correlate(right, left, mode="full")
    return float(int(np.argmax(correlation)) - (len(previous) - 1))


class FrameSampler:
    """Yield sharp frames and skip blur, duplicates, and unchanged scroll steps.

    Motion is the mean absolute difference from the previous sample on a
    98×212 grayscale signature. A screen recording stays sharp while the list
    scrolls, so motion alone does not reject a frame. A frame is read when its
    rows are sharp and the list has moved about ``row_advance_rows`` since the
    previous read, or when a new resting screen appears.
    """

    def __init__(
        self,
        path: Path,
        interval: float,
        motion_threshold: float = 8.0,
        still_threshold: float = 3.0,
        blur_ratio: float = 0.55,
        row_advance_rows: float = 1.5,
    ) -> None:
        if interval <= 0:
            raise VideoError("The sampling interval must be greater than 0.")
        if row_advance_rows <= 0:
            raise VideoError("The row advance must be greater than 0.")
        if not path.is_file():
            raise VideoError(f"Video not found: {path}")
        self.path = path
        self.interval = interval
        self.motion_threshold = motion_threshold
        self.still_threshold = still_threshold
        self.blur_ratio = blur_ratio
        self.row_advance_rows = row_advance_rows
        self.analyzed = 0
        self.skipped_similar = 0
        self.skipped_motion = 0
        self.skipped_blurry = 0
        self._capture: cv2.VideoCapture | None = None
        self.details: VideoDetails | None = None

    def open(self) -> VideoDetails:
        capture = cv2.VideoCapture(str(self.path))
        if not capture.isOpened():
            capture.release()
            raise VideoError(f"Could not open video: {self.path}")
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
        if fps <= 0:
            fps = 30.0
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        if width <= 0 or height <= 0:
            capture.release()
            raise VideoError(f"Could not read video frames: {self.path}")
        self._capture = capture
        self.details = VideoDetails(
            width=width,
            height=height,
            fps=fps,
            frame_count=frame_count,
            duration_seconds=frame_count / fps if frame_count else 0,
        )
        return self.details

    def __iter__(self):
        if self._capture is None or self.details is None:
            self.open()
        assert self._capture is not None
        assert self.details is not None
        step = max(1, int(round(self.details.fps * self.interval)))
        index = 0
        previous_sample: np.ndarray | None = None
        previous_yield: np.ndarray | None = None
        previous_column: np.ndarray | None = None
        baseline_sharpness: float | None = None
        accumulated_shift = 0.0
        advance = row_advance_px(self.details.height, self.row_advance_rows)
        try:
            while True:
                ok, frame = self._capture.read()
                if not ok:
                    break
                if index % step == 0:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if frame.ndim == 3 else frame
                    signature = _signature(gray)
                    column = badge_column(gray)
                    sharpness = frame_sharpness(gray)
                    motion = 0.0 if previous_sample is None else _changed(previous_sample, signature)
                    previous_sample = signature
                    # Measure the step from the previous candidate. A one-row
                    # periodic badge pattern aliases a multi-row correlation,
                    # and a single step of this recording is well under a row.
                    if previous_column is not None:
                        accumulated_shift += vertical_shift(previous_column, column)
                    previous_column = column
                    shift = accumulated_shift
                    changed = 0.0 if previous_yield is None else _changed(previous_yield, signature)
                    decision = classify_sample(
                        motion=motion,
                        shift=shift,
                        sharpness=sharpness,
                        baseline_sharpness=baseline_sharpness,
                        changed_from_keep=changed,
                        has_keep=previous_yield is not None,
                        motion_threshold=self.motion_threshold,
                        still_threshold=self.still_threshold,
                        row_advance=advance,
                        blur_ratio=self.blur_ratio,
                    )
                    if decision == "keep":
                        previous_yield = signature
                        accumulated_shift = 0.0
                        baseline_sharpness = (
                            sharpness
                            if baseline_sharpness is None
                            else (baseline_sharpness * 0.8) + (sharpness * 0.2)
                        )
                        self.analyzed += 1
                        yield frame
                    elif decision == "blurry":
                        self.skipped_blurry += 1
                    elif decision == "repeated":
                        self.skipped_similar += 1
                    else:
                        self.skipped_motion += 1
                index += 1
        finally:
            self._capture.release()
            self._capture = None


def _signature(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
    return cv2.resize(gray, (98, 212), interpolation=cv2.INTER_AREA)


def _changed(previous: np.ndarray, current: np.ndarray) -> float:
    return float(np.mean(cv2.absdiff(previous, current)))
