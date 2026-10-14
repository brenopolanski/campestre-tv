import json
import os
from datetime import datetime, timezone
from pathlib import Path

from tweener_ranking.models import Athlete
from tweener_ranking.parser import clean_athlete_name


class ExportError(Exception):
    """The ranking file was not written."""


def points_value(points: int | float) -> int | float:
    if isinstance(points, float) and points == int(points):
        return int(points)
    return points


def build_document(athletes: list[Athlete], updated_at: datetime) -> dict:
    moment = updated_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ordered = sorted(athletes, key=lambda athlete: athlete.position)
    return {
        "updatedAt": moment,
        "source": "tweener",
        "athletes": [
            {
                "position": athlete.position,
                "name": athlete.name,
                "points": points_value(athlete.points),
            }
            for athlete in ordered
        ],
    }


def render_document(document: dict) -> str:
    return json.dumps(document, ensure_ascii=False, indent=2) + "\n"


def validate_ranking(athletes: list[Athlete], conflicts: list[str]) -> str | None:
    """Return a reason to refuse the file, or None when the ranking can be written.

    Conflicts and broken records are refused. Gaps are reported by the caller
    and do not, by themselves, reject an otherwise consistent file.
    """

    if conflicts:
        return "Conflicting athlete records could not be resolved."
    if not athletes:
        return "No athletes were recognized."
    positions = [athlete.position for athlete in athletes]
    if len(positions) != len(set(positions)):
        return "Duplicate ranking positions remain after consolidation."
    for athlete in athletes:
        if not isinstance(athlete.position, int) or isinstance(athlete.position, bool):
            return "A ranking position is not an integer from the position column."
        if athlete.position < 1:
            return f"Ranking position {athlete.position} is not a positive integer."
        if clean_athlete_name(athlete.name) != athlete.name:
            return f"Athlete name {athlete.name!r} is empty or corrupted."
        if isinstance(athlete.points, bool) or not isinstance(athlete.points, (int, float)):
            return "A points value is missing."
        if athlete.points < 0:
            return f"Points for position {athlete.position} are negative."
    return None


def save_ranking(
    path: Path,
    athletes: list[Athlete],
    conflicts: list[str],
    updated_at: datetime,
) -> None:
    """Write ranking.json atomically.

    Validation failure writes nothing. An existing file is left as it is.
    """

    reason = validate_ranking(athletes, conflicts)
    if reason is not None:
        if path.exists():
            raise ExportError(f"{reason} Refusing to replace {path}.")
        raise ExportError(f"{reason} No JSON file was written.")

    payload = render_document(build_document(athletes, updated_at))
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.tmp")
    try:
        temporary.write_text(payload, encoding="utf-8")
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()
