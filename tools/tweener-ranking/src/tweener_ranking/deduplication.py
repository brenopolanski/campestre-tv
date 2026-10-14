from collections import defaultdict

from tweener_ranking.models import Athlete, Consolidation, Observation, ReadingEvidence, Review
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


def _quality(item: Observation, peak_sharpness: float) -> float:
    """Weight a reading by confidence and sharpness.

    An occluded points crop stays in the evidence, but it cannot carry as much
    weight as a clean crop of the same confidence. Sharpness is compared inside
    the position, so a blurry majority does not beat a sharper reading.
    """

    if peak_sharpness <= 0:
        sharpness = 1.0
    else:
        sharpness = min(1.0, item.sharpness / peak_sharpness)
    if item.points_occluded:
        sharpness *= 0.2
    return item.confidence * sharpness


def _cluster_score(cluster: list[Observation], peak_sharpness: float) -> float:
    return sum(_quality(item, peak_sharpness) for item in cluster)


def _evidence(value: str, cluster: list[Observation]) -> ReadingEvidence:
    count = len(cluster)
    return ReadingEvidence(
        value=value,
        count=count,
        mean_confidence=sum(item.confidence for item in cluster) / count,
        mean_sharpness=sum(item.sharpness for item in cluster) / count,
        occluded_count=sum(1 for item in cluster if item.points_occluded),
    )


def _is_unresolved(winner_score: float, winner_count: int, rival_score: float, rival_count: int) -> bool:
    """A rival blocks the row only when it has comparable evidence.

    One stray reading does not throw away a spelling that the other frames agree on.
    A single reading against another single reading stays unresolved.
    """

    if rival_score < winner_score * 0.75:
        return False
    return rival_count >= 2 or winner_count <= 1


def _name_clusters(group: list[Observation]) -> list[list[Observation]]:
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
    return clusters


def _pick_name(group: list[Observation], peak_sharpness: float) -> tuple[str | None, Review | None]:
    clusters = _name_clusters(group)
    ranked = sorted(clusters, key=lambda cluster: _cluster_score(cluster, peak_sharpness), reverse=True)
    readings = [
        _evidence(max(cluster, key=lambda item: item.confidence).name, cluster) for cluster in ranked
    ]
    winner = ranked[0]
    if len(ranked) > 1 and _is_unresolved(
        _cluster_score(winner, peak_sharpness),
        len(winner),
        _cluster_score(ranked[1], peak_sharpness),
        len(ranked[1]),
    ):
        return None, Review(
            position=group[0].position,
            field="name",
            status="unresolved",
            message=f"Position {group[0].position}: the name differs across frames.",
            readings=readings,
        )
    best = max(winner, key=lambda item: _quality(item, peak_sharpness))
    review = None
    if len(ranked) > 1:
        review = Review(
            position=group[0].position,
            field="name",
            status="resolved",
            message=f"Position {group[0].position}: kept the name with stronger image evidence.",
            readings=readings,
        )
    return best.name, review


def _points_buckets(group: list[Observation]) -> list[tuple[int | float, list[Observation]]]:
    buckets: dict[int | float, list[Observation]] = defaultdict(list)
    for observation in group:
        buckets[_as_points(observation.points)].append(observation)
    return list(buckets.items())


def _drop_clipped_prefixes(
    ranked: list[tuple[int | float, list[Observation]]],
) -> list[tuple[int | float, list[Observation]]]:
    """Drop a points reading that is a clipped prefix of a longer one.

    A pill cut by the edge of the frame loses its last digit, so ``195`` and
    ``1950`` are the same observation. The shorter value is not a second score.
    Two complete values that are not prefixes of each other are left to conflict.
    """

    texts = [str(points) for points, _cluster in ranked]
    clipped = {
        text
        for text in texts
        if len(text) >= 3
        and any(other.startswith(text) and len(other) == len(text) + 1 for other in texts)
    }
    if not clipped:
        return ranked
    kept = [item for item in ranked if str(item[0]) not in clipped]
    return kept or ranked


def _usable_points(group: list[Observation]) -> tuple[list[Observation], list[Observation]]:
    """Prefer clean pills. Occluded crops are evidence, not the vote, when a clean crop exists."""

    clean = [item for item in group if not item.points_occluded]
    occluded = [item for item in group if item.points_occluded]
    if clean:
        return clean, occluded
    return [], occluded


def _pick_points(group: list[Observation], peak_sharpness: float) -> tuple[int | float | None, Review | None]:
    clean, occluded = _usable_points(group)
    readings = [
        _evidence(str(points), cluster)
        for points, cluster in sorted(
            _points_buckets(group),
            key=lambda item: _cluster_score(item[1], peak_sharpness),
            reverse=True,
        )
    ]
    position = group[0].position
    if not clean:
        return None, Review(
            position=position,
            field="points",
            status="unresolved",
            message=f"Position {position}: every points reading was occluded.",
            readings=readings,
        )

    ranked = sorted(_points_buckets(clean), key=lambda item: _cluster_score(item[1], peak_sharpness), reverse=True)
    complete = _drop_clipped_prefixes(ranked)
    clipped = len(complete) < len(ranked)
    ranked = complete
    winner_points, winner = ranked[0]
    if len(ranked) > 1 and _is_unresolved(
        _cluster_score(winner, peak_sharpness),
        len(winner),
        _cluster_score(ranked[1][1], peak_sharpness),
        len(ranked[1][1]),
    ):
        return None, Review(
            position=position,
            field="points",
            status="unresolved",
            message=f"Position {position}: the points differ across frames.",
            readings=readings,
        )
    if len(winner) == 1 and winner[0].confidence < 0.45:
        return None, Review(
            position=position,
            field="points",
            status="unresolved",
            message=f"Position {position}: the only clean points reading has low confidence.",
            readings=readings,
        )
    review = None
    if len(ranked) > 1 or occluded or clipped:
        review = Review(
            position=position,
            field="points",
            status="resolved",
            message=f"Position {position}: kept the points value with stronger image evidence.",
            readings=readings,
        )
    return winner_points, review


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
    reviews: list[Review] = []
    for position in sorted(grouped):
        group = grouped[position]
        peak_sharpness = max(item.sharpness for item in group)
        name, name_review = _pick_name(group, peak_sharpness)
        points, points_review = _pick_points(group, peak_sharpness)
        for review in (name_review, points_review):
            if review is not None:
                reviews.append(review)
        if name_review is not None and name_review.status == "unresolved" or name is None:
            conflicts.append(f"Position {position}: the name differs across frames.")
            continue
        if points_review is not None and points_review.status == "unresolved" or points is None:
            conflicts.append(
                points_review.message
                if points_review is not None
                else f"Position {position}: the points differ across frames."
            )
            continue
        athletes.append(Athlete(position=position, name=name, points=points))

    return Consolidation(
        athletes=athletes,
        conflicts=conflicts,
        warnings=_warnings(athletes),
        reviews=reviews,
    )
