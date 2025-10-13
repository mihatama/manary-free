from pathlib import Path

def decode_escape(value: str) -> str:
    return bytes(value, 'utf-8').decode('unicode_escape')

replacements = [
    ('  { label: "\\u521d\\u8a3a\\u6581E, price: 1000, selected: true },', '  { label: "\\u521d\\u8a3a\\u6599", price: 1000, selected: true },'),
    ('  { label: "1\\u56c1E, price: 5500, selected: true },', '  { label: "1\\u56de", price: 5500, selected: true },'),
    ('  { label: "\\u30c1\\u30b1\\u30c1E\\ufffd\\ufffd", price: 14850, selected: false },', '  { label: "\\u30c1\\u30b1\\u30c3\\u30c8", price: 14850, selected: false },'),
    ('  label: z.string().min(1, "\\u9801E\\ufffd\\ufffd\\u540d\\u3092\\u5165\\u529b\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044"),', '  label: z.string().min(1, "\\u9805\\u76ee\\u540d\\u3092\\u5165\\u529b\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044"),'),
    ('  patientName: z.string().min(1, "\\u60a3\\u8001E\\ufffd\\ufffd\\u306f\\u5fc1E\\ufffd\\ufffd\\u3067\\u3041E),', '  patientName: z.string().min(1, "\\u60a3\\u8005\\u540d\\u306f\\u5fc5\\u9808\\u3067\\u3059"),'),
    ('  visitDate: z.string().min(1, "\\u6765\\u9662\\u65e5\\u306f\\u5fc1E\\ufffd\\ufffd\\u3067\\u3041E),', '  visitDate: z.string().min(1, "\\u6765\\u9662\\u65e5\\u306f\\u5fc5\\u9808\\u3067\\u3059"),'),
    ('      const label = item.label?.trim() || "\\u9801E\\ufffd\\ufffd"', '      const label = item.label?.trim() || "\\u9805\\u76ee"'),
    ('  const formatInputValue = (value?: string) => (value && value.trim().length > 0 ? value : "\\u672a\\u5165\\u5281E)', '  const formatInputValue = (value?: string) => (value && value.trim().length > 0 ? value : "\\u672a\\u5165\\u529b")'),
]

path = Path('components/charts/breast-care-chart-form.tsx')
text = path.read_text(encoding='utf-8')
for old, new in replacements:
    old_str = decode_escape(old)
    new_str = decode_escape(new)
    if old_str not in text:
        raise SystemExit(f'Missing pattern: {old}')
    text = text.replace(old_str, new_str)
path.write_text(text, encoding='utf-8')
