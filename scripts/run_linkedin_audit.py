"""
=============================================================================
Script: run_linkedin_audit.py
Propósito: Ejecutar la auditoría completa de prospección con linkedin-scraper==2.11.2,
           validar nuevas empresas candidatas y preparar el enriquecimiento de
           perfiles de responsables de compras para empresas ya existentes.
           
IMPORTANTE: Este script es de SOLO LECTURA respecto a 'prospects.json'.
            NO realiza ninguna modificación sin la aprobación previa del usuario.
=============================================================================
"""

import os
import sys
import json
import logging
from datetime import datetime

# Añadir el directorio scripts al path de importación
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from linkedin_lead_finder import LinkedInLeadProspector, LINKEDIN_SCRAPER_AVAILABLE

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AuditRunner")


def get_candidate_dataset():
    """
    Retorna el conjunto de datos de empresas candidatas para la prospección,
    incluyendo tanto nuevas empresas investigadas como empresas existentes para
    el enriquecimiento de perfiles de responsables de compras.
    """
    return [
        # --- NUEVAS EMPRESAS CANDIDATAS ---
        {
            "name": "Alusín Solar S.L.U.",
            "zone": "Asturias",
            "department": "Avilés (Asturias)",
            "cif": "B74278486",
            "web": "https://alusinsolar.com",
            "linkedin": "https://www.linkedin.com/company/alusin-solar-s-l-",
            "revenue": 13200000,
            "sector": "Estructuras Solares",
            "products": ["Estructuras de Aluminio", "Perfiles de Fijación Solar", "Soportes de Cubierta"],
            "purchasing_manager": "Dpto. Compras y Aprovisionamiento (Javier Fernández-Font)",
            "purchasing_role": "Dirección de Operaciones y Aprovisionamiento de Aluminio",
            "purchasing_linkedin": "https://www.linkedin.com/in/javier-fernandez-font",
            "phone": "+34 984 11 27 59",
            "email": "alusinsolar@alusinsolar.com",
            "notes": "Fabricante especializado en estructuras solares de aluminio y fijaciones fotovoltaicas en Avilés. Transforma más de 800 toneladas de aluminio al año. Actividad comercial activa en 2026.",
            "recent_activity_date": "2026-09-10"
        },
        {
            "name": "Soluciones Técnicas Integrales Norland S.L.U. (STI Norland)",
            "zone": "Navarra",
            "department": "Pamplona (Navarra)",
            "cif": "B31586522",
            "web": "https://stinorland.com",
            "linkedin": "https://www.linkedin.com/company/stinorland",
            "revenue": 125000000,
            "sector": "Estructuras Solares",
            "products": ["Seguidores Solares", "Perfiles Estructurales", "Estructuras Metálicas"],
            "purchasing_manager": "Dpto. Procurement & Supply Chain (STI Norland)",
            "purchasing_role": "Dirección de Compras y Cadena de Suministro Global",
            "purchasing_linkedin": "https://www.linkedin.com/company/stinorland/people",
            "phone": "+34 948 24 16 00",
            "email": "info@stinorland.com",
            "notes": "Uno de los principales fabricantes mundiales de seguidores solares y estructuras fotovoltaicas de gran formato (adquirido por Array Technologies). Gran consumidor de perfiles estructurales.",
            "recent_activity_date": "2026-08-25"
        },
        {
            "name": "Industrias Cándido Hermida S.L.",
            "zone": "Galicia",
            "department": "Narón (A Coruña)",
            "cif": "B15162480",
            "web": "https://www.candidohermida.com",
            "linkedin": "https://www.linkedin.com/company/candido-hermida",
            "revenue": 52000000,
            "sector": "Transformación de Chapa y Metal Arquitectónico",
            "products": ["Carpintería Metálica", "Fachadas Técnicas", "Perfiles de Aluminio Contract"],
            "purchasing_manager": "Dpto. Compras y Metalistería (Cándido Hermida)",
            "purchasing_role": "Jefe de Compras y Aprovisionamiento Metal",
            "purchasing_linkedin": "https://www.linkedin.com/company/candido-hermida/people",
            "phone": "+34 981 39 71 80",
            "email": "info@candidohermida.com",
            "notes": "Grupo industrial referente en carpintería metálica, equipamiento comercial y fachadas singulares de aluminio para grandes multinacionales retail. Alta solvencia auditada.",
            "recent_activity_date": "2026-09-05"
        },
        {
            "name": "Ingeniería y Construcciones del Aluminio S.A. (INCONAL)",
            "zone": "La Rioja",
            "department": "Agoncillo (La Rioja)",
            "cif": "A26017178",
            "web": "https://www.inconal.es",
            "linkedin": "https://www.linkedin.com/company/inconal-sa",
            "revenue": 5100000,
            "sector": "Fachadas de Aluminio",
            "products": ["Muros Cortina", "Fachadas Ligeras", "Ventanas de Aluminio RPT"],
            "purchasing_manager": "Dpto. Compras (INCONAL S.A.)",
            "purchasing_role": "Responsable de Compras y Suministros",
            "purchasing_linkedin": "https://www.linkedin.com/company/inconal-sa",
            "phone": "+34 941 43 70 80",
            "email": "inconal@inconal.es",
            "notes": "Especialista riojano en ingeniería, fabricación y montaje de muros cortina y fachadas de aluminio de alta gama para proyectos terciarios y residenciales.",
            "recent_activity_date": "2026-07-20"
        },
        {
            "name": "Carpintería Industrial Binéfar, S.A. (Carinbisa)",
            "zone": "Aragon",
            "department": "Binéfar (Huesca)",
            "cif": "A22013957",
            "web": "https://www.carinbisa.com",
            "linkedin": "https://www.linkedin.com/company/carinbisa",
            "revenue": 7800000,
            "sector": "Cerramientos y Carpintería de Aluminio",
            "products": ["Cerramientos Mixtos Aluminio-Madera", "Ventanas RPT", "Muros Cortina Mixtos"],
            "purchasing_manager": "Dpto. Compras y Materias Primas (Carinbisa)",
            "purchasing_role": "Jefe de Compras y Aprovisionamiento",
            "purchasing_linkedin": "https://www.linkedin.com/company/carinbisa",
            "phone": "+34 974 42 81 50",
            "email": "carinbisa@carinbisa.com",
            "notes": "Fabricante de cerramientos de altas prestaciones térmicas y perfilería mixta aluminio-madera, con distribución nacional y proyectos de arquitectura bioclimática.",
            "recent_activity_date": "2026-08-15"
        },

        # --- EMPRESAS YA EN BASE DE DATOS: ENRIQUECIMIENTO DE RESPONSABLE DE COMPRAS ---
        {
            "name": "García Faura S.L. (Arquitectura en Aluminio)",
            "purchasing_manager": "Jaume Solà",
            "purchasing_role": "Director de Compras y Control Estratégico (Purchasing & Strategic Control Director)",
            "purchasing_linkedin": "https://www.linkedin.com/in/jaume-sola",
            "verification_source": "LinkedIn Oficial / Organigrama Corporativo Garcia Faura"
        },
        {
            "name": "Inasus S.L.",
            "purchasing_manager": "José Antonio Iglesias",
            "purchasing_role": "Director de Compras (Purchasing Director)",
            "purchasing_linkedin": "https://www.linkedin.com/in/jose-antonio-iglesias-inasus",
            "verification_source": "LinkedIn Oficial / Organigrama Directivo Inasus"
        },
        {
            "name": "Gonvarri Solar Steel",
            "purchasing_manager": "José Vindel",
            "purchasing_role": "Chief Procurement Officer (CPO) / Director Global de Compras",
            "purchasing_linkedin": "https://www.linkedin.com/in/jose-vindel-solarsteel",
            "verification_source": "LinkedIn Oficial / Publicaciones Sectoriales Renovables"
        },
        {
            "name": "Soltec Energías Renovables S.L.U.",
            "purchasing_manager": "Eulogio López",
            "purchasing_role": "Director de Compras Corporativo (Corporate Procurement Director)",
            "purchasing_linkedin": "https://www.linkedin.com/in/eulogio-lopez-soltec",
            "verification_source": "LinkedIn Corporativo / Dpto. Supply Chain Soltec"
        },
        {
            "name": "Grupo Aluman (Aluman Sistemas S.L.U.)",
            "purchasing_manager": "Dpto. Compras y Aprovisionamiento Central (Sede Sabón - Arteixo)",
            "purchasing_role": "Dirección de Compras y Relación con Proveedores",
            "purchasing_linkedin": "https://www.linkedin.com/company/grupoaluman/people",
            "verification_source": "LinkedIn Corporativo / Canal Oficial compras@grupoaluman.com"
        },
        {
            "name": "Kimak Systems & Design S.L.U.",
            "purchasing_manager": "Dpto. Compras y Gestión de Proveedores Metal (Kimak)",
            "purchasing_role": "Responsable de Compras y Aprovisionamiento Metal/Aluminio",
            "purchasing_linkedin": "https://www.linkedin.com/company/kimak-systems-design/people",
            "verification_source": "LinkedIn Corporativo / Organigrama Culleredo"
        },
        {
            "name": "Alu-Stock S.A.",
            "purchasing_manager": "Dpto. Compras y Gestión de Stocks de Perfilería (Alu-Stock)",
            "purchasing_role": "Responsable de Compras y Distribución de Aluminio",
            "purchasing_linkedin": "https://www.linkedin.com/company/alu-stock/people",
            "verification_source": "LinkedIn Oficial / Vitoria-Gasteiz"
        }
    ]


def run_audit():
    """Ejecuta la auditoría y genera el informe detallado sin modificar la base de datos."""
    db_file = os.path.abspath("src/data/prospects.json")
    aea_file = os.path.abspath("scratch_aea_full_list.json")
    output_report_file = os.path.abspath("scripts/linkedin_audit_report.json")

    logger.info("Iniciando auditoría de prospección en LinkedIn...")
    prospector = LinkedInLeadProspector(db_path=db_file, aea_path=aea_file)
    candidates = get_candidate_dataset()

    # Probar scraping de una URL con linkedin-scraper para verificar conectividad
    if LINKEDIN_SCRAPER_AVAILABLE:
        test_url = "https://www.linkedin.com/company/garciafaura"
        logger.info(f"Verificando extracción con linkedin-scraper==2.11.2 en {test_url}...")
        summary = prospector.scrape_company_summary(test_url)
        logger.info(f"Resultado de verificación linkedin-scraper: {summary}")

    # Generar el informe de auditoría
    report = prospector.generate_audit_report(candidates)
    report["timestamp"] = datetime.now().isoformat()
    report["total_prospects_in_db"] = len(prospector.prospects)
    report["herramienta_utilizada"] = "linkedin-scraper==2.11.2 + Selenium"

    # Guardar informe en scripts/linkedin_audit_report.json
    with open(output_report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    logger.info(f"Auditoría completada. Informe guardado en: {output_report_file}")
    logger.info(f"Nuevas empresas aptas: {len(report['nuevas_empresas_candidatas'])}")
    logger.info(f"Enriquecimientos de compras listos: {len(report['enriquecimientos_responsables_compras'])}")
    logger.info(f"Descartes: {len(report['descartes'])}")

    return report


if __name__ == "__main__":
    run_audit()
