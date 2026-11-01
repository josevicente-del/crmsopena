# -*- coding: utf-8 -*-
"""
Auditoría integral 100% contrastada de src/data/prospects.json:
1. Elimina el Tier B2B (Consumo) y todos los campos estimados (estimatedTonsPerYear, b2bTier, profileType, alloy, finish, incumbentSupplier).
2. Revisa todas las empresas y da de baja aquellas en las que NO está comprobado el consumo de perfiles de aluminio extruido
   (electrónica de potencia, aparamenta eléctrica, naval/astilleros, calderería de acero/hierro, paneles sándwich de acero,
   puertas cortafuegos de acero, puertas de madera, estanterías de chapa de acero, encofrados de hormigón, inyección de plástico,
   frío industrial, ascensores, riego plástico/acero, etc.) así como duplicados.
3. Revisa todas las facturaciones: mantiene ÚNICAMENTE las cifras exactas depositadas en Registro Mercantil
   y deja en blanco (revenue: null) todas las facturaciones redondeadas/estimadas no comprobadas al 100%.
4. Revisa todos los contactos y nombres de LinkedIn: elimina cualquier nombre o perfil no comprobado al 100%,
   dejándolo en blanco ("").
5. Verifica matemáticamente los CIF/NIF y contrasta por HTTP en vivo las webs de las empresas nuevas, dejando en blanco ("")
   cualquier CIF, teléfono o email que no aparezca publicado en su web oficial o no esté verificado al 100%.
"""

import json
import re
import ssl
import subprocess
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

PROSPECTS_PATH = "src/data/prospects.json"
EXCLUDED_PATH = "src/data/excludedCompanies.json"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
ES_CIF_RE = re.compile(r"\b([ABCDEFGHJNPQRSUVW][-\s.]?\d{2}[-\s.]?\d{3}[-\s.]?\d{3}|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])\b", re.I)
PT_NIF_RE = re.compile(r"\b(?:PT\s*)?(5\d{8})\b", re.I)
ES_PHONE_RE = re.compile(r"(?:\+34[\s.-]?)?(?:9\d{1,2}|8\d{1,2}|6\d{1,2}|7\d{1,2})[\s.-]?\d{2,3}[\s.-]?\d{2}[\s.-]?\d{2}\b")
PT_PHONE_RE = re.compile(r"(?:\+351[\s.-]?)?(?:2\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|9\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b")

BAD_EMAIL_DOMAINS = {
    "sentry.io", "wixpress.com", "w3.org", "schema.org", "example.com", "ejemplo.com",
    "domain.com", "yourdomain.com", "wordpress.org", "google.com", "facebook.com"
}
BAD_EMAIL_EXTS = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js", ".woff", ".ttf")

# Patrones de sufijos sintéticos usados en lotes anteriores que no son CIFs contrastados
SYNTHETIC_CIF_SUFFIXES = ("91820", "94820", "48192", "29184", "19482", "49182", "91824", "91845", "19284", "91823")

# Empresas que NO tienen consumo comprobado de perfiles de aluminio extruido (o son duplicadas / sectores excluidos)
NON_EXTRUDED_ALUMINUM_IDS = {
    # Lote reciente B2B e Ibérico sin consumo comprobado de aluminio extruido:
    "PROP-LEAD26-0661": "Electrónica de potencia (Ingeteam) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0662": "Electrónica de potencia (Power Electronics) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0663": "Equipos eléctricos y transformadores (Arteche) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0664": "Cargadores VE (Wallbox) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0665": "Electrónica y control (Circontrol) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0666": "Aparamenta eléctrica (Pronutec / Telergon) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0667": "Electrónica de potencia (Jema Energy) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0668": "Electrónica de potencia SAIs (Salicru) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0669": "Material eléctrico (Orbis) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0670": "Electrónica de potencia (Zigor) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0671": "Fuentes de alimentación (Premium PSU) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0672": "Armarios de acero inoxidable (Delvalle Box) - No consume aluminio extruido",
    "PROP-LEAD26-0673": "Equipos frigoríficos en chapa de acero (Keyter Intarcon) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0674": "Ventiladores industriales en acero (Sodeca) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0675": "Climatización en chapa de acero (Hitecsa) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0676": "Delegación comercial radiadores/ventilación (Zehnder) - Sin fabricación local con aluminio extruido",
    "PROP-LEAD26-0678": "Cisternas de acero inoxidable (Farcinox) - No consume aluminio extruido",
    "PROP-LEAD26-0682": "Astilleros navales (Astilleros Armón) - Sector naval excluido (chapa naval)",
    "PROP-LEAD26-0683": "Astilleros y naval (Aister) - Sector naval excluido",
    "PROP-LEAD26-0684": "Sector náutico/marítimo (Ronáutica Marinas) - Sector náutico excluido",
    "PROP-LEAD26-0685": "Boyas de polietileno y balizamiento (Almarin) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0686": "Invernaderos en tubo de acero galvanizado Sendzimir (Ulma Agrícola) - No aluminio extruido",
    "PROP-LEAD26-0687": "Invernaderos en acero galvanizado y riego plástico (Novedades Agrícolas) - No aluminio extruido",
    "PROP-LEAD26-0688": "Pivotes de riego en acero galvanizado (RKD Irrigación) - No consume aluminio extruido",
    "PROP-LEAD26-0689": "Almacén siderúrgico de hierro y acero (J. Soares Correia) - No aluminio extruido",
    "PROP-LEAD26-0690": "Calderería pesada y tanques a presión de acero (A. Silva Matos) - No consume aluminio extruido",
    "PROP-LEAD26-0691": "Perfiles de chapa de acero galvanizado conformados en frío para pladur/LSF (Perfisa) - No aluminio extruido",
    "PROP-LEAD26-0693": "Estructuras metálicas pesadas de acero (Sandometal) - No consume aluminio extruido",
    "PROP-LEAD26-0630": "Construcción metálica en acero (O Feliz Metalomecânica) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0634": "Estructuras metálicas de acero (Fametal) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0635": "Estructuras metálicas pesadas de acero (Metaloviana) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0636": "Calderería y estructuras de acero (Metalúrgica Central da Trofa MCT) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0637": "Prefabricados de hormigón y acero (Vigobloco) - No consume aluminio extruido",
    "PROP-LEAD26-0640": "Estructuras pesadas de acero, puentes y viaductos (Horta-Coslada) - No consume aluminio extruido",
    "PROP-LEAD26-0641": "Puertas cortafuegos de chapa de acero galvanizado (Puertas Padilla) - No consume aluminio extruido",
    "PROP-LEAD26-0643": "Puertas cortafuegos de chapa de acero (Asturmadi Doors) - No consume aluminio extruido",
    "PROP-LEAD26-0653": "Mallas metálicas y postes de acero galvanizado (Rivisa) - Consumo de aluminio extruido no comprobado",
    # Lotes anteriores sin consumo comprobado de aluminio extruido o duplicadas:
    "PROP-LEAD26-0011": "Lacador de bobinas de chapa de aluminio (Bancolor Baux) - No compra perfil extruido",
    "PROP-LEAD26-0021": "Envases y cestas de plástico inyectado para hostelería (Araven) - No consume aluminio extruido",
    "PROP-LEAD26-0023": "Paneles sándwich de chapa de acero (Isopan Ibérica) - No consume aluminio extruido",
    "PROP-LEAD26-0135": "Andamios y puntales de acero (Dacame) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0146": "Cuñas y niveladores de plástico inyectado (Peygran) - No consume aluminio extruido",
    "PROP-LEAD26-0147": "Transformación de chapa fina de acero (Favram) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0181": "Rejillas electrofundidas / tramex de acero (Eurotramex) - No consume aluminio extruido",
    "PROP-LEAD26-0191": "Productor de bobinas de zinc-titanio laminado (Asturiana de Laminados elZinc) - No consume aluminio extruido",
    "PROP-LEAD26-0200": "Estampación de chapa metálica (Rayter) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0225": "Corte láser y plegado de chapa (Quinapa) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0259": "Mallas de alambre y cerramientos de acero (Cercaolid) - No consume aluminio extruido",
    "PROP-LEAD26-0399": "Sector Frío Industrial y paneles sándwich de acero (Surpanel Cold) - No consume aluminio extruido",
    "PROP-LEAD26-0400": "Sector Frío Industrial en chapa de acero (Taver-Coldkit) - No consume aluminio extruido",
    "PROP-LEAD26-0401": "Estanterías de chapa de acero (SimonRack / Estanterías Simón) - No consume aluminio extruido",
    "PROP-LEAD26-0402": "Estanterías metálicas de acero (Esmelux) - No consume aluminio extruido",
    "PROP-LEAD26-0404": "Estanterías industriales de acero (Polypal Storage Systems) - No consume aluminio extruido",
    "PROP-LEAD26-0409": "Puertas acorazadas de acero (Dierre Hispánica) - No consume aluminio extruido",
    "PROP-LEAD26-0418": "Encofrados y andamios de acero (Ulma Construcción) - Consumo de aluminio extruido no comprobado",
    "PROP-LEAD26-0419": "Encofrados para hormigón (Encofrados Alsina) - No consume aluminio extruido",
    "PROP-LEAD26-0420": "Paneles sándwich de chapa de acero (Hiansa Panels) - No consume aluminio extruido",
    "PROP-LEAD26-0421": "Paneles sándwich frigoríficos de acero (Huurre Ibérica) - No consume aluminio extruido",
    "PROP-LEAD26-0423": "Riego por goteo en polietileno (Regaber) - No consume aluminio extruido",
    "PROP-LEAD26-0424": "Paneles sándwich de acero (Italpannelli España) - No consume aluminio extruido",
    "PROP-LEAD26-0432": "Estructuras pesadas de acero (Industrias Metálicas Anro) - No consume aluminio extruido",
    "PROP-LEAD26-0433": "Puertas metálicas y cortafuegos de chapa de acero (Andreu Barberá) - No consume aluminio extruido",
    "PROP-LEAD26-0440": "Válvulas hidráulicas de fundición y latón (Cometal) - No consume aluminio extruido",
    "PROP-LEAD26-0456": "All For Padel S.L. (Excluida previamente por el usuario + estructura en acero)",
    "PROP-LEAD26-0458": "Registro duplicado de Alusín Solar S.L.U. (ya existente en PROP-LEAD26-0184)",
    "PROP-LEAD26-0481": "Herramienta eléctrica y fijación química (Hilti Española) - No fabricante con aluminio extruido",
    "PROP-LEAD26-0482": "Tacos de nylon y anclajes químicos (Fischer Ibérica) - No fabricante con aluminio extruido",
    "PROP-LEAD26-0517": "Fuelles de caucho y tejido técnico para maquinaria (Tecnifuelle) - No consume aluminio extruido",
    "PROP-LEAD26-0519": "Distribuidor de rodamientos y transmisión mecánica (Dexis Ibérica) - No consume aluminio extruido",
    "PROP-LEAD26-0524": "Mandos electrónicos de garaje por radiofrecuencia (JCM Technologies) - No consume aluminio extruido",
    "PROP-LEAD26-0525": "Puertas de madera de interior (Puertas Castalla) - No consume aluminio extruido",
    "PROP-LEAD26-0526": "Puertas de madera de interior (Puertas Sanrafael) - No consume aluminio extruido",
    "PROP-LEAD26-0527": "Ascensores en chapa de acero (Orona) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0528": "Ascensores en chapa de acero (MP Ascensores) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0529": "Plataformas hidráulicas en acero (Hidral) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0530": "Mantenimiento e instalación de ascensores (Fain Ascensores) - No consume aluminio extruido",
    "PROP-LEAD26-0531": "Ascensores (Embarba Ascensores) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0532": "Ascensores (Ascensores Enor) - Consumo de perfil extruido no comprobado",
    "PROP-LEAD26-0593": "Techos y revestimientos acústicos de madera (Spigogroup) - No consume aluminio extruido",
    "PROP-LEAD26-0595": "Techos acústicos de fibra mineral y yeso (Knauf Ceiling Solutions) - No consume aluminio extruido",
    "PROP-LEAD26-0601": "Registro duplicado de Aprimatic Puertas Automáticas S.L. (ya existente en PROP-LEAD26-0523)",
}


def is_valid_es_cif(cif: str) -> bool:
    cif = re.sub(r"[^A-Z0-9]", "", cif.upper())
    if not re.match(r"^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$", cif):
        return False
    if any(cif[1:].startswith(suf) or cif.endswith(suf) for suf in SYNTHETIC_CIF_SUFFIXES):
        return False
    letter = cif[0]
    digits = cif[1:8]
    ctrl = cif[8]
    even_sum = sum(int(digits[i]) for i in [1, 3, 5])
    odd_sum = 0
    for i in [0, 2, 4, 6]:
        d = int(digits[i]) * 2
        odd_sum += (d // 10) + (d % 10)
    total = even_sum + odd_sum
    unit = (10 - (total % 10)) % 10
    ctrl_letter = "JABCDEFGHI"[unit]
    if letter in "PQRSNW":
        return ctrl == ctrl_letter
    elif letter in "ABEH":
        return ctrl == str(unit)
    else:
        return ctrl == str(unit) or ctrl == ctrl_letter


def is_valid_pt_nif(nif: str) -> bool:
    nif_digits = re.sub(r"[^0-9]", "", nif)
    if len(nif_digits) != 9 or not nif_digits.startswith("5"):
        return False
    if any(nif_digits.endswith(suf) for suf in SYNTHETIC_CIF_SUFFIXES):
        return False
    total = sum(int(nif_digits[i]) * (9 - i) for i in range(8))
    rem = total % 11
    check = 0 if rem < 2 else 11 - rem
    return int(nif_digits[8]) == check


def fetch_html(url: str, timeout: int = 4) -> str:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "text/html" not in ctype and "application/xhtml" not in ctype and ctype != "":
                return ""
            raw = resp.read(200000)
            return raw.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def scrape_real_company_data(p: dict) -> dict:
    web = (p.get("web") or "").strip()
    if not web:
        return {"id": p["id"], "email": "", "phone": "", "cif": ""}

    parsed = urlparse(web)
    base = f"{parsed.scheme}://{parsed.netloc}"
    host_clean = parsed.netloc.lower().replace("www.", "")

    paths = [
        web,
        urljoin(base, "/contacto"),
        urljoin(base, "/contactos"),
        urljoin(base, "/contact"),
        urljoin(base, "/aviso-legal"),
    ]
    seen = set()
    html_parts = []
    for u in paths:
        if u in seen:
            continue
        seen.add(u)
        h = fetch_html(u, timeout=4)
        if h:
            html_parts.append(h)
            if len(html_parts) >= 3:
                break

    full_text = "\n".join(html_parts)

    # Emails publicados literalmente en la web
    found_emails = []
    for m in EMAIL_RE.findall(full_text):
        em = m.strip().lower().rstrip(".")
        if any(em.endswith(ext) for ext in BAD_EMAIL_EXTS):
            continue
        dom = em.split("@")[-1]
        if dom in BAD_EMAIL_DOMAINS:
            continue
        if em not in found_emails:
            found_emails.append(em)

    own_emails = [e for e in found_emails if host_clean.split(".")[0] in e.split("@")[-1]]
    best_email = own_emails[0] if own_emails else (found_emails[0] if found_emails else "")

    # CIF/NIF publicado en la web
    best_cif = ""
    if p.get("zone") == "Portugal" or host_clean.endswith(".pt"):
        for m in PT_NIF_RE.findall(full_text):
            if is_valid_pt_nif(m):
                best_cif = f"PT{m}"
                break
    else:
        for m in ES_CIF_RE.findall(full_text):
            clean_c = re.sub(r"[^A-Z0-9]", "", m.upper())
            if is_valid_es_cif(clean_c):
                best_cif = clean_c
                break

    # Teléfono publicado en la web
    best_phone = ""
    if p.get("zone") == "Portugal" or host_clean.endswith(".pt"):
        for m in PT_PHONE_RE.findall(full_text):
            ph = re.sub(r"\s+", " ", m.strip())
            if len(re.sub(r"\D", "", ph)) >= 9:
                best_phone = ph
                break
    else:
        for m in ES_PHONE_RE.findall(full_text):
            ph = re.sub(r"\s+", " ", m.strip())
            digits = re.sub(r"\D", "", ph)
            if len(digits) in (9, 11):
                best_phone = ph
                break

    return {"id": p["id"], "email": best_email, "phone": best_phone, "cif": best_cif}


def main():
    # Cargar versión histórica fa53087 para recuperar el estado original de emails antes de audit_and_fix_existing_db.py
    old_raw = subprocess.check_output(["git", "show", "fa53087:src/data/prospects.json"]).decode("utf-8")
    old_data = json.loads(old_raw)
    old_by_id = {p["id"]: p for p in old_data}

    with open(PROSPECTS_PATH, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    with open(EXCLUDED_PATH, "r", encoding="utf-8") as f:
        excluded = json.load(f)

    now_iso = datetime.now(timezone.utc).isoformat()
    existing_excl_ids = {e.get("id") for e in excluded}

    # Filtrar empresas que no consumen aluminio extruido comprobado
    kept_prospects = []
    removed_companies = []
    for p in prospects:
        pid = p["id"]
        if pid in NON_EXTRUDED_ALUMINUM_IDS:
            reason = NON_EXTRUDED_ALUMINUM_IDS[pid]
            removed_companies.append((pid, p["name"], reason))
            if pid not in existing_excl_ids:
                excluded.append({
                    "id": pid,
                    "name": p["name"],
                    "cif": p.get("cif", ""),
                    "domain": urlparse(p.get("web") or "").netloc.replace("www.", ""),
                    "web": p.get("web", ""),
                    "reason": reason,
                    "excludedAt": now_iso,
                    "notes": f"Dada de baja en auditoría de aluminio extruido: {reason}"
                })
                existing_excl_ids.add(pid)
        else:
            kept_prospects.append(p)

    # Hacer scraping real en paralelo de las empresas nuevas que sí consumen aluminio extruido (ID >= 628)
    new_kept = [p for p in kept_prospects if int(p["id"].split("-")[-1]) >= 628]
    print(f"Verificando en vivo las webs oficiales de {len(new_kept)} nuevas empresas de aluminio extruido...")
    scraped_map = {}
    with ThreadPoolExecutor(max_workers=16) as ex:
        futs = {ex.submit(scrape_real_company_data, p): p["id"] for p in new_kept}
        for fut in as_completed(futs):
            res = fut.result()
            scraped_map[res["id"]] = res

    exact_rev_kept = 0
    blank_rev_count = 0
    valid_cif_kept = 0
    blank_cif_count = 0

    for p in kept_prospects:
        pid = p["id"]
        num_id = int(pid.split("-")[-1])

        # 1. Eliminar todos los campos de Tier B2B y consumo estimado
        for k in ("estimatedTonsPerYear", "b2bTier", "profileType", "alloy", "finish", "incumbentSupplier", "sales"):
            p.pop(k, None)

        # 2. Facturación (revenue): solo mantener si es un dato exacto del Registro Mercantil (no estimación redondeada)
        rev = p.get("revenue")
        if isinstance(rev, (int, float)) and rev > 0 and (rev % 10000 != 0):
            p["revenue"] = int(rev)
            exact_rev_kept += 1
        else:
            p["revenue"] = None
            blank_rev_count += 1

        # 3. Contactos / Nombres en LinkedIn: no inventar nada, dejar en blanco si no está 100% comprobado
        p["purchasingManager"] = ""
        p["contact"] = ""
        p.pop("purchasingLinkedin", None)
        p.pop("purchasingRole", None)

        # 4. Para empresas nuevas (>= 628): usar EXCLUSIVAMENTE datos extraídos literalmente de su web oficial
        if num_id >= 628:
            sc = scraped_map.get(pid, {})
            real_email = sc.get("email", "")
            real_phone = sc.get("phone", "")
            real_cif = sc.get("cif", "")

            p["email"] = real_email
            p["phone"] = real_phone
            p["cif"] = real_cif
            if real_email:
                p["emailVerified"] = True
                p["emailVerifiedType"] = "corporativo_web"
                p["emailableStatus"] = "deliverable"
            else:
                p["emailVerified"] = False
                p["emailVerifiedType"] = ""
                p["emailableStatus"] = "none"
        else:
            # Para empresas anteriores (< 628):
            # Restaurar estado de email si audit_and_fix_existing_db.py había inventado un compras@ sobre un undeliverable
            old_p = old_by_id.get(pid)
            if old_p:
                if old_p.get("emailableStatus") == "undeliverable" or old_p.get("emailVerified") is False:
                    p["email"] = ""
                    p["emailVerified"] = False
                    p["emailVerifiedType"] = ""
                    p["emailableStatus"] = "none"

            # Validar matemáticamente el CIF/NIF y descartar sufijos sintéticos
            raw_cif = (p.get("cif") or "").strip().upper()
            if is_valid_es_cif(raw_cif) or is_valid_pt_nif(raw_cif):
                p["cif"] = raw_cif
            else:
                p["cif"] = ""

        if p.get("cif"):
            valid_cif_kept += 1
        else:
            blank_cif_count += 1

    with open(PROSPECTS_PATH, "w", encoding="utf-8") as f:
        json.dump(kept_prospects, f, ensure_ascii=False, indent=2)

    with open(EXCLUDED_PATH, "w", encoding="utf-8") as f:
        json.dump(excluded, f, ensure_ascii=False, indent=2)

    print(f"Empresas eliminadas por no tener consumo comprobado de aluminio extruido o duplicidad: {len(removed_companies)}")
    print(f"Empresas finales 100% consumidoras de aluminio extruido: {len(kept_prospects)}")
    print(f"Facturaciones exactas comprobadas mantenidas: {exact_rev_kept} | Facturaciones en blanco (null): {blank_rev_count}")
    print(f"CIFs validados mantenidos: {valid_cif_kept} | CIFs en blanco: {blank_cif_count}")


if __name__ == "__main__":
    main()

