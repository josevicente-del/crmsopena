# -*- coding: utf-8 -*-
import sys

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. En handleExportInteractiveHTML: añadir dateFormattedLong si no está
target_date_str = "    const dateStr = new Date().toLocaleDateString(isPt ? 'pt-PT' : 'es-ES');"
replacement_date_str = """    const dateStr = new Date().toLocaleDateString(isPt ? 'pt-PT' : 'es-ES');
    const dateFormattedLong = new Date().toLocaleDateString(isPt ? 'pt-PT' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });"""

if target_date_str in content and "dateFormattedLong" not in content:
    content = content.replace(target_date_str, replacement_date_str, 1)
    print("Añadido dateFormattedLong en handleExportInteractiveHTML")

# 2. En handleExportInteractiveHTML: reemplazar cabecera, franja y Asunto
old_interactive_header = """    <header>
      <div class="logo-container">
        <img src="${SOPENA_LOGO_B64}" alt="Logotipo Grupo Sopena Sistemas">
      </div>
      <div class="header-info">
        <strong>SOPENA INNOVATIONS, S.L.</strong><br>
        Pol. Ind. Los Vientos, C/ Garbí, 9<br>
        46119 Náquera, Valencia (${isPt ? 'Espanha' : 'España'})<br>
        +34 96 145 20 50 | <a href="https://www.gruposopena.com/" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">gruposopena.com</a>
      </div>
    </header>
    <div class="content">
      <div class="decorator-bar"></div>
      
      <div class="intro">
        <h2>${titleText}</h2>
        <div class="meta-box">
          ${target ? `
            <p style="margin-bottom: 6px; color: #334155; font-size: 0.95rem;">
              <strong style="color: #0f172a;">${isPt ? 'A/C:' : 'A/A:'}</strong> ${target.purchasingManager || (isPt ? 'Direção de Compras / Gabinete Técnico' : 'Dirección de Compras / Departamento Técnico')}
              ${target.purchasingPhone ? ` | 📞 ${target.purchasingPhone}` : ''}
              ${target.email ? ` | ✉️ <a href="mailto:${target.email}" style="color: #0a3d91; text-decoration: none;">${target.email}</a>` : ''}
            </p>
            ${(isCarpinteriaRelated(target) || target.address) ? `
              <p style="margin-bottom: 6px; color: #475569; font-size: 0.9rem;">
                <strong style="color: #0f172a;">📍 ${isPt ? 'Endereço:' : 'Dirección:'}</strong> ${target.address || 'Polígono de Pocomaco, 1ª Avda. 26'}, ${target.city || 'A Coruña'} (${target.zone})
              </p>
            ` : ''}
          ` : `
            <p style="margin-bottom: 6px; color: #334155; font-size: 0.95rem;">
              <strong style="color: #0f172a;">${isPt ? 'A/C:' : 'A/A:'}</strong> ${isPt ? 'Direção de Compras / Gabinete Técnico' : 'Dirección de Compras / Departamento Técnico'}
            </p>
          `}
          <p style="margin-bottom: 6px; color: #334155; font-size: 0.95rem;"><strong style="color: #0f172a;">De:</strong> ${salesperson.name} (${salesperson.role})</p>
          <p style="margin: 0; color: #334155; font-size: 0.95rem;"><strong style="color: #0f172a;">${isPt ? 'Data:' : 'Fecha:'}</strong> ${dateStr}</p>
        </div>
      </div>"""

new_interactive_header = """    <!-- 1. Cabecera: logo Sopena Innovations legible, razón social y datos de contacto en una sola línea -->
    <header style="background: #ffffff; padding: 14px 28px; border-bottom: 2px solid #072b66; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <div class="logo-container" style="background: transparent; padding: 0; box-shadow: none;">
        <img src="${SOPENA_LOGO_B64}" alt="Logotipo Sopena Innovations" style="height: 38px; object-fit: contain;">
      </div>
      <div style="font-size: 0.76rem; color: #475569; text-align: right; white-space: nowrap; line-height: 1.2;">
        <strong style="color: #072b66;">SOPENA INNOVATIONS, S.L.</strong> · Pol. Ind. Los Vientos, C/ Garbí, 9 · 46119 Náquera (Valencia) · Tel. +34 96 145 20 50 · <a href="https://www.gruposopena.com/" target="_blank" rel="noopener noreferrer" style="color: #0a3d91; font-weight: 600; text-decoration: none;">gruposopena.com</a>
      </div>
    </header>

    <!-- 2. Debajo de la cabecera, una franja fina a todo el ancho: destinatario a la izquierda y fecha y referencia a la derecha -->
    <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <div style="font-size: 0.84rem; color: #1e293b; line-height: 1.35;">
        <span style="font-weight: 700; color: #072b66;">
          ${target ? target.name : (isPt ? 'Empresas do Setor de Alumínio e Caixilharia' : 'Empresas del Sector del Aluminio y Cerramientos')}
        </span>
        <span style="color: #64748b;"> · </span>
        <span style="color: #334155;">
          ${target?.purchasingManager?.trim() || (isPt ? 'Direção de Compras / Gabinete Técnico' : 'Dirección de Compras / Departamento Técnico')}
        </span>
        ${target?.city ? `<span style="color: #64748b;"> (${target.city})</span>` : ''}
      </div>
      <div style="font-size: 0.80rem; color: #475569; text-align: right; white-space: nowrap;">
        <span style="color: #072b66; font-weight: 600;">${dateFormattedLong}</span>
        <span style="color: #94a3b8;"> | </span>
        <span style="font-family: monospace; color: #64748b; font-size: 0.76rem;">Ref: GS-B2B/2026-IND</span>
      </div>
    </div>

    <div class="content" style="padding: 30px 35px;">
      <div class="decorator-bar"></div>
      
      <!-- 3. Título como Asunto: -->
      <div class="intro" style="margin-bottom: 24px;">
        <h2 style="font-size: 1.35rem; color: #072b66; margin-bottom: 10px; font-weight: 800; border-left: 4px solid #00a8e8; padding-left: 12px;">
          ${isPt 
            ? 'Assunto: Extrusão, lacagem, anodização, sublimação e armazém de caixilharia'
            : 'Asunto: Extrusión, lacado, anodizado sublimacion y almacen de carpinteria'}
        </h2>
        <div style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-top: 10px; margin-bottom: 8px;">
          ${target?.purchasingManager?.trim()
            ? `${isPt ? 'Estimado/a' : 'Estimado/a'} ${target.purchasingManager.trim()}:`
            : (isPt ? 'Estimada Direção de Compras e Gabinete Técnico:' : 'Estimada Dirección de Compras y Departamento Técnico:')
          }
        </div>
      </div>"""

if old_interactive_header in content:
    content = content.replace(old_interactive_header, new_interactive_header, 1)
    print("Reemplazada cabecera y franja en handleExportInteractiveHTML")
else:
    print("ADVERTENCIA: old_interactive_header no encontrado")

# 3. En handleCopyToMailClipboard: actualizar con la misma estructura
old_clipboard_block = """          <!-- Encabezado de email -->
          <div style="background: linear-gradient(135deg, #072b66 0%, #0a3d91 100%); padding: 30px; color: #ffffff; text-align: left; display: flex; justify-content: space-between; align-items: center;">
            <div style="background: #ffffff; padding: 8px 15px; border-radius: 6px; display: inline-block;">
              <img src="/sopena_sistemas_logo.png" alt="Grupo Sopena Sistemas Logo" style="height: 35px; width: auto; display: block;" />
            </div>
            <div style="font-size: 0.8rem; line-height: 1.4; opacity: 0.9; text-align: right; margin-left: 20px; color: #ffffff;">
              <strong>SOPENA INNOVATIONS, S.L.</strong><br/>
              Náquera, Valencia<br/>
              <a href="https://www.gruposopena.com/" target="_blank" rel="noopener noreferrer" style="color: #ffffff; text-decoration: underline;">gruposopena.com</a>
            </div>
          </div>
          
          <!-- Contenido del email -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #072b66; font-size: 1.6rem; margin-top: 0; margin-bottom: 20px; font-weight: bold; font-family: Arial, sans-serif;">
              ${titleText}
            </h2>
            
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 35px; font-size: 0.9rem; color: #475569;">
              ${target ? `<strong>${isPt ? 'A/C:' : 'A/A:'}</strong> ${target.purchasingManager}<br/>` : `<strong>${isPt ? 'A/C:' : 'A/A:'}</strong> ${isPt ? 'Direção de Compras / Gabinete Técnico' : 'Dirección de Compras / Departamento Técnico'}<br/>`}
              <strong>${isPt ? 'Data:' : 'Fecha:'}</strong> ${dateStr}
            </div>"""

new_clipboard_block = """          <!-- 1. Cabecera: logo Sopena Innovations legible, razón social y datos en una sola línea -->
          <div style="background: #ffffff; padding: 14px 24px; border-bottom: 2px solid #072b66; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
            <img src="/sopena_sistemas_logo.png" alt="Sopena Innovations" style="height: 34px; width: auto; display: block;" />
            <div style="font-size: 0.74rem; color: #475569; text-align: right; line-height: 1.2; white-space: nowrap;">
              <strong style="color: #072b66;">SOPENA INNOVATIONS, S.L.</strong> · Náquera (Valencia) · Tel. +34 96 145 20 50 · <span style="color: #0a3d91; font-weight: 600;">gruposopena.com</span>
            </div>
          </div>
          
          <!-- 2. Franja fina a todo el ancho: destinatario a la izquierda y fecha y referencia a la derecha (sin 'De:') -->
          <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; font-size: 0.80rem;">
            <div style="color: #1e293b;">
              <strong style="color: #072b66;">${target ? target.name : (isPt ? 'Empresas de Alumínio' : 'Empresas del Sector')}</strong>
              <span style="color: #64748b;"> · </span>
              <span style="color: #334155;">${target?.purchasingManager?.trim() || (isPt ? 'Direção de Compras' : 'Dirección de Compras')}</span>
            </div>
            <div style="color: #475569; text-align: right; white-space: nowrap; font-size: 0.78rem;">
              <span style="color: #072b66; font-weight: 600;">${new Date().toLocaleDateString(isPt ? 'pt-PT' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span style="color: #94a3b8;"> | </span>
              <span style="font-family: monospace; color: #64748b; font-size: 0.74rem;">Ref: GS-B2B/2026-IND</span>
            </div>
          </div>
          
          <!-- Contenido del email -->
          <div style="padding: 24px 24px;">
            <!-- 3. Título como Asunto: -->
            <div style="color: #072b66; font-size: 1.15rem; margin-top: 0; margin-bottom: 14px; font-weight: 800; border-left: 3px solid #00a8e8; padding-left: 10px;">
              ${isPt 
                ? 'Assunto: Extrusão, lacagem, anodização, sublimação e armazém de caixilharia'
                : 'Asunto: Extrusión, lacado, anodizado sublimacion y almacen de carpinteria'}
            </div>
            <div style="font-size: 0.90rem; font-weight: 700; color: #1e293b; margin-bottom: 12px;">
              ${target?.purchasingManager?.trim()
                ? `${isPt ? 'Estimado/a' : 'Estimado/a'} ${target.purchasingManager.trim()}:`
                : (isPt ? 'Estimada Direção de Compras e Gabinete Técnico:' : 'Estimada Dirección de Compras y Departamento Técnico:')
              }
            </div>"""

if old_clipboard_block in content:
    content = content.replace(old_clipboard_block, new_clipboard_block, 1)
    print("Reemplazada cabecera y franja en handleCopyToMailClipboard")
else:
    print("ADVERTENCIA: old_clipboard_block no encontrado")

# Guardar cambios
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Actualización completada exitosamente.")

