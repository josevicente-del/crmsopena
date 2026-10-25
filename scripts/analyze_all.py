import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print(f"Total prospectos: {len(prospects)}")

# Mapeo de prefijos CIF a provincia y CCAA oficial
CIF_MAP = {
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

# Analizar todas las empresas
results = []
for p in prospects:
    cif = p.get('cif', '')
    prefix = cif[1:3] if len(cif) >= 3 and cif[1:3].isdigit() else None
    cif_prov, cif_ccaa = CIF_MAP.get(prefix, (None, None))
    
    zone = p.get('zone', '')
    dept = p.get('department', '')
    name = p.get('name', '')
    loc = p.get('location', [0, 0])
    
    results.append({
        'id': p.get('id'),
        'name': name,
        'zone': zone,
        'dept': dept,
        'cif': cif,
        'cif_prov': cif_prov,
        'cif_ccaa': cif_ccaa,
        'loc': loc,
        'notes': p.get('notes', ''),
        'web': p.get('web', '')
    })

# Guardar en json para análisis detallado
with open('scripts/all_prospects_analyzed.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Analizados 480 prospectos y guardados en scripts/all_prospects_analyzed.json")
