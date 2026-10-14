from collections import defaultdict

from tweener_ranking.models import Athlete, Consolidation, Observation
from tweener_ranking.parser import normalize_name


def _levenshtein(left: str, right: str) -> int:
    if left == right:
        return 0
    if not left:
        return len(right)
    if not right:
        return len(left)
    previous = list(range(len(right) + 1))
    for index, char in enumerate(left, start=1):
        current = [index]
        for other_index, other in enumerate(right, start=1):
            insert = current[other_index - 1] + 1
            delete = previous[other_index] + 1
            replace = previous[other_index - 1] + (char != other)
            current.append(min(insert, delete, replace))
        previous = current
    return previous[-1]


def names_are_near(left: str, right: str) -> bool:
    """True when two spellings are close enough to be the same OCR reading."""

    if left == right:
        return True
    distance = _levenshtein(left, right)
    limit = 1 if min(len(left), len(right)) <= 4 else 2
    return distance <= limit


def _as_points(value: float) -> int | float:
    if value == int(value):
        return int(value)
    return value


def _cluster_score(cluster: list[Observation]) -> float:
    return sum(item.confidence for item in cluster)


def _is_unresolved(winner_score: float, winner_count: int, rival_score: float, rival_count: int) -> bool:
    """A rival blocks the row only when it has comparable evidence.

    One stray reading does not throw away a spelling that the other frames agree on.
    A single reading against another single reading stays unresolved.
    """

    if rival_score < winner_score * 0.75:
        return False
    return rival_count >= 2 or winner_count <= 1


def _pick_name(group: list[Observation]) -> tuple[str | None, bool]:
    clusters: list[list[Observation]] = []
    for observation in group:
        key = normalize_name(observation.name)
        placed = False
        for cluster in clusters:
            if names_are_near(key, normalize_name(cluster[0].name)):
                cluster.append(observation)
                placed = True
                break
        if not placed:
            clusters.append([observation])

    ranked = sorted(clusters, key=_cluster_score, reverse=True)
    winner = ranked[0]
    if len(ranked) > 1 and _is_unresolved(
        _cluster_score(winner),
        len(winner),
        _cluster_score(ranked[1]),
        len(ranked[1]),
    ):
        return None, True
    best = max(winner, key=lambda item: item.confidence)
    return best.name, False


def _pick_points(group: list[Observation]) -> tuple[int | float | None, bool]:
    buckets: dict[int | float, list[Observation]] = defaultdict(list)
    for observation in group:
        buckets[_as_points(observation.points)].append(observation)
    ranked = sorted(buckets.items(), key=lambda item: _cluster_score(item[1]), reverse=True)
    if len(ranked) > 1 and _is_unresolved(
        _cluster_score(ranked[0][1]),
        len(ranked[0][1]),
        _cluster_score(ranked[1][1]),
        len(ranked[1][1]),
    ):
        return None, True
    return ranked[0][0], False


def _warnings(athletes: list[Athlete]) -> list[str]:
    warnings: list[str] = []
    for previous, following in zip(athletes, athletes[1:]):
        if following.position - previous.position > 1:
            warnings.append(
                f"Gap between positions {previous.position} and {following.position}."
            )
    for index, athlete in enumerate(athletes):
        key = normalize_name(athlete.name)
        for other in athletes[index + 1 :]:
            other_key = normalize_name(other.name)
            if key == other_key or (len(key) > 4 and names_are_near(key, other_key)):
                warnings.append(
                    "Repeated or similar names at positions "
                    f"{athlete.position} and {other.position}: {athlete.name} / {other.name}."
                )
    return warnings


def consolidate(observations: list[Observation]) -> Consolidation:
    """Merge the same athlete seen in several frames.

    Ranking position is the record key. A near-identical name is treated as
    one spelling. A disagreement is resolved when one reading has clearly
    more support. When the evidence is split, that position is reported and
    left out instead of being guessed.
    """

    grouped: dict[int, list[Observation]] = defaultdict(list)
    for observation in observations:
        grouped[observation.position].append(observation)

    athletes: list[Athlete] = []
    conflicts: list[str] = []
    for position in sorted(grouped):
        group = grouped[position]
        name, name_conflict = _pick_name(group)
        points, points_conflict = _pick_points(group)
        if name_conflict or name is None:
            conflicts.append(f"Position {position}: the name differs across frames.")
            continue
        if points_conflict or points is None:
            conflicts.append(f"Position {position}: the points differ across frames.")
            continue
        athletes.append(Athlete(position=position, name=name, points=points))

    return Consolidation(athletes=athletes, conflicts=conflicts, warnings=_warnings(athletes))
