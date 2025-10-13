from pathlib import Path
text = Path('components/charts/breast-care-chart-form.tsx').read_text(encoding='utf-8')
for line in text.splitlines():
    if '\u3001E' in line:
        print(line.encode('unicode_escape').decode())
