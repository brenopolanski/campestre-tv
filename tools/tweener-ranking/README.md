# Tweener ranking extractor

Local macOS tool that reads a screen recording of the Tweener ranking list and writes `ranking.json` for Campestre.tv. It does not call Tweener, and it does not upload the video.

The Campestre.tv site is a Next.js app. This tool lives in `tools/tweener-ranking/` and is not part of that runtime.

## Why Tesseract

PaddleOCR depends on PaddlePaddle, whose macOS wheels are large and often lag behind current Python releases on Apple Silicon. Tesseract runs locally on both Apple Silicon and Intel Macs, supports Portuguese, and needs no API key. Language data is installed by Homebrew. The first run does not download a model.

## 1. Prerequisites

- macOS
- [Homebrew](https://brew.sh)
- Python 3.11 or newer
- Tesseract, including the Portuguese language data

## 2. Python

Check the version:

```bash
python3 --version
```

If it is older than 3.11, install a current Python:

```bash
brew install python@3.12
```

The rest of this guide uses `python3.12`. Use `python3` instead when that command is already 3.11 or newer.

## 3. Virtual environment

From the repository root:

```bash
cd tools/tweener-ranking
python3.12 -m venv .venv
source .venv/bin/activate
```

## 4. Install dependencies

```bash
pip install -r requirements.txt
brew install tesseract tesseract-lang
```

## 5. OCR language data

`brew install tesseract-lang` installs Portuguese (`por`) and English. There is no separate model download. If Portuguese data is missing, the tool says so and retries with English, which is weaker for accented names.

## 6. Process a video

```bash
python process_ranking.py /path/to/ranking.mp4
```

MOV files work the same way:

```bash
python process_ranking.py "/path/to/my ranking.mov"
```

OpenCV must be able to decode the file. MP4 and MOV from the iPhone are the expected inputs.

## 7. Choose the output path

By default the file is `ranking.json` in the current working directory.

```bash
python process_ranking.py ./videos/ranking.mp4 --output ./ranking.json
```

## 8. What the messages mean

A normal run prints:

- the video size, frame rate, and duration
- how many settled frames were analyzed, and how many moving or repeated frames were skipped
- warnings for gaps or similar names
- how many athletes were written
- the absolute path of `ranking.json`

`Conflict:` lines mean the same ranking position had two readings with similar support. That position is left out, and the JSON is not written.

## 9. Unrecognized athletes and inconsistencies

- No athletes, unresolved conflicts, a corrupted name, or a duplicate position: the command exits with code 2 and does not write a file. An existing `ranking.json` is left untouched.
- A missing video exits with code 1.
- Warnings do not stop the run. A gap between positions is reported and left as a gap. Positions are not invented to fill it.

## 10. Frame sampling

The recording is a portrait list that flicks and then rests. `--interval` (default `0.35` seconds) is how often a candidate frame is considered. A candidate that is still moving is skipped. The first frame after the list stops is read. A later frame of that same resting screen is skipped.

```bash
python process_ranking.py ./ranking.mp4 --interval 0.35
```

`--motion-threshold` (default `8`) is the mean absolute difference, on a 98×212 grayscale copy, above which a candidate is treated as still scrolling. `--still-threshold` (default `3`) is how similar a settled frame must be to the previous settled frame before it is skipped.

## 11. Ranking regions

The regions were measured on a 392×850 recording of the Tweener standings. They live in `src/tweener_ranking/layout.py` and scale when the frame size differs.

| Region         | x (px)                             | What it is                                                                 |
| -------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| Position badge | 8–56                               | Scalloped mark. The digit inside it is the only ranking position.          |
| Avatar         | 57–106                             | Ignored.                                                                   |
| Name           | 112–268                            | Stops before the rank-change mark. A leaked token such as `a1` is removed. |
| Rank change    | about 282–297                      | Colored arrow and a small number. It is not a position and not points.     |
| Points pill    | about 306–352, searched in 248–372 | The only source of the points value.                                       |

Badge centers are accepted from y 90 to y 785. Above that is the status bar and header. Below that the row is cut off by the home indicator.

```bash
python process_ranking.py ./ranking.mp4 --debug
```

`--debug` writes annotated frames, row boundaries, and the position, name, and points crops under `debug/`. That directory is gitignored. The JSON does not contain those images or any OCR scores.

## 12. Known limitations

- The layout constants match this Tweener standings screen. A different screen needs new coordinates in `layout.py`.
- Names the app itself truncates with `...` stay truncated. The hidden letters are not guessed.
- A dot with exactly three digits after it, such as `2.450`, is treated as the thousands separator `2450`. `2310,5` and `2310.5` stay decimals.
- Ties and shared positions are kept. The tool does not force positions to be 1, 2, 3, and so on.
- Tesseract must be installed on the machine. The Python package only talks to it.

## 13. Tests

With the virtual environment active:

```bash
pytest
```

The tests use synthetic OCR tokens. They do not need a video or Tesseract.
