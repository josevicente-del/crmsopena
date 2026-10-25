import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

cifs_existentes = {p.get('cif', '').strip().upper() for p in prospects if p.get('cif')}
nombres_existentes = {p.get('name', '').lower() for p in prospects}

print(f"Base de datos actual: {len(prospects)} empresas")

test_candidates = [
    ("Novedades Agricolas S.A. (Novagric)", "A30089858", "Murcia", "Invernaderos y Estructuras de Extrusion"),
    ("Ulma Agricola S. Coop.", "F20078043", "Pais Vasco", "Invernaderos y Estructuras de Extrusion"),
    ("Rufepa Tecnoagro S.L.", "B03947801", "Comunidad Valenciana", "Invernaderos y Estructuras de Extrusion"),
    ("Ininsa (Invernaderos e Instalaciones S.A.)", "A46167883", "Comunidad Valenciana", "Invernaderos y Estructuras de Extrusion"),
    ("Klein Iberica S.A.U.", "A08082695", "Cataluna", "Puertas Automaticas y Correderas"),
    ("Portalum S.L.", "B19253459", "Castilla-La Mancha", "Puertas y Persianas de Aluminio"),
    ("Lucerglass S.L.", "B33496035", "Asturias", "Lucernarios y Techos de Aluminio"),
    ("ST-Systemet S.L.", "B60432366", "Cataluna", "Mamparas y Divisiones Modulares"),
    ("Azbil Telstar S.L.", "A08151219", "Cataluna", "Salas Limpias y Cerramientos Sanitarios"),
    ("Luxiona S.L.", "B60322526", "Cataluna", "Iluminacion Tecnica y Disipacion LED"),
    ("Alumisan S.L.", "B15024763", "Galicia", "Distribucion y Transformacion de Sistemas de Aluminio"),
    ("Aluminios Galisur S.L.", "B41257460", "Andalucia", "Carpinteria y Cerramientos de Aluminio"),
    ("Alumed Sistemas S.L.", "B53494886", "Comunidad Valenciana", "Sistemas de Carpinteria de Aluminio"),
    ("Microarquitectura S.L.", "B60935541", "Cataluna", "Mobiliario Urbano y Estructuras de Aluminio"),
    ("Primur S.A.", "A28751519", "Madrid", "Mobiliario Urbano y Cerramientos"),
    ("Disset Odiseo S.L.", "B08709321", "Cataluna", "Plataformas y Estructuras Modulares"),
    ("Signes Dissenys Tecnics S.L.", "B58265323", "Cataluna", "Senaletica y Rotulacion en Aluminio"),
    ("Aluminios Macrisva S.L.", "B33145897", "Asturias", "Carpinteria de Aluminio y Cerramientos"),
    ("Construcciones Metalicas Comesana S.L.", "B36631893", "Galicia", "Estructuras y Cerramientos de Aluminio"),
    ("Aluminis Iluro S.L.", "B58897588", "Cataluna", "Carpinteria de Aluminio y Muros Cortina"),
    ("Aluminios Alcar S.L.", "B30045231", "Murcia", "Cerramientos y Carpinteria de Aluminio"),
    ("Alcalum Carpinteria S.L.", "B82619081", "Madrid", "Cerramientos y Fachadas de Aluminio"),
    ("Hiberlux Techos y Fachadas Ligeras S.L.", "B86927498", "Madrid", "Lucernarios y Fachadas Ligeras de Aluminio"),
    ("Sistemas Termicos Alviento S.L.", "B87219481", "Madrid", "Ventanas y Cerramientos RPT"),
    ("Carpinteria Metalica Alupre S.L.", "B31456789", "Navarra", "Cerramientos y Fachadas de Aluminio")
]

cleaned_new = []
for name, cif, zone, sector in test_candidates:
    cif_clean = cif.strip().upper()
    if cif_clean in cifs_existentes:
        print(f"DESCARTADA por CIF: {name} ({cif_clean})")
        continue
    # Comprobar si el nombre ya está
    match = False
    for en in nombres_existentes:
        core_words = [w for w in name.lower().replace('(', '').replace(')', '').split() if len(w) > 4 and w not in ['aluminio', 'aluminios', 'sistemas', 'espana', 'industrias']]
        if core_words and any(w in en for w in core_words):
            print(f"DESCARTADA por Nombre: {name} (coincide con {en})")
            match = True
            break
    if not match:
        cleaned_new.append((name, cif_clean, zone, sector))
        print(f"ACEPTADA COMO NUEVA: {name} ({cif_clean}, {zone})")

print(f"\nTotal aceptadas como 100% nuevas: {len(cleaned_new)} de {len(test_candidates)}")
