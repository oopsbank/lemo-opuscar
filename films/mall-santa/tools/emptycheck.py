# Empty-cell check: sample a film every 2 s, split each frame into a 6×10 grid, flag cells that are flat (no object, no texture).
# A cell is "empty" when its mean edge strength (Sobel/8 on a 540×960 frame) is < 3.0: flat or blurred wall, floor, sky, with no readable object.
# Usage: python emptycheck.py film.mp4 [step_s] [--sheet out.jpg]   → prints per-frame and overall empty %, optional marked contact sheet.
import sys, subprocess, json, numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import sobel

src = sys.argv[1]; step = float(sys.argv[2]) if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 2.0
sheet = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
dur = float(json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', src]))['format']['duration'])
GX, GY, W, H = 6, 10, 540, 960
def frame(t):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', src, '-frames:v', '1', '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3)
tot = emp = 0; tiles = []
t = 0.0
while t < dur - .05:
    rgb = frame(t); L = rgb.astype(float) @ [.299, .587, .114]; edge = np.hypot(sobel(L, 0), sobel(L, 1)) / 8
    cw, ch = W // GX, H // GY; flags = []
    for j in range(GY):
        for i in range(GX):
            c = L[j * ch:(j + 1) * ch, i * cw:(i + 1) * cw]; e = edge[j * ch:(j + 1) * ch, i * cw:(i + 1) * cw]
            flags.append((i, j, e.mean() < 3.0))
    n = sum(f[2] for f in flags); tot += len(flags); emp += n
    print(f'{t:5.1f}s  empty {n:2d}/{len(flags)}  ({100 * n / len(flags):4.1f}%)')
    if sheet:
        im = Image.fromarray(rgb).resize((270, 480)); d = ImageDraw.Draw(im, 'RGBA')
        for i, j, f in flags:
            if f: d.rectangle([i * 45, j * 48, i * 45 + 44, j * 48 + 47], fill=(255, 0, 60, 90), outline=(255, 0, 60, 255))
        tiles.append(im)
    t += step
print(f'overall empty cells: {emp}/{tot} = {100 * emp / tot:.1f}%')
if sheet and tiles:
    cols = 6; rows = (len(tiles) + cols - 1) // cols; S = Image.new('RGB', (270 * cols, 480 * rows))
    for k, im in enumerate(tiles): S.paste(im, ((k % cols) * 270, (k // cols) * 480))
    S.save(sheet)
