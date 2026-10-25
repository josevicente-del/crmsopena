# -*- coding: utf-8 -*-
"""
=============================================================================
Módulo: apply_linkedin_batch.py
Propósito: Inyección controlada y segura del lote validado de 30 empresas 
           prospectadas en LinkedIn en src/data/prospects.json con formato de
           ID uniforme.
=============================================================================
"""

import json
import os
import re
import sys

def main():
    db_path = os.path.join("src", "data", "prospects.json")
    batch_path = os.path.join("scripts", "linkedin_candidates_batch.json")

    if not os.path.exists(db_path):
        print(f"[ERROR] No existe {db_path}")
        sys.exit(1)

    if not os.path.exists(batch_path):
        print(f"[ERROR] No existe {batch_path}")
        sys.exit(1)

    with open(db_path, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    with open(batch_path, "r", encoding="utf-8") as f:
        new_batch = json.load(f)

    initial_count = len(prospects)
    cifs_existentes = {p.get("cif", "").strip().upper() for p in prospects if p.get("cif")}

    # Determinar el número secuencial más alto de los IDs existentes
    max_num = 0
    for p in prospects:
        raw_id = str(p.get("id", ""))
        # Buscar números al final o en la cadena
        numbers = re.findall(r"\d+", raw_id)
        if numbers:
            num = int(numbers[-1])
            if num > max_num:
                max_num = num

    if max_num == 0:
        max_num = len(prospects)

    added = 0
    for company in new_batch:
        cif_norm = company["cif"].strip().upper()
        if cif_norm not in cifs_existentes:
            max_num += 1
            # Formato estándar de ID corporativo
            company["id"] = f"PROP-LEAD26-{max_num:04d}"
            prospects.append(company)
            cifs_existentes.add(cif_norm)
            added += 1

    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(prospects, f, ensure_ascii=False, indent=2)

    print(f"[OK] Se incorporaron {added} nuevas empresas en {db_path}")
    print(f"[INFO] Total anterior: {initial_count} -> Nuevo total: {len(prospects)}")

if __name__ == "__main__":
    main()
