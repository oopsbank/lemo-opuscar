import sys, numpy as np
from PIL import Image, ImageFilter, ImageDraw
outs=[]
for f in sys.argv[2:]:
    im = Image.open(f).convert('RGB').resize((270, 480)); L = im.convert('L'); a = np.asarray(L, float); e = np.asarray(L.filter(ImageFilter.FIND_EDGES), float)
    d = ImageDraw.Draw(im)
    for r in range(10):
        for c in range(6):
            cell = a[r*48:(r+1)*48, c*45:(c+1)*45]; ed = e[r*48:(r+1)*48, c*45:(c+1)*45]
            if cell.std() < 9 and (ed > 25).mean() < .03: d.rectangle([c*45, r*48, c*45+44, r*48+47], outline=(255, 0, 0), width=3)
    outs.append(im)
W = Image.new('RGB', (270 * len(outs), 480)); [W.paste(o, (i * 270, 0)) for i, o in enumerate(outs)]; W.save(sys.argv[1])
