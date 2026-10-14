import re
import unicodedata

from tweener_ranking.models import Observation

# Whole strings that belong to the Tweener chrome, not to an athlete.
_IGNORED = {
    "ranking",
    "classificacao",
    "standings",
    "rounds",
    "pontos",
    "points",
    "pts",
    "ponto",
    "tweener",
    "atletas",
    "atleta",
}


def strip_accents(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value)
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")


def normalize_name(name: str) -> str:
    folded = strip_accents(name).casefold()
    return re.sub(r"\s+", " ", folded).strip()


def parse_number(token: str) -> float | None:
    """Read one numeric token.

    A dot grouping three digits, as in ``2.450``, is a thousands separator.
    A comma, or a dot with one or two decimal places, is a decimal mark.
    """

    text = token.strip().lower()
    text = re.sub(r"\s*(pts?|pontos)$", "", text).strip()
    text = text.rstrip("º°.)")
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", text):
        return float(text.replace(".", ""))
    if re.fullmatch(r"\d+,\d+", text):
        return float(text.replace(",", "."))
    if re.fullmatch(r"\d+\.\d+", text) or re.fullmatch(r"\d+", text):
        return float(text)
    return None


def clean_athlete_name(raw: str) -> str | None:
    """Normalize a name taken from the name column.

    A rank-change mark sits just left of the points pill and can leak in as a
    short token such as ``a1``. That token is removed. Other symbols are kept
    when they are part of the name, and a corrupted string is rejected.
    """

    text = re.sub(r"\s+", " ", raw).strip()
    text = re.sub(r"\s+[A-Za-z]?\d{1,3}$", "", text).strip()
    text = re.sub(r"\s+[^\w.]+$", "", text, flags=re.UNICODE).strip()
    if not text or normalize_name(text) in _IGNORED:
        return None
    if re.search(r"[{}|€<>@#$%^*=_+\\/~`]", text):
        return None
    if sum(char.isalpha() for char in text) < 3:
        return None
    return text


def observation_from_fields(
    position_text: str,
    name_text: str,
    points_text: str,
    confidence: float,
    sharpness: float = 1.0,
    points_occluded: bool = False,
) -> Observation | None:
    """Build one observation from the three column readings.

    The position text and the points text are parsed separately. A number that
    only appears in the points text can never become the ranking position.
    """

    position = parse_number(position_text)
    points = parse_number(points_text)
    if position is None or points is None:
        return None
    if position != int(position) or int(position) < 1:
        return None
    if points < 0:
        return None
    name = clean_athlete_name(name_text)
    if name is None:
        return None
    return Observation(
        position=int(position),
        name=name,
        points=points,
        confidence=confidence,
        sharpness=sharpness,
        points_occluded=points_occluded,
    )


def select_rows(indexed: list[tuple[int, list[Observation]]]) -> list[Observation]:
    """Keep readings that agree with the vertical spacing of the badges.

    Adjacent badges are adjacent ranking positions. A row may offer more than
    one position reading. The reading that continues the spacing is kept.
    A points value that collapses far below the row above is a clipped pill
    and is dropped. Nothing is rewritten to fill a hole.
    """

    count = len(indexed)
    if count == 0:
        return []

    best: dict[tuple[int, int], tuple[int, tuple[int, int] | None]] = {}
    for index, (row_index, options) in enumerate(indexed):
        for option_index, observation in enumerate(options):
            length = 1
            parent: tuple[int, int] | None = None
            for earlier_index in range(index):
                earlier_row, earlier_options = indexed[earlier_index]
                index_gap = row_index - earlier_row
                if index_gap <= 0:
                    continue
                for earlier_option, earlier in enumerate(earlier_options):
                    if observation.position - earlier.position != index_gap:
                        continue
                    candidate = best[(earlier_index, earlier_option)][0] + 1
                    if candidate > length:
                        length = candidate
                        parent = (earlier_index, earlier_option)
            best[(index, option_index)] = (length, parent)

    end = max(
        best,
        key=lambda key: (best[key][0], indexed[key[0]][1][key[1]].confidence),
    )
    chosen: list[tuple[int, int]] = []
    cursor: tuple[int, int] | None = end
    while cursor is not None:
        chosen.append(cursor)
        cursor = best[cursor][1]
    chosen.reverse()

    kept: list[Observation] = []
    for index, option_index in chosen:
        observation = indexed[index][1][option_index]
        if kept:
            earlier_points = kept[-1].points
            drop = earlier_points - observation.points
            if earlier_points > 0 and drop > 400 and observation.points < earlier_points * 0.5:
                continue
        kept.append(observation)
    return kept
