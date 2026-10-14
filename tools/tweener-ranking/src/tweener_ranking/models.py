from dataclasses import dataclass


@dataclass(frozen=True)
class TextBox:
    """One OCR token and its place in the frame."""

    text: str
    confidence: float
    x: int
    y: int
    width: int
    height: int

    @property
    def center_x(self) -> float:
        return self.x + self.width / 2

    @property
    def center_y(self) -> float:
        return self.y + self.height / 2


@dataclass(frozen=True)
class Observation:
    """One athlete read from a single frame."""

    position: int
    name: str
    points: float
    confidence: float
    sharpness: float = 1.0
    points_occluded: bool = False


@dataclass(frozen=True)
class Athlete:
    position: int
    name: str
    points: int | float


@dataclass(frozen=True)
class ReadingEvidence:
    """One competing value and the observations behind it."""

    value: str
    count: int
    mean_confidence: float
    mean_sharpness: float
    occluded_count: int


@dataclass(frozen=True)
class Review:
    """A position whose readings were resolved, or still need a person."""

    position: int
    field: str
    status: str
    message: str
    readings: list[ReadingEvidence]


@dataclass(frozen=True)
class Consolidation:
    athletes: list[Athlete]
    conflicts: list[str]
    warnings: list[str]
    reviews: list[Review]
