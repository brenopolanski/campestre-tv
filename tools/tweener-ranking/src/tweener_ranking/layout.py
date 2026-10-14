"""Ranking regions measured on the 392×850 Tweener screen recording.

Each row, from left to right, is:

- a scalloped position badge (about x 16–49)
- an avatar (about x 57–106), which is not text
- the athlete name, starting near x 112
- a small colored rank-change mark near x 282–297
- a gray points pill near x 306–352
- a chevron

The status bar, the "Ranking / Standings" header, and the home indicator sit
outside the badge centers accepted below. Coordinates are pixels of that
recording and scale with the frame.
"""

from dataclasses import dataclass

import cv2
import numpy as np

REFERENCE_WIDTH = 392
REFERENCE_HEIGHT = 850

BADGE_X0 = 8
BADGE_X1 = 56
NAME_X0 = 112
NAME_X1 = 268
POINTS_X0 = 248
POINTS_X1 = 372

# Badge centers outside this band are clipped by the header or the home indicator.
# The lower bound still requires the whole badge to sit inside the frame, so a
# last fully visible row is kept and a row cut by the gesture bar is not.
ROW_CENTER_MIN = 90
ROW_CENTER_MAX = 815
MIN_BADGE_BAND = 22
BADGE_HALF = 22
NAME_HALF = 18
POINTS_HALF = 20

# OCR images are resized to the height they had on the 392×850 recording.
BADGE_OCR_HEIGHT = BADGE_HALF * 2 * 6
NAME_OCR_HEIGHT = NAME_HALF * 2 * 3
POINTS_OCR_HEIGHT = POINTS_HALF * 2 * 4


@dataclass(frozen=True)
class Scale:
    x: float
    y: float

    def sx(self, value: int) -> int:
        return int(round(value * self.x))

    def sy(self, value: int) -> int:
        return int(round(value * self.y))


def scale_for(width: int, height: int) -> Scale:
    return Scale(x=width / REFERENCE_WIDTH, y=height / REFERENCE_HEIGHT)


def _resize_for_ocr(crop: np.ndarray, target_height: int) -> np.ndarray:
    """Resize a crop to the glyph size used on the reference recording.

    A fixed upscale makes a 1080-wide frame send Tesseract an image about
    three times taller than the 392-wide recording. Matching the target
    height keeps the kernels and the OCR input equivalent at both sizes.
    """

    height = crop.shape[0]
    if height <= 0 or target_height <= 0:
        return crop
    factor = target_height / height
    if abs(factor - 1) < 0.05:
        return crop
    interpolation = cv2.INTER_CUBIC if factor > 1 else cv2.INTER_AREA
    return cv2.resize(crop, None, fx=factor, fy=factor, interpolation=interpolation)


def detect_badge_centers(gray: np.ndarray, scale: Scale) -> list[int]:
    """Return the vertical center of each position badge.

    Badges are the light scalloped marks in the left column. Avatar pixels
    and the points pills are outside that column, so they are not rows.
    """

    x0 = max(0, scale.sx(12))
    x1 = min(gray.shape[1], scale.sx(54))
    if x1 <= x0:
        return []
    column = gray[:, x0:x1].mean(axis=1)
    bright = np.where(column > 45)[0]
    if len(bright) == 0:
        return []

    minimum = scale.sy(ROW_CENTER_MIN)
    maximum = scale.sy(ROW_CENTER_MAX)
    band_floor = max(8, scale.sy(MIN_BADGE_BAND))
    half = scale.sy(BADGE_HALF)
    frame_height = gray.shape[0]
    centers: list[int] = []
    start = previous = int(bright[0])
    for raw in list(bright[1:]) + [None]:
        y = None if raw is None else int(raw)
        if y is not None and y == previous + 1:
            previous = y
            continue
        height = previous - start + 1
        center = (start + previous) // 2
        fully_inside = half <= center < frame_height - half
        if height >= band_floor and minimum <= center <= maximum and fully_inside:
            centers.append(center)
        if y is None:
            break
        start = previous = y
    return centers


def badge_digit(gray: np.ndarray, center_y: int, scale: Scale) -> np.ndarray | None:
    """Black digit on white, cropped out of the scalloped badge."""

    y0 = max(0, center_y - scale.sy(BADGE_HALF))
    y1 = min(gray.shape[0], center_y + scale.sy(BADGE_HALF))
    x0 = max(0, scale.sx(BADGE_X0))
    x1 = min(gray.shape[1], scale.sx(BADGE_X1))
    crop = gray[y0:y1, x0:x1]
    if crop.size == 0 or y1 - y0 < scale.sy(BADGE_HALF):
        return None
    big = _resize_for_ocr(crop, BADGE_OCR_HEIGHT)
    badge = ((big > 90).astype(np.uint8)) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    badge = cv2.morphologyEx(badge, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(badge, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    contour = max(contours, key=cv2.contourArea)
    if cv2.contourArea(contour) < 800:
        return None
    mask = np.zeros_like(badge)
    cv2.drawContours(mask, [contour], -1, 255, thickness=-1)
    mask = cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
    dark = (big < 110) & (mask > 0)
    ys, xs = np.where(dark)
    if len(xs) < 15:
        return None
    digit = np.full(big.shape, 255, dtype=np.uint8)
    digit[dark] = 0
    pad = 16
    left = max(0, int(xs.min()) - pad)
    right = min(digit.shape[1] - 1, int(xs.max()) + pad)
    top = max(0, int(ys.min()) - pad)
    bottom = min(digit.shape[0] - 1, int(ys.max()) + pad)
    glyph = digit[top : bottom + 1, left : right + 1]
    return cv2.copyMakeBorder(glyph, 24, 24, 24, 24, cv2.BORDER_CONSTANT, value=255)


def name_image(gray: np.ndarray, center_y: int, scale: Scale) -> np.ndarray | None:
    """Name line, stopping before the points pill. Text is black on white."""

    y0 = max(0, center_y - scale.sy(NAME_HALF))
    y1 = min(gray.shape[0], center_y + scale.sy(NAME_HALF))
    x0 = max(0, scale.sx(NAME_X0))
    x1 = min(gray.shape[1], scale.sx(NAME_X1))
    crop = gray[y0:y1, x0:x1]
    if crop.size == 0 or crop.shape[0] < 8 or crop.shape[1] < 20:
        return None
    if y1 - y0 < scale.sy(NAME_HALF):
        return None
    big = _resize_for_ocr(crop, NAME_OCR_HEIGHT)
    return cv2.bitwise_not(big)


@dataclass(frozen=True)
class DigitCrop:
    """Prepared points image and whether an overlay covered the digits."""

    image: np.ndarray
    occluded: bool


def points_digit(gray: np.ndarray, center_y: int, scale: Scale) -> DigitCrop | None:
    """Black digits from the gray points pill, without the chevron or a finger."""

    y0 = max(0, center_y - scale.sy(POINTS_HALF))
    y1 = min(gray.shape[0], center_y + scale.sy(POINTS_HALF))
    x0 = max(0, scale.sx(POINTS_X0))
    x1 = min(gray.shape[1], scale.sx(POINTS_X1))
    crop = gray[y0:y1, x0:x1]
    if crop.size == 0 or y1 - y0 < scale.sy(POINTS_HALF):
        return None
    big = _resize_for_ocr(crop, POINTS_OCR_HEIGHT)
    pill = (((big > 40) & (big < 130)).astype(np.uint8)) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 9))
    pill = cv2.morphologyEx(pill, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(pill, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best: tuple[int, int, int, int] | None = None
    best_area = 0.0
    for contour in contours:
        x, y, width, height = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        # The pill is the wide gray box. The chevron beside it is much narrower.
        if width < 80 or height < 24:
            continue
        if area > best_area:
            best = (x, y, width, height)
            best_area = area
    if best is None:
        return None
    x, y, width, height = best
    inset = 6
    roi = big[y + inset : y + height - inset, x + inset : x + width - inset]
    if roi.size == 0:
        return None
    digits = np.full(roi.shape, 255, dtype=np.uint8)
    bright = roi > 140
    digits[bright] = 0
    digits, occluded = _drop_overlays(digits)
    ink = np.where(digits < 128)
    if len(ink[0]) < 20:
        return None
    image = cv2.copyMakeBorder(digits, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
    return DigitCrop(image=image, occluded=occluded)


def _drop_overlays(image: np.ndarray) -> tuple[np.ndarray, bool]:
    """Remove a fingertip or the screen-recording button beside the pill.

    A round mark that only sits beside the digits is removed and the reading
    stays usable. A mark that overlaps the digits is removed too, and the
    crop is marked occluded so that reading cannot outvote a clean one.
    """

    ink = (image < 128).astype(np.uint8) * 255
    contours, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    components = [contour for contour in contours if cv2.contourArea(contour) >= 80]
    # A lone 0 is round. It is the score, not the record button.
    if len(components) <= 1:
        return image, False
    limit = image.shape[0] * image.shape[0] * 0.2
    overlays: list[np.ndarray] = []
    for contour in components:
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        circularity = 0.0 if perimeter <= 0 else 4 * np.pi * area / (perimeter * perimeter)
        x, _y, width, height = cv2.boundingRect(contour)
        round_blob = circularity > 0.62 and min(width, height) > image.shape[0] * 0.28
        others = [other for other in components if other is not contour]
        other_right = max(cv2.boundingRect(other)[0] + cv2.boundingRect(other)[2] for other in others)
        beside_the_digits = x >= other_right - 2
        if beside_the_digits and (area > limit or round_blob):
            overlays.append(contour)
        elif area > limit and not beside_the_digits:
            overlays.append(contour)
    if not overlays:
        return image, False

    cleaned = image.copy()
    for contour in overlays:
        cv2.drawContours(cleaned, [contour], -1, 255, thickness=-1)
    occluded = _overlays_cover_digits(cleaned, overlays)
    return cleaned, occluded


def _overlays_cover_digits(cleaned: np.ndarray, overlays: list[np.ndarray]) -> bool:
    remaining = np.where(cleaned < 128)
    if len(remaining[0]) < 20:
        return True
    top = int(remaining[0].min())
    bottom = int(remaining[0].max())
    left = int(remaining[1].min())
    right = int(remaining[1].max())
    for contour in overlays:
        x, y, width, height = cv2.boundingRect(contour)
        separated = x > right or x + width < left or y > bottom or y + height < top
        if not separated:
            return True
    # The overlay sat beside the number. The digits themselves were not covered.
    return False
