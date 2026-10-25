with open('src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if any(k in line for k in ["activeTab === 'route'", 'Planificador de Rutas', 'RoutingMapController', 'selectedZone', 'routeClients']):
        print(f"{idx+1}: {line.strip()[:110]}")
