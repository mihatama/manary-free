from pathlib import Path
path = Path('components/charts/breast-care-chart-form.tsx')
text = path.read_text(encoding='utf-8')
replacements = {
    'label: "���f��"': 'label: "初診料"',
    'label: "1��"': 'label: "1回"',
    'label: "��P�b�g"': 'label: "チケット"',
    'label: "�����^���^�I��"': 'label: "レンタルタオル"',
    'label: "�P�A�^�I��"': 'label: "ケアタオル"',
    'z.string().min(1, "���ږ�����͂��Ă�������")': 'z.string().min(1, "項目名を入力してください")',
    'z.string().min(1, "���Җ��͕K�{�ł�")': 'z.string().min(1, "患者名は必須です")',
    'z.string().min(1, "���@���͕K�{�ł�")': 'z.string().min(1, "来院日は必須です")',
    'item.label?.trim() || "����"': 'item.label?.trim() || "項目"',
    'value && value.trim().length > 0 ? value : "������"': 'value && value.trim().length > 0 ? value : "未入力"',
}
for old, new in replacements.items():
    text = text.replace(old, new)
path.write_text(text, encoding='utf-8')
