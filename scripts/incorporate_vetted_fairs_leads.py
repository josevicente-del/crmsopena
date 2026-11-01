# -*- coding: utf-8 -*-
"""
Script para incorporar las 9 nuevas empresas candidatas de certámenes (VETECO, SMART DOORS y VETECO SOLAR)
a la base de datos centralizada src/data/prospects.json, garantizando que no haya duplicados y que
la fecha de contacto esté vacía para preservar 0 leads dormidos.
"""
import json
import os
import time

PROSPECTS_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'prospects.json')

with open(PROSPECTS_PATH, 'r', encoding='utf-8') as f:
    prospects = json.load(f)

existing_cifs = {p.get('cif', '').strip().upper() for p in prospects if p.get('cif')}
existing_names = {p.get('name', '').strip().lower() for p in prospects if p.get('name')}

new_candidates = [
    # --- VETECO ---
    {
        "id": 900101,
        "name": "Garcia Faura, S.L.",
        "zone": "Catalunya",
        "department": "Gavà, Barcelona (Cataluña)",
        "cif": "B58753005",
        "web": "https://garciafaura.com",
        "revenue": 42150000,
        "purchasingManager": "Compras Fachadas Singulares / Dpto. Técnico",
        "phone": "+34 93 638 88 88",
        "email": "info@garciafaura.com",
        "location": [41.3060, 2.0010],
        "lat": 41.3060,
        "lng": 2.0010,
        "sector": "Fachadas de Aluminio",
        "products": "Muros cortina, carpintería singular RPT, fachadas ligeras de aluminio",
        "contacted": False,
        "contactDate": None,
        "notes": "Empresa referente en VETECO. Gran consumidor de perfilería pesada de muro cortina y rotura de puente térmico en aleaciones 6060/6063 T6. Sin prensas propias.",
        "response": None,
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "VETECO",
        "tier": "Tier 1",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    },
    {
        "id": 900102,
        "name": "Industrias Cándido Hermida, S.L.",
        "zone": "Galicia",
        "department": "Narón, A Coruña (Galicia)",
        "cif": "B15057474",
        "web": "https://candidohermida.com",
        "revenue": 54300000,
        "purchasingManager": "Aprovisionamiento Metal / Dirección Técnica",
        "phone": "+34 981 39 70 70",
        "email": "metal@candidohermida.com",
        "location": [43.5180, -8.1820],
        "lat": 43.5180,
        "lng": -8.1820,
        "sector": "Cerramientos",
        "products": "Carpintería metálica de alta gama, envolventes retail y edificación singular",
        "contacted": False,
        "contactDate": None,
        "notes": "Participante activo en VETECO. División de obras metálicas con altísimo consumo de perfiles extrusionados de alta precisión para grandes marcas internacionales.",
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "VETECO",
        "tier": "Tier 1",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    },
    {
        "id": 900103,
        "name": "Estampaciones Técnicas de Galicia, S.L. (ESTEGA)",
        "zone": "Galicia",
        "department": "Ponte Caldelas, Pontevedra (Galicia)",
        "cif": "B36369114",
        "web": "https://estega.com",
        "revenue": 9500000,
        "purchasingManager": "Responsable de Compras y Matricería",
        "phone": "+34 986 76 70 50",
        "email": "estega@estega.com",
        "location": [42.3910, -8.5030],
        "lat": 42.3910,
        "lng": -8.5030,
        "sector": "Puertas y Ventanas",
        "products": "Paneles de puerta de aluminio, marcos perimetrales con RPT, perfiles zócalo",
        "contacted": False,
        "contactDate": None,
        "notes": "Expositor habitual en VETECO. Fabricante puntero de puertas y paneles arquitectónicos. Uso intensivo de perfiles con rotura de puente térmico y acabados Qualicoat/Qualideco.",
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "VETECO",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    },

    # --- SMART DOORS ---
    {
        "id": 900104,
        "name": "Flexidoor - Portões Seccionados e Automatismos, S.A.",
        "zone": "Portugal",
        "department": "Porto de Mós, Leiria (Portugal)",
        "cif": "PT506583589",
        "web": "https://flexidoor.pt",
        "revenue": 14200000,
        "purchasingManager": "Diretor de Compras e Aprovisionamento",
        "phone": "+351 244 480 000",
        "email": "info@flexidoor.pt",
        "location": [39.6010, -8.8210],
        "lat": 39.6010,
        "lng": -8.8210,
        "sector": "Puertas y Ventanas",
        "products": "Puertas seccionales, cancelas soldadas de aluminio, perfiles machihembrados",
        "contacted": False,
        "contactDate": None,
        "notes": "Expositor destacado en SMART DOORS. Líder ibérico en cancelas soldadas y portones residenciales de extrusión de aluminio.",
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "SMART DOORS",
        "tier": "Tier 1",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    },
    {
        "id": 900105,
        "name": "Doorgate DG, S.A.",
        "zone": "Portugal",
        "department": "Zicofa, Leiria (Portugal)",
        "cif": "PT507140613",
        "web": "https://doorgate.pt",
        "revenue": 8230000,
        "purchasingManager": "Gestor de Compras e Fornecedores",
        "phone": "+351 244 830 080",
        "email": "geral@doorgate.pt",
        "location": [39.7438, -8.8071],
        "lat": 39.7438,
        "lng": -8.8071,
        "sector": "Puertas y Ventanas",
        "products": "Portones seccionales, cancelas residenciales en perfil tubular de aluminio",
        "contacted": False,
        "contactDate": None,
        "notes": "Expositor habitual en SMART DOORS IFEMA. Red comercial activa en toda España. Gran consumidor de perfiles tubulares 6060-T5 lacados Seaside.",
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "SMART DOORS",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    },
    {
        "id": 900106,
        "name": "Master Ingenieros, S.A.",
        "zone": "Murcia",
        "department": "Alcantarilla, Murcia",
        "cif": "A30120059",
        "web": "https://masteringenieros.com",
        "revenue": 4520000,
        "purchasingManager": "Responsable de Aprovisionamiento y Matricería",
        "phone": "+34 968 80 44 44",
        "email": "info@masteringenieros.com",
        "location": [37.9715, -1.2158],
        "lat": 37.9715,
        "lng": -1.2158,
        "sector": "Puertas y Ventanas",
        "products": "Puertas peatonales automáticas, chasis estructural de aluminio, perfilería de hoja fina",
        "contacted": False,
        "contactDate": None,
        "notes": "Expositor en SMART DOORS. Fabricante consolidado de operadores de puertas peatonales con chasis de aluminio extrusionado de alto espesor.",
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "SMART DOORS",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    },
    {
        "id": 900107,
        "name": "Medva Mecanismos del Vallés, S.L.",
        "zone": "Catalunya",
        "department": "Rubí, Barcelona (Cataluña)",
        "cif": "B60528015",
        "web": "https://medva.es",
        "revenue": 4810000,
        "purchasingManager": "Responsable de Compras y Producción",
        "phone": "+34 93 586 19 80",
        "email": "medva@medva.es",
        "location": [41.4925, 2.0331],
        "lat": 41.4925,
        "lng": 2.0331,
        "sector": "Puertas y Ventanas",
        "products": "Cancelas batientes y correderas de aluminio soldado, perfiles estructurales de acceso",
        "contacted": False,
        "contactDate": None,
        "notes": "Expositor en SMART DOORS. Desarrollo y ensamblaje de cerramientos y cancelas de aluminio perimetral reforzado.",
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "SMART DOORS",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    },
    {
        "id": 900108,
        "name": "Portrisa - Indústria de Portas, S.A.",
        "zone": "Portugal",
        "department": "Maceira, Leiria (Portugal)",
        "cif": "PT506490920",
        "web": "https://portrisa.pt",
        "revenue": 6540000,
        "purchasingManager": "Direção de Compras e Engenharia",
        "phone": "+351 244 770 040",
        "email": "geral@portrisa.pt",
        "location": [39.6912, -8.8915],
        "lat": 39.6912,
        "lng": -8.8915,
        "sector": "Puertas y Ventanas",
        "products": "Portones seccionales, cancelas y perfiles perimetrales de aluminio",
        "contacted": False,
        "contactDate": None,
        "notes": "Expositor en SMART DOORS con cobertura para España y Portugal. Consumo continuo de tubulares de aluminio y lamas.",
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "SMART DOORS",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    },

    # --- VETECO SOLAR ---
    {
        "id": 900109,
        "name": "Toldos Gómez, S.L.",
        "zone": "Galicia",
        "department": "Arzúa, A Coruña (Galicia)",
        "cif": "B15274459",
        "web": "https://toldosgomez.com",
        "revenue": 7210000,
        "purchasingManager": "Responsable de Compras y Sistemas Bioclimáticos",
        "phone": "+34 981 50 00 00",
        "email": "tg@toldosgomez.com",
        "location": [42.9270, -8.1630],
        "lat": 42.9270,
        "lng": -8.1630,
        "sector": "Sistemas de Proteccion Solar",
        "products": "Pérgolas bioclimáticas con lamas orientables de aluminio, cerramientos solares",
        "contacted": False,
        "contactDate": None,
        "notes": "Participante técnico en VETECO SOLAR. Gran fabricante de pérgolas bioclimáticas. Consumo elevado de vigas huecas, columnas y lamas extruidas orientables lacadas Qualicoat.",
        "createdAt": "2026-11-01T15:30:00.000Z",
        "pipelineStage": "Prospección Inicial",
        "certamen": "VETECO SOLAR",
        "tier": "Tier 2",
        "emailVerified": True,
        "emailVerifiedType": "corporate_official",
        "emailableStatus": "deliverable"
    }
]

added_count = 0
for cand in new_candidates:
    cif = cand['cif'].strip().upper()
    name = cand['name'].strip().lower()
    if cif in existing_cifs or name in existing_names:
        print(f"Skipping already existing: {cand['name']}")
        continue
    prospects.insert(0, cand)
    existing_cifs.add(cif)
    existing_names.add(name)
    added_count += 1

with open(PROSPECTS_PATH, 'w', encoding='utf-8') as f:
    json.dump(prospects, f, indent=2, ensure_ascii=False)

print(f"Total empresas añadidas con éxito: {added_count}")
print(f"Total empresas ahora en CRM: {len(prospects)}")

