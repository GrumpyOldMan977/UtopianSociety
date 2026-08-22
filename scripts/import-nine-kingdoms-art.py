from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


EXPECTED_SUITS = {
    "arcane",
    "crescent",
    "current",
    "cycle",
    "doctrine",
    "logos",
    "mystic",
    "order",
    "sanctum",
    "scripture",
    "spirit",
    "void",
    "will",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Import web-ready artwork for 9 Kingdoms Solitaire.")
    parser.add_argument("source", type=Path, help="Directory containing one folder per completed suit.")
    parser.add_argument("target", type=Path, help="Website cards directory.")
    args = parser.parse_args()

    source = args.source.resolve()
    target = args.target.resolve()
    suits = {directory.name for directory in source.iterdir() if directory.is_dir()}
    if suits != EXPECTED_SUITS:
        raise SystemExit(f"Expected the 13 completed suits; found: {sorted(suits)}")

    imported = 0
    retained = 0
    for suit in sorted(EXPECTED_SUITS):
        source_cards = sorted((source / suit).glob("*.png"))
        if len(source_cards) != 14:
            raise SystemExit(f"Expected 14 {suit} cards; found {len(source_cards)}")
        destination = target / suit
        destination.mkdir(parents=True, exist_ok=True)
        for source_card in source_cards:
            output = destination / f"{source_card.stem}.webp"
            if output.exists():
                try:
                    with Image.open(output) as existing:
                        existing.verify()
                    retained += 1
                    continue
                except OSError:
                    pass
            with Image.open(source_card) as image:
                image.convert("RGB").save(output, "WEBP", quality=90, method=6)
            imported += 1

    print(f"Imported {imported} and retained {retained} web-ready card illustrations in {target}")


if __name__ == "__main__":
    main()
