from pathlib import Path
path = Path('components/charts/breast-care-chart-form.tsx')
lines = path.read_text(encoding='utf-8').splitlines()
# Update DEFAULT_FEE_ITEMS entries
for i, line in enumerate(lines):
    if 'const DEFAULT_FEE_ITEMS' in line:
        start = i + 1
        lines[start + 0] = '  { label: "初診料", price: 1000, selected: true },'
        lines[start + 1] = '  { label: "1回", price: 5500, selected: true },'
        lines[start + 2] = '  { label: "チケット", price: 14850, selected: false },'
        lines[start + 3] = '  { label: "レンタルタオル", price: 350, selected: true },'
        lines[start + 4] = '  { label: "ケアタオル", price: 250, selected: true },'
        break
else:
    raise SystemExit('DEFAULT_FEE_ITEMS not found')
# Replace corrupted validation messages
for i, line in enumerate(lines):
    if 'z.string().min(1,' in line:
        if '項目名' not in line and '患者名' not in line and '来院日' not in line:
            if '���ږ' in line:
                lines[i] = '  label: z.string().min(1, "項目名を入力してください"),' 
            elif '���Җ' in line:
                lines[i] = '  patientName: z.string().min(1, "患者名は必須です"),' 
            elif '���@��' in line:
                lines[i] = '  visitDate: z.string().min(1, "来院日は必須です"),' 
# Update fallback label string
for i, line in enumerate(lines):
    if 'item.label?.trim()' in line:
        lines[i] = '      const label = item.label?.trim() || "項目"'
        break
# Update default placeholder fallback text
for i, line in enumerate(lines):
    if 'value && value.trim().length > 0 ? value : "' in line:
        lines[i] = '  const formatInputValue = (value?: string) => (value && value.trim().length > 0 ? value : "未入力")'
        break
path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
