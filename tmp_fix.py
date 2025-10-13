from pathlib import Path
text = Path('components/charts/breast-care-chart-form.tsx').read_text(encoding='utf-8')
for i, line in enumerate(text.splitlines(), 1):
    if '\ufffd' in line:
        print(i, line.encode('unicode_escape').decode())
