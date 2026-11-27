# empty-cell % over a 6×10 grid: a cell is "empty" if it is flat (low luma sd and few edges). usage: python emptycells.py img [img...]
import sys, numpy as np
from PIL import Image, ImageFilter
tot = emp = 0
for f in sys.argv[1:]:
    im = Image.open(f).convert('L').resize((270, 480)); a = np.asarray(im, float)
    e = np.asarray(im.filter(ImageFilter.FIND_EDGES), float)
    H, W = a.shape; ch, cw = H // 10, W // 6; n = 0
    for r in range(10):
        for c in range(6):
            cell = a[r*ch:(r+1)*ch, c*cw:(c+1)*cw]; ed = e[r*ch:(r+1)*ch, c*cw:(c+1)*cw]
            flat = cell.std() < 9 and (ed > 25).mean() < .03
            n += flat
    print(f.split('/')[-1], f'{n}/60 empty'); tot += 60; emp += n
print(f'TOTAL empty {100*emp/tot:.1f}%')
