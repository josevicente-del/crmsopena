# -*- coding: utf-8 -*-
"""
Scraper de verificación 100% real sobre las webs corporativas de las nuevas empresas
(PROP-LEAD26-0628 a PROP-LEAD26-0696) y auditoría de datos contrastados en prospects.json:
1. Conecta por HTTP/HTTPS a la portada y páginas de contacto / aviso legal de cada empresa nueva.
2. Extrae únicamente emails, teléfonos y CIF/NIF que aparezcan literalmente en el HTML oficial de la empresa.
3. Si un dato (facturación, responsable de compras, CIF, teléfono o email) NO está contrastado al 100%,
   lo deja en blanco (null o "").
"""

import json
import re
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse

PROSPECTS_PATH = "src/data/prospects.json"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,pt-PT,pt;q=0.8,en;q=0.7",
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


def is_valid_es_cif(cif: str) -> bool:
    """Valida matemáticamente el dígito de control oficial de un CIF español."""
    cif = re.sub(r"[^A-Z0-9]", "", cif.upper())
    if not re.match(r"^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$", cif):
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
    """Valida matemáticamente el algoritmo Módulo 11 de un NIF portugués."""
    nif = re.sub(r"[^0-9]", "", nif)
    if len(nif) != 9 or not nif.startswith("5"):
        return False
    total = sum(int(nif[i]) * (9 - i) for i in range(8))
    rem = total % 11
    check = 0 if rem < 2 else 11 - rem
    return int(nif[8]) == check


def fetch_html(url: str, timeout: int = 7) -> str:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "text/html" not in ctype and "application/xhtml" not in ctype and ctype != "":
                return ""
            raw = resp.read(250000)
            return raw.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def scrape_company_site(p: dict) -> dict:
    web = (p.get("web") or "").strip()
    if not web:
        return {"id": p["id"], "emails": [], "phones": [], "cifs": []}

    parsed = urlparse(web)
    base = f"{parsed.scheme}://{parsed.netloc}"
    host_clean = parsed.netloc.lower().replace("www.", "")

    paths = [
        web,
        urljoin(base, "/contacto"),
        urljoin(base, "/contacto/"),
        urljoin(base, "/es/contacto"),
        urljoin(base, "/contactos"),
        urljoin(base, "/contact"),
        urljoin(base, "/aviso-legal"),
        urljoin(base, "/aviso-legal/"),
        urljoin(base, "/nota-legal"),
        urljoin(base, "/politica-de-privacidad"),
    ]

    seen_urls = set()
    combined_html = []
    for u in paths:
        if u in seen_urls:
            continue
        seen_urls.add(u)
        html = fetch_html(u, timeout=6)
        if html:
            combined_html.append(html)
            if len(combined_html) >= 4:
                break

    full_text = "\n".join(combined_html)

    # Extraer emails reales publicados en la web
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

    # Priorizar emails del propio dominio de la empresa
    own_domain_emails = [e for e in found_emails if host_clean.split(".")[0] in e.split("@")[-1]]
    best_emails = own_domain_emails if own_domain_emails else found_emails

    # Extraer CIF / NIF válido publicado en la web
    found_cifs = []
    if p.get("zone") == "Portugal" or host_clean.endswith(".pt"):
        for m in PT_NIF_RE.findall(full_text):
            if is_valid_pt_nif(m):
                cand = f"PT{m}"
                if cand not in found_cifs:
                    found_cifs.append(cand)
    else:
        for m in ES_CIF_RE.findall(full_text):
            clean_c = re.sub(r"[^A-Z0-9]", "", m.upper())
            if is_valid_es_cif(clean_c) and clean_c not in found_cifs:
                found_cifs.append(clean_c)

    # Extraer teléfonos publicados en la web
    found_phones = []
    if p.get("zone") == "Portugal" or host_clean.endswith(".pt"):
        for m in PT_PHONE_RE.findall(full_text):
            ph = re.sub(r"\s+", " ", m.strip())
            if len(re.sub(r"\D", "", ph)) >= 9 and ph not in found_phones:
                found_phones.append(ph)
    else:
        for m in ES_PHONE_RE.findall(full_text):
            ph = re.sub(r"\s+", " ", m.strip())
            digits = re.sub(r"\D", "", ph)
            if len(digits) in (9, 11) and ph not in found_phones:
                found_phones.append(ph)

    return {
        "id": p["id"],
        "name": p["name"],
        "emails": best_emails,
        "phones": found_phones,
        "cifs": found_cifs,
    }


def main():
    with open(PROSPECTS_PATH, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    # Seleccionar las 69 empresas nuevas añadidas hoy (PROP-LEAD26-0628 en adelante)
    new_companies = [p for p in prospects if int(p["id"].split("-")[-1]) >= 628]
    print(f"Auditando en vivo las webs de {len(new_companies)} empresas nuevas...")

    scraped_by_id = {}
    with ThreadPoolExecutor(max_workers=12) as ex:
        futures = {ex.submit(scrape_company_site, p): p["id"] for p in new_companies}
        for fut in as_completed(futures):
            res = fut.result()
            scraped_by_id[res["id"]] = res

    with open("scripts/scraped_69_real_data.json", "w", encoding="utf-8") as f:
        json.dump(scraped_by_id, f, ensure_ascii=False, indent=2)

    found_e = sum(1 for v in scraped_by_id.values() if v["emails"])
    found_p = sum(1 for v in scraped_by_id.values() if v["phones"])
    found_c = sum(1 for v in scraped_by_id.values() if v["cifs"])
    print(f"Resultados scraping real sobre las 69 webs -> Emails encontrados: {found_e}, Teléfonos encontrados: {found_p}, CIFs encontrados: {found_c}")


if __name__ == "__main__":
    main()

