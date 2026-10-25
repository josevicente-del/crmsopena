import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print(f'Total prospects: {len(prospects)}')

matches = []
for p in prospects:
    name = str(p.get('name', ''))
    web = str(p.get('website', ''))
    email = str(p.get('email', ''))
    cif = str(p.get('cif', ''))
    all_text = f"{name} {web} {email} {cif}".lower()
    if 'acofal' in all_text or 'alcofal' in all_text or 'alma' in all_text:
        matches.append(p)

for m in matches:
    print(f"ID: {m.get('id')}")
    print(f"Name: {m.get('name')}")
    print(f"Website: {m.get('website')}")
    print(f"Email: {m.get('email')}")
    print(f"Zone: {m.get('zone')}")
    print(f"Sector: {m.get('sector')}")
    print("-" * 40)
