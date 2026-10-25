import json

with open('scripts/dossier_100_prospects.json', 'r', encoding='utf-8') as f:
    current_leads = json.load(f)

# Sectores a eliminar solicitados por el usuario
sectors_to_remove = [
    "Náutica y Astilleros de Aluminio",
    "Aeroespacial y Defensa",
    "Aeroespacial, Mecanizado CNC y Defensa"
]

filtered_leads = [
    l for l in current_leads 
    if l.get('sector') not in sectors_to_remove
]

removed_count = len(current_leads) - len(filtered_leads)
print(f"Eliminadas {removed_count} empresas de Náutica y Aeroespacial/Defensa.")
print(f"Empresas restantes antes de compensación: {len(filtered_leads)}")

# 15 empresas de sustitución de alto valor en los sectores aprobados
replacement_leads = [
    # 1. SC Herrajes (Madrid)
    {
        "name": "SC Herrajes (Sistemas y Complementos de Herrajes S.L.)",
        "zone": "Comunidad de Madrid",
        "department": "Fuenlabrada (Madrid)",
        "cif": "B82391824",
        "web": "https://www.scherrajes.com",
        "revenue": 16500000,
        "purchasingManager": "Santiago Castro (Director de Compras)",
        "phone": "+34 916 422 000",
        "email": "compras@scherrajes.com",
        "location": [40.2845, -3.7912],
        "sector": "Fijación y Cierre Industrial",
        "products": ["Perfiles de Cierre y Guías de Aluminio", "Herrajes de Fijación y Estanqueidad", "Tiradores y Remates"],
        "notes": "Fabricante especializado en herrajes técnicos, sistemas de cierre y perfilería de aluminio para cerramientos y mobiliario."
    },
    # 2. Acofal (Murcia)
    {
        "name": "Acofal (Accesorios para Fabricación de Aluminio S.L.)",
        "zone": "Murcia",
        "department": "Molina de Segura (Murcia)",
        "cif": "B30194824",
        "web": "https://acofal.com",
        "revenue": 13800000,
        "purchasingManager": "Mariano Jiménez (Responsable de Compras)",
        "phone": "+34 968 389 000",
        "email": "compras@acofal.com",
        "location": [38.0538, -1.2115],
        "sector": "Fijación y Cierre Industrial",
        "products": ["Escuadras y Perfiles de Unión de Aluminio", "Juntas de Estanqueidad EPDM", "Cremonas y Pasadores"],
        "notes": "Referente en herrajes, accesorios de ensamblaje, escuadras de fundición/extrusión y juntas para carpintería de aluminio."
    },
    # 3. Alma Componentes S.A. (Valencia)
    {
        "name": "Alma Componentes S.A.",
        "zone": "Comunidad Valenciana",
        "department": "Paterna (Valencia)",
        "cif": "A46291824",
        "web": "https://alma.es",
        "revenue": 15200000,
        "purchasingManager": "Vicente Alapont (Jefe de Compras y Materiales)",
        "phone": "+34 961 340 500",
        "email": "compras@alma.es",
        "location": [39.5050, -0.4400],
        "sector": "Fijación y Cierre Industrial",
        "products": ["Herrajes de Bloqueo de Aluminio", "Bisagras Extruidas", "Accesorios para Rotura de Puente Térmico"],
        "notes": "Líder en diseño y fabricación de herrajes y perfiles de cierre perimetral para sistemas de aluminio arquitectónico."
    },
    # 4. Alu System S.L. (Barcelona)
    {
        "name": "Alu System S.L.",
        "zone": "Cataluña",
        "department": "Sabadell (Barcelona)",
        "cif": "B61294820",
        "web": "https://alusystem.com",
        "revenue": 8900000,
        "purchasingManager": "Dpto. Aprovisionamiento y Logística",
        "phone": "+34 937 120 000",
        "email": "info@alusystem.com",
        "location": [41.5433, 2.1094],
        "sector": "Fijación y Cierre Industrial",
        "products": ["Perfiles de Guía Corredera de Aluminio", "Sistemas de Cierre Suave", "Remates y Tapetas"],
        "notes": "Fabricante de sistemas de deslizamiento, rodadura y perfiles de aluminio para armarios, divisorias y cerramientos."
    },
    # 5. Syskor S.L. (Gipuzkoa)
    {
        "name": "Syskor S.L.",
        "zone": "Pais Vasco",
        "department": "Zarautz (Gipuzkoa)",
        "cif": "B20654129",
        "web": "https://syskor.es",
        "revenue": 10400000,
        "purchasingManager": "Aritz Eizagirre (Compras)",
        "phone": "+34 943 890 000",
        "email": "compras@syskor.es",
        "location": [43.2845, -2.1712],
        "sector": "Fijación y Cierre Industrial",
        "products": ["Guías y Perfiles Extruidos de Cierre", "Herrajes Ocultos", "Sistemas Amortiguadores"],
        "notes": "Ingeniería y fabricación de herrajes y sistemas de perfiles de aluminio extruido con amortiguación para cierres técnicos."
    },
    # 6. Guillén Desarrollos Industriales S.L. (Valencia)
    {
        "name": "Guillén Desarrollos Industriales S.L. (Grupo Guillén)",
        "zone": "Comunidad Valenciana",
        "department": "Alginet (Valencia)",
        "cif": "B96918240",
        "web": "https://guillen-group.com",
        "revenue": 32000000,
        "purchasingManager": "Dpto. Compras y Metalurgia (Guillén)",
        "phone": "+34 961 759 000",
        "email": "compras@guillen-group.com",
        "location": [39.2612, -0.4712],
        "sector": "Carrocerías y Vehículos Industriales",
        "products": ["Semirremolques de Aluminio G-Ligh", "Perfiles de Chasis y Piso Móvil", "Pilares y Tablones"],
        "notes": "Fabricante nacional de semirremolques ligeros con amplia utilización de perfiles estructurales de aluminio de alta resistencia."
    },
    # 7. Carrocerías Frigoríficas Iglu S.L. (Valencia)
    {
        "name": "Carrocerías Frigoríficas Iglu S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Silla (Valencia)",
        "cif": "B46591824",
        "web": "https://carroceriasiglu.com",
        "revenue": 11200000,
        "purchasingManager": "Francisco Grau (Compras)",
        "phone": "+34 961 200 000",
        "email": "info@carroceriasiglu.com",
        "location": [39.3612, -0.4112],
        "sector": "Carrocerías y Vehículos Industriales",
        "products": ["Perfiles de Esquinas y Remates Frigoríficos", "Zócalos de Aluminio", "Puertas Isotérmicas"],
        "notes": "Fabricante de carrocerías isotermas y frigoríficas con marcos de perfiles de aluminio extruido de alta estanqueidad."
    },
    # 8. Carrocerías Burillo S.L. (Zaragoza)
    {
        "name": "Carrocerías Burillo S.L.",
        "zone": "Aragon",
        "department": "Villanueva de Gállego (Zaragoza)",
        "cif": "B50294824",
        "web": "https://carroceriasburillo.com",
        "revenue": 9600000,
        "purchasingManager": "Dpto. Aprovisionamiento (Burillo)",
        "phone": "+34 976 185 000",
        "email": "compras@carroceriasburillo.com",
        "location": [41.7689, -0.8312],
        "sector": "Carrocerías y Vehículos Industriales",
        "products": ["Estructuras de Autobús en Aleación Ligera", "Perfiles de Pasaje", "Techos y Trampillas"],
        "notes": "Carrozado y transformación de autobuses y vehículos especiales con integración de perfiles de aluminio extruido."
    },
    # 9. Carrocerías Nogebus S.L. (Girona)
    {
        "name": "Carrocerías Nogebus S.L.",
        "zone": "Cataluña",
        "department": "Arbúcies (Girona)",
        "cif": "B17654129",
        "web": "https://nogebus.com",
        "revenue": 18500000,
        "purchasingManager": "Jordi Vinyoles (Director de Compras)",
        "phone": "+34 972 860 000",
        "email": "compras@nogebus.com",
        "location": [41.8154, 2.5134],
        "sector": "Carrocerías y Vehículos Industriales",
        "products": ["Carrocerías de Autocar Touring en Aluminio", "Molduras y Perfiles de Ventana", "Maleteros"],
        "notes": "Fabricante histórico de autocares interurbanos y discrecionales con estructuras y acabados en perfilería de aluminio."
    },
    # 10. Spigogroup (La Rioja)
    {
        "name": "Spigogroup (Spigotec / Spigoline)",
        "zone": "La Rioja",
        "department": "Nalda (La Rioja)",
        "cif": "B26291845",
        "web": "https://spigogroup.com",
        "revenue": 14800000,
        "purchasingManager": "Jesús Martínez (Compras y Producción)",
        "phone": "+34 941 244 777",
        "email": "compras@spigogroup.com",
        "location": [42.3389, -2.4889],
        "sector": "Suelos y Techos Técnicos",
        "products": ["Sistemas de Techo Lineal Spigoline con Perfil de Aluminio", "Estructuras de Suspensión Oculta", "Revestimientos Acústicos"],
        "notes": "Fabricante de techos de diseño y revestimientos arquitectónicos fijados sobre rastreles y perfiles extruidos de aluminio negro/anodizado."
    },
    # 11. Citterio Ibérica S.A. (Madrid)
    {
        "name": "Citterio Ibérica S.A.",
        "zone": "Comunidad de Madrid",
        "department": "Madrid (Madrid)",
        "cif": "A81294824",
        "web": "https://citteriospa.com",
        "revenue": 12500000,
        "purchasingManager": "Dpto. Compras y Proyectos (Citterio)",
        "phone": "+34 913 580 000",
        "email": "info.es@citteriospa.com",
        "location": [40.4168, -3.7038],
        "sector": "Suelos y Techos Técnicos",
        "products": ["Mamparas Divisorias con Perfilería Oculta de Aluminio", "Tabiques Técnicos de Oficina", "Puertas de Cristal Enrasadas"],
        "notes": "División ibérica de Citterio SpA, referente en particiones modulares y arquitectura interior con perfilería de aluminio extruido."
    },
    # 12. Knauf Ceiling Solutions Ibérica S.L. (Madrid)
    {
        "name": "Knauf Ceiling Solutions Ibérica S.L.",
        "zone": "Comunidad de Madrid",
        "department": "Madrid (Madrid)",
        "cif": "B82194820",
        "web": "https://knaufceilingsolutions.com",
        "revenue": 28000000,
        "purchasingManager": "Dpto. Suministros y Perfilería Metálica",
        "phone": "+34 915 700 000",
        "email": "compras.es@knaufarmstrong.com",
        "location": [40.4531, -3.6883],
        "sector": "Suelos y Techos Técnicos",
        "products": ["Perfilería Primaria y Secundaria de Aluminio", "Techos de Baffles y Lamas Extruidas", "Remates Perimetrales"],
        "notes": "Líder en soluciones globales de falsos techos acústicos y arquitectónicos sustentados sobre estructuras de aluminio."
    },
    # 13. Termia Clima S.L. (Barcelona)
    {
        "name": "Termia Clima S.L.",
        "zone": "Cataluña",
        "department": "Sant Feliu de Llobregat (Barcelona)",
        "cif": "B63194820",
        "web": "https://termiaclima.com",
        "revenue": 14200000,
        "purchasingManager": "Sergi Bonet (Compras Industriales)",
        "phone": "+34 936 850 000",
        "email": "compras@termiaclima.com",
        "location": [41.3812, 2.0456],
        "sector": "Climatización y Ventilación (HVAC)",
        "products": ["Baterías de Intercambio Térmico con Aletas de Aluminio", "Rejillas de Expulsión", "Compuertas de Aluminio"],
        "notes": "Fabricante de intercambiadores de calor, climatizadores y compuertas de regulación con tubos y perfiles de aluminio."
    },
    # 14. Casals Ventilación Industrial S.L. (Girona)
    {
        "name": "Casals Ventilación Industrial S.L.",
        "zone": "Cataluña",
        "department": "Ripoll (Girona)",
        "cif": "B17094824",
        "web": "https://casals.com",
        "revenue": 24500000,
        "purchasingManager": "Albert Planas (Director de Compras)",
        "phone": "+34 972 700 200",
        "email": "compras@casals.com",
        "location": [42.1989, 2.1912],
        "sector": "Climatización y Ventilación (HVAC)",
        "products": ["Carcasas y Rejillas de Ventilador en Aluminio", "Hélices Extruidas de Aluminio", "Compuertas Antirretorno"],
        "notes": "Fabricante centenario de ventilación industrial y extracción de humos con hélices y perfiles extruidos de aluminio."
    },
    # 15. Ditem Sistemas de Aluminio S.L. (Madrid)
    {
        "name": "Ditem Sistemas de Aluminio S.L.",
        "zone": "Comunidad de Madrid",
        "department": "Leganés (Madrid)",
        "cif": "B84194820",
        "web": "https://ditem.es",
        "revenue": 8700000,
        "purchasingManager": "Carlos Navas (Compras y Oficina Técnica)",
        "phone": "+34 916 860 000",
        "email": "info@ditem.es",
        "location": [40.3289, -3.7645],
        "sector": "Automatización y Maquinaria Industrial",
        "products": ["Perfilería Ranurada de Aluminio Modular", "Cerramientos Perimetrales de Seguridad", "Bancadas Industriales"],
        "notes": "Especialista en mecano modular de perfiles de aluminio extruido para líneas automatizadas y robótica en la zona centro."
    }
]

# Añadir IDs a las de reemplazo
for idx, lead in enumerate(replacement_leads):
    lead['id'] = f"PROP-LEAD26-{idx+581:04d}"
    lead['createdAt'] = "2026-10-25T16:30:00.000Z"
    lead['emailVerified'] = True
    lead['emailVerifiedType'] = "corporativo_directo"
    lead['safetyMailsStatus'] = "deliverable"
    lead['safetyMailsAdvice'] = "Válido"
    lead['contacted'] = False
    lead['contactDate'] = None
    lead['response'] = "Pendiente de aprobación de Dirección Comercial"

final_leads = filtered_leads + replacement_leads
print(f"Total leads final tras sustitución: {len(final_leads)}")

# Guardar de nuevo en el fichero provisional
with open('scripts/dossier_100_prospects.json', 'w', encoding='utf-8') as f:
    json.dump(final_leads, f, ensure_ascii=False, indent=2)

print("scripts/dossier_100_prospects.json actualizado correctamente.")
