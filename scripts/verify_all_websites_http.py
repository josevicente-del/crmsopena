"""
Verifica de forma concurrente (HTTP/HTTPS + resolución DNS + seguimiento de redirecciones)
todas las páginas web de src/data/prospects.json (657 registros) y actualiza automáticamente
aquellas que requieran ajuste de subdominio (www vs non-www) o redirección canónica.
"""

import json
import socket
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

PROSPECTS_PATH = "src/data/prospects.json"

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def check_single_url(item):
    pid = item.get("id")
    name = item.get("name")
    url = (item.get("web") or item.get("website") or "").strip()
    if not url.startswith("http"):
        url = "https://" + url

    parsed = urlparse(url)
    host = parsed.netloc
    base_host = host[4:] if host.startswith("www.") else host

    # Probar URL original, variante con/sin www, y http si https falla
    candidates = [
        url,
        f"https://www.{base_host}{parsed.path or ''}",
        f"https://{base_host}{parsed.path or ''}",
        f"http://www.{base_host}{parsed.path or ''}",
        f"http://{base_host}{parsed.path or ''}",
    ]
    # Eliminar duplicados preservando orden
    seen = set()
    unique_candidates = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            unique_candidates.append(c)

    for candidate in unique_candidates:
        c_host = urlparse(candidate).netloc
        try:
            socket.gethostbyname(c_host)
        except Exception:
            continue

        try:
            req = urllib.request.Request(candidate, headers=HEADERS, method="GET")
            with urllib.request.urlopen(req, timeout=6, context=ssl_ctx) as resp:
                code = resp.getcode()
                final_url = resp.geturl()
                if 200 <= code < 400:
                    return (pid, name, url, candidate, final_url, code, "OK")
        except urllib.error.HTTPError as e:
            # 403/401/405/429 en Cloudflare/WAF confirman servidor web corporativo activo
            if e.code in (401, 403, 405, 406, 429, 503):
                return (pid, name, url, candidate, candidate, e.code, "OK_WAF")
        except Exception:
            continue

    # Comprobar al menos resolución DNS del dominio base
    try:
        ip = socket.gethostbyname(base_host)
        return (pid, name, url, url, url, 0, f"DNS_OK_TIMEOUT ({ip})")
    except Exception:
        try:
            ip = socket.gethostbyname("www." + base_host)
            fixed = f"https://www.{base_host}"
            return (pid, name, url, fixed, fixed, 0, f"DNS_WWW_OK ({ip})")
        except Exception as e:
            return (pid, name, url, url, url, 0, f"FAIL: {type(e).__name__}")


def main():
    with open(PROSPECTS_PATH, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    print(f"Verificando {len(prospects)} sitios web en paralelo...")
    results = {}
    with ThreadPoolExecutor(max_workers=45) as executor:
        future_map = {executor.submit(check_single_url, p): p["id"] for p in prospects}
        for fut in as_completed(future_map):
            res = fut.result()
            results[res[0]] = res

    ok_count = 0
    waf_count = 0
    dns_only_count = 0
    fail_list = []
    updated_urls = 0

    for p in prospects:
        pid = p["id"]
        pid, name, orig_url, working_candidate, final_url, code, status = results[pid]
        if status == "OK":
            ok_count += 1
            if working_candidate != orig_url:
                p["web"] = working_candidate
                p["website"] = working_candidate
                updated_urls += 1
        elif status == "OK_WAF":
            waf_count += 1
            if working_candidate != orig_url:
                p["web"] = working_candidate
                p["website"] = working_candidate
                updated_urls += 1
        elif status.startswith("DNS_"):
            dns_only_count += 1
            if working_candidate != orig_url:
                p["web"] = working_candidate
                p["website"] = working_candidate
                updated_urls += 1
        else:
            fail_list.append((pid, name, orig_url, status))

    with open(PROSPECTS_PATH, "w", encoding="utf-8") as f:
        json.dump(prospects, f, ensure_ascii=False, indent=2)

    print(f"--- RESULTADO AUDITORÍA WEB ({len(prospects)} empresas) ---")
    print(f"HTTP 200/3xx OK directo: {ok_count}")
    print(f"Activo tras WAF/Cloudflare: {waf_count}")
    print(f"DNS activo (respuesta lenta): {dns_only_count}")
    print(f"URLs ajustadas automáticamente (www/https): {updated_urls}")
    print(f"Fallos de resolución DNS ({len(fail_list)}):")
    for item in fail_list:
        print("  ", item)


if __name__ == "__main__":
    main()

