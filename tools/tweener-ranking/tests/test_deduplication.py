from tweener_ranking.deduplication import consolidate
from tweener_ranking.models import Observation


def obs(
    position: int,
    name: str,
    points: float,
    confidence: float = 0.9,
    sharpness: float = 1.0,
    points_occluded: bool = False,
) -> Observation:
    return Observation(
        position=position,
        name=name,
        points=points,
        confidence=confidence,
        sharpness=sharpness,
        points_occluded=points_occluded,
    )


def test_merges_duplicate_observations_and_sorts_by_position():
    result = consolidate(
        [
            obs(2, "Maria Souza", 2310, 0.8),
            obs(1, "João Silva", 2450, 0.95),
            obs(1, "Joao Silva", 2450, 0.7),
            obs(2, "Maria Souza", 2310, 0.6),
        ]
    )

    assert [athlete.position for athlete in result.athletes] == [1, 2]
    assert result.athletes[0].name == "João Silva"
    assert result.athletes[0].points == 2450
    assert result.conflicts == []


def test_keeps_the_consistent_points_value():
    result = consolidate(
        [
            obs(1, "Ana Lima", 10, 0.9),
            obs(1, "Ana Lima", 10, 0.8),
            obs(1, "Ana Lima", 99, 0.2),
        ]
    )

    assert result.athletes[0].points == 10
    assert result.conflicts == []


def test_keeps_the_majority_when_one_reading_disagrees():
    result = consolidate(
        [
            obs(8, "Giovani Barbosa", 1608, 0.9),
            obs(8, "Giovani Barbosa", 1608, 0.92),
            obs(8, "Giovani Barbosa", 1608, 0.88),
            obs(8, "Rod Giovani Barbosa", 4, 0.4),
        ]
    )

    assert len(result.athletes) == 1
    assert result.athletes[0].name == "Giovani Barbosa"
    assert result.athletes[0].points == 1608
    assert result.conflicts == []


def test_flags_unresolved_name_and_point_conflicts():
    names = consolidate([obs(1, "Ana Lima", 10, 0.9), obs(1, "Bruno Costa", 10, 0.9)])
    points = consolidate([obs(4, "Ana Lima", 10, 0.9), obs(4, "Ana Lima", 80, 0.85)])

    assert names.athletes == []
    assert "name" in names.conflicts[0]
    assert points.athletes == []
    assert "points" in points.conflicts[0]


def test_does_not_merge_similar_names_at_different_positions():
    result = consolidate(
        [
            obs(1, "Ana Silva", 100),
            obs(2, "Ana Silve", 90),
        ]
    )

    assert [athlete.name for athlete in result.athletes] == ["Ana Silva", "Ana Silve"]
    assert any("similar" in warning.lower() or "Repeated" in warning for warning in result.warnings)


def test_an_occluded_majority_does_not_beat_a_clean_reading():
    result = consolidate(
        [
            obs(3, "Lee Tavares", 1890, 0.95, points_occluded=True),
            obs(3, "Lee Tavares", 1890, 0.94, points_occluded=True),
            obs(3, "Lee Tavares", 1890, 0.93, points_occluded=True),
            obs(3, "Lee Tavares", 1899, 0.9),
            obs(3, "Lee Tavares", 1899, 0.88),
        ]
    )

    assert result.athletes[0].points == 1899
    assert result.conflicts == []
    assert result.reviews[0].status == "resolved"
    occluded = next(reading for reading in result.reviews[0].readings if reading.occluded_count)
    assert occluded.value == "1890"
    assert occluded.count == 3


def test_a_blurry_majority_does_not_beat_a_sharp_reading():
    result = consolidate(
        [
            Observation(4, "Heberth Domingos", 1730, 0.95, sharpness=80),
            Observation(4, "Heberth Domingos", 1730, 0.94, sharpness=70),
            Observation(4, "Heberth Domingos", 1730, 0.93, sharpness=75),
            Observation(4, "Heberth Domingos", 1732, 0.8, sharpness=900),
        ]
    )

    assert result.athletes[0].points == 1732
    assert result.conflicts == []


def test_equal_clean_points_stay_unresolved_with_evidence():
    result = consolidate(
        [
            obs(9, "Guilerme Barbosa", 1577, 0.9, sharpness=800),
            obs(9, "Guilerme Barbosa", 1517, 0.88, sharpness=820),
        ]
    )

    assert result.athletes == []
    assert "points" in result.conflicts[0]
    review = result.reviews[0]
    assert review.status == "unresolved"
    assert {reading.value for reading in review.readings} == {"1577", "1517"}
    assert all(reading.count == 1 for reading in review.readings)


def test_a_clipped_points_prefix_keeps_the_complete_value():
    result = consolidate(
        [
            obs(2, "Mirko Perkusich", 195, 0.92, sharpness=1500),
            obs(2, "Mirko Perkusich", 1950, 0.91, sharpness=1510),
        ]
    )

    assert result.conflicts == []
    assert result.athletes[0].points == 1950
    assert result.reviews[0].status == "resolved"
    assert {reading.value for reading in result.reviews[0].readings} == {"195", "1950"}


def test_a_single_low_confidence_reading_is_not_published():
    result = consolidate([obs(12, "Ana Lima", 1400, 0.3)])

    assert result.athletes == []
    assert "low confidence" in result.conflicts[0]


def test_reports_ranking_gaps_without_filling_them():
    result = consolidate([obs(1, "Ana Lima", 10), obs(4, "Bia Nunes", 8)])

    assert [athlete.position for athlete in result.athletes] == [1, 4]
    assert any("Gap" in warning for warning in result.warnings)
