# -*- coding: utf-8 -*-
import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)
with open('src/data/excludedCompanies.json', 'r', encoding='utf-8') as f:
    excluded = json.load(f)

crm_names = [p['name'].lower().strip() for p in prospects]
crm_cifs = [p.get('cif', '').lower().strip() for p in prospects if p.get('cif')]
ex_names = [e['name'].lower().strip() for e in excluded]

candidates = [
    'Kauma', 'C3 Systems', 'Seeglass', 'Allglass', 'Todocristal', 'Lumon',
    'Teyco', 'Industrias Teyco', 'Acristalia', 'Glaxior', 'Dvelas', 'Habitex',
    'Alutecnic', 'Pergolux', 'Industrias Roper', 'Roper', 'Garcia Faura',
    'Folcra', 'Caamaño', 'Kimak', 'Candido Hermida', 'Flexidoor', 'Doorgate',
    'Master Ingenieros', 'Medva', 'Toldos Gomez', 'Aludoors', 'Portes Bisbal',
    'Aluminios Vallirana', 'Centro Alum', 'Alumed'
]

print("--- RESULTADOS DE CRUCE NUEVOS CANDIDATOS ---")
available = []
for c in candidates:
    cl = c.lower()
    in_crm = [name for name in crm_names if cl in name]
    in_ex = [name for name in ex_names if cl in name]
    status = []
    if in_crm: status.append(f"EN CRM ({in_crm[0]})")
    if in_ex: status.append(f"EXCLUIDA ({in_ex[0]})")
    if not status:
        status.append("DISPONIBLE (NUEVA)")
        available.append(c)
    print(f"{c:22} -> {' | '.join(status)}")

print(f"\nTotal disponibles para propuesta: {len(available)}")

