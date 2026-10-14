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
ROW_CENTER_MIN = 90
ROW_CENTER_MAX = 785
MIN_BADGE_BAND = 22


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
    centers: list[int] = []
    start = previous = int(bright[0])
    for raw in list(bright[1:]) + [None]:
        y = None if raw is None else int(raw)
        if y is not None and y == previous + 1:
            previous = y
            continue
        height = previous - start + 1
        center = (start + previous) // 2
        if height >= band_floor and minimum <= center <= maximum:
            centers.append(center)
        if y is None:
            break
        start = previous = y
    return centers


def badge_digit(gray: np.ndarray, center_y: int, scale: Scale) -> np.ndarray | None:
    """Black digit on white, cropped out of the scalloped badge."""

    y0 = max(0, center_y - scale.sy(22))
    y1 = min(gray.shape[0], center_y + scale.sy(22))
    x0 = max(0, scale.sx(BADGE_X0))
    x1 = min(gray.shape[1], scale.sx(BADGE_X1))
    crop = gray[y0:y1, x0:x1]
    if crop.size == 0:
        return None
    big = cv2.resize(crop, None, fx=6, fy=6, interpolation=cv2.INTER_CUBIC)
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

    y0 = max(0, center_y - scale.sy(18))
    y1 = min(gray.shape[0], center_y + scale.sy(18))
    x0 = max(0, scale.sx(NAME_X0))
    x1 = min(gray.shape[1], scale.sx(NAME_X1))
    crop = gray[y0:y1, x0:x1]
    if crop.size == 0 or crop.shape[0] < 8 or crop.shape[1] < 20:
        return None
    big = cv2.resize(crop, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    return cv2.bitwise_not(big)


def points_digit(gray: np.ndarray, center_y: int, scale: Scale) -> np.ndarray | None:
    """Black digits from the gray points pill, without the chevron or a finger."""

    y0 = max(0, center_y - scale.sy(20))
    y1 = min(gray.shape[0], center_y + scale.sy(20))
    x0 = max(0, scale.sx(POINTS_X0))
    x1 = min(gray.shape[1], scale.sx(POINTS_X1))
    crop = gray[y0:y1, x0:x1]
    if crop.size == 0:
        return None
    big = cv2.resize(crop, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
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
    digits = _drop_large_blobs(digits)
    ink = np.where(digits < 128)
    if len(ink[0]) < 20:
        return None
    return cv2.copyMakeBorder(digits, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)


def _drop_large_blobs(image: np.ndarray) -> np.ndarray:
    """Remove a fingertip or other round mark that covers the pill."""

    ink = (image < 128).astype(np.uint8) * 255
    contours, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cleaned = image.copy()
    limit = image.shape[0] * image.shape[0] * 0.35
    for contour in contours:
        if cv2.contourArea(contour) > limit:
            cv2.drawContours(cleaned, [contour], -1, 255, thickness=-1)
    return cleaned
