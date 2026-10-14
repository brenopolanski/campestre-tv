import cv2
import numpy as np
import pytesseract
from pytesseract import Output


class OcrError(Exception):
    """Local OCR could not run."""


_language_warning_shown = False


def read_line(image, lang: str, psm: int, whitelist: str | None = None) -> tuple[str, float]:
    """Read one prepared line. Returns the text and the mean word confidence."""

    config = f"--psm {psm} --oem 1"
    if whitelist:
        config += f" -c tessedit_char_whitelist={whitelist}"
    data = _read(image, lang, config)
    words: list[str] = []
    confidences: list[float] = []
    for raw_text, raw_confidence in zip(data["text"], data["conf"], strict=True):
        text = str(raw_text).strip()
        if not text:
            continue
        try:
            confidence = float(raw_confidence)
        except (TypeError, ValueError):
            continue
        if confidence < 0:
            continue
        words.append(text)
        confidences.append(confidence / 100)
    if not words:
        return "", 0.0
    return " ".join(words), sum(confidences) / len(confidences)


def read_digits(image, modes: tuple[int, ...] = (8, 7)) -> tuple[str, float]:
    """Read one digits-only crop. See ``read_digit_options`` for the rules."""

    options = read_digit_options(image, modes)
    if not options:
        return "", 0.0
    return options[0]


def read_digit_options(image, modes: tuple[int, ...] = (8, 7)) -> list[tuple[str, float]]:
    """Readings whose length matches the number of ink glyphs.

    Badge mode 8 and mode 7 sometimes disagree on a digit, as when ``101`` is
    read as ``107``. Both are returned so the row spacing can decide. A reading
    with the wrong number of digits is ignored. Points use mode 7 first because
    mode 8 turns a 5 in the points pill into an 8.
    """

    glyphs = _glyph_count(image)
    matched: list[tuple[str, float]] = []
    fallback: tuple[str, float] | None = None
    seen: set[str] = set()
    for psm in modes:
        text, confidence = read_line(image, "eng", psm, whitelist="0123456789")
        if not text or text in seen:
            continue
        seen.add(text)
        if fallback is None:
            fallback = (text, confidence)
        if glyphs == 0 or len(text) == glyphs:
            matched.append((text, confidence))
    if matched:
        return matched
    if fallback is None:
        return []
    return [fallback]


def _glyph_count(image: np.ndarray) -> int:
    ink = ((image < 128).astype(np.uint8)) * 255
    contours, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return sum(1 for contour in contours if cv2.contourArea(contour) > 40)


def _read(image, lang: str, config: str) -> dict:
    global _language_warning_shown
    try:
        return pytesseract.image_to_data(image, lang=lang, config=config, output_type=Output.DICT)
    except pytesseract.TesseractNotFoundError as error:
        raise OcrError(
            "Tesseract is not installed. On macOS, run: brew install tesseract tesseract-lang"
        ) from error
    except pytesseract.TesseractError as error:
        if lang != "eng":
            if not _language_warning_shown:
                print(
                    f"Tesseract language '{lang}' is unavailable. Falling back to English. "
                    "Install Portuguese data with: brew install tesseract-lang"
                )
                _language_warning_shown = True
            return _read(image, "eng", config)
        raise OcrError(f"Tesseract failed: {error}") from error
