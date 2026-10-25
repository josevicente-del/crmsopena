import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

existing_cifs = {p.get('cif', '').strip().upper() for p in prospects if p.get('cif')}
existing_names = [p.get('name', '').lower() for p in prospects]

new_batch_candidates = [
    ("Novedades Agricolas (Novagric)", "A30089858"),
    ("Ulma Agricola", "F20078043"),
    ("Rufepa Tecnoagro", "B03947801"),
    ("Ininsa (Invernaderos e Instalaciones)", "A46167883"),
    ("Lecinena Trailer", "A50005081"),
    ("Guillen Desarrollos Industriales", "B96541578"),
    ("Indetruck", "B73907721"),
    ("Angel Mir (Portes Bisbal)", "B17056425"),
    ("Ferroflex", "B61783064"),
    ("Novoferm Alsal", "A28076594"),
    ("Benito Urban", "B63273106"),
    ("Microarquitectura", "B60935541"),
    ("Primur (Mobiliario Urbano)", "A28751519"),
    ("PV Hardware (PVH - Gransolar)", "B86274479"),
    ("Axial Structural Solutions", "B98007289"),
    ("Movinord Formas y Espacios", "A31023773"),
    ("Portalum", "B19253459"),
    ("Hiberlux Techos y Fachadas", "A28704252"),
    ("Lucerglass", "B33496035"),
    ("ST-Systemet", "B60432366"),
    ("Azbil Telstar", "A08151219"),
    ("Luxiona", "B60322526"),
    ("Klein Iberica", "A08082695")
]

available = []
for name, cif in new_batch_candidates:
    found = False
    if cif and cif.strip().upper() in existing_cifs:
        found = True
        reason = f"CIF {cif} ya existe"
    else:
        for en in existing_names:
            words = [w for w in name.lower().split() if len(w) > 4]
            if any(w in en for w in words):
                found = True
                reason = f"Nombre similar: {en}"
                break
    if not found:
        print(f"DISPONIBLE: {name} (CIF: {cif})")
        available.append((name, cif))
    else:
        print(f"YA EXISTE: {name} -> {reason}")

print(f"\nTotal disponibles: {len(available)} de {len(new_batch_candidates)}")
