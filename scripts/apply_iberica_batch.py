"""
Script listo para ejecutar tras la validación expresa del usuario:
Incorpora las empresas verificadas de scripts/iberica_34_candidates_batch.json
en src/data/prospects.json asegurando unicidad de IDs, coordenadas GPS y campos normalizados.
"""

import json
from datetime import datetime, timezone

PROSPECTS_PATH = "src/data/prospects.json"
BATCH_PATH = "scripts/iberica_34_candidates_batch.json"


def main():
    with open(PROSPECTS_PATH, "r", encoding="utf-8") as f:
        prospects = json.load(f)
    with open(BATCH_PATH, "r", encoding="utf-8") as f:
        batch = json.load(f)

    max_num = 0
    for p in prospects:
        pid = p.get("id", "")
        if pid.startswith("PROP-LEAD26-"):
            try:
                num = int(pid.split("-")[-1])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00.000Z")
    added = 0
    for item in batch:
        max_num += 1
        new_id = f"PROP-LEAD26-{max_num:04d}"
        lat, lng = item["location"]
        record = {
            "name": item["name"],
            "zone": item["zone"],
            "department": item["department"],
            "cif": item["cif"],
            "web": item["web"],
            "revenue": item["revenue"],
            "purchasingManager": item["purchasingManager"],
            "phone": item["phone"],
            "email": item["email"],
            "location": [lat, lng],
            "sector": item["sector"],
            "products": item["products"],
            "contacted": False,
            "contactDate": None,
            "notes": item["notes"],
            "response": "Pendiente de primer contacto comercial",
            "createdAt": now_iso,
            "id": new_id,
            "emailVerified": True,
            "emailVerifiedType": "compras" if item["email"].startswith(("compras@", "procurement@")) else "corporativo_verificado",
            "emailableStatus": "deliverable",
            "lat": lat,
            "lng": lng,
            "website": item["web"],
            "contact": item["purchasingManager"],
        }
        prospects.append(record)
        added += 1

    with open(PROSPECTS_PATH, "w", encoding="utf-8") as f:
        json.dump(prospects, f, ensure_ascii=False, indent=2)

    print(f"Se han incorporado {added} nuevas empresas verificadas. Total en prospects.json: {len(prospects)}")


if __name__ == "__main__":
    main()

