from pathlib import Path

def decode_escape(value: str) -> str:
    return bytes(value, 'utf-8').decode('unicode_escape')

replacements = [
    ('          <CardTitle className="text-xl">{chart ? "\\u4e73\\u623f\\u30b1\\u30a2\\u30ab\\u30eb\\u30c1E\\ufffd\\ufffd\\u7de8\\u96c1E : "\\u4e73\\u623f\\u30b1\\u30a2\\u30ab\\u30eb\\u30c1E\\ufffd\\ufffd\\u4f5c\\ufffdE"}</CardTitle>', '          <CardTitle className="text-xl">{chart ? "\\u4e73\\u623f\\u30b1\\u30a2\\u30ab\\u30eb\\u30c6\\u3092\\u7de8\\u96c6" : "\\u4e73\\u623f\\u30b1\\u30a2\\u30ab\\u30eb\\u30c6\\u3092\\u4f5c\\u6210"}</CardTitle>'),
    ('            <FieldWrapper label="\\u60a3\\u8001E\\ufffd\\ufffd" error={errors.patientName?.message}>', '            <FieldWrapper label="\\u60a3\\u8005\\u540d" error={errors.patientName?.message}>'),
    ('              <Input {...register("patientName")} placeholder="\\u4f81E \\u5c71\\u7530 \\u82b1\\u5b41E />', '              <Input {...register("patientName")} placeholder="\\u4f8b: \\u5c71\\u7530 \\u82b1\\u5b50" />'),
    ('              <Input {...register("patientId")} placeholder="\\u4f81E PATIENT-001" />', '              <Input {...register("patientId")} placeholder="\\u4f8b: PATIENT-001" />'),
    ('            <FieldWrapper label="\\u62c1E\\ufffd\\ufffd\\u52a9\\u7523\\u5e2b">', '            <FieldWrapper label="\\u62c5\\u5f53\\u52a9\\u7523\\u5e2b">'),
    ('              <Input {...register("practitionerName")} placeholder="\\u4f81E \\u4f50\\u85e4 \\u4ec1\\u7f81E />', '              <Input {...register("practitionerName")} placeholder="\\u4f8b: \\u4f50\\u85e4 \\u4ec1\\u7f8e" />'),
    ('            <FieldWrapper label="\\u7814\\u4fee\\u7501E>', '            <FieldWrapper label="\\u7814\\u4fee\\u8005">'),
    ('              <Input {...register("traineeName")} placeholder="\\u4f81E \\u7814\\u4fee\\u751fA" />', '              <Input {...register("traineeName")} placeholder="\\u4f8b: \\u7814\\u4fee\\u751fA" />'),
    ('            <FieldWrapper label="\\u30ab\\u30eb\\u30c1E\\ufffd\\ufffd\\u53f7">', '            <FieldWrapper label="\\u30ab\\u30eb\\u30c6\\u756a\\u53f7">'),
    ('              <Input {...register("chartNumber")} placeholder="\\u4f81E BC-401" />', '              <Input {...register("chartNumber")} placeholder="\\u4f8b: BC-401" />'),
    ('            <FieldWrapper label="\\u304a\\u5b50\\u69d8\\u540d\\u5241E>', '            <FieldWrapper label="\\u304a\\u5b50\\u69d8\\u306e\\u6c0f\\u540d">'),
    ('              <Input {...register("childName")} placeholder="\\u4f81E \\u5c71\\u7530 \\u592a\\u90c1E />', '              <Input {...register("childName")} placeholder="\\u4f8b: \\u5c71\\u7530 \\u592a\\u90ce" />'),
    ('            <FieldWrapper label="\\u304a\\u5b50\\u69d8\\ufffdE\\u751f\\u5e74\\u6708\\u65e5">', '            <FieldWrapper label="\\u304a\\u5b50\\u69d8\\u306e\\u751f\\u5e74\\u6708\\u65e5">'),
    ('          <FieldWrapper label="\\u5e74\\u9f62\\ufffdE\\ufffd\\ufffd\\u25cb\\u6b73 \\u25cb\\u304b\\u6701E\\u25cb\\u65e5\\u76ee\\ufffdE\\ufffdE>', '          <FieldWrapper label="\\u5e74\\u9f62\\uff08\\u6b73\\u30fb\\u304b\\u6708\\u30fb\\u65e5\\u76ee\\uff09">'),
    ('                aria-label="\\u5e74\\u9f62\\ufffdE\\ufffd\\u6b73\\ufffdE\\ufffdE', '                aria-label="\\u5e74\\u9f62\\uff08\\u6b73\\uff09"'),
    ('                aria-label="\\u5e74\\u9f62\\ufffdE\\ufffd\\u304b\\u6708\\uff01E', '                aria-label="\\u5e74\\u9f62\\uff08\\u304b\\u6708\\uff09"'),
    ('                aria-label="\\u5e74\\u9f62\\ufffdE\\ufffd\\u65e5\\u76ee\\ufffdE\\ufffdE', '                aria-label="\\u5e74\\u9f62\\uff08\\u65e5\\u76ee\\uff09"'),
    ('            <Input {...register("clinicLocation")} placeholder="\\u4f81E \\u5b9d\\u5841E/ \\u8a2a\\u554f\\uff08\\u897f\\u5bae\\u5e02\\uff09\\u306a\\u3069\\u81ea\\u7531\\u8a18\\ufffdE" />', '            <Input {...register("clinicLocation")} placeholder="\\u4f8b: \\u5b9d\\u585a / \\u8a2a\\u554f\\uff08\\u897f\\u5bae\\u5e02\\uff09\\u306a\\u3069\\u81ea\\u7531\\u8a18\\u5165" />'),
    ('            <Textarea rows={3} {...register("memo")} placeholder="\\u30e1\\u30e2\\u3092\\ufffdE\\u529b\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044" />', '            <Textarea rows={3} {...register("memo")} placeholder="\\u30e1\\u30e2\\u3092\\u5165\\u529b\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044" />'),
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
