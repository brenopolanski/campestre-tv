"""Read one frame by cropping each ranking row into position, name, and points."""

from dataclasses import dataclass

import cv2
import numpy as np

from tweener_ranking.layout import (
    badge_digit,
    detect_badge_centers,
    name_image,
    points_digit,
    scale_for,
)
from tweener_ranking.models import Observation
from tweener_ranking.ocr import read_digit_options, read_digits, read_line
from tweener_ranking.parser import observation_from_fields, select_rows


@dataclass(frozen=True)
class RowCapture:
    """One detected row, including the images and text used to read it."""

    center_y: int
    position_image: np.ndarray | None
    name_image: np.ndarray | None
    points_image: np.ndarray | None
    position_text: str
    name_text: str
    points_text: str
    observation: Observation | None


def _sharpness(image: np.ndarray | None) -> float:
    if image is None or image.size == 0:
        return 0.0
    return float(cv2.Laplacian(image, cv2.CV_64F).var())


def read_frame(frame: np.ndarray, lang: str = "por+eng") -> list[RowCapture]:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if frame.ndim == 3 else frame
    scale = scale_for(gray.shape[1], gray.shape[0])
    captures: list[RowCapture] = []
    pending: list[list[Observation]] = []
    indexed: list[tuple[int, list[Observation]]] = []
    for row_index, center_y in enumerate(detect_badge_centers(gray, scale)):
        position_image = badge_digit(gray, center_y, scale)
        name = name_image(gray, center_y, scale)
        points_crop = points_digit(gray, center_y, scale)
        points_image = None if points_crop is None else points_crop.image
        position_options: list[tuple[str, float]] = []
        name_text, name_confidence = ("", 0.0)
        points_text, points_confidence = ("", 0.0)
        if position_image is not None:
            position_options = read_digit_options(position_image, modes=(8, 7))
        if name is not None:
            name_text, name_confidence = read_line(name, lang, psm=7)
        points_occluded = False
        if points_crop is not None:
            points_text, points_confidence = read_digits(points_crop.image, modes=(7, 6))
            points_occluded = points_crop.occluded
        position_text = "|".join(text for text, _confidence in position_options)
        observations: list[Observation] = []
        sharpness = _sharpness(name)
        for text, position_confidence in position_options:
            confidences = [
                value
                for value in (position_confidence, name_confidence, points_confidence)
                if value > 0
            ]
            confidence = sum(confidences) / len(confidences) if confidences else 0.0
            observation = observation_from_fields(
                text,
                name_text,
                points_text,
                confidence,
                sharpness=sharpness,
                points_occluded=points_occluded,
            )
            if observation is not None:
                observations.append(observation)
        if observations:
            indexed.append((row_index, observations))
        pending.append(observations)
        captures.append(
            RowCapture(
                center_y=center_y,
                position_image=position_image,
                name_image=name,
                points_image=points_image,
                position_text=position_text,
                name_text=name_text,
                points_text=points_text,
                observation=None,
            )
        )
    accepted = {id(item) for item in select_rows(indexed)}
    resolved: list[RowCapture] = []
    for capture, observations in zip(captures, pending, strict=True):
        chosen = next((item for item in observations if id(item) in accepted), None)
        if chosen is None:
            resolved.append(capture)
            continue
        resolved.append(
            RowCapture(
                center_y=capture.center_y,
                position_image=capture.position_image,
                name_image=capture.name_image,
                points_image=capture.points_image,
                position_text=capture.position_text,
                name_text=capture.name_text,
                points_text=capture.points_text,
                observation=chosen,
            )
        )
    return resolved
