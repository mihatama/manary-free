from pathlib import Path
text = Path('components/charts/breast-care-chart-form.tsx').read_text(encoding='utf-8')
for seq in ['\\xc1E','\\u3001E','\\u3041E','\\u3081E','\\u30c1E','\\u4f41E','\\u4f81E','\\u5181E','\\u5241E','\\u5281E','\\u5401E','\\u56c1E','\\u5841E','\\u5b41E','\\u5f81E','\\u5fc1E','\\u60c1E','\\u6141E','\\u6281E','\\u62c1E','\\u6581E','\\u6701E','\\u6801E','\\u6cc1E','\\u7501E','\\u7681E','\\u7f81E','\\u8001E','\\u8a01E','\\u8ac1E','\\u90c1E','\\u91c1E','\\u96c1E','\\u9801E','\\u9841E','\\uff01E','\\ufffdE']:
    seq_actual = bytes(seq, 'utf-8').decode('unicode_escape')
    print('---', seq)
    for line in text.splitlines():
        if seq_actual in line:
            print(line.encode('unicode_escape').decode())
