"""
Składa kod SDK workflow n8n z szablonów w sdk/ i kodu węzłów w code/.

Szablon zawiera znaczniki __NAZWA_JS__, które zastępujemy treścią code/nazwa.js jako literałem JSON -
kod węzłów Code żyje w zwykłych plikach .js (lint, diff, review), a nie w stringach w eksporcie workflow.

Użycie: python automation/n8n/build.py lead-created > out.ts
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent


def build(name: str) -> str:
    template = (ROOT / 'sdk' / f'{name}.ts').read_text(encoding='utf-8')

    def inline(match: re.Match) -> str:
        source = ROOT / 'code' / f"{match.group(1).lower().replace('_', '-')}.js"
        return json.dumps(source.read_text(encoding='utf-8'), ensure_ascii=False)

    return re.sub(r'__([A-Z_]+)_JS__', inline, template)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stdout.write(build(sys.argv[1]))
