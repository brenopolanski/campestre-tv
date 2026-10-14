import cv2
import numpy as np
import pytest

from tweener_ranking.layout import (
    BADGE_X0,
    BADGE_X1,
    NAME_X0,
    NAME_X1,
    POINTS_X0,
    POINTS_X1,
    _drop_overlays,
    detect_badge_centers,
    scale_for,
)


def _badge_frame(width: int, height: int, centers: list[int]) -> np.ndarray:
    image = np.zeros((height, width), dtype=np.uint8)
    scale = scale_for(width, height)
    x0 = scale.sx(16)
    x1 = scale.sx(50)
    half = max(4, scale.sy(16))
    for center in centers:
        y = scale.sy(center)
        image[y - half : y + half, x0:x1] = 220
    return image


def test_crop_fractions_match_at_both_resolutions():
    small = scale_for(392, 850)
    large = scale_for(1080, 2340)
    regions = (
        (BADGE_X0, BADGE_X1),
        (NAME_X0, NAME_X1),
        (POINTS_X0, POINTS_X1),
    )
    for x0, x1 in regions:
        assert large.sx(x0) / 1080 == pytest.approx(small.sx(x0) / 392, abs=0.01)
        assert large.sx(x1) / 1080 == pytest.approx(small.sx(x1) / 392, abs=0.01)


def test_badge_centers_land_on_the_same_rows_at_both_resolutions():
    reference = [160, 242, 324, 406]
    small = detect_badge_centers(_badge_frame(392, 850, reference), scale_for(392, 850))
    large = detect_badge_centers(_badge_frame(1080, 2340, reference), scale_for(1080, 2340))

    assert len(small) == len(reference)
    assert len(large) == len(reference)
    for narrow, wide, center in zip(small, large, reference, strict=True):
        assert narrow / 850 == pytest.approx(center / 850, abs=0.02)
        assert wide / 2340 == pytest.approx(center / 850, abs=0.02)


def test_a_lone_zero_is_kept():
    image = np.full((80, 80), 255, dtype=np.uint8)
    cv2.circle(image, (40, 40), 18, 0, thickness=4)

    cleaned, occluded = _drop_overlays(image)

    assert occluded is False
    assert int(cleaned.min()) == 0


def test_a_round_overlay_beside_the_digits_does_not_mark_the_crop_occluded():
    image = np.full((80, 180), 255, dtype=np.uint8)
    cv2.putText(image, "1899", (8, 55), cv2.FONT_HERSHEY_SIMPLEX, 1.2, 0, 3)
    cv2.circle(image, (145, 40), 24, 0, thickness=-1)

    cleaned, occluded = _drop_overlays(image)

    assert occluded is False
    assert int(cleaned[:, 120:].min()) == 255
    assert int(cleaned[:, :100].min()) == 0
