from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

source = Path(r"C:\Users\Robyn\Documents\Codex\ClipChamp\review")
frames = sorted(source.glob("frame-*.jpg"))
thumb_w, thumb_h = 480, 270
label_h = 32
cols = 3
rows = (len(frames) + cols - 1) // cols
sheet = Image.new("RGB", (cols * thumb_w, rows * (thumb_h + label_h)), "#071f19")
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype("arial.ttf", 20)

for index, path in enumerate(frames):
    image = Image.open(path).convert("RGB")
    image.thumbnail((thumb_w, thumb_h))
    x = (index % cols) * thumb_w
    y = (index // cols) * (thumb_h + label_h)
    sheet.paste(image, (x, y))
    seconds = index * 15
    label = f"{seconds // 60}:{seconds % 60:02d}"
    draw.text((x + 10, y + thumb_h + 4), label, fill="#e5c36f", font=font)

sheet.save(source / "contact-sheet.jpg", quality=92)
