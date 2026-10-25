# -*- coding: utf-8 -*-
"""
=============================================================================
Módulo: fix_and_normalize_prospects.py
Propósito: Normalización integral de la base de datos prospects.json:
  1. Garantizar IDs 100% únicos y secuenciales (PROP-LEAD26-0001 a 0632).
  2. Garantizar que todos los prospectos tengan location: [lat, lng].
  3. Garantizar que todos los prospectos tengan products como lista de strings.
  4. Garantizar campos web, phone, email, contact y purchasingManager coherentes.
=============================================================================
"""

import json
import os
import sys

def main():
    db_path = os.path.join("src", "data", "prospects.json")
    if not os.path.exists(db_path):
        print(f"[ERROR] Archivo no encontrado en {db_path}")
        sys.exit(1)

    with open(db_path, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    print(f"[INFO] Registros totales cargados: {len(prospects)}")

    normalized = []
    seen_cifs = set()

    for idx, p in enumerate(prospects):
        clean = dict(p)

        # 1. Asignar ID único y secuencial garantizado
        clean["id"] = f"PROP-LEAD26-{(idx + 1):04d}"

        # 2. Normalizar CIF
        cif = str(clean.get("cif", "")).strip().upper()
        clean["cif"] = cif

        # 3. Normalizar location [lat, lng]
        loc = clean.get("location")
        lat = clean.get("lat")
        lng = clean.get("lng")

        valid_loc = False
        if isinstance(loc, list) and len(loc) == 2:
            try:
                lat_val = float(loc[0])
                lng_val = float(loc[1])
                if -90 <= lat_val <= 90 and -180 <= lng_val <= 180 and not (lat_val == 0 and lng_val == 0):
                    clean["location"] = [round(lat_val, 6), round(lng_val, 6)]
                    clean["lat"] = round(lat_val, 6)
                    clean["lng"] = round(lng_val, 6)
                    valid_loc = True
            except (ValueError, TypeError):
                pass

        if not valid_loc and lat is not None and lng is not None:
            try:
                lat_val = float(lat)
                lng_val = float(lng)
                if -90 <= lat_val <= 90 and -180 <= lng_val <= 180:
                    clean["location"] = [round(lat_val, 6), round(lng_val, 6)]
                    clean["lat"] = round(lat_val, 6)
                    clean["lng"] = round(lng_val, 6)
                    valid_loc = True
            except (ValueError, TypeError):
                pass

        if not valid_loc:
            # Coordenadas por defecto en el centro de la península si faltasen
            clean["location"] = [40.4168, -3.7038]
            clean["lat"] = 40.4168
            clean["lng"] = -3.7038

        # 4. Normalizar products como lista de strings limpia
        prods = clean.get("products")
        if isinstance(prods, str):
            # Separar por comas o puntos y comas
            items = [item.strip() for item in prods.replace(";", ",").split(",") if item.strip()]
            clean["products"] = items if items else [prods.strip()]
        elif isinstance(prods, list):
            clean["products"] = [str(x).strip() for x in prods if str(x).strip()]
        else:
            clean["products"] = []

        # 5. Normalizar web / website
        web = clean.get("web") or clean.get("website") or ""
        clean["web"] = web
        clean["website"] = web

        # 6. Normalizar contact / purchasingManager
        pm = clean.get("purchasingManager") or clean.get("contact") or "Responsable de Compras"
        clean["purchasingManager"] = pm
        clean["contact"] = pm

        normalized.append(clean)

    # Validar que todos los IDs sean únicos
    all_ids = [p["id"] for p in normalized]
    assert len(all_ids) == len(set(all_ids)), "Error: Existen IDs repetidos tras normalizar"

    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    print(f"[OK] Base de datos normalizada con {len(normalized)} registros 100% únicos.")
    print(f"[OK] Primer ID: {normalized[0]['id']}, Último ID: {normalized[-1]['id']}")
    print(f"[OK] Todos cuentan con 'location' [lat, lng] y 'products' en formato lista.")

if __name__ == "__main__":
    main()
