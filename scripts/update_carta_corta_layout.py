# -*- coding: utf-8 -*-
import sys

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Ajustes en Carta Corta para eliminar el hueco excesivo y equilibrar la composición
old_carta_corta_body = """                    {/* CUERPO CENTRAL DE LA CARTA (PÁGINA 1) */}
                    <div style={{
                      padding: '14px 28px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden'
                    }}>
                      {/* ASUNTO Y SALUDO */}
                      <div>
                        <div style={{
                          fontSize: '0.98rem',
                          fontWeight: '800',
                          color: '#072b66',
                          marginBottom: '8px',
                          letterSpacing: '-0.2px',
                          borderLeft: '3px solid #00a8e8',
                          paddingLeft: '10px'
                        }}>
                          {isPt 
                            ? 'Assunto: Extrusão, lacagem, anodização, sublimação e armazém de caixilharia'
                            : 'Asunto: Extrusión, lacado, anodizado sublimacion y almacen de carpinteria'}
                        </div>
                        <div style={{fontSize: '0.84rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px'}}>
                          {presentationTarget?.purchasingManager?.trim()
                            ? `${isPt ? 'Estimado/a' : 'Estimado/a'} ${presentationTarget.purchasingManager.trim()}:`
                            : (isPt ? 'Estimada Direção de Compras e Gabinete Técnico:' : 'Estimada Dirección de Compras y Departamento Técnico:')
                          }
                        </div>

                        {/* 2 PÁRRAFOS BREVES: Quiénes somos y por qué le escribimos */}
                        <div style={{fontSize: '0.81rem', lineHeight: '1.42', color: '#334155'}}>
                          <p style={{margin: '0 0 6px 0'}}>
                            {isPt ? (
                              <>Somos a <strong>Sopena Innovations</strong>, divisão industrial do Grupo Sopena com fábrica e centro logístico integrado no <strong>Polígono Industrial Los Vientos (Náquera, Valencia)</strong>. Contamos com ciclo completo de produção: fundição de biletes, prensas de extrusão de alta potência, instalações próprias de lacagem vertical (Qualicoat Seaside), anodização controlada (Qualanod), efeito madeira por sublimação (Qualideco) e montagem de rutura de ponte térmica (RPT).</>
                            ) : (
                              <>Somos <strong>Sopena Innovations</strong>, división industrial de Grupo Sopena con planta fabril y centro logístico centralizado en el <strong>Polígono Industrial Los Vientos (Náquera, Valencia)</strong>. Disponemos de ciclo integral de producción: fundición de tocho, prensas de extrusión de alta capacidad, plantas propias de lacado vertical (Qualicoat Seaside), anodizado (Qualanod), sublimación efecto madera (Qualideco) y ensamblaje de rotura de puente térmico (RPT).</>
                            )}
                          </p>
                          <p style={{margin: '0 0 10px 0'}}>
                            {presentationTarget ? (
                              isPt ? (
                                <>Entramos em contacto com a <strong>{presentationTarget.name}</strong> para propor-lhe o fornecimento direto de fábrica de perfis de alumínio à medida, assegurando apoio técnico de matricaria, tolerâncias milimétricas rigorosas e prazos de resposta imediatos sem sobrecustos de intermediação.</>
                              ) : (
                                <>Nos dirigimos a <strong>{presentationTarget.name}</strong> para proponerles el suministro directo desde fábrica de perfilería de aluminio extruido a medida, garantizando soporte técnico en diseño de matrices, tolerancias milimétricas exactas y plazos ágiles sin sobrecostes de intermediación.</>
                              )
                            ) : (
                              isPt ? (
                                <>Apresentamos a nossa capacidade industrial para o desenvolvimento e extrusão de perfis industriais e séries de arquitetura, garantindo prazos de entrega rigorosos em toda a Península Ibérica.</>
                              ) : (
                                <>Presentamos nuestra capacidad industrial para el desarrollo y extrusión de perfiles industriales y series de arquitectura, garantizando plazos de entrega rigurosos en toda la Península Ibérica.</>
                              )
                            )}
                          </p>
                        </div>

                        {/* FILA DE 4 CIFRAS GRANDES (CAPACIDADES DIARIAS) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '10px',
                          marginBottom: '10px'
                        }}>
                          <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #072b66', padding: '7px 8px', borderRadius: '4px', textAlign: 'center'}}>
                            <div style={{fontSize: '1.15rem', fontWeight: '800', color: '#072b66', lineHeight: '1'}}>55 Tm/día</div>
                            <div style={{fontSize: '0.67rem', color: '#475569', marginTop: '3px', fontWeight: '600'}}>{isPt ? 'Extrusão Diária' : 'Extrusión Diaria'}</div>
                            <div style={{fontSize: '0.62rem', color: '#64748b', lineHeight: '1.1'}}>{isPt ? 'Prensas de 7" e 9"' : 'Prensas de 7" y 9"'}</div>
                          </div>
                          <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #00a8e8', padding: '7px 8px', borderRadius: '4px', textAlign: 'center'}}>
                            <div style={{fontSize: '1.15rem', fontWeight: '800', color: '#072b66', lineHeight: '1'}}>2 Prensas</div>
                            <div style={{fontSize: '0.67rem', color: '#475569', marginTop: '3px', fontWeight: '600'}}>{isPt ? 'Geometrias a Medida' : 'Geometrías a Medida'}</div>
                            <div style={{fontSize: '0.62rem', color: '#64748b', lineHeight: '1.1'}}>{isPt ? 'Até 250 mm de secção' : 'Hasta 250 mm sección'}</div>
                          </div>
                          <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #072b66', padding: '7px 8px', borderRadius: '4px', textAlign: 'center'}}>
                            <div style={{fontSize: '1.15rem', fontWeight: '800', color: '#072b66', lineHeight: '1'}}>3 Líneas</div>
                            <div style={{fontSize: '0.67rem', color: '#475569', marginTop: '3px', fontWeight: '600'}}>{isPt ? 'Tratamentos Próprios' : 'Tratamientos Propios'}</div>
                            <div style={{fontSize: '0.62rem', color: '#64748b', lineHeight: '1.1'}}>{isPt ? 'Lacagem, Anodizado, Madeira' : 'Lacado, Anodizado, Madera'}</div>
                          </div>
                          <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #00a8e8', padding: '7px 8px', borderRadius: '4px', textAlign: 'center'}}>
                            <div style={{fontSize: '1.15rem', fontWeight: '800', color: '#072b66', lineHeight: '1'}}>48-72 h</div>
                            <div style={{fontSize: '0.67rem', color: '#475569', marginTop: '3px', fontWeight: '600'}}>{isPt ? 'Almacém Regulador' : 'Almacén Regulador'}</div>
                            <div style={{fontSize: '0.62rem', color: '#64748b', lineHeight: '1.1'}}>{isPt ? 'Serviço logístico direto' : 'Servicio logístico directo'}</div>
                          </div>
                        </div>

                        {/* 3 BENEFICIOS CON PRUEBA */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                          marginBottom: '10px'
                        }}>
                          <div style={{background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '6px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px'}}>
                              <span style={{display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00a8e8'}} />
                              <strong style={{fontSize: '0.74rem', color: '#072b66'}}>{isPt ? 'Proximidade Logística' : 'Proximidad Logística'}</strong>
                            </div>
                            <div style={{fontSize: '0.69rem', color: '#475569', lineHeight: '1.35'}}>
                              {isPt ? 'Fábrica em Valência com frotas dedicadas. Menor pegada de carbono, sem atrasos alfandegários nem risco cambial.' : 'Fábrica en Valencia con frotas directas. Menor huella de carbono, sin demoras aduaneras ni sobrecostes de fletes.'}
                            </div>
                          </div>
                          <div style={{background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '6px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px'}}>
                              <span style={{display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00a8e8'}} />
                              <strong style={{fontSize: '0.74rem', color: '#072b66'}}>{isPt ? 'Rastreabilidade do Bilete' : 'Trazabilidad desde Tocho'}</strong>
                            </div>
                            <div style={{fontSize: '0.69rem', color: '#475569', lineHeight: '1.35'}}>
                              {isPt ? 'Ligas EN AW-6060, 6005 e 6082 com controlo espetrométrico contínuo em fundição e extrusão certificada.' : 'Aleaciones EN AW-6060, 6005 y 6082 con control espectrométrico continuo en fundición y extrusión certificada.'}
                            </div>
                          </div>
                          <div style={{background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '6px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px'}}>
                              <span style={{display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00a8e8'}} />
                              <strong style={{fontSize: '0.74rem', color: '#072b66'}}>{isPt ? 'Acabamentos Certificados' : 'Acabados Certificados'}</strong>
                            </div>
                            <div style={{fontSize: '0.69rem', color: '#475569', lineHeight: '1.35'}}>
                              {isPt ? 'Qualicoat Seaside (Lic. 439), Qualanod e Qualideco (Lic. ES-0004) para resistir a ambientes marinos severos.' : 'Qualicoat Seaside (Lic. 439), Qualanod y Qualideco (Lic. ES-0004) para resistir a la corrosión marina severa.'}
                            </div>
                          </div>
                        </div>

                        {/* FILA DE SELLOS DE CERTIFICACIÓN CON LICENCIA (MÍN. 18 MM DE ANCHO) */}
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          marginBottom: '10px'
                        }}>
                          <div style={{fontSize: '0.68rem', fontWeight: '700', color: '#072b66', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center'}}>
                            {isPt ? 'Certificações Oficiais de Qualidade e Homologações com Licença' : 'Certificaciones Oficiales de Calidad y Homologaciones con Licencia'}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: '6px',
                            alignItems: 'center'
                          }}>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.QUALICOAT_SEASIDE} alt="Qualicoat Seaside" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.55rem', color: '#334155', fontWeight: '700', marginTop: '1px'}}>Lic. 439</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.QUALIDECO} alt="Qualideco" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.55rem', color: '#334155', fontWeight: '700', marginTop: '1px'}}>Lic. ES-0004</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.QUALANOD} alt="Qualanod" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.55rem', color: '#334155', fontWeight: '700', marginTop: '1px'}}>Qualanod</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.KIWA_9001} alt="ISO 9001" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.55rem', color: '#334155', fontWeight: '700', marginTop: '1px'}}>ISO 9001</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.KIWA_14001} alt="ISO 14001" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.55rem', color: '#334155', fontWeight: '700', marginTop: '1px'}}>ISO 14001</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.KIWA_45001} alt="ISO 45001" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.55rem', color: '#334155', fontWeight: '700', marginTop: '1px'}}>ISO 45001</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.SGS_50001} alt="ISO 50001" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.55rem', color: '#334155', fontWeight: '700', marginTop: '1px'}}>ISO 50001</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.MARCADO_CE} alt="Marcado CE" style={{height: '24px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.55rem', color: '#334155', fontWeight: '700', marginTop: '1px'}}>EN 15088</div>
                            </div>
                          </div>
                        </div>

                        {/* 3 PASOS CON PLAZO DE RESPUESTA */}
                        <div style={{
                          background: '#f1f5f9',
                          borderLeft: '3px solid #072b66',
                          padding: '7px 12px',
                          borderRadius: '4px',
                          marginBottom: '10px'
                        }}>
                          <div style={{fontSize: '0.72rem', fontWeight: '800', color: '#072b66', marginBottom: '4px', textTransform: 'uppercase'}}>
                            {isPt ? 'Processo de Colaboração e Prazos de Resposta' : 'Proceso de Colaboración y Plazos de Respuesta'}
                          </div>
                          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.70rem', color: '#334155'}}>
                            <div>
                              <strong style={{color: '#072b66'}}>1. Envío de Requisitos:</strong><br/>
                              <span>{isPt ? 'Partilhe planos técnicos ou séries para estudo.' : 'Comparta planos técnicos o series a cotizar.'}</span>
                            </div>
                            <div>
                              <strong style={{color: '#072b66'}}>2. Oferta RFQ (24-48 h):</strong><br/>
                              <span>{isPt ? 'Orçamento vinculativo direto de fábrica em 24-48h.' : 'Presupuesto vinculante directo en 24-48 horas.'}</span>
                            </div>
                            <div>
                              <strong style={{color: '#072b66'}}>3. Probetas o Visita:</strong><br/>
                              <span>{isPt ? 'Envio de amostras de acabamento ou reunião.' : 'Envío de probetas de acabado o visita técnica.'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CONTACTO FINAL Y FIRMA (CON URLs VISIBLES Y QR) */}
                      <div style={{
                        borderTop: '1px solid #cbd5e1',
                        paddingTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: '14px',
                        flexShrink: 0
                      }}>
                        <div style={{fontSize: '0.75rem', color: '#334155', lineHeight: '1.35'}}>
                          <div style={{color: '#64748b', fontSize: '0.72rem', marginBottom: '1px'}}>
                            {isPt ? 'Com os melhores cumprimentos,' : 'Atentamente,'}
                          </div>
                          <div style={{fontWeight: '800', color: '#072b66', fontSize: '0.88rem'}}>
                            {getActiveSalesperson().name}
                          </div>
                          <div style={{fontSize: '0.70rem', color: '#475569', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px'}}>
                            {getActiveSalesperson().role} · GRUPO SOPENA
                          </div>
                          <div style={{fontSize: '0.70rem', color: '#334155'}}>
                            <span>Tel. {getActiveSalesperson().phone}</span>
                            <span style={{color: '#94a3b8'}}> | </span>
                            <span>Email: <a href={`mailto:${getActiveSalesperson().email}`} style={{color: '#0a3d91', textDecoration: 'none', fontWeight: '600'}}>{getActiveSalesperson().email}</a></span>
                          </div>
                          <div style={{fontSize: '0.68rem', color: '#475569', marginTop: '2px'}}>
                            <span>WhatsApp: <a href={`https://wa.me/${getActiveSalesperson().whatsapp || '34961452050'}`} target="_blank" rel="noopener noreferrer" style={{color: '#0a3d91', textDecoration: 'none'}}>https://wa.me/{getActiveSalesperson().whatsapp || '34961452050'}</a></span>
                            <span style={{color: '#94a3b8'}}> | </span>
                            <span>Web: <a href="https://www.gruposopena.com" target="_blank" rel="noopener noreferrer" style={{color: '#0a3d91', textDecoration: 'none'}}>https://www.gruposopena.com</a></span>
                          </div>
                        </div>

                        {/* CÓDIGO QR VECTORIAL OFICIAL DE GRUPO SOPENA */}
                        <div style={{textAlign: 'center', flexShrink: 0}}>
                          <img src={QR_SOPENA_SVG} alt="QR Grupo Sopena" style={{width: '54px', height: '54px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px', background: '#ffffff'}} />
                          <div style={{fontSize: '0.58rem', color: '#64748b', marginTop: '2px', fontWeight: '600'}}>gruposopena.com</div>
                        </div>
                      </div>
                    </div>"""

new_carta_corta_body = """                    {/* CUERPO CENTRAL DE LA CARTA (PÁGINA 1 - ESTRUCTURA EQUILIBRADA SIN HUECOS MUERTOS NI DESBORDAMIENTOS) */}
                    <div style={{
                      padding: '16px 28px 14px 28px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden'
                    }}>
                      {/* BLOQUE SUPERIOR: Asunto, Saludo y Párrafos comerciales */}
                      <div>
                        {/* ASUNTO CON ACENTO CIAN */}
                        <div style={{
                          fontSize: '1.02rem',
                          fontWeight: '800',
                          color: '#072b66',
                          marginBottom: '8px',
                          letterSpacing: '-0.2px',
                          borderLeft: '4px solid #00a8e8',
                          paddingLeft: '10px'
                        }}>
                          {isPt 
                            ? 'Assunto: Extrusão, lacagem, anodização, sublimação e armazém de caixilharia'
                            : 'Asunto: Extrusión, lacado, anodizado sublimacion y almacen de carpinteria'}
                        </div>
                        {/* SALUDO FORMAL */}
                        <div style={{fontSize: '0.86rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px'}}>
                          {presentationTarget?.purchasingManager?.trim()
                            ? `${isPt ? 'Estimado/a' : 'Estimado/a'} ${presentationTarget.purchasingManager.trim()}:`
                            : (isPt ? 'Estimada Direção de Compras e Gabinete Técnico:' : 'Estimada Dirección de Compras y Departamento Técnico:')
                          }
                        </div>

                        {/* PÁRRAFOS COMERCIALES: Equilibrados y con interlineado holgado */}
                        <div style={{fontSize: '0.83rem', lineHeight: '1.46', color: '#334155'}}>
                          <p style={{margin: '0 0 6px 0'}}>
                            {isPt ? (
                              <>Somos a <strong>Sopena Innovations</strong>, divisão industrial do Grupo Sopena com fábrica e centro logístico integrado no <strong>Polígono Industrial Los Vientos (Náquera, Valencia)</strong>. Contamos com ciclo completo de produção: fundição de biletes, prensas de extrusão de alta potência, instalações próprias de lacagem vertical (Qualicoat Seaside), anodização controlada (Qualanod), efeito madeira por sublimação (Qualideco) e montagem de rutura de ponte térmica (RPT).</>
                            ) : (
                              <>Somos <strong>Sopena Innovations</strong>, división industrial de Grupo Sopena con planta fabril y centro logístico centralizado en el <strong>Polígono Industrial Los Vientos (Náquera, Valencia)</strong>. Disponemos de ciclo integral de producción: fundición de tocho, prensas de extrusión de alta capacidad, plantas propias de lacado vertical (Qualicoat Seaside), anodizado (Qualanod), sublimación efecto madera (Qualideco) y ensamblaje de rotura de puente térmico (RPT).</>
                            )}
                          </p>
                          <p style={{margin: '0 0 10px 0'}}>
                            {presentationTarget ? (
                              isPt ? (
                                <>Entramos em contacto com a <strong>{presentationTarget.name}</strong> para propor-lhe o fornecimento direto de fábrica de perfis de alumínio à medida, assegurando apoio técnico de matricaria, tolerâncias milimétricas rigorosas e prazos de resposta imediatos sem sobrecustos de intermediação.</>
                              ) : (
                                <>Nos dirigimos a <strong>{presentationTarget.name}</strong> para proponerles el suministro directo desde fábrica de perfilería de aluminio extruido a medida, garantizando soporte técnico en diseño de matrices, tolerancias milimétricas exactas y plazos ágiles sin sobrecostes de intermediación.</>
                              )
                            ) : (
                              isPt ? (
                                <>Apresentamos a nossa capacidade industrial para o desenvolvimento e extrusão de perfis industriais e séries de arquitetura, garantindo prazos de entrega rigorosos em toda a Península Ibérica.</>
                              ) : (
                                <>Presentamos nuestra capacidad industrial para el desarrollo y extrusión de perfiles industriales y series de arquitectura, garantizando plazos de entrega rigurosos en toda la Península Ibérica.</>
                              )
                            )}
                          </p>
                        </div>

                        {/* FILA DE 4 MÉTRICAS DE CAPACIDAD DIARIA */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '10px',
                          marginBottom: '10px'
                        }}>
                          <div style={{background: '#f8fafc', border: '1px solid #cbd5e1', borderTop: '3px solid #072b66', padding: '8px 10px', borderRadius: '4px', textAlign: 'center'}}>
                            <div style={{fontSize: '1.20rem', fontWeight: '800', color: '#072b66', lineHeight: '1'}}>55 Tm/día</div>
                            <div style={{fontSize: '0.70rem', color: '#1e293b', marginTop: '3px', fontWeight: '700'}}>{isPt ? 'Extrusão Diária' : 'Extrusión Diaria'}</div>
                            <div style={{fontSize: '0.64rem', color: '#64748b', lineHeight: '1.2'}}>{isPt ? 'Prensas de 7" e 9"' : 'Prensas de 7" y 9"'}</div>
                          </div>
                          <div style={{background: '#f8fafc', border: '1px solid #cbd5e1', borderTop: '3px solid #00a8e8', padding: '8px 10px', borderRadius: '4px', textAlign: 'center'}}>
                            <div style={{fontSize: '1.20rem', fontWeight: '800', color: '#072b66', lineHeight: '1'}}>2 Prensas</div>
                            <div style={{fontSize: '0.70rem', color: '#1e293b', marginTop: '3px', fontWeight: '700'}}>{isPt ? 'Geometrias a Medida' : 'Geometrías a Medida'}</div>
                            <div style={{fontSize: '0.64rem', color: '#64748b', lineHeight: '1.2'}}>{isPt ? 'Até 250 mm de secção' : 'Hasta 250 mm sección'}</div>
                          </div>
                          <div style={{background: '#f8fafc', border: '1px solid #cbd5e1', borderTop: '3px solid #072b66', padding: '8px 10px', borderRadius: '4px', textAlign: 'center'}}>
                            <div style={{fontSize: '1.20rem', fontWeight: '800', color: '#072b66', lineHeight: '1'}}>3 Líneas</div>
                            <div style={{fontSize: '0.70rem', color: '#1e293b', marginTop: '3px', fontWeight: '700'}}>{isPt ? 'Tratamentos Próprios' : 'Tratamientos Propios'}</div>
                            <div style={{fontSize: '0.64rem', color: '#64748b', lineHeight: '1.2'}}>{isPt ? 'Lacagem, Anodizado, Madeira' : 'Lacado, Anodizado, Madera'}</div>
                          </div>
                          <div style={{background: '#f8fafc', border: '1px solid #cbd5e1', borderTop: '3px solid #00a8e8', padding: '8px 10px', borderRadius: '4px', textAlign: 'center'}}>
                            <div style={{fontSize: '1.20rem', fontWeight: '800', color: '#072b66', lineHeight: '1'}}>48-72 h</div>
                            <div style={{fontSize: '0.70rem', color: '#1e293b', marginTop: '3px', fontWeight: '700'}}>{isPt ? 'Almacém Regulador' : 'Almacén Regulador'}</div>
                            <div style={{fontSize: '0.64rem', color: '#64748b', lineHeight: '1.2'}}>{isPt ? 'Serviço logístico direto' : 'Servicio logístico directo'}</div>
                          </div>
                        </div>

                        {/* 3 PILARES TÉCNICOS DE VALOR */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                          marginBottom: '10px'
                        }}>
                          <div style={{background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 10px', borderRadius: '6px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px'}}>
                              <span style={{display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00a8e8'}} />
                              <strong style={{fontSize: '0.76rem', color: '#072b66'}}>{isPt ? 'Proximidade Logística' : 'Proximidad Logística'}</strong>
                            </div>
                            <div style={{fontSize: '0.70rem', color: '#475569', lineHeight: '1.35'}}>
                              {isPt ? 'Fábrica em Valência com frotas dedicadas. Menor pegada de carbono, sem atrasos alfandegários nem risco cambial.' : 'Fábrica en Valencia con frotas directas. Menor huella de carbono, sin demoras aduaneras ni sobrecostes de fletes.'}
                            </div>
                          </div>
                          <div style={{background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 10px', borderRadius: '6px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px'}}>
                              <span style={{display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00a8e8'}} />
                              <strong style={{fontSize: '0.76rem', color: '#072b66'}}>{isPt ? 'Rastreabilidade do Bilete' : 'Trazabilidad desde Tocho'}</strong>
                            </div>
                            <div style={{fontSize: '0.70rem', color: '#475569', lineHeight: '1.35'}}>
                              {isPt ? 'Ligas EN AW-6060, 6005 e 6082 com controlo espetrométrico contínuo em fundição e extrusão certificada.' : 'Aleaciones EN AW-6060, 6005 y 6082 con control espectrométrico continuo en fundición y extrusión certificada.'}
                            </div>
                          </div>
                          <div style={{background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 10px', borderRadius: '6px'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px'}}>
                              <span style={{display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00a8e8'}} />
                              <strong style={{fontSize: '0.76rem', color: '#072b66'}}>{isPt ? 'Acabamentos Certificados' : 'Acabados Certificados'}</strong>
                            </div>
                            <div style={{fontSize: '0.70rem', color: '#475569', lineHeight: '1.35'}}>
                              {isPt ? 'Qualicoat Seaside (Lic. 439), Qualanod e Qualideco (Lic. ES-0004) para resistir a ambientes marinos severos.' : 'Qualicoat Seaside (Lic. 439), Qualanod y Qualideco (Lic. ES-0004) para resistir a la corrosión marina severa.'}
                            </div>
                          </div>
                        </div>

                        {/* FILA DE 8 SELLOS DE CERTIFICACIÓN CON LICENCIA OFICIAL (NÍTIDOS Y LEGIBLES) */}
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          marginBottom: '10px'
                        }}>
                          <div style={{fontSize: '0.70rem', fontWeight: '800', color: '#072b66', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center'}}>
                            {isPt ? 'Certificações Oficiais de Qualidade e Homologações com Licença' : 'Certificaciones Oficiales de Calidad y Homologaciones con Licencia'}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: '8px',
                            alignItems: 'center'
                          }}>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.QUALICOAT_SEASIDE} alt="Qualicoat Seaside" style={{height: '26px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.58rem', color: '#1e293b', fontWeight: '800', marginTop: '2px'}}>Lic. 439</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.QUALIDECO} alt="Qualideco" style={{height: '26px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.58rem', color: '#1e293b', fontWeight: '800', marginTop: '2px'}}>Lic. ES-0004</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.QUALANOD} alt="Qualanod" style={{height: '26px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.58rem', color: '#1e293b', fontWeight: '800', marginTop: '2px'}}>Qualanod</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.KIWA_9001} alt="ISO 9001" style={{height: '26px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.58rem', color: '#1e293b', fontWeight: '800', marginTop: '2px'}}>ISO 9001</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.KIWA_14001} alt="ISO 14001" style={{height: '26px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.58rem', color: '#1e293b', fontWeight: '800', marginTop: '2px'}}>ISO 14001</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.KIWA_45001} alt="ISO 45001" style={{height: '26px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.58rem', color: '#1e293b', fontWeight: '800', marginTop: '2px'}}>ISO 45001</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.SGS_50001} alt="ISO 50001" style={{height: '26px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.58rem', color: '#1e293b', fontWeight: '800', marginTop: '2px'}}>ISO 50001</div>
                            </div>
                            <div style={{textAlign: 'center'}}>
                              <img src={QUALITY_LOGOS.MARCADO_CE} alt="Marcado CE" style={{height: '26px', maxWidth: '100%', objectFit: 'contain'}} />
                              <div style={{fontSize: '0.58rem', color: '#1e293b', fontWeight: '800', marginTop: '2px'}}>EN 15088</div>
                            </div>
                          </div>
                        </div>

                        {/* 3 PASOS CON PLAZO DE RESPUESTA */}
                        <div style={{
                          background: '#f1f5f9',
                          borderLeft: '4px solid #072b66',
                          padding: '8px 14px',
                          borderRadius: '4px',
                          marginBottom: '10px'
                        }}>
                          <div style={{fontSize: '0.74rem', fontWeight: '800', color: '#072b66', marginBottom: '4px', textTransform: 'uppercase'}}>
                            {isPt ? 'Processo de Colaboração e Prazos de Resposta' : 'Proceso de Colaboración y Plazos de Respuesta'}
                          </div>
                          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '0.72rem', color: '#334155'}}>
                            <div>
                              <strong style={{color: '#072b66'}}>1. Envío de Requisitos:</strong><br/>
                              <span>{isPt ? 'Partilhe planos técnicos ou séries para estudo.' : 'Comparta planos técnicos o series a cotizar.'}</span>
                            </div>
                            <div>
                              <strong style={{color: '#072b66'}}>2. Oferta RFQ (24-48 h):</strong><br/>
                              <span>{isPt ? 'Orçamento vinculativo direto de fábrica em 24-48h.' : 'Presupuesto vinculante directo en 24-48 horas.'}</span>
                            </div>
                            <div>
                              <strong style={{color: '#072b66'}}>3. Probetas o Visita:</strong><br/>
                              <span>{isPt ? 'Envio de amostras de acabamento ou reunião.' : 'Envío de probetas de acabado o visita técnica.'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CONTACTO FINAL Y FIRMA (CON URLs VISIBLES Y QR OFICIAL) */}
                      <div style={{
                        borderTop: '1px solid #cbd5e1',
                        paddingTop: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: '16px',
                        flexShrink: 0
                      }}>
                        <div style={{fontSize: '0.76rem', color: '#334155', lineHeight: '1.4'}}>
                          <div style={{color: '#64748b', fontSize: '0.72rem', marginBottom: '1px'}}>
                            {isPt ? 'Com os melhores cumprimentos,' : 'Atentamente,'}
                          </div>
                          <div style={{fontWeight: '800', color: '#072b66', fontSize: '0.94rem'}}>
                            {getActiveSalesperson().name}
                          </div>
                          <div style={{fontSize: '0.72rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', marginBottom: '3px'}}>
                            {getActiveSalesperson().role} · GRUPO SOPENA
                          </div>
                          <div style={{fontSize: '0.72rem', color: '#334155'}}>
                            <span>Tel. {getActiveSalesperson().phone}</span>
                            <span style={{color: '#94a3b8'}}> | </span>
                            <span>Email: <a href={`mailto:${getActiveSalesperson().email}`} style={{color: '#0a3d91', textDecoration: 'none', fontWeight: '700'}}>{getActiveSalesperson().email}</a></span>
                          </div>
                          <div style={{fontSize: '0.70rem', color: '#475569', marginTop: '2px'}}>
                            <span>WhatsApp: <a href={`https://wa.me/${getActiveSalesperson().whatsapp || '34961452050'}`} target="_blank" rel="noopener noreferrer" style={{color: '#0a3d91', textDecoration: 'none'}}>https://wa.me/{getActiveSalesperson().whatsapp || '34961452050'}</a></span>
                            <span style={{color: '#94a3b8'}}> | </span>
                            <span>Web: <a href="https://www.gruposopena.com" target="_blank" rel="noopener noreferrer" style={{color: '#0a3d91', textDecoration: 'none'}}>https://www.gruposopena.com</a></span>
                          </div>
                        </div>

                        {/* CÓDIGO QR VECTORIAL OFICIAL DE GRUPO SOPENA */}
                        <div style={{textAlign: 'center', flexShrink: 0}}>
                          <img src={QR_SOPENA_SVG} alt="QR Grupo Sopena" style={{width: '58px', height: '58px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px', background: '#ffffff'}} />
                          <div style={{fontSize: '0.60rem', color: '#072b66', marginTop: '2px', fontWeight: '700'}}>gruposopena.com</div>
                        </div>
                      </div>
                    </div>"""

if old_carta_corta_body in text:
    text = text.replace(old_carta_corta_body, new_carta_corta_body, 1)
    print("Carta Corta actualizada con balance y espaciado impecable.")
else:
    # Normalizado
    text_norm = text.replace('\r\n', '\n')
    old_norm = old_carta_corta_body.replace('\r\n', '\n')
    if old_norm in text_norm:
        text_norm = text_norm.replace(old_norm, new_carta_corta_body.replace('\r\n', '\n'), 1)
        text = text_norm
        print("Carta Corta actualizada con balance y espaciado impecable (normalizado).")
    else:
        print("ADVERTENCIA: old_carta_corta_body no encontrado.")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Proceso de Carta Corta terminado.")

