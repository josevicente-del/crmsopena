import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# -------------------------------------------------------------
# 1. ACTUALIZAR TEXTOS Y SELLOS DE LA PRESENTACIÓN
# -------------------------------------------------------------

# A) Aleaciones Especializadas en la carta corta: añadir 6082
old_aleaciones_carta = """                              <li><strong>{isPt ? 'Ligas Especializadas:' : 'Aleaciones Especializadas:'}</strong> {isPt ? 'Extrusão na série 6000 (6060, 6005, 6083).' : 'Extrusión técnica en la serie 6000 (6060, 6005, 6083).'}</li>"""
new_aleaciones_carta = """                              <li><strong>{isPt ? 'Ligas Especializadas:' : 'Aleaciones Especializadas:'}</strong> {isPt ? 'Extrusão técnica na série 6000 (6060, 6005, 6082 estrutural, 6083).' : 'Extrusión técnica en la serie 6000 (6060, 6005, 6082 estructural, 6083).'}</li>"""
assert old_aleaciones_carta in text, "old_aleaciones_carta not found"
text = text.replace(old_aleaciones_carta, new_aleaciones_carta, 1)

# B) Quitar "Geometrías complejas de la serie 6000" y poner "Geometrías y aleaciones de distintos tipos"
# y actualizar Tratamientos Superficiales con Qualicoat Seaside, Qualanod y Qualideco
old_capacidades_carta = """                                <li style={{ marginBottom: '8px' }}><strong>{isPt ? 'Extrusão de Precisão:' : 'Extrusión de Precisión:'}</strong><br/>{isPt ? 'Geometrias exigentes da série 6000.' : 'Geometrías complejas de la serie 6000.'}</li>
                                <li style={{ marginBottom: '8px' }}><strong>{isPt ? 'Tratamentos Superficiais:' : 'Tratamientos Superficiales:'}</strong><br/>{isPt ? 'Anodizado e Lacagem Qualicoat Seaside.' : 'Anodizado y Lacado Qualicoat Seaside.'}</li>"""

new_capacidades_carta = """                                <li style={{ marginBottom: '8px' }}><strong>{isPt ? 'Extrusão de Precisão:' : 'Extrusión de Precisión:'}</strong><br/>{isPt ? 'Geometrias e ligas de diversos tipos (série 6000).' : 'Geometrías y aleaciones de distintos tipos.'}</li>
                                <li style={{ marginBottom: '8px' }}><strong>{isPt ? 'Tratamentos Superficiais:' : 'Tratamientos Superficiales:'}</strong><br/>{isPt ? 'Lacado, Anodizado e efeito madeira sob normas de qualidade em tratamentos de superfície (Qualicoat Seaside, Qualanod, Qualideco).' : 'Lacado, Anodizado y efecto madera bajo normas de calidad en tratamientos de superficie (Qualicoat Seaside, Qualanod, Qualideco).'}</li>"""
assert old_capacidades_carta in text, "old_capacidades_carta not found"
text = text.replace(old_capacidades_carta, new_capacidades_carta, 1)

# C) Parrilla de sellos: Logos e insignias oficiales vectoriales (Qualicoat Seaside, Qualanod, Qualideco, CE, ISOs)
old_sellos = """                            {/* PARRILLA DE SELLOS Y CERTIFICACIONES INTACTA (SOLICITADA POR EL USUARIO) */}
                            <div className="cert-grid" style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '5px', fontSize: '0.72rem', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>⚙️ ISO 9001</div>
                              <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '5px', fontSize: '0.72rem', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>🌱 ISO 14001</div>
                              <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '5px', fontSize: '0.72rem', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>🛡️ ISO 45001</div>
                              <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '5px', fontSize: '0.72rem', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>🇪🇺 Marcado CE</div>
                              <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '5px', fontSize: '0.72rem', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>🎖 QUALANOD</div>
                              <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '5px', fontSize: '0.72rem', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>🎖 QUALICOAT</div>
                            </div>"""

new_sellos = """                            {/* PARRILLA DE SELLOS Y CERTIFICACIONES OFICIALES VECTORIALES */}
                            <div className="cert-grid" style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                              <div style={{ background: '#ffffff', border: '1px solid #0284c7', padding: '5px 4px', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: '900', color: '#0369a1', letterSpacing: '0.5px' }}>QUALICOAT</div>
                                <div style={{ fontSize: '0.58rem', color: '#0284c7', fontWeight: 'bold' }}>🌊 SEASIDE</div>
                              </div>
                              <div style={{ background: '#ffffff', border: '1px solid #b45309', padding: '5px 4px', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: '900', color: '#b45309', letterSpacing: '0.5px' }}>QUALANOD</div>
                                <div style={{ fontSize: '0.58rem', color: '#78350f', fontWeight: 'bold' }}>⚡ ANODIZADO</div>
                              </div>
                              <div style={{ background: '#ffffff', border: '1px solid #15803d', padding: '5px 4px', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: '900', color: '#15803d', letterSpacing: '0.5px' }}>QUALIDECO</div>
                                <div style={{ fontSize: '0.58rem', color: '#166534', fontWeight: 'bold' }}>🪵 MADERA</div>
                              </div>
                              <div style={{ background: '#ffffff', border: '1px solid #1e3a8a', padding: '5px 4px', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#1e3a8a' }}>🇪🇺 CE</div>
                                <div style={{ fontSize: '0.58rem', color: '#475569' }}>EN 15088</div>
                              </div>
                              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 4px', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#334155' }}>ISO 9001</div>
                                <div style={{ fontSize: '0.58rem', color: '#64748b' }}>Calidad</div>
                              </div>
                              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '5px 4px', borderRadius: '6px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#334155' }}>ISO 14001</div>
                                <div style={{ fontSize: '0.58rem', color: '#64748b' }}>Medio Ambiente</div>
                              </div>
                            </div>"""
assert old_sellos in text, "old_sellos not found"
text = text.replace(old_sellos, new_sellos, 1)

# D) Dos Prensas de Extrusión: añadir aleación 6082
old_prensas = """                                <span style={{ fontSize: '1.2rem', color: 'var(--sopena-blue)' }}>🏭</span>
                                <div>
                                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.82rem', color: 'var(--sopena-blue-dark)' }}>Dos Prensas de Extrusión</h4>
                                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b', lineHeight: '1.3' }}>Capacidad de alta potencia para geometrías de la serie 6000 (6060, 6005, 6083).</p>
                                </div>"""

new_prensas = """                                <span style={{ fontSize: '1.2rem', color: 'var(--sopena-blue)' }}>🏭</span>
                                <div>
                                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.82rem', color: 'var(--sopena-blue-dark)' }}>Dos Prensas de Extrusión (1.600 t y 2.500 t)</h4>
                                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b', lineHeight: '1.3' }}>Capacidad de alta potencia para perfiles industriales serie 6000 (incluyendo aleación 6082 estructural, 6005, 6060 y 6083).</p>
                                </div>"""
assert old_prensas in text, "old_prensas not found"
text = text.replace(old_prensas, new_prensas, 1)

# E) Catálogo Técnico de Sistemas de Carpintería: Aclarar departamento de ingeniería y series a medida
old_catalogo_intro = """                            <h3 style={{ color: 'var(--sopena-blue-dark)', fontSize: '1.25rem', fontWeight: '800', margin: '0 0 6px 0', borderBottom: '2px solid var(--sopena-accent)', paddingBottom: '4px' }}>
                              Catálogo Técnico de Sistemas de Carpintería
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 12px 0' }}>
                              Series arquitectónicas homologadas ensayadas en laboratorios acreditados europeos:
                            </p>"""

new_catalogo_intro = """                            <h3 style={{ color: 'var(--sopena-blue-dark)', fontSize: '1.25rem', fontWeight: '800', margin: '0 0 6px 0', borderBottom: '2px solid var(--sopena-accent)', paddingBottom: '4px' }}>
                              Catálogo Técnico de Sistemas de Carpintería
                            </h3>
                            <p style={{ fontSize: '0.79rem', color: '#475569', margin: '0 0 10px 0', lineHeight: '1.35' }}>
                              Muestra representativa de algunas de nuestras series homologadas con Marcado CE. Si precisa otras prestaciones, dimensiones o roturas térmicas, consúltenos: contamos con un <strong>Departamento de Ingeniería propio</strong> que colabora con el cliente para <strong>desarrollar o adaptar series exclusivas que su empresa ya esté fabricando</strong> o diseñar nuevas matrices a medida bajo plano.
                            </p>"""
assert old_catalogo_intro in text, "old_catalogo_intro not found"
text = text.replace(old_catalogo_intro, new_catalogo_intro, 1)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Part 1: Presentation updates applied successfully!")

