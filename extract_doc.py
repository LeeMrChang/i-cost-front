import zipfile
from xml.etree import ElementTree as ET
from pathlib import Path

DOC_PATH = Path('sim_icost.docx')
with zipfile.ZipFile(DOC_PATH) as z:
    xml_bytes = z.read('word/document.xml')

root = ET.fromstring(xml_bytes)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
lines = []
for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
    parts = []
    for run in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
        if run.text:
            parts.append(run.text)
    text = ''.join(parts).strip()
    if text:
        lines.append(text)

Path('doc_text.txt').write_text('\n'.join(lines), encoding='utf-8')
