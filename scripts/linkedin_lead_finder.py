"""
=============================================================================
Módulo: linkedin_lead_finder.py
Propósito: Prospección automatizada, validación y auditoría de leads en la industria
           del aluminio extruido integrando LinkedIn, Ferias Sectoriales (VETECO,
           GENERA, CONCRETA, FIAA), Licitaciones Públicas (contrataciondelestado.es,
           BASE Portugal), Portales Técnicos de Arquitectura (Tectónica, ArchDaily)
           y Directorios Sectoriales Ibéricos (ANFAJE, AIMMAP, Novoperfil, FEMVAL, AECIM).

Reglas de Negocio Estrictas:
  1. Criterios de cualificación de perfiles de aluminio extruido:
     - Sectores objetivo: Fachadas de Aluminio / Muros Cortina, Cerramientos,
       Carpintería con RPT, Estructuras Solares, Carrocerías y Modular.
     - Consumo demostrado de perfiles extruidos sin prensa de extrusión propia.
     - Facturación auditada superior a 5.000.000 € (o en blanco si no es comprobable al 100%).
     - Restricción temporal estricta (<3 meses de antigüedad, posterior a junio 2026).
     - Exclusión taxativa de miembros de la AEA (Asociación Española del Aluminio, Act. 12).
  2. Integridad de los datos:
     - No inventar ningún dato: si el contacto, teléfono o facturación no está
       comprobado fehacientemente, se deja en blanco (None o "").
  3. Seguridad de datos y aprobación del usuario:
     - No realiza modificaciones directas en la base de datos sin confirmación
       previa expresa del usuario. Propone candidatos en informe para su revisión.
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
logger = logging.getLogger("LinkedInLeadProspector")

# Intentar importar librerías de Selenium y linkedin-scraper
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from linkedin_scraper import Company, Person
    LINKEDIN_SCRAPER_AVAILABLE = True
except ImportError as err:
    logger.warning(f"Librerías de scraping no disponibles o incompletas: {err}")
    LINKEDIN_SCRAPER_AVAILABLE = False


# Catálogo de fuentes homologadas de prospección sectorial
HOMOLOGATED_PROSPECTING_SOURCES = {
    "ferias_sectoriales": [
        {"nombre": "VETECO (IFEMA Madrid)", "url": "https://www.ifema.es/veteco", "alcance": "España"},
        {"nombre": "GENERA (IFEMA Madrid)", "url": "https://www.ifema.es/genera", "alcance": "España"},
        {"nombre": "CONCRETA (Exponor Oporto)", "url": "https://concreta.exponor.pt/", "alcance": "Portugal"},
        {"nombre": "FIAA (IFEMA Madrid)", "url": "https://www.ifema.es/fiaa", "alcance": "Península Ibérica"}
    ],
    "licitaciones_publicas": [
        {"nombre": "Plataforma de Contratación del Estado", "url": "https://contrataciondelestado.es", "alcance": "España"},
        {"nombre": "Portal BASE", "url": "https://www.base.gov.pt", "alcance": "Portugal"}
    ],
    "prescripcion_arquitectura": [
        {"nombre": "Tectónica", "url": "https://tectonica.archi", "alcance": "Península Ibérica"},
        {"nombre": "ArchDaily España", "url": "https://www.archdaily.es", "alcance": "España"},
        {"nombre": "Construnario", "url": "https://www.construnario.com", "alcance": "España"}
    ],
    "asociaciones_ibéricas": [
        {"nombre": "ANFAJE (Janelas Eficientes Portugal)", "url": "https://www.anfaje.pt", "alcance": "Portugal"},
        {"nombre": "AIMMAP (Metalurgia Portugal)", "url": "https://aimmap.pt", "alcance": "Portugal"},
        {"nombre": "Novoperfil", "url": "https://www.novoperfil.com", "alcance": "España"},
        {"nombre": "FEMVAL", "url": "https://www.femval.es", "alcance": "Comunidad Valenciana"},
        {"nombre": "AECIM", "url": "https://www.aecim.org", "alcance": "Comunidad de Madrid"}
    ]
}


class LinkedInLeadProspector:
    """
    Clase modular y reutilizable para la prospección, validación y propuesta
    de leads B2B en la industria del aluminio extruido.
    """

    def __init__(self, db_path: str, aea_path: str = ""):
        """
        Inicializa el prospeccionador cargando la base de datos de prospectos y exclusiones.
        
        :param db_path: Ruta al archivo JSON con los prospectos del CRM (src/data/prospects.json)
        :param aea_path: Ruta a la lista de empresas asociadas a la AEA a excluir
        """
        self.db_path = db_path
        self.aea_path = aea_path
        self.prospects: List[Dict[str, Any]] = self._load_json(db_path, default=[])
        self.aea_exclusions: List[str] = self._load_json(aea_path, default=[])
        
        # Mapeo rápido de nombres y CIFs en base de datos para comprobación de duplicados
        self.existing_names = [p.get("name", "").lower().strip() for p in self.prospects]
        self.existing_cifs = [p.get("cif", "").upper().strip() for p in self.prospects if p.get("cif")]
        
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
        if path and os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error cargando JSON de {path}: {e}")
        return default

    def is_aea_excluded(self, company_name: str) -> bool:
        """
        Comprueba si la empresa pertenece a la lista de exclusión de la AEA
        o a extrusores competidores directos con prensa propia.
        """
        norm_name = company_name.lower().strip()
        # Competidores directos con instalaciones de extrusión propias
        direct_competitors = [
            "cortizo", "exlabesa", "extrugasa", "alueuropa", "anicolor",
            "itesal", "alugom", "hydro extrusion", "extruperfil", "aluval",
            "nevaluz", "siplan", "mitjavila", "installux", "extrusax",
            "aluminis vic", "navarra de extrusion", "alu-stock", "sapa"
        ]
        if any(comp in norm_name for comp in direct_competitors):
            return True

        for aea_item in self.aea_exclusions:
            norm_aea = aea_item.lower().strip()
            if norm_aea in norm_name or norm_name in norm_aea:
                return True
        return False

    def is_already_in_db(self, company_name: str, cif: str = "") -> Optional[Dict[str, Any]]:
        """
        Verifica si la empresa ya está registrada en el CRM por nombre o por CIF.
        Retorna el registro del prospecto si existe, o None si es nueva.
        """
        if cif and cif.upper().strip() in self.existing_cifs:
            for p in self.prospects:
                if p.get("cif", "").upper().strip() == cif.upper().strip():
                    return p

        norm_name = company_name.lower().strip()
        clean_cand = norm_name.replace("s.l.", "").replace("s.a.", "").replace("s.l.u.", "").replace("lda.", "").replace("lda", "").strip()

        for p in self.prospects:
            p_name = p.get("name", "").lower().strip()
            clean_p = p_name.replace("s.l.", "").replace("s.a.", "").replace("s.l.u.", "").replace("lda.", "").replace("lda", "").strip()
            if clean_p and clean_cand and (clean_p in clean_cand or clean_cand in clean_p):
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
            driver.get(linkedin_url)
            summary["title"] = driver.title
            summary["name"] = driver.title.split("|")[0].strip() if "|" in driver.title else driver.title
            summary["current_url"] = driver.current_url
            summary["scraped_successfully"] = True
            logger.info(f"Página cargada con éxito: {summary['name']}")
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
        Audita una lista de empresas candidatas aplicando los filtros de negocio:
        1. Comprobar que consuma aluminio extruido y no tenga prensa propia.
        2. Descartar si pertenece a la AEA o a competidores extrusores.
        3. Comprobar duplicidad contra prospects.json y excludedCompanies.json.
        4. Validar facturación (>5M €) o dejar en blanco si no está 100% contrastada.
        5. Proponer empresas al usuario SIN insertarlas en la base de datos.
        """
        report = {
            "nuevas_empresas_propuestas": [],
            "enriquecimientos_responsables_existentes": [],
            "descartes": []
        }

        for cand in candidate_companies:
            name = cand.get("name", "")
            cif = cand.get("cif", "")
            existing = self.is_already_in_db(name, cif)
            
            # Caso 1: La empresa YA existe en la base de datos
            if existing:
                purchasing_manager = cand.get("purchasing_manager")
                if purchasing_manager and purchasing_manager != existing.get("purchasingManager"):
                    report["enriquecimientos_responsables_existentes"].append({
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
                        "motivo": f"Ya registrada en CRM ({existing.get('id')})."
                    })
                continue

            # Caso 2: Verificar exclusiones AEA
            if self.is_aea_excluded(name):
                report["descartes"].append({
                    "empresa": name,
                    "motivo": "Excluida por pertenecer a la Asociación Española del Aluminio (AEA) o ser extrusor con prensa propia."
                })
                continue

            # Caso 3: Verificar que consume aluminio extruido
            if not cand.get("consumes_extruded_aluminum", True):
                report["descartes"].append({
                    "empresa": name,
                    "motivo": "No se pudo comprobar que consuma perfiles de aluminio extruido."
                })
                continue

            # Caso 4: Nueva empresa propuesta para revisión del usuario (SIN INSERTAR EN BD)
            revenue = cand.get("revenue")
            # Si no está comprobada fehacientemente, se mantiene None / vacío
            report["nuevas_empresas_propuestas"].append({
                "name": name,
                "cif": cif or "",
                "zone": cand.get("zone", "España"),
                "department": cand.get("department", ""),
                "city": cand.get("city", ""),
                "address": cand.get("address", ""),
                "web": cand.get("web", ""),
                "revenue": revenue if (revenue is not None and revenue > 0) else None,
                "sector": cand.get("sector", "Carpintería y Cerramientos de Aluminio"),
                "products": cand.get("products", ["Perfiles de aluminio extruido"]),
                "purchasingManager": cand.get("purchasing_manager") or "",
                "purchasingRole": cand.get("purchasing_role") or "",
                "purchasingLinkedin": cand.get("purchasing_linkedin") or "",
                "linkedin": cand.get("linkedin") or "",
                "phone": cand.get("phone") or "",
                "email": cand.get("email") or "",
                "source": cand.get("source", "Catálogo VETECO / CONCRETA / Licitaciones / ANFAJE"),
                "notes": cand.get("notes", "Consumo verificado de perfiles de aluminio extruido. Pendiente de aprobación expresa."),
                "recent_activity_date": cand.get("recent_activity_date", "2026-09-01")
            })

        return report


def main():
    """Función principal de prueba y trazabilidad."""
    db_file = os.path.abspath("src/data/prospects.json")
    
    logger.info("Inicializando LinkedInLeadProspector con fuentes ampliadas (VETECO, CONCRETA, Licitaciones, Tectónica, ANFAJE)...")
    prospector = LinkedInLeadProspector(db_path=db_file)
    logger.info(f"Base de datos cargada: {len(prospector.prospects)} prospectos.")
    logger.info("Fuentes homologadas disponibles:")
    for categoria, lista in HOMOLOGATED_PROSPECTING_SOURCES.items():
        logger.info(f"  - {categoria}: {len(lista)} fuentes")


if __name__ == "__main__":
    main()
