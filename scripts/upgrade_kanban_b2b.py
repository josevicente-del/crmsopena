# -*- coding: utf-8 -*-
"""
Script complementario para enriquecer las tarjetas del Pipeline Kanban en src/App.jsx
con el potencial de consumo (Tn/año), badge Tier A/B/C, aleación y acceso directo al Kit B2B.
"""

with open("src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read().replace("\r\n", "\n")

target = """                       <span style={{background: 'var(--sopena-blue)', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem'}}>{pipelineProspects.filter(p => (p.pipelineStage || 'Lead') === stage).length}</span>
                    </h3>
                    <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px'}}>
                      {pipelineProspects.filter(p => (p.pipelineStage || 'Lead') === stage).map(p => (
                        <div key={p.id} style={{background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${stage.includes('Ganado') ? '#10b981' : stage.includes('Perdido') ? '#ef4444' : 'var(--sopena-blue)'}`, position: 'relative'}}>
                          <button onClick={() => handleDeleteProspect(p.id)} style={{position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: 0}} title="Borrar Empresa">🗑️</button>
                          <h4 style={{margin: '0 0 5px 0', color: '#1e293b', paddingRight: '20px'}}>{p.name}</h4>
                          <p style={{margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b'}}>{p.sector} - {new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(p.revenue)}</p>
                          <select 
                            value={p.pipelineStage || 'Lead'} 
                            onChange={(e) => handleUpdatePipelineStage(p.id, e.target.value)}
                            style={{width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem'}}
                          >
                            <option value="Lead">Lead</option>
                            <option value="Contactado">Contactado</option>
                            <option value="Propuesta">Propuesta</option>
                            <option value="Cerrado Ganado">Cerrado Ganado</option>
                            <option value="Cerrado Perdido">Cerrado Perdido</option>
                          </select>
                        </div>
                      ))}"""

replacement = """                        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span style={{background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '2px 6px', fontSize: '0.72rem', fontWeight: 700}}>
                            {new Intl.NumberFormat('es-ES').format(pipelineProspects.filter(p => (p.pipelineStage || 'Lead') === stage).reduce((s, p) => s + (getB2BExtrusionProfile(p).estimatedTonsPerYear || 0), 0))} Tn/año
                          </span>
                          <span style={{background: 'var(--sopena-blue)', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem'}}>{pipelineProspects.filter(p => (p.pipelineStage || 'Lead') === stage).length}</span>
                        </span>
                    </h3>
                    <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px'}}>
                      {pipelineProspects.filter(p => (p.pipelineStage || 'Lead') === stage).map(p => {
                        const b2b = getB2BExtrusionProfile(p);
                        return (
                        <div key={p.id} style={{background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${stage.includes('Ganado') ? '#10b981' : stage.includes('Perdido') ? '#ef4444' : 'var(--sopena-blue)'}`, position: 'relative'}}>
                          <button onClick={() => handleDeleteProspect(p.id)} style={{position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: 0}} title="Borrar Empresa">🗑️</button>
                          <h4 onClick={() => setSelectedProspect(p)} style={{margin: '0 0 5px 0', color: '#1e293b', paddingRight: '20px', cursor: 'pointer'}} title="Abrir Ficha Técnica y Kit B2B">{p.name}</h4>
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px'}}>
                            <span style={{fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: b2b.b2bTier.startsWith('Tier A') ? '#ecfdf5' : b2b.b2bTier.startsWith('Tier B') ? '#eff6ff' : '#f8fafc', color: b2b.b2bTier.startsWith('Tier A') ? '#065f46' : b2b.b2bTier.startsWith('Tier B') ? '#1e40af' : '#475569', border: '1px solid #cbd5e1'}}>
                              {b2b.b2bTier.split(' ')[0]} {b2b.b2bTier.split(' ')[1]} · ~{b2b.estimatedTonsPerYear} Tn/año
                            </span>
                            <span style={{fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#475569'}}>{b2b.alloy.split(' ')[0]}</span>
                          </div>
                          <p style={{margin: '0 0 10px 0', fontSize: '0.82rem', color: '#64748b'}}>{p.sector} - {new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(p.revenue)}</p>
                          <div style={{display: 'flex', gap: '6px'}}>
                            <select 
                              value={p.pipelineStage || 'Lead'} 
                              onChange={(e) => handleUpdatePipelineStage(p.id, e.target.value)}
                              style={{flex: 1, padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem'}}
                            >
                              <option value="Lead">Lead</option>
                              <option value="Contactado">Contactado</option>
                              <option value="Propuesta">Propuesta</option>
                              <option value="Cerrado Ganado">Cerrado Ganado</option>
                              <option value="Cerrado Perdido">Cerrado Perdido</option>
                            </select>
                            <button onClick={() => setSelectedProspect(p)} style={{padding: '5px 8px', borderRadius: '4px', border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'}} title="Abrir Ficha y Kit Prospección B2B">🎯 Kit</button>
                          </div>
                        </div>
                        );
                      })}"""

assert target in content, "Kanban target not found"
content = content.replace(target, replacement, 1)

with open("src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Kanban B2B enriquecido correctamente.")
