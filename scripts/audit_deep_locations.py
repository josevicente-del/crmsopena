import json
import collections

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print(f"Total prospectos: {len(prospects)}")

# 1. Analizar cuántas tienen department vacío
empty_dept = [p for p in prospects if not p.get('department') or p.get('department').strip() == '']
print(f"\nEmpresas con department vacío ({len(empty_dept)}):")
for p in empty_dept:
    print(f"[{p['id']}] {p['name']} | Zone: {p.get('zone')} | Loc: {p.get('location')} | Web: {p.get('web')}")

# 2. Analizar coordenadas duplicadas exactas
loc_counts = collections.defaultdict(list)
for p in prospects:
    loc_tuple = tuple(p.get('location', [0, 0]))
    loc_counts[loc_tuple].append(p)

duplicate_locs = {loc: plist for loc, plist in loc_counts.items() if len(plist) > 2}
print(f"\nUbicaciones con más de 2 empresas compartiendo coordenadas exactas ({len(duplicate_locs)} puntos):")
for loc, plist in duplicate_locs.items():
    print(f"Loc: {loc} -> {len(plist)} empresas: {[p['name'] for p in plist[:5]]} (Zonas: {set(p.get('zone') for p in plist)})")

# 3. Analizar prospectos donde department contenga un '/' (multizona)
slash_depts = [p for p in prospects if '/' in p.get('department', '')]
print(f"\nEmpresas con multizona en department ({len(slash_depts)}):")
for p in slash_depts:
    print(f"[{p['id']}] {p['name']} | Zone: {p.get('zone')} | Dept: {p.get('department')} | Loc: {p.get('location')}")
