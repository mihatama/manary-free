from pathlib import Path
text = Path('components/charts/breast-care-chart-form.tsx').read_text(encoding='utf-8')
corrupted = set()
for line in text.splitlines():
    if '\ufffd' in line:
        corrupted.add(line.encode('unicode_escape').decode())
for entry in sorted(corrupted):
    print(entry)
