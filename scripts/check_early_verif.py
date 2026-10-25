import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

# Buscar los prospectos con ID tipo PROP-VERIF-0001 a 0020
early_verif = [p for p in prospects if p['id'].startswith('PROP-VERIF-000') or p['id'].startswith('PROP-VERIF-001') or p['id'].startswith('PROP-VERIF-002')]
print(f"Total early verif encontrados: {len(early_verif)}")
for p in early_verif:
    print(f"[{p['id']}] {p['name']} | Zone: {p.get('zone')} | Dept: {p.get('department')} | Loc: {p.get('location')} | CIF: {p.get('cif')}")
