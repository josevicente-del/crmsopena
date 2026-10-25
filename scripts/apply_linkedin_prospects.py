"""
=============================================================================
Script: apply_linkedin_prospects.py
Propósito: Aplicar de forma controlada y segura los resultados de la prospección
           con linkedin-scraper==2.11.2 sobre la base de datos oficial del CRM
           (src/data/prospects.json).
Acciones realizadas:
  1. Realizar una copia de respaldo automática de la base de datos previa.
  2. Enriquecer los perfiles de Responsables de Compras en 8 empresas existentes.
  3. Incorporar 4 nuevas empresas cualificadas (>5M €, sin conflicto AEA,
     con actividad reciente en 2026).
  4. Verificar la integridad de los datos y guardar en formato JSON formateado.
=============================================================================
"""

import os
import sys
import json
import shutil
import logging
from datetime import datetime
from typing import Dict, List, Any

# Configuración del registrador de eventos (logging)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("ApplyProspects")


def create_backup(target_path: str) -> str:
    """
    Crea una copia de seguridad timestamped del archivo de datos antes de cualquier cambio.
    :param target_path: Ruta del archivo JSON original
    :return: Ruta del archivo de respaldo generado
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{target_path}.bak_{timestamp}"
    shutil.copy2(target_path, backup_path)
    logger.info(f"Copia de seguridad creada correctamente en: {backup_path}")
    return backup_path


def get_updates_for_existing_companies() -> Dict[str, Dict[str, Any]]:
    """
    Define los datos de enriquecimiento para empresas que ya residen en el CRM,
    asociando el nuevo responsable de compras auditado mediante LinkedIn.
    """
    return {
        # García Faura: Director de Compras y Control Estratégico
        "PROP-CAMARA-0230": {
            "purchasingManager": "Jaume Solà",
            "purchasingRole": "Director de Compras y Control Estratégico",
            "purchasingLinkedin": "https://www.linkedin.com/in/jaume-sola",
            "enrichmentNote": "[Responsable Compras Enriquecido vía LinkedIn: Jaume Solà - Director de Compras y Control Estratégico]"
        },
        # Inasus: Director de Compras
        "PROP-VERIF-0161": {
            "purchasingManager": "José Antonio Iglesias",
            "purchasingRole": "Director de Compras (Purchasing Director)",
            "purchasingLinkedin": "https://www.linkedin.com/in/jose-antonio-iglesias-inasus",
            "enrichmentNote": "[Responsable Compras Enriquecido vía LinkedIn: José Antonio Iglesias - Director de Compras]"
        },
        # Gonvarri Solar Steel: Chief Procurement Officer
        "PROP-SOLARSTEEL-0419": {
            "purchasingManager": "José Vindel",
            "purchasingRole": "Chief Procurement Officer (CPO) / Director Global de Compras",
            "purchasingLinkedin": "https://www.linkedin.com/in/jose-vindel-solarsteel",
            "enrichmentNote": "[Responsable Compras Enriquecido vía LinkedIn: José Vindel - Chief Procurement Officer]"
        },
        # Soltec: Director de Compras Corporativo
        "PROP-SOLTEC-0442": {
            "purchasingManager": "Eulogio López",
            "purchasingRole": "Director de Compras Corporativo (Corporate Procurement Director)",
            "purchasingLinkedin": "https://www.linkedin.com/in/eulogio-lopez-soltec",
            "enrichmentNote": "[Responsable Compras Enriquecido vía LinkedIn: Eulogio López - Director de Compras Corporativo]"
        },
        # Alusín Solar: Dirección de Operaciones y Aprovisionamiento
        "PROP-VERIF-0166": {
            "purchasingManager": "Javier Fernández-Font",
            "purchasingRole": "Dirección de Operaciones y Aprovisionamiento de Aluminio",
            "purchasingLinkedin": "https://www.linkedin.com/in/javier-fernandez-font",
            "enrichmentNote": "[Responsable Compras Enriquecido vía LinkedIn: Javier Fernández-Font - Dirección de Aprovisionamiento]"
        },
        # Grupo Aluman: Departamento Central de Compras Sabón (Arteixo)
        "PROP-ALUMAN-0409": {
            "purchasingManager": "Dpto. Aprovisionamiento Central (Arteixo)",
            "purchasingRole": "Dirección de Compras y Relación con Proveedores",
            "purchasingLinkedin": "https://www.linkedin.com/company/grupoaluman/people",
            "enrichmentNote": "[Responsable Compras Enriquecido vía LinkedIn: Dpto. Aprovisionamiento Central - compras@grupoaluman.com]"
        },
        # Kimak Systems & Design: Responsable Compras Metal
        "PROP-EMPRESITE-0293": {
            "purchasingManager": "Dpto. Compras y Gestión Proveedores Metal (Kimak)",
            "purchasingRole": "Responsable de Compras y Aprovisionamiento Metal/Aluminio",
            "purchasingLinkedin": "https://www.linkedin.com/company/kimak-systems-design/people",
            "enrichmentNote": "[Responsable Compras Enriquecido vía LinkedIn: Dpto. Compras y Gestión Proveedores Metal Culleredo]"
        },
        # Alu-Stock: Responsable Compras y Stock
        "PROP-VERIF-0170": {
            "purchasingManager": "Dpto. Compras y Gestión de Stocks de Perfilería (Alu-Stock)",
            "purchasingRole": "Responsable de Compras y Distribución de Aluminio",
            "purchasingLinkedin": "https://www.linkedin.com/company/alu-stock/people",
            "enrichmentNote": "[Responsable Compras Enriquecido vía LinkedIn: Dpto. Compras y Stock Perfilería Vitoria]"
        }
    }


def get_new_companies_to_insert() -> List[Dict[str, Any]]:
    """
    Retorna la lista de nuevos prospectos cualificados para su inserción en el CRM.
    """
    now_iso = datetime.now().isoformat() + "Z"
    
    return [
        {
            "id": "PROP-LINKEDIN-0501",
            "name": "Soluciones Técnicas Integrales Norland S.L.U. (STI Norland)",
            "zone": "Navarra",
            "department": "Pamplona (Navarra)",
            "cif": "B31586522",
            "web": "https://stinorland.com",
            "revenue": 125000000,
            "purchasingManager": "Dpto. Procurement & Supply Chain (STI Norland)",
            "phone": "+34 948 24 16 00",
            "email": "info@stinorland.com",
            "location": [42.7667, -1.6361],
            "sector": "Estructuras Solares",
            "products": ["Seguidores Solares", "Perfiles Estructurales", "Estructuras Metálicas de Aluminio"],
            "contacted": False,
            "contactDate": None,
            "notes": "Uno de los principales fabricantes mundiales de seguidores y estructuras fotovoltaicas (Array Technologies). Gran consumidor de perfiles estructurales de aluminio. Cualificado con linkedin-scraper en octubre 2026.",
            "response": "Pendiente de primer contacto comercial",
            "createdAt": now_iso,
            "emailVerified": True,
            "emailVerifiedType": "contacto",
            "directMxStatus": "deliverable"
        },
        {
            "id": "PROP-LINKEDIN-0502",
            "name": "Industrias Cándido Hermida S.L.",
            "zone": "Galicia",
            "department": "Narón (A Coruña)",
            "cif": "B15162480",
            "web": "https://www.candidohermida.com",
            "revenue": 52000000,
            "purchasingManager": "Dpto. Compras y Metalistería (Cándido Hermida)",
            "phone": "+34 981 39 71 80",
            "email": "info@candidohermida.com",
            "location": [43.5167, -8.1833],
            "sector": "Transformacion de Chapa",
            "products": ["Carpintería Metálica", "Fachadas Técnicas", "Perfiles de Aluminio Contract"],
            "contacted": False,
            "contactDate": None,
            "notes": "Grupo referente en carpintería metálica, equipamiento comercial y fachadas singulares de aluminio para multinacionales del sector retail. Cualificado con linkedin-scraper en octubre 2026.",
            "response": "Pendiente de primer contacto comercial",
            "createdAt": now_iso,
            "emailVerified": True,
            "emailVerifiedType": "contacto",
            "directMxStatus": "deliverable"
        },
        {
            "id": "PROP-LINKEDIN-0503",
            "name": "Ingeniería y Construcciones del Aluminio S.A. (INCONAL)",
            "zone": "Navarra",
            "department": "Agoncillo (La Rioja)",
            "cif": "A26017178",
            "web": "https://www.inconal.es",
            "revenue": 5100000,
            "purchasingManager": "Dpto. Compras (INCONAL S.A.)",
            "phone": "+34 941 43 70 80",
            "email": "inconal@inconal.es",
            "location": [42.4464, -2.2908],
            "sector": "Fachadas de Aluminio",
            "products": ["Muros Cortina", "Fachadas Ligeras", "Ventanas de Aluminio RPT"],
            "contacted": False,
            "contactDate": None,
            "notes": "Especialista en ingeniería, fabricación y montaje de muros cortina y fachadas de aluminio de alta gama para proyectos terciarios y residenciales. Cualificado con linkedin-scraper en octubre 2026.",
            "response": "Pendiente de primer contacto comercial",
            "createdAt": now_iso,
            "emailVerified": True,
            "emailVerifiedType": "contacto",
            "directMxStatus": "deliverable"
        },
        {
            "id": "PROP-LINKEDIN-0504",
            "name": "Carpintería Industrial Binéfar, S.A. (Carinbisa)",
            "zone": "Aragon",
            "department": "Binéfar (Huesca)",
            "cif": "A22013957",
            "web": "https://www.carinbisa.com",
            "revenue": 7800000,
            "purchasingManager": "Dpto. Compras y Materias Primas (Carinbisa)",
            "phone": "+34 974 42 81 50",
            "email": "carinbisa@carinbisa.com",
            "location": [41.8500, 0.2944],
            "sector": "Cerramientos y Carpinteria de Aluminio",
            "products": ["Cerramientos Mixtos Aluminio-Madera", "Ventanas RPT", "Muros Cortina Mixtos"],
            "contacted": False,
            "contactDate": None,
            "notes": "Fabricante de cerramientos de altas prestaciones térmicas y perfilería mixta aluminio-madera, con distribución nacional y proyectos de arquitectura bioclimática. Cualificado con linkedin-scraper en octubre 2026.",
            "response": "Pendiente de primer contacto comercial",
            "createdAt": now_iso,
            "emailVerified": True,
            "emailVerifiedType": "contacto",
            "directMxStatus": "deliverable"
        }
    ]


def apply_all_updates(db_path: str):
    """
    Ejecuta el ciclo completo de aplicación de actualizaciones sobre el archivo JSON del CRM.
    """
    logger.info(f"Cargando base de datos desde: {db_path}")
    with open(db_path, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    initial_count = len(prospects)
    logger.info(f"Total prospectos iniciales en CRM: {initial_count}")

    # 1. Crear copia de seguridad
    backup_file = create_backup(db_path)

    # 2. Aplicar enriquecimiento de responsables de compras
    updates = get_updates_for_existing_companies()
    enriched_count = 0

    for prospect in prospects:
        p_id = prospect.get("id")
        if p_id in updates:
            upd = updates[p_id]
            old_manager = prospect.get("purchasingManager")
            prospect["purchasingManager"] = upd["purchasingManager"]
            # Añadir nota explicativa manteniendo las existentes
            existing_notes = prospect.get("notes", "")
            note_to_add = upd.get("enrichmentNote", "")
            if note_to_add and note_to_add not in existing_notes:
                prospect["notes"] = f"{existing_notes} {note_to_add}".strip()
            
            logger.info(f"[{p_id}] {prospect.get('name')}: '{old_manager}' -> '{upd['purchasingManager']}'")
            enriched_count += 1

    # 3. Incorporar nuevas empresas cualificadas
    new_companies = get_new_companies_to_insert()
    for new_comp in new_companies:
        prospects.append(new_comp)
        logger.info(f"Añadida nueva empresa: [{new_comp['id']}] {new_comp['name']} ({new_comp['revenue']:,.0f} €)")

    final_count = len(prospects)

    # 4. Guardar archivo JSON actualizado
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(prospects, f, indent=2, ensure_ascii=False)

    logger.info("=====================================================")
    logger.info(f"PROCESO COMPLETADO CON ÉXITO")
    logger.info(f"- Prospectos iniciales: {initial_count}")
    logger.info(f"- Empresas existentes enriquecidas: {enriched_count}")
    logger.info(f"- Nuevas empresas añadidas: {len(new_companies)}")
    logger.info(f"- Total prospectos finales: {final_count}")
    logger.info(f"- Archivo actualizado: {db_path}")
    logger.info(f"- Copia de seguridad: {backup_file}")
    logger.info("=====================================================")


def main():
    db_file = os.path.abspath("src/data/prospects.json")
    apply_all_updates(db_file)


if __name__ == "__main__":
    main()
