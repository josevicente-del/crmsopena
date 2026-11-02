# -*- coding: utf-8 -*-
import subprocess

out = subprocess.check_output(['git', 'show', 'fb78570:src/App.jsx'], encoding='utf-8')
idx = out.find("const handleExportInteractiveHTML = () => {")
print('Index:', idx)
if idx != -1:
    end_idx = out.find("const handleExportPDF = async () => {", idx)
    print('Length:', end_idx - idx)
    with open('handleInteractiveHTML_old.txt', 'w', encoding='utf-8') as f:
        f.write(out[idx:end_idx])
    print('Guardado handleInteractiveHTML_old.txt')

idx2 = out.find("const handleCopyToMailClipboard = async () => {")
if idx2 != -1:
    end_idx2 = out.find("const [showReportModal, setShowReportModal]", idx2)
    with open('handleCopyToMailClipboard_old.txt', 'w', encoding='utf-8') as f:
        f.write(out[idx2:end_idx2])
    print('Guardado handleCopyToMailClipboard_old.txt')

