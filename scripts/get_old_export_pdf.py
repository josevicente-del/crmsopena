# -*- coding: utf-8 -*-
import subprocess

out = subprocess.check_output(['git', 'show', 'fb78570:src/App.jsx'], encoding='utf-8')
idx = out.find("const handleExportPDF = async () => {")
print('Index:', idx)
if idx != -1:
    end_idx = out.find("const handleCopyToMailClipboard", idx)
    print('Length:', end_idx - idx)
    with open('handleExportPDF_old.txt', 'w', encoding='utf-8') as f:
        f.write(out[idx:end_idx])
    print('Guardado handleExportPDF_old.txt')

