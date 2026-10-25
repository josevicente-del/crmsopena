import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

# Rangos geográficos aproximados de cada CCAA en España
ZONE_BOUNDS = {
    'Andalucia': {'lat': (35.8, 38.9), 'lng': (-7.6, -1.5)},
    'Aragon': {'lat': (39.8, 43.0), 'lng': (-2.3, 0.9)},
    'Asturias': {'lat': (42.8, 43.8), 'lng': (-7.2, -4.4)},
    'Cantabria': {'lat': (42.7, 43.6), 'lng': (-4.9, -3.1)},
    'Castilla-La Mancha': {'lat': (38.0, 41.4), 'lng': (-5.5, -0.9)},
    'Castilla y Leon': {'lat': (40.0, 43.3), 'lng': (-7.1, -1.7)},
    'Cataluña': {'lat': (40.5, 42.9), 'lng': (0.1, 3.4)},
    'Comunidad de Madrid': {'lat': (39.8, 41.2), 'lng': (-4.6, -3.0)},
    'Comunidad Valenciana': {'lat': (37.8, 40.8), 'lng': (-1.6, 0.8)},
    'Extremadura': {'lat': (37.9, 40.5), 'lng': (-7.6, -4.6)},
    'Galicia': {'lat': (41.8, 43.8), 'lng': (-9.3, -6.6)},
    'La Rioja': {'lat': (41.9, 42.7), 'lng': (-3.2, -1.7)},
    'Navarra': {'lat': (41.9, 43.4), 'lng': (-2.6, -0.7)},
    'Pais Vasco': {'lat': (42.4, 43.5), 'lng': (-3.5, -1.7)},
    'Murcia': {'lat': (37.3, 38.8), 'lng': (-2.4, -0.6)},
    'Baleares': {'lat': (38.6, 40.1), 'lng': (1.1, 4.4)},
    'Canarias': {'lat': (27.5, 29.5), 'lng': (-18.2, -13.3)},
    'Portugal': {'lat': (36.9, 42.2), 'lng': (-9.6, -6.1)},
    'Francia': {'lat': (42.3, 51.1), 'lng': (-4.8, 8.3)},
    'Argelia': {'lat': (18.9, 37.1), 'lng': (-8.7, 12.0)}
}

# Verifiquemos si las coordenadas de cada prospecto caen dentro de su zona
out_of_bounds = []
for p in prospects:
    zone = p.get('zone', '').replace('Catalua', 'Cataluña')
    loc = p.get('location', [0, 0])
    lat, lng = loc[0], loc[1]
    
    if zone in ZONE_BOUNDS:
        b = ZONE_BOUNDS[zone]
        if not (b['lat'][0] <= lat <= b['lat'][1] and b['lng'][0] <= lng <= b['lng'][1]):
            out_of_bounds.append((p['id'], p['name'], zone, p.get('department'), loc))

print(f"Total empresas con coordenadas fuera de los límites de su 'zone': {len(out_of_bounds)}")
for o in out_of_bounds:
    print(f"[{o[0]}] {o[1]} | Zona declarada: {o[2]} | Dept: {o[3]} | Coordenadas: {o[4]}")
