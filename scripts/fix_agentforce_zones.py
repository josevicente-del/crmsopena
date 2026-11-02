# -*- coding: utf-8 -*-
with open('src/components/AgentforceAssistant.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_block = """  // Determinar zona inicial por defecto basada en las zonas asignadas al usuario activo
  const defaultUserZone = useMemo(() => {
    if (!userAllowedZones.length || userAllowedZones.includes('ALL')) return 'ALL';
    return userAllowedZones[0];
  }, [userAllowedZones]);



  // Todas las zonas activas de trabajo existentes en el CRM (dinámicas desde prospects + availableSearchZones)
  const existingActiveZones = useMemo(() => {
    const rawZones = new Set();
    prospects.forEach(p => {
      if (p.zone && typeof p.zone === 'string' && p.zone.trim()) {
        rawZones.add(p.zone.trim());
      }
    });
    availableSearchZones.forEach(z => rawZones.add(z));
    const list = Array.from(rawZones);
    if (userAllowedZones && userAllowedZones.length > 0 && !userAllowedZones.includes('ALL')) {
      return list.filter(z => userAllowedZones.includes(z)).sort((a, b) => a.localeCompare(b, 'es'));
    }
    return list.sort((a, b) => a.localeCompare(b, 'es'));
  }, [prospects, availableSearchZones, userAllowedZones]);"""

new_block = """  // Determinar zona inicial por defecto basada en las zonas asignadas al usuario activo
  const defaultUserZone = useMemo(() => {
    if (!userAllowedZones.length || userAllowedZones.includes('ALL')) return 'ALL';
    return userAllowedZones[0];
  }, [userAllowedZones]);

  // Lista canónica de todas las zonas de prospección y de trabajo activas en el CRM
  const availableSearchZones = useMemo(() => {
    const canonicalZones = [
      'Comunidad Valenciana',
      'Cataluña',
      'Madrid',
      'Comunidad de Madrid',
      'Andalucia',
      'Murcia',
      'Pais Vasco',
      'Galicia',
      'Castilla y Leon',
      'Castilla-La Mancha',
      'Aragon',
      'Asturias',
      'Cantabria',
      'Navarra',
      'La Rioja',
      'Extremadura',
      'Baleares',
      'Canarias',
      'Portugal',
      'Francia',
      'Argelia'
    ];
    const rawZones = new Set(canonicalZones);
    if (Array.isArray(prospects)) {
      prospects.forEach(p => {
        if (p.zone && typeof p.zone === 'string' && p.zone.trim()) {
          rawZones.add(p.zone.trim());
        }
      });
    }
    const list = Array.from(rawZones);
    if (userAllowedZones && userAllowedZones.length > 0 && !userAllowedZones.includes('ALL')) {
      return list.filter(z => userAllowedZones.includes(z)).sort((a, b) => a.localeCompare(b, 'es'));
    }
    return list.sort((a, b) => a.localeCompare(b, 'es'));
  }, [prospects, userAllowedZones]);

  // Todas las zonas activas de trabajo existentes en el CRM
  const existingActiveZones = useMemo(() => {
    return availableSearchZones;
  }, [availableSearchZones]);"""

if target_block in content:
    content = content.replace(target_block, new_block, 1)
    with open('src/components/AgentforceAssistant.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("AgentforceAssistant actualizado con éxito!")
else:
    # Intento con normalización de líneas
    content_norm = content.replace('\r\n', '\n')
    target_norm = target_block.replace('\r\n', '\n')
    if target_norm in content_norm:
        content_norm = content_norm.replace(target_norm, new_block.replace('\r\n', '\n'), 1)
        with open('src/components/AgentforceAssistant.jsx', 'w', encoding='utf-8') as f:
            f.write(content_norm)
        print("AgentforceAssistant actualizado con éxito (normalizado)!")
    else:
        print("Error: target_block no encontrado.")

