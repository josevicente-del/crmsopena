import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

existing_cifs = {p.get('cif', '').strip().upper() for p in prospects if p.get('cif')}
existing_names = [p.get('name', '').lower() for p in prospects]

candidates = [
    ("Sunfer Estructuras", "B98692791"),
    ("Esasolar Energy", "B90176843"),
    ("Alumero Solar Spain", "B71207165"),
    ("Klein Iberica", "A08082695"),
    ("Matz-Erreka (Erreka Puertas Automaticas)", "F20027008"),
    ("Portalum", "B19253459"),
    ("Talleres Roper (Roper Puertas)", "A39009584"),
    ("Hiberlux Lucernarios", "A28704252"),
    ("Lucerglass", "B33496035"),
    ("Gimenez Ganga (Saxun)", "B03212891"),
    ("Bandalux Industrial", "A36647204"),
    ("Persax", "A03117462"),
    ("Riventi Fachadas Estructurales", "B09419169"),
    ("Estrumat", "B31612781"),
    ("Umetal Fachadas", "B95574349"),
    ("Arlex Design", "B63503254"),
    ("Dynamobel", "A31109606"),
    ("ST-Systemet", "B60432366"),
    ("Azbil Telstar", "A08151219"),
    ("Leds C4", "A25036575"),
    ("Secom Iluminacion", "B30206107"),
    ("Luxiona", "B60322526"),
    ("Faraone Espanola", "B91054320"),
    ("Acristalia", ""),
    ("Airfal", ""),
    ("Tecnicas Expansivas", "")
]

print(f"Total prospectos actuales en base: {len(prospects)}")
available = []
for name, cif in candidates:
    found = False
    if cif and cif.strip().upper() in existing_cifs:
        found = True
        reason = f"CIF {cif} ya existe"
    else:
        for en in existing_names:
            words = [w for w in name.lower().split() if len(w) > 3]
            if any(w in en for w in words):
                found = True
                reason = f"Nombre similar en base: {en}"
                break
    if not found:
        print(f"DISPONIBLE: {name} (CIF: {cif})")
        available.append((name, cif))
    else:
        print(f"YA EXISTE: {name} -> {reason}")

print(f"\nTotal disponibles encontradas: {len(available)}")
