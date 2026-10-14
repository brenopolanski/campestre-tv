import numpy as np
import pytest

from tweener_ranking.video import classify_sample, row_advance_px, vertical_shift


def decision(**overrides: float | bool | None) -> str:
    values: dict[str, float | bool | None] = {
        "motion": 20.0,
        "shift": 0.0,
        "sharpness": 400.0,
        "baseline_sharpness": 400.0,
        "changed_from_keep": 20.0,
        "has_keep": True,
        "motion_threshold": 8.0,
        "still_threshold": 3.0,
        "row_advance": 120.0,
        "blur_ratio": 0.55,
    }
    values.update(overrides)
    return classify_sample(**values)  # type: ignore[arg-type]


def test_a_sharp_scrolling_frame_is_kept_once_a_row_has_advanced():
    assert decision(motion=22, shift=130) == "keep"


def test_a_sharp_scrolling_frame_waits_until_the_list_advances():
    assert decision(motion=22, shift=40) == "waiting"


def test_a_blurry_frame_is_rejected_even_when_the_list_moved():
    assert decision(sharpness=100, shift=400) == "blurry"


def test_a_repeated_resting_screen_is_skipped():
    assert decision(motion=1, shift=2, changed_from_keep=1) == "repeated"


def test_a_new_resting_screen_is_kept():
    assert decision(motion=1, shift=10, changed_from_keep=12) == "keep"


def test_row_advance_scales_with_frame_height():
    assert row_advance_px(850, 1.5) == 82 * 1.5
    assert row_advance_px(2340, 1.5) == pytest.approx(82 * 1.5 * (2340 / 850))


def test_vertical_shift_measures_a_small_scroll_step():
    column = np.zeros(400, dtype=np.float32)
    column[40:70] = 200
    column[120:150] = 180
    moved = np.roll(column, -20)

    assert vertical_shift(column, moved) == -20
