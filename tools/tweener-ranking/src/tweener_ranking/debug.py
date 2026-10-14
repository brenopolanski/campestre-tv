"""Diagnostic images for --debug. They are never part of ranking.json."""

from pathlib import Path

import cv2
import numpy as np

from tweener_ranking.layout import BADGE_X0, NAME_X1, POINTS_X1, ROW_CENTER_MAX, ROW_CENTER_MIN
from tweener_ranking.rows import RowCapture


def save_frame_debug(directory: Path, index: int, frame: np.ndarray, rows: list[RowCapture]) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    stem = f"frame_{index:04d}"
    annotated = frame.copy() if frame.ndim == 3 else cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
    height, width = annotated.shape[:2]
    scale_x = width / 392
    scale_y = height / 850
    left = int(round(BADGE_X0 * scale_x))
    right = int(round(POINTS_X1 * scale_x))
    top = int(round(ROW_CENTER_MIN * scale_y))
    bottom = int(round(min(height - 1, ROW_CENTER_MAX * scale_y)))
    cv2.rectangle(annotated, (left, top), (right, bottom), (0, 180, 255), 1)

    frame_dir = directory / stem
    frame_dir.mkdir(parents=True, exist_ok=True)
    notes: list[str] = []
    for row_index, row in enumerate(rows):
        y = row.center_y
        cv2.line(annotated, (left, y), (right, y), (0, 220, 0), 1)
        label = _label(row)
        cv2.putText(
            annotated,
            label,
            (left, max(12, y - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.35,
            (0, 220, 0),
            1,
            cv2.LINE_AA,
        )
        _write_crop(frame_dir / f"row_{row_index:02d}_position.png", row.position_image)
        _write_crop(frame_dir / f"row_{row_index:02d}_name.png", row.name_image)
        _write_crop(frame_dir / f"row_{row_index:02d}_points.png", row.points_image)
        kept = ""
        if row.observation is not None:
            kept = (
                f" -> {row.observation.position} | {row.observation.name} | "
                f"{row.observation.points:g}"
            )
        notes.append(
            f"y={row.center_y} position={row.position_text!r} "
            f"name={row.name_text!r} points={row.points_text!r}{kept}"
        )

    cv2.imwrite(str(directory / f"{stem}.png"), annotated)
    (frame_dir / "rows.txt").write_text("\n".join(notes) + "\n", encoding="utf-8")


def _label(row: RowCapture) -> str:
    if row.observation is None:
        return f"? {row.position_text} {row.name_text} {row.points_text}".strip()
    return f"{row.observation.position} {row.observation.name} {row.observation.points:g}"


def _write_crop(path: Path, image: np.ndarray | None) -> None:
    if image is None:
        return
    cv2.imwrite(str(path), image)
