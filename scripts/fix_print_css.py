# -*- coding: utf-8 -*-
with open('src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

old_print = """@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body * {
    visibility: hidden;
  }
  .a4-container, .a4-container * {
    visibility: visible;
  }
  .a4-container {
    position: absolute;
    left: 0;
    top: 0;
    margin: 0;
    padding: 0;
    width: 100%;
    overflow: visible;
  }
  .a4-sheet, .a4-page {
    box-shadow: none;
    margin: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    overflow: hidden !important;
    border-radius: 0;
    page-break-after: always !important;
    break-after: page !important;
  }
  .page-break {
    page-break-before: always;
    break-before: page;
  }
  .dossier-project-card, .dossier-fabril-card, .dossier-tech-card, .card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .no-print {
    display: none !important;
  }
}"""

new_print = """@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    width: 210mm !important;
    height: auto !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* Ocultar interfaz externa de la aplicación al imprimir */
  header, nav, aside, .sidebar, .navbar, .action-btn, button, .modal, .tasks-container, .filter-group, .no-print, input, select {
    display: none !important;
  }
  .a4-container {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 210mm !important;
    max-width: 210mm !important;
    overflow: visible !important;
    box-shadow: none !important;
    background: transparent !important;
    position: static !important;
  }
  .a4-sheet, .a4-page {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    overflow: hidden !important;
    border-radius: 0 !important;
    page-break-before: auto !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-sizing: border-box !important;
  }
  .a4-page:last-child {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .dossier-project-card, .dossier-fabril-card, .dossier-tech-card, .card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}"""

if old_print in css:
    css = css.replace(old_print, new_print, 1)
    with open('src/index.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("Actualizado src/index.css con reglas de impresión limpias.")
else:
    css_norm = css.replace('\r\n', '\n')
    old_norm = old_print.replace('\r\n', '\n')
    if old_norm in css_norm:
        css_norm = css_norm.replace(old_norm, new_print.replace('\r\n', '\n'), 1)
        with open('src/index.css', 'w', encoding='utf-8') as f:
            f.write(css_norm)
        print("Actualizado src/index.css con reglas de impresión limpias (normalizado).")
    else:
        print("Error: old_print no encontrado en src/index.css")

