from pathlib import Path
text = Path('components/charts/breast-care-chart-form.tsx').read_text(encoding='utf-8')
sequences = set()
for i, ch in enumerate(text[:-1]):
    if ord(ch) > 127 and text[i+1] == 'E':
        sequences.add(ch + 'E')
for seq in sorted(sequences):
    print(seq.encode('unicode_escape').decode())
