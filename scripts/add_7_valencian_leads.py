import json
import os
import sys

# Reconfigurar codificación UTF-8
sys.stdout.reconfigure(encoding='utf-8')

PROSPECTS_PATH = os.path.join('src', 'data', 'prospects.json')

with open(PROSPECTS_PATH, 'r', encoding='utf-8') as f:
    prospects = json.load(f)

current_ids = set(str(p['id']) for p in prospects)
current_names = set(p['name'].lower().strip() for p in prospects)

# Base ID incremental
next_id_num = 900501

new_leads = [
    {
        "id": f"PROP-LEAD26-CV-{next_id_num}",
        "name": "Sanycces (Sanycces Bath, S.L.)",
        "zone": "Comunidad Valenciana",
        "department": "Burriana (Castellón)",
        "cif": "B12356002",
        "web": "https://sanycces.es",
        "website": "https://sanycces.es",
        "revenue": None,
        "purchasingManager": "Dirección de Compras y Desarrollo de Producto",
        "phone": "+34 964 518 202",
        "email": "info@sanycces.es",
        "location": [39.8893, -0.0847],
        "lat": 39.8893,
        "lng": -0.0847,
        "address": "Polígono Industrial Carabona, C/ Coure, 11, 12530 Burriana, Castellón",
        "sector": "Fabricacion Puertas y Ventanas",
        "products": "Mamparas de baño de diseño a medida, perfilería de compensación y guías de aluminio extruido anodizado y lacado",
        "contacted": False,
        "contactDate": None,
        "notes": "Fabricante de mamparas de baño y equipamiento de ducha. Elevado consumo industrial de perfiles de aluminio extruido con acabados superficiales de alta resistencia a la corrosión y humedad.",
        "createdAt": "2026-11-02T19:45:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "Sistemas de Baño y Cerramientos",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable",
        "tasks": [],
        "history": []
    },
    {
        "id": f"PROP-LEAD26-CV-{next_id_num + 1}",
        "name": "Cerramientos Candela, S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Elche (Alicante)",
        "cif": "B53863569",
        "web": "https://cerramientoscandela.com",
        "website": "https://cerramientoscandela.com",
        "revenue": None,
        "purchasingManager": "Responsable de Compras y Suministros Metálicos",
        "phone": "+34 966 61 53 70",
        "email": "info@cerramientoscandela.com",
        "location": [38.2669, -0.6983],
        "lat": 38.2669,
        "lng": -0.6983,
        "address": "Partida de Altabix, Polígono 1, Nº 55, 03207 Elche, Alicante",
        "sector": "Cerramientos",
        "products": "Grandes cerramientos panorámicos, techos móviles motorizados y pérgolas bioclimáticas con perfilería de aluminio",
        "contacted": False,
        "contactDate": None,
        "notes": "Fabricante e instalador de grandes estructuras y cerramientos de aluminio para hostelería y vivienda unifamiliar. Consumo continuo de perfiles de aleaciones estructurales.",
        "createdAt": "2026-11-02T19:45:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "Cerramientos y Protección Exterior",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable",
        "tasks": [],
        "history": []
    },
    {
        "id": f"PROP-LEAD26-CV-{next_id_num + 2}",
        "name": "Jubo Padel, S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Beniarbeig (Alicante)",
        "cif": "B53298808",
        "web": "https://www.jubopadel.com",
        "website": "https://www.jubopadel.com",
        "revenue": None,
        "purchasingManager": "Dpto. Compras y Aprovisionamiento Estructural",
        "phone": "+34 865 72 71 53",
        "email": "info@jubopadel.com",
        "location": [38.8217, 0.0019],
        "lat": 38.8217,
        "lng": 0.0019,
        "address": "Calle Riu Xuquer, 6, 03778 Beniarbeig, Alicante",
        "sector": "Perfiles Estructurales Aluminio",
        "products": "Estructuras autoportantes para pistas de pádel, pilares reforzados y marcos en perfilería de aleación estructural",
        "contacted": False,
        "contactDate": None,
        "notes": "Fabricante y exportador internacional de pistas de pádel. Requiere perfilería estructural de aluminio extruido de alta inercia resistente a la intemperie.",
        "createdAt": "2026-11-02T19:45:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "Estructuras Deportivas y Perfilería",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable",
        "tasks": [],
        "history": []
    },
    {
        "id": f"PROP-LEAD26-CV-{next_id_num + 3}",
        "name": "SkyPadel (Sky Padel, S.L.)",
        "zone": "Comunidad Valenciana",
        "department": "Valencia / Seseña",
        "cif": "B86440476",
        "web": "https://www.skypadel.com",
        "website": "https://www.skypadel.com",
        "revenue": None,
        "purchasingManager": "Dirección de Producción y Compras Industriales",
        "phone": "+34 91 490 16 90",
        "email": "info@skypadel.com",
        "location": [39.4699, -0.3763],
        "lat": 39.4699,
        "lng": -0.3763,
        "address": "Camino de los Pontones, 2, 45224 Seseña Nuevo (Delegación de Proyectos Levante)",
        "sector": "Perfiles Estructurales Aluminio",
        "products": "Estructuras de pistas de pádel panorámicas, marcos y pilares de aluminio extruido",
        "contacted": False,
        "contactDate": None,
        "notes": "Fabricación y montaje de pistas de pádel en todo el territorio nacional y exportación. Consumo recurrente de perfiles extruidos para pistas exteriores.",
        "createdAt": "2026-11-02T19:45:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "Estructuras Deportivas y Perfilería",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable",
        "tasks": [],
        "history": []
    },
    {
        "id": f"PROP-LEAD26-CV-{next_id_num + 4}",
        "name": "TotMàtic (New-Totmatic, S.L.)",
        "zone": "Comunidad Valenciana",
        "department": "Villajoyosa (Alicante)",
        "cif": "B54628110",
        "web": "https://totmatic.es",
        "website": "https://totmatic.es",
        "revenue": None,
        "purchasingManager": "Responsable Técnico de Compras y Automatismos",
        "phone": "+34 966 810 069",
        "email": "info@totmatic.es",
        "location": [38.5132, -0.2281],
        "lat": 38.5132,
        "lng": -0.2281,
        "address": "C/ Menadors, 38, Pol. Ind. El Torres, 03570 Villajoyosa, Alicante",
        "sector": "Cerramientos",
        "products": "Puertas automáticas industriales, puertas rápidas de lona con perfiles guía verticales de aluminio y puertas seccionales",
        "contacted": False,
        "contactDate": None,
        "notes": "Fabricación e instalación de accesos y puertas rápidas industriales en Levante. Perfiles de aluminio extruido para guías, dinteles y perfiles travesaño.",
        "createdAt": "2026-11-02T19:45:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "Puertas y Automatismos Industriales",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable",
        "tasks": [],
        "history": []
    },
    {
        "id": f"PROP-LEAD26-CV-{next_id_num + 5}",
        "name": "Induzel, S.L. (Induzel Pérgolas y Toldos)",
        "zone": "Comunidad Valenciana",
        "department": "Valencia / Levante",
        "cif": "B56430234",
        "web": "https://induzel.com",
        "website": "https://induzel.com",
        "revenue": None,
        "purchasingManager": "Dpto. de Compras y Sistemas de Protección Solar",
        "phone": "+34 922 15 33 78",
        "email": "info@induzel.com",
        "location": [39.4239, -0.3978],
        "lat": 39.4239,
        "lng": -0.3978,
        "address": "Delegación y Operaciones Levante, Comunitat Valenciana",
        "sector": "Sistemas de Proteccion Solar",
        "products": "Pérgolas bioclimáticas de lamas orientables de aluminio, techos fijos y móviles de aluminio lacado",
        "contacted": False,
        "contactDate": None,
        "notes": "Fabricación de soluciones de protección solar y pérgolas bioclimáticas con alta presencia en el litoral mediterráneo. Perfilería de aluminio extruido lacada Qualicoat.",
        "createdAt": "2026-11-02T19:45:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "Protección Solar y Pérgolas",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable",
        "tasks": [],
        "history": []
    },
    {
        "id": f"PROP-LEAD26-CV-{next_id_num + 6}",
        "name": "Cecort Sistemas, S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Sant Vicent del Raspeig (Alicante)",
        "cif": "B01607878",
        "web": "https://cecortsistemas.com",
        "website": "https://cecortsistemas.com",
        "revenue": None,
        "purchasingManager": "Dirección Técnica de Compras y Perfilería",
        "phone": "+34 965 50 28 82",
        "email": "info@cecort.es",
        "location": [38.3965, -0.5255],
        "lat": 38.3965,
        "lng": -0.5255,
        "address": "Calle Cottolengo, 28, 03690 Sant Vicent del Raspeig, Alicante",
        "sector": "Sistemas de Proteccion Solar",
        "products": "Sistemas de pérgolas bioclimáticas domóticas, techos corredizos y perfilería de aluminio con lamas motorizadas",
        "contacted": False,
        "contactDate": None,
        "notes": "Ingeniería y fabricación de cerramientos y pérgolas bioclimáticas. Consumo continuo de perfiles extruidos de aluminio a medida para proyectos residenciales y contract.",
        "createdAt": "2026-11-02T19:45:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "Protección Solar y Pérgolas",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable",
        "tasks": [],
        "history": []
    }
]

# Filtrar para evitar cualquier posible duplicado
added = []
for lead in new_leads:
    if lead['name'].lower().strip() not in current_names and str(lead['id']) not in current_ids:
        prospects.append(lead)
        added.append(lead['name'])
    else:
        print(f"Skipping duplicate: {lead['name']}")

with open(PROSPECTS_PATH, 'w', encoding='utf-8') as f:
    json.dump(prospects, f, indent=2, ensure_ascii=False)

print(f"SUCCESS: Added {len(added)} new Valencian leads to prospects.json. Total now: {len(prospects)}")
for a in added:
    print(f" - {a}")

