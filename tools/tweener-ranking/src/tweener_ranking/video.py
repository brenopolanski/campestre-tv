from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

class VideoError(Exception):
    """The video could not be read."""


@dataclass(frozen=True)
class VideoDetails:
    width: int
    height: int
    fps: float
    frame_count: int
    duration_seconds: float


class FrameSampler:
    """Yield settled frames and skip ones that are still moving or unchanged.

    Motion is the mean absolute difference from the previous sample on a
    98×212 grayscale signature. A flick between two resting screens is above
    ``motion_threshold``. The next sample, once the list has stopped, is kept.
    A later sample of that same resting screen is skipped.
    """

    def __init__(
        self,
        path: Path,
        interval: float,
        motion_threshold: float = 8.0,
        still_threshold: float = 3.0,
    ) -> None:
        if interval <= 0:
            raise VideoError("The sampling interval must be greater than 0.")
        if not path.is_file():
            raise VideoError(f"Video not found: {path}")
        self.path = path
        self.interval = interval
        self.motion_threshold = motion_threshold
        self.still_threshold = still_threshold
        self.analyzed = 0
        self.skipped_similar = 0
        self.skipped_motion = 0
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
        try:
            while True:
                ok, frame = self._capture.read()
                if not ok:
                    break
                if index % step == 0:
                    signature = _signature(frame)
                    if previous_sample is None:
                        motion = 0.0
                    else:
                        motion = _changed(previous_sample, signature)
                    previous_sample = signature
                    if motion > self.motion_threshold:
                        self.skipped_motion += 1
                    elif (
                        previous_yield is not None
                        and _changed(previous_yield, signature) < self.still_threshold
                    ):
                        self.skipped_similar += 1
                    else:
                        previous_yield = signature
                        self.analyzed += 1
                        yield frame
                index += 1
        finally:
            self._capture.release()
            self._capture = None


def _signature(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image
    return cv2.resize(gray, (98, 212), interpolation=cv2.INTER_AREA)


def _changed(previous: np.ndarray, current: np.ndarray) -> float:
    return float(np.mean(cv2.absdiff(previous, current)))
