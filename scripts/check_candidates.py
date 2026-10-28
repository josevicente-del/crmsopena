import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

existing_cifs = {p.get('cif', '').strip().upper() for p in prospects if p.get('cif')}
existing_names = [p.get('name', '').lower() for p in prospects]

def check_company(name, cif=None):
    if cif and cif.strip().upper() in existing_cifs:
        return True, f"Existe CIF {cif}"
    for en in existing_names:
        if name.lower() in en or en in name.lower():
            return True, f"Existe nombre similar: {en}"
    return False, "Nueva"

terms = [
    ("Sunfer Estructuras", "B98692791"),
    ("Praxia Energy", "B74182969"),
    ("Esasolar", "B90176843"),
    ("Hiberlux", "A28704252"),
    ("Klein Iberica", "A08082695"),
    ("Aluminios Cortizo", ""),
    ("Airfal International", "A50058817"),
    ("Lamp Lighting", "A08316275"),
    ("GARCIA FAURA", ""),
    ("Citterio", "")
]

for name, cif in terms:
    exists, reason = check_company(name, cif)
    print(f"{name} -> {exists} ({reason})")
