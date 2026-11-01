# -*- coding: utf-8 -*-
import sys
import re

app_path = "src/App.jsx"

with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """                            <div className="dossier-tech-card">
                              <div className="dossier-tech-header">
                                <span className="dossier-tech-name">Serie GS-82 RT</span>
                                <span className="dossier-tech-badge">Estándar Corredera</span>
                              </div>
                              <div className="dossier-tech-specs">
                                <div className="dossier-tech-spec-item">Espesor Marco: <strong>82 mm</strong></div>
                                <div className="dossier-tech-spec-item">Ensayos AEV: <strong>Clase 3 / 7A / C3</strong></div>
                              </div>
                              <p className="dossier-tech-desc">Corredera perimetral clásica con rotura de puente térmico. Apta para hojas de peso medio de hasta 200 kg. Óptima para reposición y reformas rápidas.</p>
                            </div>
                          </div>
                        </div>"""

replacement = """                            <div className="dossier-tech-card">
                              <div className="dossier-tech-header">
                                <span className="dossier-tech-name">Serie GS-82 RT</span>
                                <span className="dossier-tech-badge">Estándar Corredera</span>
                              </div>
                              <div className="dossier-tech-specs">
                                <div className="dossier-tech-spec-item">Espesor Marco: <strong>82 mm</strong></div>
                                <div className="dossier-tech-spec-item">Ensayos AEV: <strong>Clase 3 / 7A / C3</strong></div>
                              </div>
                              <p className="dossier-tech-desc">Corredera perimetral clásica con rotura de puente térmico. Apta para hojas de peso medio de hasta 200 kg. Óptima para reposición y reformas rápidas.</p>
                            </div>
                          </div>
                        </div>

                        {/* SECCIÓN OBRAS REALES Y CAPACIDAD PRODUCTIVA INDUSTRIAL */}
                        <div className="dossier-section page-break" style={{marginTop: '30px'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px'}}>
                            <h3 className="dossier-section-title" style={{margin: 0}}>Obras Emblemáticas y Capacidad Productiva Real</h3>
                            <span style={{background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 'bold'}}>
                              🏗️ Casos de Éxito y Grandes Proyectos
                            </span>
                          </div>

                          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px'}}>
                            {/* OBRA 1: ROIG ARENA */}
                            <div style={{background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'}}>
                              <div style={{position: 'relative', height: '220px', overflow: 'hidden', background: '#0f172a'}}>
                                <img 
                                  src="/roig_arena.jpg" 
                                  alt="Roig Arena Valencia - Suministro Grupo Sopena" 
                                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                />
                                <div style={{position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold'}}>
                                  🏟️ Roig Arena (Valencia)
                                </div>
                              </div>
                              <div style={{padding: '16px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                                <h4 style={{margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--sopena-blue-dark)'}}>
                                  Suministro de Fachada y Perfilería de Gran Escala
                                </h4>
                                <p style={{margin: '0 0 12px 0', fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5'}}>
                                  Participación en el macrocomplejo multiusos con envolvente de lamas arquitectónicas de alta inercia estructural.
                                </p>
                                <div style={{background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: 'auto'}}>
                                  <div style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#072b66', textTransform: 'uppercase', marginBottom: '6px'}}>
                                    📊 Capacidad Productiva Ejecutada:
                                  </div>
                                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem', color: '#334155'}}>
                                    <div>⚡ <strong>55 Tm</strong> de extrusión</div>
                                    <div>✨ <strong>4.500</strong> barras anodizadas</div>
                                    <div>🎨 <strong>11</strong> barras lacadas</div>
                                    <div>🪵 <strong>1.500</strong> barras sublimación</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* OBRA 2: VIVIENDAS PREMIUM */}
                            <div style={{background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'}}>
                              <div style={{position: 'relative', height: '220px', overflow: 'hidden', background: '#0f172a'}}>
                                <img 
                                  src="/viviendas_premium.jpg" 
                                  alt="Residencial Viviendas Premium - Carpintería Minimalista Grupo Sopena" 
                                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                />
                                <div style={{position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold'}}>
                                  🏡 Residencial Viviendas Premium
                                </div>
                              </div>
                              <div style={{padding: '16px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                                <h4 style={{margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--sopena-blue-dark)'}}>
                                  Carpintería Minimalista Elevable & Perfiles RPT
                                </h4>
                                <p style={{margin: '0 0 12px 0', fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5'}}>
                                  Suministro de la Serie GS-120 RT de cruce reducido (25 mm) y grandes formatos acristalados con rodadura reforzada y protección Qualicoat Seaside.
                                </p>
                                <div style={{background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: 'auto'}}>
                                  <div style={{fontSize: '0.75rem', fontWeight: 'bold', color: '#072b66', textTransform: 'uppercase', marginBottom: '6px'}}>
                                    📐 Ficha Técnica Destacada:
                                  </div>
                                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.78rem', color: '#334155'}}>
                                    <div>🪟 <strong>GS-120 RT</strong> corredera</div>
                                    <div>🛡️ <strong>Qualicoat Seaside</strong></div>
                                    <div>⚖️ <strong>Hasta 400 kg</strong> / hoja</div>
                                    <div>🌡️ <strong>Uw &lt; 0.9</strong> W/m²K</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>"""

assert target in content, "target not found in content"
content = content.replace(target, replacement, 1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Real works injected successfully!")

