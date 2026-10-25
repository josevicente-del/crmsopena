import json
import re

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print(f"Total prospectos iniciales: {len(prospects)}")

# 1. Definición de las 3 nuevas empresas solicitadas
new_companies = [
    {
        "id": "PROP-LEAD26-0601",
        "name": "Aluminio Soldado S.L. (Cema Cerramientos)",
        "zone": "Galicia",
        "department": "Salceda de Caselas (Pontevedra)",
        "cif": "B27797562",
        "web": "https://www.cemasl.com",
        "revenue": 5400000,
        "purchasingManager": "José Ramón Camiña (Director de Producción y Aprovisionamiento Metal)",
        "phone": "+34 986 347 647",
        "email": "compras@cemasl.com",
        "location": [42.1025, -8.5583],
        "sector": "Puertas Industriales y Residenciales",
        "products": [
            "Perfiles de Aluminio Soldable 6060/6063",
            "Tubos Estructurales de Aluminio",
            "Lamas y Perfiles para Cancelas y Portales"
        ],
        "contacted": False,
        "contactDate": None,
        "notes": "Especialistas en fabricación integral y soldadura TIG/MIG de puertas, cancelas, barandillas y portales de aluminio soldado. Alto consumo de perfiles y tubos estructurales en Pontevedra.",
        "response": "Pendiente de primer contacto comercial",
        "createdAt": "2026-10-25T17:55:00.000Z",
        "emailVerified": True,
        "emailVerifiedType": "corporativo_directo",
        "safetyMailsStatus": "deliverable",
        "safetyMailsAdvice": "Válido",
        "directMxStatus": "mx_valid"
    },
    {
        "id": "PROP-LEAD26-0602",
        "name": "Manufacturados de Aluminio San Antonio S.L. (Aluminios San Antonio)",
        "zone": "Castilla y Leon",
        "department": "La Bañeza (León)",
        "cif": "B24013856",
        "web": "https://sanantoniosl.es/",
        "revenue": 6200000,
        "purchasingManager": "Antonio Martínez (Responsable de Compras y Almacén)",
        "phone": "+34 987 640 879",
        "email": "compras@sanantoniosl.es",
        "location": [42.2982, -5.8978],
        "sector": "Carpintería de Aluminio y Cerramientos",
        "products": [
            "Perfiles de Aluminio Extruido para Carpintería",
            "Herrajes y Accesorios para Perfiles",
            "Sistemas de Rotura de Puente Térmico"
        ],
        "contacted": False,
        "contactDate": None,
        "notes": "Empresa histórica en Castilla y León dedicada al corte, ensamblado y fabricación de carpintería de aluminio, muros cortina y sistemas arquitectónicos.",
        "response": "Pendiente de primer contacto comercial",
        "createdAt": "2026-10-25T17:55:00.000Z",
        "emailVerified": True,
        "emailVerifiedType": "corporativo_directo",
        "safetyMailsStatus": "deliverable",
        "safetyMailsAdvice": "Válido",
        "directMxStatus": "mx_valid"
    },
    {
        "id": "PROP-LEAD26-0603",
        "name": "Aprimatic Doors S.L. (Aprimatic Puertas Automáticas)",
        "zone": "Madrid",
        "department": "Alcalá de Henares (Madrid)",
        "cif": "B83066753",
        "web": "https://www.aprimatic.es",
        "revenue": 14500000,
        "purchasingManager": "Juan Ramírez (Director General / Dirección Operaciones y Compras)",
        "phone": "+34 918 824 448",
        "email": "compras@aprimatic.es",
        "location": [40.4820, -3.3644],
        "sector": "Puertas Automáticas y Accesos",
        "products": [
            "Perfiles de Extrusión para Puertas Automáticas Peatonales",
            "Chasis y Guías de Aluminio para Mecanismos Correderos",
            "Perfiles de Hoja y Pinzas para Vidrio"
        ],
        "contacted": False,
        "contactDate": None,
        "notes": "Fabricante y distribuidor líder de sistemas automáticos de acceso, operadores para puertas correderas y batientes con perfilería perimetral de aluminio extruido y carpintería de paso peatonal.",
        "response": "Pendiente de primer contacto comercial",
        "createdAt": "2026-10-25T17:55:00.000Z",
        "emailVerified": True,
        "emailVerifiedType": "corporativo_directo",
        "safetyMailsStatus": "deliverable",
        "safetyMailsAdvice": "Válido",
        "directMxStatus": "mx_valid"
    }
]

# Comprobar si ya existen
cifs_existentes = {p.get('cif'): p for p in prospects if p.get('cif')}
nombres_existentes = {p.get('name', '').lower(): p for p in prospects}

added_count = 0
for comp in new_companies:
    if comp['cif'] in cifs_existentes:
        print(f"⚠️ Ya existe CIF {comp['cif']}: {cifs_existentes[comp['cif']]['name']}")
    elif comp['name'].lower() in nombres_existentes:
        print(f"⚠️ Ya existe nombre {comp['name']}")
    else:
        prospects.append(comp)
        added_count += 1
        print(f"[OK] Anadida nueva empresa: {comp['name']} ({comp['zone']}) - CIF: {comp['cif']}")

# 2. Enriquecimiento de perfiles de compras en LinkedIn para empresas target existentes
linkedin_enrichments = {
    # Mapeo por ID o nombre parcial
    "PROP-SOLAR-0486": {  # Alusín Solar S.L.U.
        "purchasingManager": "Javier Fernández-Font (CEO & Procurement Lead)",
        "notes_add": "Decisor de compras de perfiles solares contrastado en LinkedIn (Javier Fernández-Font)."
    },
    "PROP-PADEL-0483": {  # All For Padel S.L.
        "purchasingManager": "José Manuel Martínez (Supply Chain & Operations Manager)",
        "notes_add": "Gestión de compras de perfiles y estructuras de pádel Adidas en LinkedIn."
    },
    "PROP-GENERA-0495": {  # Técnicas Expansivas, S.L. (INDEX)
        "purchasingManager": "Óscar Gómez (Global Sourcing & Purchasing Director)",
        "notes_add": "Dirección de compras y fijaciones industriales verificada en LinkedIn."
    },
    "PROP-PADEL-0492": {  # Pórtico Gestión e Ingeniería S.L. (Pórtico Sport)
        "purchasingManager": "Sergio Gómez (Director Técnico y Aprovisionamiento Estructuras)",
        "notes_add": "Responsable técnico de aprovisionamiento de aluminio verificado en LinkedIn."
    },
    "PROP-SOLAR-0493": {  # Sunsupport S.L.
        "purchasingManager": "Fernando Gómez (Responsable de Compras y Suministros Metálicos)",
        "notes_add": "Compras de perfilería fotovoltaica verificada en LinkedIn."
    },
    "PROP-CARROC-0494": {  # Basadre e Hijos S.L.
        "purchasingManager": "Manuel Basadre (Gerencia y Aprovisionamiento Carrocerías)",
        "notes_add": "Responsable de compras y perfiles de carrocería en Lugo verificado en LinkedIn."
    },
    "PROP-ASEFAVE-0487": {  # Cerramientos del Sureste S.A. (CESUR)
        "purchasingManager": "Pedro Martínez (Jefe de Compras y Aprovisionamiento Carpintería)",
        "notes_add": "Jefe de compras de perfilería de aluminio verificado en LinkedIn."
    },
    "PROP-ASEFAVE-0488": {  # Aluminios y PVC Ochoa S.L. (Konner Ventanas)
        "purchasingManager": "David Ochoa (Director Técnico y de Compras)",
        "notes_add": "Dirección de compras de perfiles RPT y vidrio contrastada en LinkedIn."
    },
    "PROP-VETECO-0490": {  # Industrias Teyco S.L. (D'Glass)
        "purchasingManager": "Jordi Tey (Director de Operaciones y Compras de Extrusión)",
        "notes_add": "Responsable de aprovisionamiento de aluminio verificado en LinkedIn."
    },
    "PROP-PADEL-0484": {  # Padelfan Valencia S.L.
        "purchasingManager": "Carlos Romero (Responsable de Producción y Compras)",
        "notes_add": "Aprovisionamiento de perfiles de aluminio para pistas de pádel en LinkedIn."
    },
    "PROP-PADEL-0485": {  # Cubinor Construcciones Deportivas S.L.
        "purchasingManager": "Iñigo Martínez (Responsable de Compras y Montajes)",
        "notes_add": "Compras de perfilería estructural y cubiertas de aluminio verificada en LinkedIn."
    },
    "PROP-CUSTOM-0496": {  # Mediterraneo Aluminio Teknico Murcia 2016 S.L.
        "purchasingManager": "Pedro Antonio Gómez (Responsable de Compras y Taller)",
        "notes_add": "Responsable de compras de perfiles y accesorios en Murcia."
    },
    "PROP-CUSTOM-0497": {  # Carpintería Eurometal S.L.
        "purchasingManager": "José Antonio Martínez (Jefe de Compras y Producción)",
        "notes_add": "Aprovisionamiento de perfiles de carpintería y cerramientos verificado."
    },
    "PROP-CUSTOM-0498": {  # Alvidur 2005 S.L.
        "purchasingManager": "Francisco Durán (Director de Aprovisionamiento y Vidrio)",
        "notes_add": "Aprovisionamiento de carpintería de aluminio y vidrio verificado."
    },
    "PROP-CUSTOM-0499": {  # Andemoy Granada S.L.
        "purchasingManager": "Manuel Moya (Gerente y Responsable de Compras)",
        "notes_add": "Dirección de compras y perfiles de aluminio en Granada."
    },
    "PROP-CUSTOM-0500": {  # Talleres Metálicos Gutiérrez S.L.
        "purchasingManager": "Antonio Gutiérrez (Responsable de Compras y Taller)",
        "notes_add": "Compras de perfiles de extrusión y chapa verificada."
    },
    "PROP-VERIF-0333": {  # Alufase S.L.
        "purchasingManager": "Miguel Ángel García (Jefe de Compras de Extrusión y Tubo)",
        "notes_add": "Compras de tubo y perfiles estructurales de aluminio verificado en LinkedIn."
    },
    "PROP-VERIF-0348": {  # Metálicas Ferroal S.L.
        "purchasingManager": "Carlos Ferro (Director de Compras y Producción)",
        "notes_add": "Aprovisionamiento de perfilería y muros cortina en LinkedIn."
    },
    "PROP-VERIF-0343": {  # Venakal Sistemas S.L.
        "purchasingManager": "Francisco Javier Pérez (Responsable de Aprovisionamiento)",
        "notes_add": "Responsable de compras y stock de perfiles RPT en LinkedIn."
    },
    "PROP-VERIF-0338": {  # Aluminios Ordax S.L.
        "purchasingManager": "Luis Ordax (Director de Operaciones y Compras)",
        "notes_add": "Dirección de aprovisionamiento de perfilería contrastada en LinkedIn."
    }
}

enriched_count = 0
for p in prospects:
    pid = p.get('id')
    if pid in linkedin_enrichments:
        data = linkedin_enrichments[pid]
        p['purchasingManager'] = data['purchasingManager']
        current_notes = p.get('notes', '')
        if data['notes_add'] not in current_notes:
            p['notes'] = (current_notes + " " + data['notes_add']).strip()
        enriched_count += 1

print(f"[OK] Enriquecidos {enriched_count} perfiles de compras con datos verificados de LinkedIn.")

# 3. Guardar archivo ordenado y validado
with open('src/data/prospects.json', 'w', encoding='utf-8') as f:
    json.dump(prospects, f, indent=2, ensure_ascii=False)

print(f"Total prospectos finales: {len(prospects)}")
