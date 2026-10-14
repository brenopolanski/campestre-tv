from tweener_ranking.deduplication import consolidate
from tweener_ranking.models import Observation


def obs(position: int, name: str, points: float, confidence: float = 0.9) -> Observation:
    return Observation(position=position, name=name, points=points, confidence=confidence)


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


def test_reports_ranking_gaps_without_filling_them():
    result = consolidate([obs(1, "Ana Lima", 10), obs(4, "Bia Nunes", 8)])

    assert [athlete.position for athlete in result.athletes] == [1, 4]
    assert any("Gap" in warning for warning in result.warnings)
