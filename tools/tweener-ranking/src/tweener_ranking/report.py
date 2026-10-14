"""Candidate ranking and diagnostic report.

``ranking.json`` is written only when validation passes. A failed run writes
``ranking.candidate.json`` and ``ranking.report.json`` beside the output path
and leaves an existing production file untouched.
"""

import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from tweener_ranking.exporter import build_document, render_document, save_ranking, validate_ranking
from tweener_ranking.models import Athlete, Observation, Review
from tweener_ranking.video import VideoDetails


def missing_positions(athletes: list[Athlete]) -> list[int]:
    if not athletes:
        return []
    positions = sorted(athlete.position for athlete in athletes)
    present = set(positions)
    return [position for position in range(positions[0], positions[-1] + 1) if position not in present]


def rejection_reasons(athletes: list[Athlete], conflicts: list[str]) -> list[str]:
    """Reasons the production file must not be replaced.

    Conflicts and broken records come from the existing validator. A gap, or a
    list that does not start at position 1, is also withheld: those athletes
    stay in the candidate for review and are not invented.
    """

    reasons: list[str] = []
    reason = validate_ranking(athletes, conflicts)
    if reason is not None:
        reasons.append(reason)
    missing = missing_positions(athletes)
    if missing:
        listed = ", ".join(str(position) for position in missing)
        reasons.append(f"Missing positions remain: {listed}.")
    if athletes and athletes[0].position != 1:
        reasons.append(f"The extracted ranking starts at position {athletes[0].position}.")
    return reasons


def _round(value: float) -> float:
    return round(value, 3)


def _review_payload(review: Review) -> dict:
    return {
        "position": review.position,
        "field": review.field,
        "status": review.status,
        "message": review.message,
        "readings": [
            {
                "value": reading.value,
                "count": reading.count,
                "meanConfidence": _round(reading.mean_confidence),
                "meanSharpness": _round(reading.mean_sharpness),
                "occludedCount": reading.occluded_count,
            }
            for reading in review.readings
        ],
    }


def name_notes(observations: list[Observation]) -> tuple[list[dict], list[dict]]:
    grouped: dict[int, list[Observation]] = defaultdict(list)
    for observation in observations:
        grouped[observation.position].append(observation)
    low: list[dict] = []
    truncated: list[dict] = []
    for position in sorted(grouped):
        group = grouped[position]
        best = max(group, key=lambda item: item.confidence)
        mean = sum(item.confidence for item in group) / len(group)
        if mean < 0.55:
            low.append(
                {
                    "position": position,
                    "name": best.name,
                    "meanConfidence": _round(mean),
                    "count": len(group),
                }
            )
        if "..." in best.name or "…" in best.name:
            truncated.append({"position": position, "name": best.name})
    return low, truncated


def build_report(
    details: VideoDetails,
    analyzed: int,
    skipped_blurry: int,
    skipped_repeated: int,
    skipped_waiting: int,
    observations: list[Observation],
    athletes: list[Athlete],
    reviews: list[Review],
    published: bool,
    reasons: list[str],
) -> dict:
    low_confidence, truncated = name_notes(observations)
    conflicts = [review for review in reviews if review.status == "unresolved"]
    return {
        "video": {
            "width": details.width,
            "height": details.height,
            "fps": round(details.fps, 2),
            "durationSeconds": round(details.duration_seconds, 1),
        },
        "frames": {
            "analyzed": analyzed,
            "skippedBlurry": skipped_blurry,
            "skippedRepeated": skipped_repeated,
            "skippedWaiting": skipped_waiting,
        },
        "observations": len(observations),
        "athletes": len(athletes),
        "missingPositions": missing_positions(athletes),
        "conflicts": [_review_payload(review) for review in conflicts],
        "resolvedReadings": [
            _review_payload(review) for review in reviews if review.status == "resolved"
        ],
        "lowConfidenceNames": low_confidence,
        "truncatedNames": truncated,
        "published": published,
        "rejectionReasons": reasons,
    }


def _write_json(path: Path, payload: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(payload, encoding="utf-8")


def candidate_path(output: Path) -> Path:
    return output.with_name(f"{output.stem}.candidate{output.suffix}")


def report_path(output: Path) -> Path:
    return output.with_name(f"{output.stem}.report{output.suffix}")


def publish(
    output: Path,
    athletes: list[Athlete],
    conflicts: list[str],
    reviews: list[Review],
    observations: list[Observation],
    details: VideoDetails,
    analyzed: int,
    skipped_blurry: int,
    skipped_repeated: int,
    skipped_waiting: int,
    updated_at: datetime,
) -> tuple[bool, list[str]]:
    """Write the report and, when needed, a candidate. Publish only a valid ranking.

    Returns whether ``output`` was replaced, and the rejection reasons.
    """

    reasons = rejection_reasons(athletes, conflicts)
    published = not reasons
    document = build_report(
        details,
        analyzed,
        skipped_blurry,
        skipped_repeated,
        skipped_waiting,
        observations,
        athletes,
        reviews,
        published,
        reasons,
    )
    _write_json(report_path(output), render_document(document))
    if published:
        save_ranking(output, athletes, conflicts, updated_at)
        stale = candidate_path(output)
        if stale.exists():
            stale.unlink()
        return True, []

    candidate = build_document(athletes, updated_at)
    candidate["status"] = "candidate"
    candidate["rejectionReasons"] = reasons
    _write_json(candidate_path(output), render_document(candidate))
    return False, reasons
