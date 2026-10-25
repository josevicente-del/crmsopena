"""
=============================================================================
Script: add_suelos_tecnicos_category.py
Propósito: Añadir la nueva categoría 'Suelos Técnicos' al CRM incorporando
           a DC Systems (Technical Flooring Systems, S.L.) como empresa referente
           y caso de estudio técnico según https://dcsystems.es/descargas.
=============================================================================
"""

import os
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SuelosTecnicosAdder")


def add_dc_systems_prospect():
    db_path = os.path.abspath("src/data/prospects.json")
    logger.info(f"Cargando base de datos desde {db_path}...")
    
    with open(db_path, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    # Verificar si ya existe para evitar duplicidades
    exists = any("technical flooring" in p.get("name", "").lower() or "dc systems" in p.get("name", "").lower() for p in prospects)
    if exists:
        logger.warning("DC Systems ya existe en la base de datos.")
        return

    now_iso = datetime.now().isoformat() + "Z"

    # Datos técnicos extraídos de https://dcsystems.es/descargas
    dc_systems_record = {
        "id": "PROP-SUELOS-0505",
        "name": "DC Systems (Technical Flooring Systems S.L.)",
        "cif": "B75180497",
        "web": "https://dcsystems.es",
        "phone": "+34 695 44 46 59",
        "email": "cm@dcsystems.es",
        "zone": "Pais Vasco",
        "department": "Donostia / San Sebastián (Gipuzkoa)",
        "location": [43.3183, -1.9427],
        "revenue": 6200000,
        "sector": "Suelos Técnicos",
        "products": [
            "Suelos Técnicos Elevados",
            "Perfiles de Aluminio EN AW-6060 T6",
            "Techos Estructurales GRID",
            "Pedestales y Travesaños",
            "Paneles Perforados de Ventilación"
        ],
        "purchasingManager": "Dpto. Compras y Prescripción Técnica (DC Systems)",
        "notes": "Ingeniería y fabricante de suelos técnicos elevados para centros de datos (cargas de hasta 20 kN) y techos estructurales GRID DC10 / DC20 en perfiles de aluminio extruido EN AW-6060 T6 ensayados bajo norma UNE-EN 13964 con marcado CE. Ref de prescripción: https://dcsystems.es/descargas",
        "contacted": False,
        "contactDate": None,
        "response": "Pendiente de primer contacto comercial",
        "createdAt": now_iso,
        "emailVerified": True,
        "emailVerifiedType": "contacto",
        "directMxStatus": "deliverable"
    }

    # También podemos incorporar como segundo referente a Polygroup Europe S.L. (Valencina de la Concepción, Sevilla)
    # especialista nacional en suelos técnicos elevados GAMAFLOR con perfiles de aluminio perimetrales
    polygroup_record = {
        "id": "PROP-SUELOS-0506",
        "name": "Polygroup Europe S.L. (Suelos Técnicos GAMAFLOR)",
        "cif": "B91813543",
        "web": "https://polygroup.es",
        "phone": "+34 955 99 77 30",
        "email": "info@polygroup.es",
        "zone": "Andalucia",
        "department": "Valencina de la Concepción (Sevilla)",
        "location": [37.4167, -6.0667],
        "revenue": 8900000,
        "sector": "Suelos Técnicos",
        "products": [
            "Suelos Técnicos Elevados",
            "Perfiles Perimetrales de Aluminio",
            "Pedestales Regulables",
            "Sistemas GAMAFLOR"
        ],
        "purchasingManager": "Dpto. Compras y Aprovisionamiento (Polygroup)",
        "notes": "Fabricante líder internacional de suelos técnicos elevados registrables (sistemas GAMAFLOR PAC / BANK) con estructura portante y perfilería perimetral de aluminio extruido. Sede central en Sevilla con proyectos internacionales.",
        "contacted": False,
        "contactDate": None,
        "response": "Pendiente de primer contacto comercial",
        "createdAt": now_iso,
        "emailVerified": True,
        "emailVerifiedType": "contacto",
        "directMxStatus": "deliverable"
    }

    prospects.append(dc_systems_record)
    prospects.append(polygroup_record)
    logger.info(f"Añadido {dc_systems_record['name']} con ID {dc_systems_record['id']}")
    logger.info(f"Añadido {polygroup_record['name']} con ID {polygroup_record['id']}")

    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(prospects, f, indent=2, ensure_ascii=False)

    logger.info(f"Base de datos actualizada. Total prospectos: {len(prospects)}")


if __name__ == "__main__":
    add_dc_systems_prospect()
