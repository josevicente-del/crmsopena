import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print("=== REVISIÓN DE PROSPECTOS 0030 A 0150 ===")
for p in prospects:
    pid = p['id']
    if pid.startswith('PROP-VERIF-00') or pid.startswith('PROP-VERIF-01'):
        num = int(pid.replace('PROP-VERIF-', '')) if pid.replace('PROP-VERIF-', '').isdigit() else 999
        if 32 <= num <= 150:
            print(f"[{p['id']}] {p['name']} | Zone: {p.get('zone')} | Dept: {p.get('department')} | Loc: {p.get('location')} | CIF: {p.get('cif')}")
