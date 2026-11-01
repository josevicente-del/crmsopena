# -*- coding: utf-8 -*-
import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)
with open('src/data/excludedCompanies.json', 'r', encoding='utf-8') as f:
    excluded = json.load(f)

crm_names = [p['name'].lower().strip() for p in prospects]
ex_names = [e['name'].lower().strip() for e in excluded]

candidates = ['Grupsa', 'Secrisa', 'Diansa', 'Portrisa', 'Portalnor', 'Aluvisa', 'Jordao', 'Grau']

print("--- RESULTADOS ---")
for c in candidates:
    cl = c.lower()
    in_crm = [name for name in crm_names if cl in name]
    in_ex = [name for name in ex_names if cl in name]
    status = []
    if in_crm: status.append(f"EN CRM ({in_crm[0]})")
    if in_ex: status.append(f"EXCLUIDA ({in_ex[0]})")
    if not status: status.append("DISPONIBLE (NUEVA)")
    print(f"{c:15} -> {' | '.join(status)}")

