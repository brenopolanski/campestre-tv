from tweener_ranking.models import Observation
from tweener_ranking.parser import (
    clean_athlete_name,
    observation_from_fields,
    parse_number,
    select_rows,
)


def test_parses_position_name_and_points_from_separate_fields():
    observation = observation_from_fields("1", "João Silva", "2450", 0.9)

    assert observation is not None
    assert observation.position == 1
    assert observation.name == "João Silva"
    assert observation.points == 2450


def test_does_not_treat_a_points_value_as_the_ranking_position():
    missing_position = observation_from_fields("", "Giovani Barbosa", "1608", 0.9)
    swapped = observation_from_fields("1608", "Giovani Barbosa", "1608", 0.9)
    kept = observation_from_fields("8", "Giovani Barbosa", "1608", 0.9)

    assert missing_position is None
    assert swapped is not None
    assert swapped.position == 1608
    assert swapped.points == 1608
    assert kept is not None
    assert kept.position == 8
    assert kept.points == 1608


def test_preserves_accents_ellipsis_and_collapses_whitespace():
    spaced = observation_from_fields("14", "  Vinícius   Leandro ", "1547", 0.9)
    truncated = observation_from_fields("52", "Eduardo Henrique Ca...", "1271", 0.9)

    assert spaced is not None
    assert spaced.name == "Vinícius Leandro"
    assert truncated is not None
    assert truncated.name == "Eduardo Henrique Ca..."


def test_strips_a_rank_change_token_leaked_from_beside_the_points():
    observation = observation_from_fields("2", "Mirko Perkusich a1", "1950", 0.8)

    assert observation is not None
    assert observation.name == "Mirko Perkusich"


def test_rejects_a_corrupted_name_instead_of_editing_it():
    assert clean_athlete_name("} a > Milito Farias") is None
    assert clean_athlete_name("Rod €) Giovani Barbosa |") is None
    assert observation_from_fields("20", "} a > Milito Farias", "1511", 0.4) is None


def test_accepts_decimal_points_and_thousands_separator():
    assert parse_number("2310,5") == 2310.5
    assert parse_number("2310.5") == 2310.5
    assert parse_number("2.450") == 2450
    assert parse_number("2450 pts") == 2450

    decimal = observation_from_fields("3", "Ana Lima", "2310,5", 0.9)
    grouped = observation_from_fields("4", "Bia Nunes", "2.450", 0.9)

    assert decimal is not None and decimal.points == 2310.5
    assert grouped is not None and grouped.points == 2450


def test_keeps_a_score_of_zero():
    observation = observation_from_fields("138", "Luca Lira", "0", 0.9)

    assert observation is not None
    assert observation.position == 138
    assert observation.name == "Luca Lira"
    assert observation.points == 0


def test_rejects_an_empty_position_or_points_field():
    assert observation_from_fields("5", "Carlos", "", 0.9) is None
    assert observation_from_fields("abc", "Carlos", "20", 0.9) is None


def test_keeps_readings_that_match_the_badge_spacing():
    indexed = [
        (0, [Observation(11, "Lucas Machado", 1560, 0.9)]),
        (1, [Observation(12, "Carlos Andrey", 1554, 0.9)]),
        (2, [Observation(12, "Repeated", 1550, 0.9)]),
        (3, [Observation(19, "Andrey Wanderley", 241, 0.4)]),
        (4, [Observation(15, "Matias Porto", 1538, 0.9)]),
        (5, [Observation(16, "Gabriel Santana", 200, 0.4)]),
    ]

    kept = select_rows(indexed)

    assert [(item.position, item.name) for item in kept] == [
        (11, "Lucas Machado"),
        (12, "Carlos Andrey"),
        (15, "Matias Porto"),
    ]


def test_picks_the_position_reading_that_fits_between_its_neighbors():
    indexed = [
        (3, [Observation(100, "Renato Gaudard", 975, 0.9)]),
        (
            4,
            [
                Observation(107, "Thiago Silva", 970, 0.8),
                Observation(101, "Thiago Silva", 970, 0.7),
            ],
        ),
        (5, [Observation(102, "André Germano", 935, 0.9)]),
    ]

    kept = select_rows(indexed)

    assert [item.position for item in kept] == [100, 101, 102]
    assert kept[1].name == "Thiago Silva"
