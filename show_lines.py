from pathlib import Path
text = Path('components/charts/breast-care-chart-form.tsx').read_text(encoding='utf-8')
for line in text.splitlines():
    if 'FieldWrapper label="' in line and '\u5e74' in line:
        print(line.encode('unicode_escape').decode())
