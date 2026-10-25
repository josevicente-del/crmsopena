"""
Script de actualización y saneamiento de datos para el CRM de Aluminio (Sopena Innovations).
- Corrige los datos de Sector & Zona de ALDAL S.L. (Murcia, San Ginés, B73849754, coordenadas, teléfono y sector).
- Normaliza la nomenclatura de la zona 'Castilla-La Mancha' en registros con erratas.
- Incorpora las 3 nuevas empresas solicitadas por el usuario:
  1. Aluminios Villalta S.L.
  2. Ventanas Térmicas Madrileñas S.L.U. (VTM)
  3. Aluminios Criptana, S.L.
"""

import json
import os

PROSPECTS_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'prospects.json')

def update_prospects():
    with open(PROSPECTS_PATH, 'r', encoding='utf-8') as f:
        prospects = json.load(f)

    print(f"Total prospectos iniciales: {len(prospects)}")

    # 1. Corrección de ALDAL S.L.
    aldal_updated = False
    for p in prospects:
        if 'aldal' in p.get('name', '').lower() or p.get('id') == 'PROP-DISTRIB-0320':
            p['name'] = "ALDAL S.L. (Aluminios de Andalucía y Levante)"
            p['zone'] = "Murcia"
            p['department'] = "San Ginés (Murcia)"
            p['cif'] = "B73849754"
            p['phone'] = "+34 968 89 22 11"
            p['email'] = "murcia@aldalsl.es"
            p['web'] = "https://aldalsl.es"
            p['location'] = [37.9547, -1.1894]
            p['sector'] = "Cerramientos y Carpinteria de Aluminio"
            p['notes'] = "Sede central en San Ginés (Murcia), Pol. Ind. Oeste. Distribución y elaboración de sistemas de carpintería de aluminio, perfiles RPT y panel composite para arquitectura en Levante y Andalucía."
            aldal_updated = True
            print(" -> ALDAL S.L. corregido exitosamente (Zona: Murcia, Sector: Cerramientos y Carpinteria de Aluminio, CIF: B73849754).")

    if not aldal_updated:
        print(" AVISO: No se localizó ALDAL S.L. en la base de datos.")

    # 2. Normalización de zonas con erratas ("Castilla la Mancha" -> "Castilla-La Mancha")
    fixed_zones_count = 0
    for p in prospects:
        if p.get('zone') == 'Castilla la Mancha':
            p['zone'] = 'Castilla-La Mancha'
            fixed_zones_count += 1
    print(f" -> Zonas normalizadas a 'Castilla-La Mancha': {fixed_zones_count} registros.")

    # 3. Nuevas empresas a incorporar
    new_companies = [
        {
            "id": "PROP-MANCHA-0507",
            "name": "Aluminios Villalta S.L.",
            "zone": "Castilla-La Mancha",
            "department": "Nambroca (Toledo)",
            "cif": "B45581642",
            "web": "https://www.aluminiosvillalta.com",
            "revenue": 1400000,
            "purchasingManager": "Dpto. Compras y Aprovisionamiento (Villalta)",
            "phone": "+34 925 36 63 16",
            "email": "central@aluminiosvillalta.com",
            "location": [39.7542, -3.9856],
            "sector": "Puertas y Ventanas",
            "products": ["Perfiles RPT", "Ventanas de Aluminio", "Cerramientos", "Chapas y Remates"],
            "contacted": False,
            "contactDate": None,
            "notes": "Fabricación y montaje de carpintería de aluminio, ventanas de rotura de puente térmico (RPT), cerramientos y mallorquinas. Instalaciones en Pol. Ind. Nambroca (Toledo).",
            "response": "Pendiente de primer contacto comercial",
            "createdAt": "2026-10-25T12:00:00.000Z",
            "emailVerified": True,
            "emailVerifiedType": "corporativo_directo",
            "safetyMailsStatus": "deliverable",
            "safetyMailsAdvice": "Verificado"
        },
        {
            "id": "PROP-MADRID-0508",
            "name": "Ventanas Térmicas Madrileñas S.L.U. (VTM)",
            "zone": "Comunidad de Madrid",
            "department": "Humanes de Madrid (Madrid)",
            "cif": "B82287012",
            "web": "http://vtmaluminioypvc.com/",
            "revenue": 1850000,
            "purchasingManager": "Dpto. Compras y Producción (VTM)",
            "phone": "+34 919 16 97 78",
            "email": "info@vtmaluminioypvc.com",
            "location": [40.2522, -3.8294],
            "sector": "Puertas y Ventanas",
            "products": ["Perfiles RPT", "Ventanas Térmicas de Aluminio", "Herrajes y Accesorios", "Puertas de Aluminio"],
            "contacted": False,
            "contactDate": None,
            "notes": "Fabricación a medida de ventanas de aluminio con rotura de puente térmico (RPT), puertas, cerramientos térmicos y mallorquinas en Humanes de Madrid.",
            "response": "Pendiente de primer contacto comercial",
            "createdAt": "2026-10-25T12:00:00.000Z",
            "emailVerified": True,
            "emailVerifiedType": "corporativo_directo",
            "safetyMailsStatus": "deliverable",
            "safetyMailsAdvice": "Verificado"
        },
        {
            "id": "PROP-MANCHA-0509",
            "name": "Aluminios Criptana, S.L.",
            "zone": "Castilla-La Mancha",
            "department": "Campo de Criptana (Ciudad Real)",
            "cif": "B13300462",
            "web": "https://aluminioscriptana.com/",
            "revenue": 2100000,
            "purchasingManager": "Dpto. Compras y Suministros (Aluminios Criptana)",
            "phone": "+34 926 56 34 56",
            "email": "info@aluminioscriptana.com",
            "location": [39.4042, -3.1256],
            "sector": "Cerramientos y Carpinteria de Aluminio",
            "products": ["Perfiles de Rotura de Puente Térmico", "Muros Cortina", "Chapas de Aluminio", "Barandillas"],
            "contacted": False,
            "contactDate": None,
            "notes": "Especialistas en carpintería de aluminio de alta gama, cerramientos técnicos, rotura de puente térmico y muros cortina. Ubicada en el Pol. Ind. Pozo Hondo de Campo de Criptana.",
            "response": "Pendiente de primer contacto comercial",
            "createdAt": "2026-10-25T12:00:00.000Z",
            "emailVerified": True,
            "emailVerifiedType": "corporativo_directo",
            "safetyMailsStatus": "deliverable",
            "safetyMailsAdvice": "Verificado"
        }
    ]

    # Evitar duplicados por id o nombre
    existing_ids = {p.get('id') for p in prospects}
    existing_names = {p.get('name', '').lower().strip() for p in prospects}

    added_count = 0
    for comp in new_companies:
        if comp['id'] not in existing_ids and comp['name'].lower().strip() not in existing_names:
            prospects.append(comp)
            added_count += 1
            print(f" -> Añadido prospecto: {comp['name']} ({comp['id']}) - Zona: {comp['zone']}")
        else:
            print(f" -> Empresa {comp['name']} ya existía en el listado.")

    with open(PROSPECTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(prospects, f, indent=2, ensure_ascii=False)

    print(f"Total prospectos final: {len(prospects)} (+{added_count} nuevos).")

if __name__ == '__main__':
    update_prospects()
