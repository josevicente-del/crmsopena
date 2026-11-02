# -*- coding: utf-8 -*-
import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Optimizar handleExportPDF con dimensiones exactas para evitar desbordes o cortes
old_export_pdf = """        // Capturar la página A4 individual con alta resolución (~192 DPI)
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        pdf.addImage(imgData, 'JPEG', 0, 0, PDF_W_MM, PDF_H_MM);"""

new_export_pdf = """        // Capturar la página A4 individual con alta resolución (~192 DPI) y proporción exacta sin desbordamientos
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          width: pageEl.clientWidth,
          height: pageEl.clientHeight,
          windowWidth: pageEl.scrollWidth,
          windowHeight: pageEl.scrollHeight,
          scrollX: 0,
          scrollY: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, PDF_W_MM, PDF_H_MM, undefined, 'FAST');"""

if old_export_pdf in code:
    code = code.replace(old_export_pdf, new_export_pdf, 1)
    print("handleExportPDF actualizado con captura dimensional perfecta.")
else:
    # Probar normalizado
    code_norm = code.replace('\r\n', '\n')
    old_norm = old_export_pdf.replace('\r\n', '\n')
    if old_norm in code_norm:
        code_norm = code_norm.replace(old_norm, new_export_pdf.replace('\r\n', '\n'), 1)
        code = code_norm
        print("handleExportPDF actualizado con captura dimensional perfecta (normalizado).")
    else:
        print("ADVERTENCIA: old_export_pdf no encontrado")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Proceso completado.")

