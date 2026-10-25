import json
import re

cif_provinces = {
    '01': ('Alava', 'Pais Vasco'),
    '02': ('Albacete', 'Castilla-La Mancha'),
    '03': ('Alicante', 'Comunidad Valenciana'),
    '04': ('Almeria', 'Andalucia'),
    '05': ('Avila', 'Castilla y Leon'),
    '06': ('Badajoz', 'Extremadura'),
    '07': ('Baleares', 'Baleares'),
    '08': ('Barcelona', 'Cataluña'),
    '09': ('Burgos', 'Castilla y Leon'),
    '10': ('Caceres', 'Extremadura'),
    '11': ('Cadiz', 'Andalucia'),
    '12': ('Castellon', 'Comunidad Valenciana'),
    '13': ('Ciudad Real', 'Castilla-La Mancha'),
    '14': ('Cordoba', 'Andalucia'),
    '15': ('A Coruña', 'Galicia'),
    '16': ('Cuenca', 'Castilla-La Mancha'),
    '17': ('Girona', 'Cataluña'),
    '18': ('Granada', 'Andalucia'),
    '19': ('Guadalajara', 'Castilla-La Mancha'),
    '20': ('Gipuzkoa', 'Pais Vasco'),
    '21': ('Huelva', 'Andalucia'),
    '22': ('Huesca', 'Aragon'),
    '23': ('Jaen', 'Andalucia'),
    '24': ('Leon', 'Castilla y Leon'),
    '25': ('Lleida', 'Cataluña'),
    '26': ('La Rioja', 'La Rioja'),
    '27': ('Lugo', 'Galicia'),
    '28': ('Madrid', 'Comunidad de Madrid'),
    '29': ('Malaga', 'Andalucia'),
    '30': ('Murcia', 'Murcia'),
    '31': ('Navarra', 'Navarra'),
    '32': ('Ourense', 'Galicia'),
    '33': ('Asturias', 'Asturias'),
    '34': ('Palencia', 'Castilla y Leon'),
    '35': ('Las Palmas', 'Canarias'),
    '36': ('Pontevedra', 'Galicia'),
    '37': ('Salamanca', 'Castilla y Leon'),
    '38': ('Santa Cruz de Tenerife', 'Canarias'),
    '39': ('Cantabria', 'Cantabria'),
    '40': ('Segovia', 'Castilla y Leon'),
    '41': ('Sevilla', 'Andalucia'),
    '42': ('Soria', 'Castilla y Leon'),
    '43': ('Tarragona', 'Cataluña'),
    '44': ('Teruel', 'Aragon'),
    '45': ('Toledo', 'Castilla-La Mancha'),
    '46': ('Valencia', 'Comunidad Valenciana'),
    '47': ('Valladolid', 'Castilla y Leon'),
    '48': ('Bizkaia', 'Pais Vasco'),
    '49': ('Zamora', 'Castilla y Leon'),
    '50': ('Zaragoza', 'Aragon'),
}

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print(f"Total prospectos: {len(prospects)}")

issues = []

for p in prospects:
    pid = p.get('id')
    name = p.get('name')
    zone = p.get('zone', '')
    dept = p.get('department', '')
    cif = p.get('cif', '')
    loc = p.get('location', [0, 0])
    web = p.get('web', '')
    notes = p.get('notes', '')

    cif_match = re.search(r'^[A-Z](\d{2})', cif)
    cif_prov = None
    cif_ccaa = None
    if cif_match:
        code = cif_match.group(1)
        if code in cif_provinces:
            cif_prov, cif_ccaa = cif_provinces[code]

    # Comprobar si zone discrepa con cif_ccaa
    mismatch_cif = False
    if cif_ccaa:
        # normalizar nombres de zonas
        norm_zone = zone.replace('Catalua', 'Cataluña').replace('Madrid', 'Comunidad de Madrid') if zone == 'Madrid' else zone.replace('Catalua', 'Cataluña')
        if norm_zone != cif_ccaa:
            mismatch_cif = True

    issues.append({
        'id': pid,
        'name': name,
        'zone': zone,
        'dept': dept,
        'cif': cif,
        'cif_prov': cif_prov,
        'cif_ccaa': cif_ccaa,
        'mismatch_cif': mismatch_cif,
        'loc': loc,
        'web': web,
        'notes': notes[:80]
    })

mismatches = [i for i in issues if i['mismatch_cif']]
print(f"Total con discrepancia entre CIF y Zone asignada: {len(mismatches)}")
for m in mismatches:
    print(f"[{m['id']}] {m['name']} | CIF: {m['cif']} ({m['cif_prov']} -> {m['cif_ccaa']}) vs Zone: '{m['zone']}' | Dept: {m['dept']} | Loc: {m['loc']}")
