import json

with open('scripts/all_prospects_analyzed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0
for p in data:
    cif_ccaa = p['cif_ccaa']
    zone = p['zone'].replace('Catalua', 'Cataluña')
    if cif_ccaa and cif_ccaa != zone:
        count += 1
        print(f"#{count:02d} [{p['id']}] {p['name']}")
        print(f"    CIF: {p['cif']} ({p['cif_prov']} -> {cif_ccaa})")
        print(f"    Zone actual: '{p['zone']}' | Dept actual: '{p['dept']}'")
        print(f"    Loc actual: {p['loc']}")
        print(f"    Web: {p['web']}")
