import json
from datetime import datetime, timezone
from pathlib import Path

from tweener_ranking.models import Athlete, Observation, ReadingEvidence, Review
from tweener_ranking.report import publish
from tweener_ranking.video import VideoDetails

UPDATED = datetime(2026, 10, 14, 18, 0, tzinfo=timezone.utc)
DETAILS = VideoDetails(width=1080, height=2340, fps=8.52, frame_count=2312, duration_seconds=271.5)


def athlete(position: int, name: str = "Ana Lima", points: int = 1000) -> Athlete:
    return Athlete(position=position, name=name, points=points)


def observation(position: int, name: str, points: float, confidence: float = 0.9) -> Observation:
    return Observation(position=position, name=name, points=points, confidence=confidence)


def publish_case(tmp_path: Path, athletes: list[Athlete], conflicts: list[str], reviews: list[Review]):
    output = tmp_path / "ranking.json"
    output.write_text('{"source":"previous"}\n', encoding="utf-8")
    original = output.read_text(encoding="utf-8")
    published, reasons = publish(
        output,
        athletes,
        conflicts,
        reviews,
        [observation(1, "Ana Lima", 1000), observation(9, "Guilerme Barbosa...", 1577, 0.4)],
        DETAILS,
        analyzed=40,
        skipped_blurry=2,
        skipped_repeated=10,
        skipped_waiting=80,
        updated_at=UPDATED,
    )
    return output, original, published, reasons


def test_a_valid_ranking_replaces_the_production_file(tmp_path: Path):
    output, _original, published, reasons = publish_case(
        tmp_path,
        [athlete(1, "Ana Lima", 2000), athlete(2, "Bia Nunes", 1900)],
        conflicts=[],
        reviews=[],
    )

    assert published is True
    assert reasons == []
    document = json.loads(output.read_text(encoding="utf-8"))
    assert [row["position"] for row in document["athletes"]] == [1, 2]
    assert document["source"] == "tweener"
    report = json.loads((tmp_path / "ranking.report.json").read_text(encoding="utf-8"))
    assert report["published"] is True
    assert report["video"] == {
        "width": 1080,
        "height": 2340,
        "fps": 8.52,
        "durationSeconds": 271.5,
    }
    assert report["frames"]["analyzed"] == 40
    assert report["rejectionReasons"] == []
    assert not (tmp_path / "ranking.candidate.json").exists()


def test_conflicts_keep_the_production_file_and_write_a_candidate(tmp_path: Path):
    review = Review(
        position=9,
        field="points",
        status="unresolved",
        message="Position 9: the points differ across frames.",
        readings=[
            ReadingEvidence("1577", 2, 0.91, 800, 0),
            ReadingEvidence("1517", 2, 0.9, 120, 2),
        ],
    )
    output, original, published, reasons = publish_case(
        tmp_path,
        [athlete(1), athlete(2, "Bia Nunes", 900)],
        conflicts=["Position 9: the points differ across frames."],
        reviews=[review],
    )

    assert published is False
    assert output.read_text(encoding="utf-8") == original
    assert any("Conflicting" in reason for reason in reasons)
    candidate = json.loads((tmp_path / "ranking.candidate.json").read_text(encoding="utf-8"))
    assert candidate["status"] == "candidate"
    assert [row["position"] for row in candidate["athletes"]] == [1, 2]
    report = json.loads((tmp_path / "ranking.report.json").read_text(encoding="utf-8"))
    assert report["published"] is False
    assert report["conflicts"][0]["position"] == 9
    assert report["conflicts"][0]["readings"][0]["value"] == "1577"
    assert report["conflicts"][0]["readings"][1]["occludedCount"] == 2
    assert report["truncatedNames"][0]["name"] == "Guilerme Barbosa..."
    assert report["lowConfidenceNames"][0]["position"] == 9


def test_missing_positions_do_not_replace_the_production_file(tmp_path: Path):
    output, original, published, reasons = publish_case(
        tmp_path,
        [athlete(1), athlete(4, "Bia Nunes", 800)],
        conflicts=[],
        reviews=[],
    )

    assert published is False
    assert output.read_text(encoding="utf-8") == original
    assert any("Missing positions remain: 2, 3." in reason for reason in reasons)
    report = json.loads((tmp_path / "ranking.report.json").read_text(encoding="utf-8"))
    assert report["missingPositions"] == [2, 3]
    assert (tmp_path / "ranking.candidate.json").exists()
