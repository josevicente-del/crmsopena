# -*- coding: utf-8 -*-
import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)
with open('src/data/excludedCompanies.json', 'r', encoding='utf-8') as f:
    excluded = json.load(f)

crm_names = [p['name'].lower().strip() for p in prospects]
ex_names = [e['name'].lower().strip() for e in excluded]

candidates = [
    'Angel Mir', 'Portes Bisbal', 'Industrias Roper', 'Matz-Erreka', 'Erreka',
    'Portalum', 'Aludoors', 'Medva', 'Manusa', 'Collbaix', 'Grupo Collbaix',
    'Doorgate', 'Flexidoor', 'Portrisa', 'Master Ingenieros',
    'Gimenez Ganga', 'Saxun', 'Persax', 'Gradhermetic', 'Industrial Gradhermetic',
    'Toldos Gomez', 'Durmi', 'Industrias Durmi', 'Bandalux', 'Llaza',
    'Garcia Faura', 'Folcra', 'Riventi', 'Grupo Aluman', 'Inasus', 'Caamaño',
    'Martifer', 'Metaloviana', 'Candido Hermida', 'Alcongal', 'Hermet 10',
    'Puertas Padilla', 'Novoferm', 'Aprimatic', 'Aluplast', 'Deceuninck',
    'Kommerling', 'Cortizo', 'Exlabesa', 'Extrugasa'
]

print("--- RESULTADOS DE CRUCE ---")
for c in candidates:
    cl = c.lower()
    in_crm = [name for name in crm_names if cl in name]
    in_ex = [name for name in ex_names if cl in name]
    status = []
    if in_crm:
        status.append(f"EN CRM ({in_crm[0]})")
    if in_ex:
        status.append(f"EXCLUIDA ({in_ex[0]})")
    if not status:
        status.append("DISPONIBLE (NUEVA)")
    print(f"{c:25} -> {' | '.join(status)}")
