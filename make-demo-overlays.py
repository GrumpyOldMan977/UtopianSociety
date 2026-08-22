from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(r"C:\Users\Robyn\Documents\Codex\ClipChamp")

def font(name: str, size: int):
    return ImageFont.truetype(str(Path(r"C:\Windows\Fonts") / name), size)

# Small event identifier for the opening.
opening = Image.new("RGBA", (760, 92), (0, 0, 0, 0))
d = ImageDraw.Draw(opening)
d.rounded_rectangle((0, 0, 759, 91), radius=8, fill=(4, 38, 30, 214), outline=(203, 167, 82, 220), width=2)
d.text((34, 19), "OPENAI BUILD WEEK  •  2026", font=font("arialbd.ttf", 31), fill=(239, 215, 155, 255))
opening.save(out / "overlay-opening.png")

# Required collaboration disclosure near the end.
closing = Image.new("RGBA", (1120, 210), (0, 0, 0, 0))
d = ImageDraw.Draw(closing)
d.rounded_rectangle((0, 0, 1119, 209), radius=10, fill=(4, 38, 30, 232), outline=(203, 167, 82, 235), width=3)
d.text((48, 28), "BUILT WITH CODEX + GPT-5.6", font=font("georgiab.ttf", 43), fill=(248, 240, 216, 255))
d.line((48, 90, 1070, 90), fill=(203, 167, 82, 220), width=2)
d.text((48, 111), "Corpus reconciliation  •  civic portal implementation", font=font("arial.ttf", 27), fill=(225, 207, 160, 255))
d.text((48, 155), "testing  •  deployment  •  human authority retained", font=font("arial.ttf", 27), fill=(225, 207, 160, 255))
closing.save(out / "overlay-codex.png")
