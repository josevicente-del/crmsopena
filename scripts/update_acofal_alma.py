import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print(f"Total prospectos iniciales: {len(prospects)}")

updated_prospects = []
removed_alma = None
updated_acofal = None

for p in prospects:
    name = str(p.get('name', ''))
    web = str(p.get('web', ''))
    
    # 1. Quitar Alma Componentes S.A. (alma.es)
    if 'alma.es' in web.lower() or name.strip().lower().startswith('alma componentes'):
        removed_alma = p
        print(f"-> Eliminando empresa: {name} (ID: {p.get('id')}, Web: {web})")
        continue
    
    # 2. Actualizar Acofal
    if 'acofal' in name.lower() or 'acofal' in web.lower():
        p['web'] = 'https://acofal.es/'
        if p.get('email') == 'compras@acofal.com':
            p['email'] = 'compras@acofal.es'
        p['name'] = 'ACOFAL (Accesorios para Fabricación de Aluminio S.L.)'
        p['notes'] = 'Fabricante referente en accesorios y herrajes para carpintería de aluminio (escuadras, juntas de estanqueidad, cierres y pasadores).'
        updated_acofal = p
        print(f"-> Actualizada Acofal: Web={p['web']}, Email={p['email']}")
    
    updated_prospects.append(p)

print(f"Total prospectos resultantes: {len(updated_prospects)}")
assert removed_alma is not None, "Error: No se encontró la empresa Alma Componentes S.A."
assert updated_acofal is not None, "Error: No se encontró la empresa Acofal"

with open('src/data/prospects.json', 'w', encoding='utf-8') as f:
    json.dump(updated_prospects, f, indent=2, ensure_ascii=False)

print("src/data/prospects.json actualizado correctamente.")
