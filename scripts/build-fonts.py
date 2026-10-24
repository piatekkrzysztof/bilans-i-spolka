"""
Podzbiory fontów pod LCP na mobile (ADR-010).

Z plików zmiennych google/fonts (OFL) robi instancje w używanych wagach i zostawia tylko
glify, których strona potrzebuje: łacinę, polskie znaki i typografię (cudzysłowy, myślniki, strzałki).
Jeden mały plik na krój = wszystko preloadowane, bez drugiej rundy pobrań po sparsowaniu CSS.

Użycie (fonttools + brotli):
    python scripts/build-fonts.py <katalog z plikami .ttf z google/fonts>
"""
import sys
from io import BytesIO
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
    0x2122,  # ™ - znacznik w stylu druku technicznego (ADR-012); kwadraty ■ rysuje CSS
]

# Osie: liczba = instancja statyczna, krotka = zawężony zakres zmienny (jeden plik na kilka wag).
FONTS = [
    # (plik źródłowy, plik wynikowy, osie)
    ("Inter[opsz,wght].ttf", "inter-text.woff2", {"opsz": 14, "wght": (400, 500)}),
    ("Inter[opsz,wght].ttf", "inter-display.woff2", {"opsz": 32, "wght": 900}),
    ("JetBrainsMono[wght].ttf", "jetbrains-mono.woff2", {"wght": (400, 700)}),
    # Obrazek do udostępniania (next/og, Satori) nie czyta woff2 ani fontów zmiennych - statyczne TTF.
    ("Inter[opsz,wght].ttf", "og/inter-display.ttf", {"opsz": 32, "wght": 900}),
    ("JetBrainsMono[wght].ttf", "og/jetbrains-mono.ttf", {"wght": 500}),
]


def build(source: str, target: str, pinned: dict) -> None:
    font = TTFont(SOURCE / source)
    # Osie nieopisane przypinamy do wartości domyślnej - tak jak statyczne pliki Google Fonts.
    axes = {axis.axisTag: axis.defaultValue for axis in font["fvar"].axes}
    axes.update(pinned)
    static = instantiateVariableFont(font, axes)
    # Po zawężeniu osi tablica gvar zostaje „leniwa” i subsetter jej nie obsługuje - zapis i odczyt w pamięci.
    buffer = BytesIO()
    static.save(buffer)
    buffer.seek(0)
    static = TTFont(buffer)

    woff2 = target.endswith(".woff2")
    options = subset.Options()
    options.flavor = "woff2" if woff2 else None
    options.layout_features = ["*"]  # tnum/lnum (kwoty), kern, liga
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(static)

    (OUT / target).parent.mkdir(parents=True, exist_ok=True)
    static.flavor = "woff2" if woff2 else None
    static.save(OUT / target)
    print(f"{target}: {(OUT / target).stat().st_size / 1024:.1f} kB")


for args in FONTS:
    build(*args)
