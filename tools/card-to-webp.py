#!/usr/bin/env python3
"""名刺の PDF を、サイトが表示する WebP 画像に変換する。

    pip install pymupdf pillow
    python3 tools/card-to-webp.py

assets/card/front.pdf と back.pdf を読み、同じ場所に front.webp / back.webp を書き出す。
名刺を刷り直して PDF を差し替えたら、これを一度走らせるだけでサイトに反映される。

PDF を直接ブラウザで描画する方式も試したが、PDF.js が名刺に使われている
CFF フォント（FormaDJRMicro）の文字幅を正しく扱えず、欧文が潰れてしまった。
そのため、確実に元の見た目を保てるこの方式を採っている。
"""

import io
import os
import sys

import pymupdf
from PIL import Image

CARD_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'card')
TARGET_WIDTH = 2048   # 3Dテクスチャとして十分な横幅（px）
QUALITY = 90


def convert(name: str) -> None:
    src = os.path.join(CARD_DIR, f'{name}.pdf')
    dst = os.path.join(CARD_DIR, f'{name}.webp')

    if not os.path.exists(src):
        sys.exit(f'見つかりません: {src}')

    page = pymupdf.open(src)[0]
    dpi = round(TARGET_WIDTH / (page.rect.width / 72))
    pix = page.get_pixmap(dpi=dpi)

    img = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    img.save(dst, 'WEBP', quality=QUALITY, method=6)

    print(f'{name}: {img.width}×{img.height}px  {os.path.getsize(dst) / 1024:.0f} KB')


if __name__ == '__main__':
    for face in ('front', 'back'):
        convert(face)
    print('完了しました。')
