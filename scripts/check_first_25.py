import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print("=== REVISIÓN DETALLADA DE PROP-VERIF-0001 A PROP-VERIF-0025 ===")
for p in prospects[:25]:
    print(f"[{p['id']}] {p['name']}")
    print(f"    Zone: {p.get('zone')} | Dept: {p.get('department')}")
    print(f"    Loc: {p.get('location')}")
    print(f"    Web: {p.get('web')}")
    print(f"    CIF: {p.get('cif')}")
    print(f"    Notes: {p.get('notes')[:80]}")
    print("-" * 50)
