# -*- coding: utf-8 -*-
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_str = """                      {/* Contenido Página 1 */}
                      <div style={{
                        padding: '12px 28px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                      }}>"""

new_str = """                      {/* Contenido Página 1 - Equilibrada, holgada y sin desbordamientos */}
                      <div style={{
                        padding: '14px 28px 12px 28px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden'
                      }}>"""

if target_str in text:
    text = text.replace(target_str, new_str, 1)
    print("Cabecera de padding reemplazada")
else:
    text_norm = text.replace('\r\n', '\n')
    if target_str.replace('\r\n', '\n') in text_norm:
        text_norm = text_norm.replace(target_str.replace('\r\n', '\n'), new_str.replace('\r\n', '\n'), 1)
        text = text_norm
        print("Cabecera de padding reemplazada (normalizado)")

# Actualizar el bloque de sellos en Dossier P1 para aumentar tamaño de logos y nitidez
old_sellos_p1 = """                          {/* SELLOS CON LICENCIA */}
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '5px 8px',
                            borderRadius: '4px',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(8, 1fr)',
                              gap: '6px',
                              alignItems: 'center'
                            }}>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.QUALICOAT_SEASIDE} alt="Qualicoat Seaside" style={{height: '22px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.52rem', color: '#334155', fontWeight: '700'}}>Lic. 439</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.QUALIDECO} alt="Qualideco" style={{height: '22px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.52rem', color: '#334155', fontWeight: '700'}}>Lic. ES-0004</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.QUALANOD} alt="Qualanod" style={{height: '22px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.52rem', color: '#334155', fontWeight: '700'}}>Qualanod</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.KIWA_9001} alt="ISO 9001" style={{height: '22px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.52rem', color: '#334155', fontWeight: '700'}}>ISO 9001</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.KIWA_14001} alt="ISO 14001" style={{height: '22px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.52rem', color: '#334155', fontWeight: '700'}}>ISO 14001</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.KIWA_45001} alt="ISO 45001" style={{height: '22px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.52rem', color: '#334155', fontWeight: '700'}}>ISO 45001</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.SGS_50001} alt="ISO 50001" style={{height: '22px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.52rem', color: '#334155', fontWeight: '700'}}>ISO 50001</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.MARCADO_CE} alt="Marcado CE" style={{height: '22px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.52rem', color: '#334155', fontWeight: '700'}}>EN 15088</div>
                              </div>
                            </div>
                          </div>"""

new_sellos_p1 = """                          {/* SELLOS CON LICENCIA OFICIAL (NÍTIDOS Y LEGIBLES) */}
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(8, 1fr)',
                              gap: '6px',
                              alignItems: 'center'
                            }}>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.QUALICOAT_SEASIDE} alt="Qualicoat Seaside" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.54rem', color: '#1e293b', fontWeight: '800'}}>Lic. 439</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.QUALIDECO} alt="Qualideco" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.54rem', color: '#1e293b', fontWeight: '800'}}>Lic. ES-0004</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.QUALANOD} alt="Qualanod" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.54rem', color: '#1e293b', fontWeight: '800'}}>Qualanod</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.KIWA_9001} alt="ISO 9001" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.54rem', color: '#1e293b', fontWeight: '800'}}>ISO 9001</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.KIWA_14001} alt="ISO 14001" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.54rem', color: '#1e293b', fontWeight: '800'}}>ISO 14001</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.KIWA_45001} alt="ISO 45001" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.54rem', color: '#1e293b', fontWeight: '800'}}>ISO 45001</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.SGS_50001} alt="ISO 50001" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.54rem', color: '#1e293b', fontWeight: '800'}}>ISO 50001</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <img src={QUALITY_LOGOS.MARCADO_CE} alt="Marcado CE" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                                <div style={{fontSize: '0.54rem', color: '#1e293b', fontWeight: '800'}}>EN 15088</div>
                              </div>
                            </div>
                          </div>"""

if old_sellos_p1 in text:
    text = text.replace(old_sellos_p1, new_sellos_p1, 1)
    print("Sellos de calidad en Dossier P1 actualizados.")
else:
    text_norm = text.replace('\r\n', '\n')
    if old_sellos_p1.replace('\r\n', '\n') in text_norm:
        text_norm = text_norm.replace(old_sellos_p1.replace('\r\n', '\n'), new_sellos_p1.replace('\r\n', '\n'), 1)
        text = text_norm
        print("Sellos de calidad en Dossier P1 actualizados (normalizado).")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Actualización Dossier P1 terminada.")
