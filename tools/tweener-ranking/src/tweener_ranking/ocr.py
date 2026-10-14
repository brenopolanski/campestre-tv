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
    # A line reading of "111" often comes back as "1" or "1117". Each ink
    # glyph is read on its own, and the result is kept only when the number
    # of characters matches the number of glyphs.
    per_glyph = _read_glyphs(image)
    if per_glyph is not None and per_glyph[0] not in seen and (glyphs == 0 or len(per_glyph[0]) == glyphs):
        return [per_glyph]
    if fallback is None:
        return []
    return [fallback]


def _read_glyphs(image: np.ndarray) -> tuple[str, float] | None:
    ink = ((image < 128).astype(np.uint8)) * 255
    contours, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    glyphs = [contour for contour in contours if cv2.contourArea(contour) > 40]
    if not glyphs:
        return None
    glyphs.sort(key=lambda contour: cv2.boundingRect(contour)[0])
    characters: list[str] = []
    confidences: list[float] = []
    for contour in glyphs:
        x, y, width, height = cv2.boundingRect(contour)
        crop = image[max(0, y - 8) : y + height + 8, max(0, x - 8) : x + width + 8]
        if crop.size == 0:
            return None
        padded = cv2.copyMakeBorder(crop, 16, 16, 16, 16, cv2.BORDER_CONSTANT, value=255)
        text, confidence = read_line(padded, "eng", 10, whitelist="0123456789")
        if len(text) != 1:
            return None
        characters.append(text)
        confidences.append(confidence)
    return "".join(characters), sum(confidences) / len(confidences)


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
