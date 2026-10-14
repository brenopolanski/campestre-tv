import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from tweener_ranking.exporter import ExportError, save_ranking
from tweener_ranking.models import Athlete

UPDATED = datetime(2026, 10, 14, 15, 0, tzinfo=timezone.utc)


def athlete(position: int = 1, name: str = "João Silva", points: int | float = 2450) -> Athlete:
    return Athlete(position=position, name=name, points=points)


def test_writes_utf8_json_sorted_schema(tmp_path: Path):
    destination = tmp_path / "ranking.json"
    save_ranking(
        destination,
        [athlete(2, "Maria", 10.5), athlete(1, "João Silva", 2450)],
        conflicts=[],
        updated_at=UPDATED,
    )

    raw = destination.read_bytes()
    assert "João".encode() in raw
    document = json.loads(raw.decode("utf-8"))
    assert document == {
        "updatedAt": "2026-10-14T15:00:00Z",
        "source": "tweener",
        "athletes": [
            {"position": 1, "name": "João Silva", "points": 2450},
            {"position": 2, "name": "Maria", "points": 10.5},
        ],
    }
    assert raw.decode("utf-8").startswith("{\n  ")
    assert not (tmp_path / "ranking.json.tmp").exists()


def test_empty_result_does_not_create_a_file(tmp_path: Path):
    destination = tmp_path / "ranking.json"
    with pytest.raises(ExportError, match="No athletes"):
        save_ranking(destination, [], conflicts=[], updated_at=UPDATED)
    assert not destination.exists()


def test_conflicts_do_not_replace_an_existing_file(tmp_path: Path):
    destination = tmp_path / "ranking.json"
    destination.write_text('{"source":"tweener","athletes":[]}\n', encoding="utf-8")
    original = destination.read_text(encoding="utf-8")

    with pytest.raises(ExportError, match="Refusing to replace"):
        save_ranking(
            destination,
            [athlete()],
            conflicts=["Position 3: the name differs across frames."],
            updated_at=UPDATED,
        )

    assert destination.read_text(encoding="utf-8") == original


def test_conflicts_do_not_create_a_new_file(tmp_path: Path):
    destination = tmp_path / "ranking.json"
    with pytest.raises(ExportError, match="No JSON file was written"):
        save_ranking(
            destination,
            [athlete()],
            conflicts=["Position 3: the name differs across frames."],
            updated_at=UPDATED,
        )
    assert not destination.exists()


def test_a_corrupted_name_does_not_replace_an_existing_file(tmp_path: Path):
    destination = tmp_path / "ranking.json"
    destination.write_text('{"source":"tweener"}\n', encoding="utf-8")
    original = destination.read_text(encoding="utf-8")

    with pytest.raises(ExportError, match="Refusing to replace"):
        save_ranking(
            destination,
            [athlete(name="} a > Milito Farias")],
            conflicts=[],
            updated_at=UPDATED,
        )

    assert destination.read_text(encoding="utf-8") == original


def test_duplicate_positions_are_not_written(tmp_path: Path):
    destination = tmp_path / "ranking.json"
    with pytest.raises(ExportError, match="Duplicate"):
        save_ranking(
            destination,
            [athlete(1, "Ana Lima", 10), athlete(1, "Bia Nunes", 9)],
            conflicts=[],
            updated_at=UPDATED,
        )
    assert not destination.exists()
