#!/usr/bin/env python3
"""Extract a Tweener ranking video into ranking.json."""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

from tweener_ranking.debug import save_frame_debug  # noqa: E402
from tweener_ranking.deduplication import consolidate  # noqa: E402
from tweener_ranking.exporter import ExportError  # noqa: E402
from tweener_ranking.ocr import OcrError  # noqa: E402
from tweener_ranking.report import candidate_path, publish, report_path  # noqa: E402
from tweener_ranking.rows import read_frame  # noqa: E402
from tweener_ranking.video import FrameSampler, VideoError  # noqa: E402


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Turn a Tweener ranking screen recording into ranking.json."
    )
    parser.add_argument("video", type=Path, help="Path to an MP4, MOV, or other OpenCV-readable video.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("ranking.json"),
        help="Where to write the JSON file. Defaults to ./ranking.json.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=0.35,
        help="Seconds between candidate frames. Default: 0.35.",
    )
    parser.add_argument(
        "--motion-threshold",
        type=float,
        default=8.0,
        help="Skip a candidate that is still moving. Default: 8.",
    )
    parser.add_argument(
        "--still-threshold",
        type=float,
        default=3.0,
        help="Skip a settled frame that repeats the previous one. Default: 3.",
    )
    parser.add_argument(
        "--blur-ratio",
        type=float,
        default=0.55,
        help="Reject a frame softer than this fraction of the recent sharp frames. Default: 0.55.",
    )
    parser.add_argument(
        "--row-advance",
        type=float,
        default=1.5,
        help="Rows of scroll between kept frames. Sharp frames are still read while the list moves. Default: 1.5.",
    )
    parser.add_argument(
        "--lang",
        default="por+eng",
        help="Tesseract languages for athlete names. Default: por+eng.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Write diagnostic images under ./debug. They are not part of the JSON.",
    )
    return parser


def run(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        sampler = FrameSampler(
            args.video,
            args.interval,
            motion_threshold=args.motion_threshold,
            still_threshold=args.still_threshold,
            blur_ratio=args.blur_ratio,
            row_advance_rows=args.row_advance,
        )
        details = sampler.open()
    except VideoError as error:
        print(error, file=sys.stderr)
        return 1

    print(
        f"Video: {details.width}x{details.height}, {details.fps:.2f} fps, "
        f"{details.duration_seconds:.1f}s"
    )
    print(
        f"Sampling every {args.interval:g}s, keeping a sharp frame every {args.row_advance:g} rows of scroll"
    )

    debug_dir = ROOT / "debug" if args.debug else None
    observations = []
    try:
        for frame in sampler:
            rows = read_frame(frame, lang=args.lang)
            if debug_dir is not None:
                save_frame_debug(debug_dir, sampler.analyzed, frame, rows)
            observations.extend(row.observation for row in rows if row.observation is not None)
    except (VideoError, OcrError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1

    result = consolidate(observations)
    print(
        f"Analyzed {sampler.analyzed} sharp frames "
        f"(skipped {sampler.skipped_blurry} blurry, {sampler.skipped_similar} repeated, "
        f"{sampler.skipped_motion} waiting for the next row)"
    )
    print(f"Observations: {len(observations)}")
    for warning in result.warnings:
        print(f"Warning: {warning}")
    for conflict in result.conflicts:
        print(f"Conflict: {conflict}", file=sys.stderr)

    try:
        published, reasons = publish(
            args.output,
            result.athletes,
            result.conflicts,
            result.reviews,
            observations,
            details,
            sampler.analyzed,
            sampler.skipped_blurry,
            sampler.skipped_similar,
            sampler.skipped_motion,
            datetime.now(timezone.utc),
        )
    except ExportError as error:
        print(error, file=sys.stderr)
        return 2

    print(f"Extracted {len(result.athletes)} athletes")
    print(f"Wrote {report_path(args.output).resolve()}")
    if not published:
        for reason in reasons:
            print(reason, file=sys.stderr)
        print(f"Wrote {candidate_path(args.output).resolve()}", file=sys.stderr)
        print(f"Refusing to replace {args.output.resolve()}.", file=sys.stderr)
        return 2

    print(f"Wrote {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    sys.exit(run())
