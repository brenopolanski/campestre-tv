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


@dataclass(frozen=True)
class Athlete:
    position: int
    name: str
    points: int | float


@dataclass(frozen=True)
class Consolidation:
    athletes: list[Athlete]
    conflicts: list[str]
    warnings: list[str]
