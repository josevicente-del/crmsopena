# -*- coding: utf-8 -*-
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

count1 = text.count("border: '1px solid #cbd5e1', borderTop:")
count2 = text.count("border: '1px solid #e2e8f0', borderTop:")

text = text.replace("border: '1px solid #cbd5e1', borderTop:", "borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', borderTop:")
text = text.replace("border: '1px solid #e2e8f0', borderTop:", "borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderTop:")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print(f"Reemplazados {count1 + count2} conflictos de border/borderTop")

