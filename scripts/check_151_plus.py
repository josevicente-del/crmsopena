import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print("=== REVISIÓN DE PROSPECTOS 151 EN ADELANTE ===")
for p in prospects:
    pid = p['id']
    # Analizar prospectos verificados >= 151 o con otros prefijos
    num = 0
    if 'VERIF' in pid:
        parts = pid.split('-')
        if len(parts) == 3 and parts[2].isdigit():
            num = int(parts[2])
    
    if num >= 151 or 'VERIF' not in pid:
        loc = p.get('location', [0, 0])
        print(f"[{p['id']}] {p['name']} | Zone: {p.get('zone')} | Dept: {p.get('department')} | Loc: {loc} | CIF: {p.get('cif')}")
