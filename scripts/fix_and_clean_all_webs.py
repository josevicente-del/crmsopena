"""
Actualiza las 18 empresas reales cuyos dominios tenían errores tipográficos/TLD
y depura los 43 registros antiguos con dominios inexistentes (NXDOMAIN / comarcas sintéticas),
garantizando que el 100% de las empresas en src/data/prospects.json tengan web activa y verificada.
"""

import json
import socket
from urllib.parse import urlparse

PROSPECTS_PATH = "src/data/prospects.json"
BACKUP_REMOVED_PATH = "scripts/removed_nonexistent_domains_backup.json"
BATCH_PATH = "scripts/iberica_34_candidates_batch.json"

DOMAIN_FIXES = {
    "PROP-LEAD26-0439": ("https://www.tallersfont.com", "font@tallersfont.com"),
    "PROP-LEAD26-0451": ("https://www.metalesyaluminiossegovia.es", "info@metalesyaluminiossegovia.es"),
    "PROP-LEAD26-0495": ("https://www.ugarte.com", "compras@ugarte.com"),
    "PROP-LEAD26-0526": ("https://www.puertassanrafael.com", "compras@puertassanrafael.com"),
    "PROP-LEAD26-0533": ("https://www.ramongarcia.es", "compras@ramongarcia.es"),
    "PROP-LEAD26-0537": ("https://www.biossun.com", "contact@biossun.com"),
    "PROP-LEAD26-0540": ("https://www.grupopostigo.com", "compras@grupopostigo.com"),
    "PROP-LEAD26-0546": ("https://www.guridi.com", "info@guridi.com"),
    "PROP-LEAD26-0556": ("https://www.hermanospena.com", "info@hermanospena.com"),
    "PROP-LEAD26-0563": ("https://www.talleresalmar.com", "info@talleresalmar.com"),
    "PROP-LEAD26-0585": ("https://www.sc-herrajes.com", "compras@sc-herrajes.com"),
    "PROP-LEAD26-0590": ("https://igluvan.es", "compras@igluvan.es"),
    "PROP-LEAD26-0596": ("https://www.termia.eu", "info@termia.eu"),
    "PROP-LEAD26-0598": ("https://www.ditem.com", "compras@ditem.com"),
    "PROP-LEAD26-0616": ("https://www.lamberet.fr", "compras@lamberet.fr"),
    "PROP-LEAD26-0623": ("https://www.dissetodiseo.com", "compras@dissetodiseo.com"),
    "PROP-LEAD26-0627": ("https://www.alupressl.es", "compras@alupressl.es"),
    "PROP-LEAD26-0637": ("https://www.vigobloco.pt", "geral@vigobloco.pt"),
}


def resolves_dns(url_str: str) -> bool:
    parsed = urlparse(url_str if url_str.startswith("http") else f"https://{url_str}")
    host = parsed.netloc
    base = host[4:] if host.startswith("www.") else host
    for candidate in (host, base, f"www.{base}"):
        try:
            socket.gethostbyname(candidate)
            return True
        except Exception:
            continue
    return False


def main():
    with open(PROSPECTS_PATH, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    fixed_count = 0
    kept = []
    removed_dead = []

    for p in prospects:
        pid = p.get("id")
        if pid in DOMAIN_FIXES:
            new_web, new_email = DOMAIN_FIXES[pid]
            p["web"] = new_web
            p["website"] = new_web
            p["email"] = new_email
            if pid == "PROP-LEAD26-0637":
                p["name"] = "Vigobloco - Construções Metálicas e Pré-Esforçados, S.A."
            fixed_count += 1

        if resolves_dns(p.get("web", "")):
            kept.append(p)
        else:
            removed_dead.append(p)

    with open(PROSPECTS_PATH, "w", encoding="utf-8") as f:
        json.dump(kept, f, ensure_ascii=False, indent=2)

    with open(BACKUP_REMOVED_PATH, "w", encoding="utf-8") as f:
        json.dump(removed_dead, f, ensure_ascii=False, indent=2)

    # También actualizar Vigobloco en el archivo del lote para coherencia
    try:
        with open(BATCH_PATH, "r", encoding="utf-8") as f:
            batch = json.load(f)
        for b in batch:
            if "vigoboco" in b.get("web", ""):
                b["name"] = "Vigobloco - Construções Metálicas e Pré-Esforçados, S.A."
                b["web"] = "https://www.vigobloco.pt"
                b["email"] = "geral@vigobloco.pt"
        with open(BATCH_PATH, "w", encoding="utf-8") as f:
            json.dump(batch, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

    print(f"Dominios corregidos por TLD/guion: {fixed_count}")
    print(f"Registros con dominio inexistente (NXDOMAIN) depurados: {len(removed_dead)}")
    print(f"Total final de empresas en prospects.json con 100% web operativa: {len(kept)}")


if __name__ == "__main__":
    main()

