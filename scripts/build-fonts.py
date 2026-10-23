"""
Podzbiory fontów pod LCP na mobile (ADR-010).

Z plików zmiennych google/fonts (OFL) robi statyczne instancje w używanych wagach i zostawia tylko
glify, których strona potrzebuje: łacinę, polskie znaki i typografię (cudzysłowy, myślniki, strzałki).
Jeden mały plik na krój = wszystko preloadowane, bez drugiej rundy pobrań po sparsowaniu CSS.

Użycie (fonttools + brotli):
    python scripts/build-fonts.py <katalog z plikami .ttf z google/fonts>
"""
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

SOURCE = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "src" / "app" / "fonts"

UNICODES = [
    *range(0x20, 0x7F),  # ASCII
    *range(0xA0, 0x100),  # Latin-1: ó, ×, ·, «», twarda spacja
    0x104, 0x105, 0x106, 0x107, 0x118, 0x119, 0x141, 0x142,  # Ą ą Ć ć Ę ę Ł ł
    0x143, 0x144, 0x15A, 0x15B, 0x179, 0x17A, 0x17B, 0x17C,  # Ń ń Ś ś Ź ź Ż ż
    0x2009, 0x200A, 0x202F,  # wąskie spacje
    0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E,  # myślniki, cudzysłowy „”
    0x2022, 0x2026, 0x20AC, 0x2116,  # • … € №
    0x2190, 0x2192, 0x2193, 0x2212, 0x2264, 0x2265, 0x2713,  # ← → ↓ − ≤ ≥ ✓
]

# Kursywa jest tylko w „&” logo i w inicjałach monogramów - wystarczą litery i „&”.
ITALIC_UNICODES = [0x20, 0x26, *range(0x41, 0x5B), *range(0x61, 0x7B)]

FONTS = [
    # (plik źródłowy, plik wynikowy, waga, znaki)
    ("Inter[opsz,wght].ttf", "inter-400.woff2", 400, UNICODES),
    ("Inter[opsz,wght].ttf", "inter-500.woff2", 500, UNICODES),
    ("Newsreader[opsz,wght].ttf", "newsreader-500.woff2", 500, UNICODES),
    ("Newsreader-Italic[opsz,wght].ttf", "newsreader-500-italic.woff2", 500, ITALIC_UNICODES),
]


def build(source: str, target: str, weight: int, unicodes: list[int]) -> None:
    font = TTFont(SOURCE / source)
    # Pozostałe osie (opsz) przypinamy do wartości domyślnej - tak jak statyczne pliki Google Fonts.
    axes = {axis.axisTag: axis.defaultValue for axis in font["fvar"].axes}
    axes["wght"] = weight
    static = instantiateVariableFont(font, axes)

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]  # tnum/lnum (kwoty), kern, liga
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(static)

    OUT.mkdir(parents=True, exist_ok=True)
    static.flavor = "woff2"
    static.save(OUT / target)
    print(f"{target}: {(OUT / target).stat().st_size / 1024:.1f} kB")


for args in FONTS:
    build(*args)
