# -*- coding: utf-8 -*-
"""
=============================================================================
Módulo: remove_requested_companies.py
Propósito: Eliminación selectiva de las 5 empresas solicitadas por el usuario:
  1. Cubinor Construcciones Deportivas S.L. (B33917824)
  2. Oleohidráulica Ferruz S.A. (Grupo Ferruz) (A50027069)
  3. Mitjavila España S.A. (A17169129)
  4. Siplan S.L. (B41584442)
  5. Aluminios Galisur S.L. (B41257460)

Acciones ejecutadas:
  - Eliminación de src/data/prospects.json.
  - Registro en src/data/excludedCompanies.json (lista negra permanente).
  - Reindexación secuencial uniforme de IDs (PROP-LEAD26-0001 a 0627).
=============================================================================
"""

import json
import os
import sys
from datetime import datetime, timezone

def main():
    prospects_path = os.path.join("src", "data", "prospects.json")
    excluded_path = os.path.join("src", "data", "excludedCompanies.json")

    if not os.path.exists(prospects_path):
        print(f"[ERROR] Archivo no encontrado: {prospects_path}")
        sys.exit(1)

    with open(prospects_path, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    print(f"[INFO] Total prospectos actuales: {len(prospects)}")

    # CIFs y términos identificadores de las 5 empresas a eliminar
    cifs_a_eliminar = {
        "B33917824", # Cubinor Construcciones Deportivas S.L.
        "A50027069", # Oleohidráulica Ferruz S.A. (Grupo Ferruz)
        "A17169129", # Mitjavila España S.A.
        "B41584442", # Siplan S.L.
        "B41257460"  # Aluminios Galisur S.L.
    }

    nombres_clave = [
        "cubinor",
        "ferruz",
        "mitjavila",
        "siplan",
        "galisur"
    ]

    empresas_eliminadas = []
    prospectos_filtrados = []

    for p in prospects:
        cif_norm = str(p.get("cif", "")).strip().upper()
        name_low = str(p.get("name", "")).strip().lower()

        debe_eliminar = False
        motivo = ""

        if cif_norm in cifs_a_eliminar:
            debe_eliminar = True
            motivo = f"Coincidencia exacta de CIF ({cif_norm})"
        else:
            for term in nombres_clave:
                if term in name_low:
                    debe_eliminar = True
                    motivo = f"Coincidencia de nombre por término '{term}'"
                    break

        if debe_eliminar:
            empresas_eliminadas.append(p)
            print(f"[BAJA] Eliminando: {p.get('name')} | CIF: {p.get('cif')} | Motivo: {motivo}")
        else:
            prospectos_filtrados.append(p)

    print(f"\n[INFO] Total eliminadas: {len(empresas_eliminadas)}")
    print(f"[INFO] Total resultantes antes de reindexar: {len(prospectos_filtrados)}")

    # Reindexar IDs secuenciales de forma limpia y homogénea
    for idx, p in enumerate(prospectos_filtrados):
        p["id"] = f"PROP-LEAD26-{(idx + 1):04d}"

    # Guardar prospects.json actualizado
    with open(prospects_path, "w", encoding="utf-8") as f:
        json.dump(prospectos_filtrados, f, ensure_ascii=False, indent=2)

    print(f"[OK] {prospects_path} guardado con éxito. Total registros: {len(prospectos_filtrados)}")

    # Actualizar excludedCompanies.json para evitar reincorporación
    if os.path.exists(excluded_path):
        with open(excluded_path, "r", encoding="utf-8") as f:
            excluded = json.load(f)
    else:
        excluded = []

    excluded_cifs = {e.get("cif", "").strip().upper() for e in excluded if e.get("cif")}
    now_iso = datetime.now(timezone.utc).isoformat()

    for p in empresas_eliminadas:
        cif_p = str(p.get("cif", "")).strip().upper()
        if cif_p and cif_p not in excluded_cifs:
            excluded.append({
                "id": p.get("id"),
                "name": p.get("name"),
                "cif": cif_p,
                "domain": p.get("web") or p.get("website") or "",
                "web": p.get("web") or p.get("website") or "",
                "reason": "Eliminada por solicitud expresa de Dirección Comercial",
                "excludedAt": now_iso,
                "notes": "Baja definitiva del CRM por indicación expresa del usuario."
            })
            excluded_cifs.add(cif_p)

    with open(excluded_path, "w", encoding="utf-8") as f:
        json.dump(excluded, f, ensure_ascii=False, indent=2)

    print(f"[OK] {excluded_path} actualizado con las nuevas bajas registradas.")

if __name__ == "__main__":
    main()
