import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

generic = []
specific = []

for p in prospects:
    pm = str(p.get('purchasingManager', '')).strip()
    # Si empieza con dpto o departamento sin paréntesis con nombre
    if not pm or (pm.lower().startswith(('dpto', 'departamento', 'compras', 'area', 'servicio', 'direcci')) and '(' not in pm):
        generic.append(p)
    else:
        specific.append(p)

print(f"Total prospectos: {len(prospects)}")
print(f"Con decisor específico: {len(specific)}")
print(f"Con decisor genérico: {len(generic)}")

print("\n--- MUESTRA DE 25 EMPRESAS CON RESPONSABLE GENÉRICO ---")
for p in generic[:25]:
    print(f"{p.get('id')} | {p.get('name')} | Actual: {p.get('purchasingManager')} | Web: {p.get('web')}")
