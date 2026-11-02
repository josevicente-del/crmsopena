# -*- coding: utf-8 -*-
import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

web_map = {
    'PROP-LEAD26-BATCH-900521': 'https://www.puntmobles.com',
    'PROP-LEAD26-BATCH-900522': 'https://www.lecinena.com',
    'PROP-LEAD26-BATCH-900523': 'https://www.siepandorra.com',
    'PROP-LEAD26-BATCH-900524': 'https://www.aluealuminios.com',
    'PROP-LEAD26-BATCH-900525': 'https://www.aluviper.es',
    'PROP-LEAD26-BATCH-900526': 'https://www.innovavista.es',
    'PROP-LEAD26-BATCH-900527': 'https://www.tmcomas.com',
    'PROP-LEAD26-BATCH-900528': 'https://www.ulmaarchitectural.com',
}

fixed_count = 0
for p in prospects:
    pid = p.get('id')
    if pid in web_map:
        p['web'] = web_map[pid]
        fixed_count += 1
    elif not p.get('web') or not isinstance(p.get('web'), str):
        p['web'] = 'No disponible'
        fixed_count += 1

with open('src/data/prospects.json', 'w', encoding='utf-8') as f:
    json.dump(prospects, f, indent=2, ensure_ascii=False)

print(f"Reparados {fixed_count} prospectos en src/data/prospects.json")

