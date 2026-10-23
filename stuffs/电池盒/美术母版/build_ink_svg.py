"""Build self-contained battery-note SVG lettering from OFL Noto Serif SC.

Run with: python build_ink_svg.py [path/to/NotoSerifSC-VF.ttf]
The checked-in SVG assets remain usable without Python or this font installed.
"""

from __future__ import annotations

import sys
from html import escape
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont


HERE = Path(__file__).resolve().parent
DEFAULT_FONT = Path(r"C:\Windows\Fonts\NotoSerifSC-VF.ttf")
INK = "#40382d"


def outlined_line(font: TTFont, value: str, x: int, baseline: int, size: int,
                  spacing: int = 0) -> str:
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    units = font["head"].unitsPerEm
    scale = size / units
    cursor = 0.0
    parts: list[str] = []
    for char in value:
        name = cmap.get(ord(char))
        if name is None:
            raise ValueError(f"Font has no outline for {char!r}")
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        command = pen.getCommands()
        if command:
            parts.append(f'<path d="{command}" transform="translate({cursor:.3f} 0)"/>')
        cursor += font["hmtx"].metrics[name][0] + spacing / scale
    return (f'<g transform="translate({x} {baseline}) scale({scale:.6f} {-scale:.6f})" '
            f'fill="{INK}">' + "".join(parts) + "</g>")


def svg(title: str, view_box: str, body: str, description: str = "") -> str:
    desc = f'<desc id="desc">{escape(description)}</desc>' if description else ""
    label = "title desc" if description else "title"
    header = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" '
              f'role="img" aria-labelledby="{label}">\n'
              f'  <title id="title">{escape(title)}</title>\n')
    if desc:
        header += f'  {desc}\n'
    return (header +
            '  <!-- Noto Serif SC glyph outlines, SIL Open Font License 1.1. -->\n' +
            f'  {body}\n</svg>\n')


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_FONT
    font = TTFont(source)
    if not any("SIL Open Font License" in entry.toUnicode() for entry in font["name"].names if entry.nameID == 13):
        raise ValueError("Refusing to export outlines from a font without an OFL license record")
    files = {
        "ink-battery-problem.svg": svg("潮后接点不稳。", "0 0 760 130",
            outlined_line(font, "潮后接点不稳。", 24, 94, 74, 3)),
        "ink-battery-retry.svg": svg("接点已擦，到了干处再试。", "0 0 1220 140",
            outlined_line(font, "接点已擦，到了干处再试。", 22, 98, 72, 1)),
        "ink-battery-result.svg": svg("试用结果：空栏", "0 0 700 140",
            outlined_line(font, "试用结果：", 21, 95, 76) +
            f'<path d="M405 105H670" stroke="{INK}" stroke-width="2.8" opacity=".65"/>',
            "空白是剧情的一部分，后续不会显出已通或失败。"),
        "battery_note_text.svg": svg("虚构电池盒盖内维护短笺文字", "0 0 1200 700",
            outlined_line(font, "潮后接点不稳。", 91, 198, 57) +
            outlined_line(font, "接点已擦，到了干处再试。", 91, 335, 47) +
            outlined_line(font, "试用结果：", 91, 477, 44) +
            f'<path d="M355 491H1050" fill="none" stroke="{INK}" '
            'stroke-width="2.5" stroke-linecap="round" opacity=".7"/>',
            "纸笺字句是游戏虚构，不是史料；试用结果栏空白。"),
    }
    for name, content in files.items():
        (HERE / name).write_text(content, encoding="utf-8")
        print(name)


if __name__ == "__main__":
    main()
