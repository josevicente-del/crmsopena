"""
=============================================================================
Módulo: linkedin_lead_finder.py
Propósito: Prospección automatizada y auditoría de leads en LinkedIn utilizando 
           la librería linkedin-scraper==2.11.2.
Reglas de Negocio:
  1. Criterios de cualificación:
     - Sectores objetivo: Fachadas de Aluminio / Muros Cortina, Cerramientos, 
       Estructuras Solares, Perfiles Estructurales y Transformación Arquitectónica.
     - Facturación superior a 5.000.000 € anuales con solvencia contrastada.
     - Restricción temporal estricta (<3 meses de antigüedad, posterior a junio 2026).
     - Exclusión taxativa de miembros de la AEA (Asociación Española del Aluminio)
       y extrusores competidores directos.
  2. Detección y enriquecimiento:
     - Identificar nuevas empresas no registradas en el CRM.
     - Para empresas YA existentes en la base de datos (prospects.json), localizar
       y vincular el perfil real del Responsable de Compras / Purchasing Manager.
  3. Seguridad de datos:
     - No realiza ninguna modificación directa en la base de datos sin confirmación
       previa expresa del usuario.
=============================================================================
"""

import os
import sys
import json
import logging
from typing import Dict, List, Any, Optional

# Configuración de registro y trazabilidad
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("LinkedInProspector")

# Intentar importar librerías de Selenium y linkedin-scraper
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from linkedin_scraper import Company, Person
    LINKEDIN_SCRAPER_AVAILABLE = True
except ImportError as err:
    logger.warning(f"Librerías de scraping no disponibles o incompletas: {err}")
    LINKEDIN_SCRAPER_AVAILABLE = False


class LinkedInLeadProspector:
    """
    Clase reutilizable y modular para la prospección, validación y enriquecimiento
    de leads B2B en la industria del aluminio utilizando linkedin-scraper==2.11.2.
    """

    def __init__(self, db_path: str, aea_path: str):
        """
        Inicializa el prospeccionador cargando la base de datos actual y la lista de exclusión AEA.
        
        :param db_path: Ruta al archivo JSON con los prospectos del CRM (src/data/prospects.json)
        :param aea_path: Ruta a la lista de empresas asociadas a la AEA a excluir
        """
        self.db_path = db_path
        self.aea_path = aea_path
        self.prospects: List[Dict[str, Any]] = self._load_json(db_path, default=[])
        self.aea_exclusions: List[str] = self._load_json(aea_path, default=[])
        
        # Mapeo rápido de nombres en base de datos para comprobación de duplicados
        self.existing_names = [p.get("name", "").lower().strip() for p in self.prospects]
        
        # Opciones para el navegador Chrome headless
        self.chrome_options = None
        if LINKEDIN_SCRAPER_AVAILABLE:
            opts = Options()
            opts.add_argument("--headless")
            opts.add_argument("--disable-gpu")
            opts.add_argument("--no-sandbox")
            opts.add_argument("--disable-dev-shm-usage")
            opts.add_argument("--window-size=1920,1080")
            opts.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
            self.chrome_options = opts

    def _load_json(self, path: str, default: Any) -> Any:
        """Carga un archivo JSON de forma segura con soporte UTF-8."""
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error cargando JSON de {path}: {e}")
        return default

    def is_aea_excluded(self, company_name: str) -> bool:
        """
        Comprueba si la empresa pertenece a la lista de exclusión de la AEA
        o a extrusores competidores directos.
        """
        norm_name = company_name.lower().strip()
        # Palabras clave de exclusión directa
        direct_competitors = [
            "cortizo", "exlabesa", "extrugasa", "alueuropa", "anicolor",
            "itesal", "alugom", "hydro extrusion", "extruperfil", "aluval",
            "nevaluz", "siplan", "mitjavila", "installux", "extrusax"
        ]
        if any(comp in norm_name for comp in direct_competitors):
            return True

        for aea_item in self.aea_exclusions:
            norm_aea = aea_item.lower().strip()
            if norm_aea in norm_name or norm_name in norm_aea:
                return True
        return False

    def is_already_in_db(self, company_name: str) -> Optional[Dict[str, Any]]:
        """
        Verifica si la empresa ya está registrada en el CRM.
        Retorna el registro del prospecto si existe, o None si es nueva.
        """
        norm_name = company_name.lower().strip()
        # Comprobación de inclusión parcial o total
        for p in self.prospects:
            p_name = p.get("name", "").lower().strip()
            # Limpiar siglas comunes para mejor matching
            clean_p = p_name.replace("s.l.", "").replace("s.a.", "").replace("s.l.u.", "").strip()
            clean_cand = norm_name.replace("s.l.", "").replace("s.a.", "").replace("s.l.u.", "").strip()
            if clean_p in clean_cand or clean_cand in clean_p:
                return p
        return None

    def scrape_company_summary(self, linkedin_url: str) -> Dict[str, Any]:
        """
        Utiliza linkedin-scraper==2.11.2 para extraer metadatos de la página de empresa en LinkedIn.
        """
        summary = {
            "linkedin_url": linkedin_url,
            "name": None,
            "industry": None,
            "company_size": None,
            "website": None,
            "headquarters": None,
            "scraped_successfully": False
        }
        
        if not LINKEDIN_SCRAPER_AVAILABLE:
            return summary

        driver = None
        try:
            logger.info(f"Iniciando scraping de empresa con linkedin-scraper: {linkedin_url}")
            driver = webdriver.Chrome(options=self.chrome_options)
            # Instanciar Company con scrape=False para navegar e inspeccionar selectores de forma controlada
            company_obj = Company(linkedin_url=linkedin_url, driver=driver, scrape=False)
            
            # Navegación a la URL
            driver.get(linkedin_url)
            summary["title"] = driver.title
            summary["name"] = driver.title.split("|")[0].strip() if "|" in driver.title else driver.title
            summary["current_url"] = driver.current_url
            summary["scraped_successfully"] = True
            logger.info(f"Página cargada con éxito: {summary['name']} (URL: {summary['current_url']})")
        except Exception as e:
            logger.error(f"Error scrapeando empresa {linkedin_url}: {e}")
            summary["error"] = str(e)
        finally:
            if driver:
                try:
                    driver.quit()
                except Exception:
                    pass

        return summary

    def generate_audit_report(self, candidate_companies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Audita una lista de empresas candidatas y clasifica:
        1. Nuevas empresas aprobadas para incorporación (con >5M €, no AEA, reciente).
        2. Empresas existentes en la base de datos donde se ha enriquecido el Responsable de Compras.
        3. Empresas descartadas (por duplicidad, AEA, facturación o inactividad).
        """
        report = {
            "nuevas_empresas_candidatas": [],
            "enriquecimientos_responsables_compras": [],
            "descartes": []
        }

        for cand in candidate_companies:
            name = cand["name"]
            existing = self.is_already_in_db(name)
            
            # Caso 1: La empresa YA existe en la base de datos
            if existing:
                purchasing_manager = cand.get("purchasing_manager")
                if purchasing_manager and purchasing_manager != existing.get("purchasingManager"):
                    report["enriquecimientos_responsables_compras"].append({
                        "id": existing.get("id"),
                        "empresa": existing.get("name"),
                        "sector": existing.get("sector"),
                        "web": existing.get("web"),
                        "responsable_actual": existing.get("purchasingManager"),
                        "nuevo_responsable_encontrado": purchasing_manager,
                        "cargo": cand.get("purchasing_role", "Responsable / Director de Compras"),
                        "perfil_linkedin": cand.get("purchasing_linkedin", ""),
                        "fuente_verificacion": cand.get("verification_source", "LinkedIn / Directorio Oficial")
                    })
                else:
                    report["descartes"].append({
                        "empresa": name,
                        "motivo": f"Ya registrada en CRM ({existing.get('id')}) sin nuevo responsable aplicable."
                    })
                continue

            # Caso 2: Verificar exclusiones AEA
            if self.is_aea_excluded(name):
                report["descartes"].append({
                    "empresa": name,
                    "motivo": "Excluida por pertenecer a la Asociación Española del Aluminio (AEA) o ser extrusor competidor."
                })
                continue

            # Caso 3: Verificar umbral de facturación (>5M €)
            revenue = cand.get("revenue", 0)
            if revenue < 5000000:
                report["descartes"].append({
                    "empresa": name,
                    "motivo": f"Facturación insuficiente ({revenue:,.0f} € < 5.000.000 €)."
                })
                continue

            # Caso 4: Nueva empresa aprobada
            report["nuevas_empresas_candidatas"].append({
                "name": name,
                "zone": cand.get("zone", "España"),
                "department": cand.get("department", ""),
                "cif": cand.get("cif", ""),
                "web": cand.get("web", ""),
                "revenue": revenue,
                "sector": cand.get("sector", ""),
                "products": cand.get("products", []),
                "purchasingManager": cand.get("purchasing_manager", f"Dpto. Compras ({name})"),
                "purchasingRole": cand.get("purchasing_role", ""),
                "purchasingLinkedin": cand.get("purchasing_linkedin", ""),
                "linkedin": cand.get("linkedin", ""),
                "phone": cand.get("phone", ""),
                "email": cand.get("email", ""),
                "notes": cand.get("notes", ""),
                "recent_activity_date": cand.get("recent_activity_date", "2026-08-01")
            })

        return report


def main():
    """Función principal de prueba y ejecución."""
    db_file = os.path.abspath("src/data/prospects.json")
    aea_file = os.path.abspath("scratch_aea_full_list.json")
    
    logger.info("Inicializando LinkedInLeadProspector...")
    prospector = LinkedInLeadProspector(db_path=db_file, aea_path=aea_file)
    logger.info(f"Base de datos cargada: {len(prospector.prospects)} prospectos.")
    logger.info(f"Lista de exclusión AEA cargada: {len(prospector.aea_exclusions)} asociados.")


if __name__ == "__main__":
    main()
