# -*- coding: utf-8 -*-
with open('src/App.jsx', 'rb') as f:
    raw = f.read()

target = b'{p.web !== \'No disponible\' ? (\r\n                            <a href={p.web.startsWith(\'http\') ? p.web : `https://${p.web}`} target="_blank" rel="noreferrer" style={{color: \'var(--sopena-blue)\', fontSize: \'0.85rem\'}}>{p.web.replace(\'https://www.\',\'\').replace(\'http://www.\',\'\').replace(\'https://\',\'\')}</a>\r\n                          ) : (\r\n                            <span style={{color: \'var(--text-secondary)\', fontSize: \'0.85rem\'}}>No disponible</span>\r\n                          )}'

replacement = b'{p.web && typeof p.web === \'string\' && p.web.trim() !== \'\' && p.web !== \'No disponible\' ? (\r\n                            <a href={p.web.startsWith(\'http\') ? p.web : `https://${p.web}`} target="_blank" rel="noreferrer" style={{color: \'var(--sopena-blue)\', fontSize: \'0.85rem\'}}>{p.web.replace(/^https?:\\/\\/(www\\.)?/, \'\')}</a>\r\n                          ) : (\r\n                            <span style={{color: \'var(--text-secondary)\', fontSize: \'0.85rem\'}}>No disponible</span>\r\n                          )}'

if target in raw:
    raw = raw.replace(target, replacement, 1)
    with open('src/App.jsx', 'wb') as f:
        f.write(raw)
    print("Reemplazo binario completado con éxito!")
else:
    # Buscar versión con \n
    target_lf = target.replace(b'\r\n', b'\n')
    replacement_lf = replacement.replace(b'\r\n', b'\n')
    if target_lf in raw:
        raw = raw.replace(target_lf, replacement_lf, 1)
        with open('src/App.jsx', 'wb') as f:
            f.write(raw)
        print("Reemplazo LF completado con éxito!")
    else:
        print("Error: Target no encontrado en binario.")

