import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

found = False
for p in prospects:
    if p.get('id') == 'PROP-APPR-0407' or 'durmi' in p.get('name', '').lower() or 'A08466187' in str(p.get('cif', '')).upper():
        found = True
        p['name'] = 'Durmi - Arquitectura Bioclimática y Protección Solar (Industrias Durmi S.A.)'
        p['web'] = 'https://durmi.com/'
        p['cif'] = 'A08466187'
        p['zone'] = 'Cataluña'
        p['department'] = 'Sant Pere de Ribes (Barcelona)'
        p['revenue'] = 6800000
        p['purchasingManager'] = 'Jordi Rubio (Responsable Técnico y Compras)'
        p['phone'] = '+34 938 932 754'
        p['email'] = 'compras@durmi.com'
        p['location'] = [41.2580, 1.7645]
        p['sector'] = 'Pérgolas y Protección Solar'
        p['products'] = [
            'Lamas Bioclimáticas Orientables',
            'Celosías y Mallorquinas de Aluminio Extruido',
            'Perfiles Estructurales para Pérgolas Bioclimáticas',
            'Sistemas de Guías y Montantes'
        ]
        p['notes'] = 'Referente en celosías, lamas orientables y pérgolas bioclimáticas de aluminio extruido para arquitectura bioclimática y protección solar. Fabricación a medida para proyectos residenciales y singulares.'
        p['safetyMailsStatus'] = 'deliverable'
        p['safetyMailsAdvice'] = 'Válido'
        p['directMxStatus'] = 'mx_valid'
        p['emailVerified'] = True
        p['emailVerifiedType'] = 'corporativo_directo'
        print(f"-> Actualizado prospecto Durmi (ID: {p['id']})")
        break

assert found, "No se encontró el prospecto Durmi para actualizar"

with open('src/data/prospects.json', 'w', encoding='utf-8') as f:
    json.dump(prospects, f, indent=2, ensure_ascii=False)

print(f"Total prospectos en archivo: {len(prospects)}")
print("src/data/prospects.json guardado con éxito.")
