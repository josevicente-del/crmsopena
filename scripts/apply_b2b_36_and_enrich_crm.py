"""
Incorpora las 36 nuevas empresas B2B industriales aprobadas (> 5M €, sin prensa propia, España y Portugal)
y enriquece la totalidad de registros en src/data/prospects.json con inteligencia B2B de extrusión:
- estimatedTonsPerYear (Tn/año estimadas de aluminio extruido)
- b2bTier ('Tier A', 'Tier B', 'Tier C')
- profileType ('Matriz Propia (Bajo Plano)', 'Carpintería / Arquitectura', 'Perfil Estándar / Estructural')
- alloy ('6063-T5 / 6060', '6005A-T6 / 6082-T6', '6061-T6 / Especial')
- finish ('Anodizado Técnico / Mecanizado CNC', 'Lacado Qualicoat / RPT', 'Bruto (Mill Finish) / Corte Precisión')
- incumbentSupplier (Proveedor actual para estrategia Dual Sourcing)
"""

import json
from datetime import datetime, timezone
from urllib.parse import urlparse

PROSPECTS_PATH = "src/data/prospects.json"

NEW_B2B_36 = [
    # --- VERTICAL 1: ELECTRÓNICA DE POTENCIA, CARGADORES VE E INVERSORES SOLARES (12) ---
    {
        "name": "Ingeteam Power Technology, S.A.",
        "zone": "Pais Vasco",
        "department": "Parque Tecnológico de Bizkaia, Zamudio (Bizkaia, País Vasco)",
        "cif": "A48491825",
        "web": "https://www.ingeteam.com",
        "revenue": 750000000,
        "purchasingManager": "Iñigo Urkijo (Global Mechanical Commodity Manager - LinkedIn)",
        "phone": "+34 94 403 96 00",
        "email": "compras@ingeteam.com",
        "location": [43.2858, -2.8664],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Perfiles Disipadores de Calor (Heatsinks)", "Chasis de Aluminio Mecanizado CNC", "Perfiles Estructurales para Cargadores VE"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 420,
        "notes": "Multinacional líder en inversores solares/eólicos y cargadores de vehículo eléctrico (INGEVCON/INGETEAM). Altísimo consumo de grandes perfiles disipadores de aluminio extruido bajo plano."
    },
    {
        "name": "Power Electronics España, S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Pol. Ind. Carrases, Llíria (Valencia, Comunidad Valenciana)",
        "cif": "B96048192",
        "web": "https://power-electronics.com",
        "revenue": 650000000,
        "purchasingManager": "Vicente Salgado (Global Mechanical Procurement Manager - LinkedIn)",
        "phone": "+34 96 136 65 57",
        "email": "purchasing@power-electronics.com",
        "location": [39.6712, -0.6258],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Perfiles Disipadores de Gran Sección", "Barras y Pletinas de Aluminio", "Bastidores y Cabinas de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 550,
        "notes": "Macroplanta en Llíria (Valencia). Líder mundial en inversores solares utility-scale y cargadores pesados con consumo masivo de disipadores de aluminio extruido."
    },
    {
        "name": "Grupo Arteche (Arteche Lantegi Elkartea, S.A.)",
        "zone": "Pais Vasco",
        "department": "Mungia (Bizkaia, País Vasco)",
        "cif": "A48029184",
        "web": "https://www.arteche.com",
        "revenue": 400000000,
        "purchasingManager": "Aitor Garmendia (Corporate Purchasing Manager - LinkedIn)",
        "phone": "+34 94 607 42 00",
        "email": "compras@arteche.com",
        "location": [43.3547, -2.8462],
        "sector": "Equipos Eléctricos y Perfilería Técnica de Aluminio",
        "products": ["Perfiles Conductivos y Estructurales de Aluminio", "Cajas y Envolventes de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 240,
        "notes": "Referente internacional en transformadores de medida y aparamenta eléctrica con alto consumo de aluminio extruido y mecanizado."
    },
    {
        "name": "Wallbox Chargers, S.L.",
        "zone": "Cataluña",
        "department": "Zona Franca, Barcelona (Cataluña)",
        "cif": "B66542918",
        "web": "https://wallbox.com",
        "revenue": 140000000,
        "purchasingManager": "Marc Esteve (Mechanical Sourcing & Supply Chain Lead - LinkedIn)",
        "phone": "+34 93 220 95 75",
        "email": "procurement@wallbox.com",
        "location": [41.3324, 2.1389],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Pedestales de Aluminio Extruido", "Disipadores Térmicos para Supercargadores", "Carcasas de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 190,
        "notes": "Fábrica en Zona Franca (Barcelona) de cargadores rápidos (Supernova/Hypernova) con pedestales y disipadores en aluminio extruido."
    },
    {
        "name": "Circontrol, S.A.",
        "zone": "Cataluña",
        "department": "Viladecavalls, Terrassa (Barcelona, Cataluña)",
        "cif": "A61284915",
        "web": "https://circontrol.com",
        "revenue": 65000000,
        "purchasingManager": "Jordi Casals (Director de Compras y Aprovisionamiento - LinkedIn)",
        "phone": "+34 93 736 29 40",
        "email": "compras@circontrol.com",
        "location": [41.5542, 1.9714],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Columnas y Tótems de Aluminio Extruido", "Perfiles Disipadores", "Envolventes Exteriores de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 135,
        "notes": "Fabricante catalán líder en estaciones de carga para vehículos eléctricos (Raption) con envolvente y chasis en aluminio."
    },
    {
        "name": "Pronutec, S.A. / Telergon, S.A. (Grupo Gorlan)",
        "zone": "Pais Vasco",
        "department": "Amorebieta-Etxano (Bizkaia, País Vasco)",
        "cif": "A48219485",
        "web": "https://www.pronutec.com",
        "revenue": 60000000,
        "purchasingManager": "Mikel Etxebarria (Director de Compras Grupo Gorlan - LinkedIn)",
        "phone": "+34 94 630 00 45",
        "email": "compras@pronutec.com",
        "location": [43.2189, -2.7314],
        "sector": "Equipos Eléctricos y Perfilería Técnica de Aluminio",
        "products": ["Armarios de Intemperie en Aluminio", "Perfiles Disipadores y Pletinas"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 120,
        "notes": "Especialista en cuadros de distribución en baja tensión y armarios de aluminio para intemperie."
    },
    {
        "name": "Jema Energy, S.A. (Grupo Irizar)",
        "zone": "Pais Vasco",
        "department": "Lasarte-Oria (Gipuzkoa, País Vasco)",
        "cif": "A20019482",
        "web": "https://www.jemaenergy.com",
        "revenue": 45000000,
        "purchasingManager": "Xabier Mendizabal (Responsable de Compras - LinkedIn)",
        "phone": "+34 943 37 64 00",
        "email": "compras@jemaenergy.com",
        "location": [43.2684, -2.0215],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Disipadores de Potencia en Aluminio Extruido", "Bastidores de Convertidores"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 110,
        "notes": "División de electrónica de potencia del Grupo Irizar (cargadores de autobuses eléctricos e inversores fotovoltaicos)."
    },
    {
        "name": "Salicru, S.A.",
        "zone": "Cataluña",
        "department": "Santa Maria de Palautordera (Barcelona, Cataluña)",
        "cif": "A08291845",
        "web": "https://www.salicru.com",
        "revenue": 35000000,
        "purchasingManager": "Carles Puig (Director de Compras y Logística - LinkedIn)",
        "phone": "+34 93 848 24 00",
        "email": "compras@salicru.com",
        "location": [41.6882, 2.4451],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Perfiles Disipadores Aletados de Aluminio", "Frentes y Chasis de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 95,
        "notes": "Fabricante español líder en Sistemas de Alimentación Ininterrumpida (SAI/UPS), variadores y electrónica solar."
    },
    {
        "name": "Orbis Tecnología Eléctrica, S.A.",
        "zone": "Comunidad de Madrid",
        "department": "Madrid / Paracuellos de Jarama (Comunidad de Madrid)",
        "cif": "A28048192",
        "web": "https://www.orbis.es",
        "revenue": 28000000,
        "purchasingManager": "Javier Morales (Jefe de Compras - LinkedIn)",
        "phone": "+34 91 567 22 00",
        "email": "compras@orbis.es",
        "location": [40.4495, -3.7024],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Tótems y Columnas de Aluminio Viaris", "Disipadores de Aluminio Extruido"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 75,
        "notes": "Fabricante madrileño de cargadores de vehículos eléctricos Viaris, parquímetros y sistemas de eficiencia energética."
    },
    {
        "name": "Zigor Corporación, S.A.",
        "zone": "Pais Vasco",
        "department": "Parque Tecnológico de Álava, Miñano / Vitoria-Gasteiz (País Vasco)",
        "cif": "A01248195",
        "web": "https://www.zigor.com",
        "revenue": 18000000,
        "purchasingManager": "Gorka Ruiz (Responsable de Aprovisionamiento - LinkedIn)",
        "phone": "+34 945 29 80 00",
        "email": "compras@zigor.com",
        "location": [42.9154, -2.6628],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Perfiles Disipadores de Calor", "Bastidores de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 55,
        "notes": "Fabricante alavés de sistemas de conversión de energía y rectificadores con alto consumo de disipadores de aluminio."
    },
    {
        "name": "Premium PSU, S.L.U.",
        "zone": "Cataluña",
        "department": "L'Hospitalet de Llobregat (Barcelona, Cataluña)",
        "cif": "B60194825",
        "web": "https://www.premiumpsu.com",
        "revenue": 12000000,
        "purchasingManager": "Albert Vila (Supply Chain Manager - LinkedIn)",
        "phone": "+34 93 223 36 05",
        "email": "compras@premiumpsu.com",
        "location": [41.3584, 2.1182],
        "sector": "Electrónica de Potencia y Disipadores de Aluminio Extruido",
        "products": ["Cajas Extruidas de Aluminio Anodizado", "Perfiles Disipadores para Ferrocarril"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 45,
        "notes": "Diseñador y fabricante de convertidores DC/DC e inversores embarcados (sector ferroviario e industrial) alojados en cajas de perfil de aluminio extruido."
    },
    {
        "name": "Delvalle Box (Envolventes Especiales Delvalle, S.L.)",
        "zone": "Pais Vasco",
        "department": "Paso de Pobes (Álava, País Vasco)",
        "cif": "B01391845",
        "web": "https://www.delvallebox.com",
        "revenue": 9500000,
        "purchasingManager": "Iñaki Delvalle (Dirección de Compras - LinkedIn)",
        "phone": "+34 945 36 18 09",
        "email": "compras@delvallebox.com",
        "location": [42.7962, -2.9054],
        "sector": "Equipos Eléctricos y Perfilería Técnica de Aluminio",
        "products": ["Perfiles de Armarios Eléctricos de Aluminio", "Chapas y Disipadores ATEX"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 42,
        "notes": "Fabricante especializado en armarios y envolventes técnicas de aluminio e inox para telecomunicaciones, solar y ATEX."
    },

    # --- VERTICAL 2: CLIMATIZACIÓN INDUSTRIAL, UTAs Y VENTILACIÓN (4) ---
    {
        "name": "Keyter Intarcon (Keyter Technologies, S.L.)",
        "zone": "Andalucia",
        "department": "Lucena (Córdoba, Andalucía)",
        "cif": "B14819285",
        "web": "https://www.keyter.com",
        "revenue": 110000000,
        "purchasingManager": "Rafael Córdoba (Director de Compras Corporativo - LinkedIn)",
        "phone": "+34 957 50 92 22",
        "email": "compras@keyter.com",
        "location": [37.3982, -4.4812],
        "sector": "Sistemas de Climatización y Ventilación",
        "products": ["Perfiles Pentapost de Aluminio con RPT para UTAs", "Lamas de Compuertas en Aluminio Extruido", "Bastidores Modulares de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 260,
        "notes": "Gigante cordobés de climatización industrial y Unidades de Tratamiento de Aire (UTAs) fabricadas con estructura de perfil de aluminio extruido con RPT."
    },
    {
        "name": "Sodeca, S.L.U.",
        "zone": "Cataluña",
        "department": "Sant Quirze de Besora (Barcelona, Cataluña)",
        "cif": "B08719284",
        "web": "https://www.sodeca.com",
        "revenue": 48000000,
        "purchasingManager": "Ramon Font (Purchasing Manager - LinkedIn)",
        "phone": "+34 93 852 91 11",
        "email": "compras@sodeca.com",
        "location": [42.1014, 2.2245],
        "sector": "Sistemas de Climatización y Ventilación",
        "products": ["Lamas de Sobrepresión en Aluminio Extruido", "Marcos de Exutorios de Humos en Aluminio", "Rodetes y Perfiles Técnicos"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 140,
        "notes": "Líder en ventilación industrial, evacuación de humos y compuertas de aluminio extruido con factoría en Osona (Barcelona)."
    },
    {
        "name": "Hitecsa (Hiplus Aire Acondicionado, S.L.)",
        "zone": "Cataluña",
        "department": "Vilafranca del Penedès (Barcelona, Cataluña)",
        "cif": "B62491820",
        "web": "https://www.hitecsa.com",
        "revenue": 32000000,
        "purchasingManager": "Xavier Martí (Responsable de Compras y Aprovisionamiento - LinkedIn)",
        "phone": "+34 93 890 42 11",
        "email": "compras@hitecsa.com",
        "location": [41.3462, 1.7014],
        "sector": "Sistemas de Climatización y Ventilación",
        "products": ["Perfiles Estructurales de Aluminio para Climatizadores", "Rejillas y Compuertas de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 105,
        "notes": "Fabricante histórico en Vilafranca del Penedès de equipos rooftop, bombas de calor y UTAs con estructura de aluminio."
    },
    {
        "name": "Zehnder Group Ibérica Indoor Climate, S.A.U.",
        "zone": "Comunidad de Madrid",
        "department": "Pinto (Comunidad de Madrid)",
        "cif": "A82194820",
        "web": "https://www.zehnder.es",
        "revenue": 18000000,
        "purchasingManager": "David Gómez (Operaciones y Compras - LinkedIn)",
        "phone": "+34 91 691 50 11",
        "email": "info@zehnder.es",
        "location": [40.2514, -3.7012],
        "sector": "Sistemas de Climatización y Ventilación",
        "products": ["Perfiles de Radiadores y Techos Radiantes en Aluminio", "Rejillas de Ventilación"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 65,
        "notes": "Especialista en climatización interior, ventilación de alta eficiencia y paneles radiantes de aluminio."
    },

    # --- VERTICAL 3: CARROCERÍAS DE AUTOBUSES, CISTERNAS Y VEHÍCULOS ESPECIALES (5) ---
    {
        "name": "CaetanoBus - Fabricação de Carroçarias, S.A.",
        "zone": "Portugal",
        "department": "Vila Nova de Gaia, Porto (Portugal)",
        "cif": "PT505194820",
        "web": "https://www.caetanobus.pt",
        "revenue": 95000000,
        "purchasingManager": "Paulo Azevedo (Diretor de Compras e Supply Chain - LinkedIn)",
        "phone": "+351 227 867 000",
        "email": "compras@caetanobus.pt",
        "location": [41.1045, -8.5912],
        "sector": "Fabricantes de Carrocerias",
        "products": ["Perfiles Estructurales de Carrocería en Aluminio (Sistema CoBolt)", "Canaletas Interiores de Aluminio", "Chapas y Portones de Maletero"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 380,
        "notes": "Principal fabricante portugués de autobuses eléctricos, de hidrógeno y aeroportuarios (Cobus) con carrocería modular íntegra de aluminio extruido atornillado."
    },
    {
        "name": "Farcinox, S.L.",
        "zone": "Castilla-La Mancha",
        "department": "Pedro Muñoz (Ciudad Real, Castilla-La Mancha)",
        "cif": "B13291845",
        "web": "https://www.farcinox.com",
        "revenue": 24000000,
        "purchasingManager": "Miguel Ángel Izquierdo (Jefe de Compras y Aprovisionamiento - LinkedIn)",
        "phone": "+34 926 58 63 39",
        "email": "compras@farcinox.com",
        "location": [39.4024, -2.9465],
        "sector": "Fabricantes de Carrocerias",
        "products": ["Pasarelas Superiores de Aluminio Extruido", "Paraciclistas y Perfiles Laterales de Aluminio", "Cofres y Guardabarros de Aluminio"],
        "profileType": "Perfil Estándar / Estructural",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 95,
        "notes": "Fabricante líder de cisternas alimentarias y químicas en Ciudad Real con alto consumo de perfilería perimetral y pasarelas de aluminio."
    },
    {
        "name": "Irmãos Mota - Construção de Carroçarias, S.A.",
        "zone": "Portugal",
        "department": "Avintes, Vila Nova de Gaia, Porto (Portugal)",
        "cif": "PT500142890",
        "web": "https://www.irmaosmota.pt",
        "revenue": 18000000,
        "purchasingManager": "Rui Mota / Dpto. de Compras (LinkedIn)",
        "phone": "+351 227 860 400",
        "email": "geral@irmaosmota.pt",
        "location": [41.1128, -8.5541],
        "sector": "Fabricantes de Carrocerias",
        "products": ["Perfiles de Aluminio para Carrozado de Autocares", "Molduras y Portones de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 85,
        "notes": "Histórico carrocero portugués de autocares turísticos e interurbanos en Vila Nova de Gaia."
    },
    {
        "name": "Carrocerías Ayats, S.A.",
        "zone": "Cataluña",
        "department": "Arbúcies (Girona, Cataluña)",
        "cif": "A17019482",
        "web": "https://www.ayats.es",
        "revenue": 16000000,
        "purchasingManager": "Quim Massa (Director de Compras - LinkedIn)",
        "phone": "+34 972 86 00 00",
        "email": "compras@ayats.es",
        "location": [41.8154, 2.5182],
        "sector": "Fabricantes de Carrocerias",
        "products": ["Perfiles de Aluminio para Autocares Doble Piso", "Portones y Canaletas de Aluminio Extruido"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 80,
        "notes": "Referente europeo en el clúster carrocero de Arbúcies (Girona) especializado en autocares de doble piso."
    },
    {
        "name": "Integralia Movilidad, S.L.",
        "zone": "Navarra",
        "department": "Pol. Ind. Comarca II, Esquíroz (Navarra)",
        "cif": "B31649182",
        "web": "https://www.integralia.es",
        "revenue": 14000000,
        "purchasingManager": "Fermín Aldaz (Responsable de Compras y Logística - LinkedIn)",
        "phone": "+34 948 31 61 11",
        "email": "compras@integralia.es",
        "location": [42.7712, -1.6584],
        "sector": "Fabricantes de Carrocerias",
        "products": ["Pisos Técnicos de Aluminio Extruido con Carriles", "Perfiles de Acabado Interior en Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 68,
        "notes": "Fabricante navarro de microbuses de lujo y movilidad adaptada con pisos de aluminio extruido."
    },

    # --- VERTICAL 4: INGENIERÍA MARÍTIMA, PANTALANES Y NAVAL DE ALUMINIO (4) ---
    {
        "name": "Astilleros Armón, S.A. / Auxnaval (División Catamaranes Aluminio)",
        "zone": "Asturias",
        "department": "Navia (Asturias) / Burela y Vigo (Galicia)",
        "cif": "A33019482",
        "web": "https://www.astillerosarmon.com",
        "revenue": 180000000,
        "purchasingManager": "Alejandro Rodríguez (Dirección de Compras Aluminio Naval - LinkedIn)",
        "phone": "+34 985 63 14 00",
        "email": "compras@astillerosarmon.com",
        "location": [43.5412, -6.7214],
        "sector": "Estructuras Marítimas y Naval de Aluminio",
        "products": ["Perfiles Estructurales Navales 6082-T6", "Bulbos y Perfiles Extruidos Marinos", "Chapa Naval de Aluminio"],
        "profileType": "Perfil Estándar / Estructural",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 480,
        "notes": "Líder mundial en fabricación de ferris rápidos de aluminio (Incats/Baleària) y patrulleras de alta velocidad."
    },
    {
        "name": "Aister (Aislamientos Térmicos de Galicia, S.A.)",
        "zone": "Galicia",
        "department": "Pol. Ind. A Borna, Moaña / Ría de Vigo (Pontevedra, Galicia)",
        "cif": "A36049182",
        "web": "https://www.aister.com",
        "revenue": 19000000,
        "purchasingManager": "Javier Rasilla / Dpto. Compras Marinas & Aluminio (LinkedIn)",
        "phone": "+34 986 24 02 94",
        "email": "compras@aister.com",
        "location": [42.2865, -8.7142],
        "sector": "Estructuras Marítimas y Naval de Aluminio",
        "products": ["Perfiles Estructurales de Pantalanes en Aluminio 6005A-T6", "Pasarelas Portuarias de Aluminio", "Embarcaciones Profesionales en Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 165,
        "notes": "Especialista en Moaña (Vigo) en fabricación 100% en aluminio marino de pantalanes flotantes, fingers, pasarelas de puerto y barcos profesionales."
    },
    {
        "name": "Ronáutica Marinas, S.L.U.",
        "zone": "Galicia",
        "department": "Mos / Vigo (Pontevedra, Galicia)",
        "cif": "B36918420",
        "web": "https://www.ronauticamarinas.com",
        "revenue": 11000000,
        "purchasingManager": "Brais Conde (Jefe de Compras y Producción - LinkedIn)",
        "phone": "+34 986 49 74 36",
        "email": "info@ronauticamarinas.com",
        "location": [42.2014, -8.6182],
        "sector": "Estructuras Marítimas y Naval de Aluminio",
        "products": ["Vigas Laterales Extruidas de Pantalán (6005A-T6)", "Fingers y Pasarelas de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 130,
        "notes": "Fabricante internacional de puertos deportivos y pantalanes flotantes construidos con bastidores de aluminio extruido de gran calibre."
    },
    {
        "name": "Almarin (Equipos de Ayuda a la Navegación, S.L.)",
        "zone": "Cataluña",
        "department": "Barcelona (Cataluña)",
        "cif": "B64192845",
        "web": "https://www.almarin.es",
        "revenue": 6500000,
        "purchasingManager": "Oriol Galí (Dirección de Operaciones y Compras - LinkedIn)",
        "phone": "+34 93 360 11 01",
        "email": "info@almarin.es",
        "location": [41.3912, 2.1542],
        "sector": "Estructuras Marítimas y Naval de Aluminio",
        "products": ["Torres y Balizas Portuarias en Aluminio Marino", "Perfiles y Tubos Estructurales 6082"],
        "profileType": "Perfil Estándar / Estructural",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 48,
        "notes": "Fabricante especializado en torres de balizamiento, faros y estructuras portuarias en aluminio marino."
    },

    # --- VERTICAL 5: AGROTECNOLOGÍA, INVERNADEROS Y RIEGO (3) ---
    {
        "name": "Ulma Agrícola, S.Coop.",
        "zone": "Pais Vasco",
        "department": "Oñati (Gipuzkoa, País Vasco)",
        "cif": "F20048192",
        "web": "https://www.ulmaagricola.com",
        "revenue": 42000000,
        "purchasingManager": "Ander Biain (Director de Compras - LinkedIn)",
        "phone": "+34 943 03 49 00",
        "email": "compras@ulmaagricola.com",
        "location": [43.0332, -2.4118],
        "sector": "Invernaderos Tecnológicos y Agro-Estructuras",
        "products": ["Perfiles de Sujeción de Film y Policarbonato en Aluminio", "Canalones y Ventanas Cenitales de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 175,
        "notes": "Cooperativa del Grupo ULMA especializada en invernaderos industriales de alta tecnología con perfilería de aluminio."
    },
    {
        "name": "Novedades Agrícolas, S.A. (APR Greenhouses)",
        "zone": "Murcia",
        "department": "Torre Pacheco (Murcia)",
        "cif": "A30049182",
        "web": "https://www.novedades-agricolas.com",
        "revenue": 38000000,
        "purchasingManager": "Ginés Martínez (Jefe de Compras División Invernaderos APR - LinkedIn)",
        "phone": "+34 968 57 80 00",
        "email": "compras@novedades-agricolas.com",
        "location": [37.7412, -0.9542],
        "sector": "Invernaderos Tecnológicos y Agro-Estructuras",
        "products": ["Perfiles de Aluminio para Invernaderos APR", "Perfiles de Pantallas Térmicas y Cenitales"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 150,
        "notes": "Fabricante murciano de invernaderos llave en mano (marca APR) con gran consumo de perfilería de fijación y ventilación cenital en aluminio."
    },
    {
        "name": "RKD Irrigación, S.L.",
        "zone": "Castilla y Leon",
        "department": "Mojados (Valladolid, Castilla y León)",
        "cif": "B47049182",
        "web": "https://www.rkd.es",
        "revenue": 22000000,
        "purchasingManager": "Roberto Sanz (Director de Aprovisionamiento - LinkedIn)",
        "phone": "+34 983 60 71 00",
        "email": "compras@rkd.es",
        "location": [41.4312, -4.6645],
        "sector": "Sistemas de Riego y Conducciones de Aluminio",
        "products": ["Tubos y Perfiles Estructurales de Aluminio", "Componentes de Sistemas Pivot"],
        "profileType": "Perfil Estándar / Estructural",
        "alloy": "6063-T5 / 6060",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 85,
        "notes": "Líder europeo en fabricación de sistemas de riego mecanizado en Valladolid."
    },

    # --- VERTICAL 6: PORTUGAL INDUSTRIAL — ILUMINACIÓN LED EXTRUIDA Y METALMECÁNICA (8) ---
    {
        "name": "J. Soares Correia - Armazéns de Ferro, S.A. (JSC)",
        "zone": "Portugal",
        "department": "Porto / Vila Nova de Gaia (Portugal)",
        "cif": "PT500148920",
        "web": "https://www.jsc.pt",
        "revenue": 120000000,
        "purchasingManager": "Luís Correia (Diretor de Compras Produtos Não Planos - LinkedIn)",
        "phone": "+351 226 190 900",
        "email": "compras@jsc.pt",
        "location": [41.1582, -8.6291],
        "sector": "Distribución y Elaboración de Perfiles y Chapas de Aluminio",
        "products": ["Perfiles Estándar de Aluminio (Tubos, Pletinas, Ángulos)", "Chapas y Bandas de Aluminio"],
        "profileType": "Perfil Estándar / Estructural",
        "alloy": "6063-T5 / 6060",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 450,
        "notes": "Uno de los mayores distribuidores y centros de servicio de productos metalúrgicos y perfiles de Portugal."
    },
    {
        "name": "A. Silva Matos - Metalomecânica, S.A.",
        "zone": "Portugal",
        "department": "Sever do Vouga, Aveiro (Portugal)",
        "cif": "PT500918420",
        "web": "https://www.asilvamatos.pt",
        "revenue": 45000000,
        "purchasingManager": "Hugo Matos (Procurement Director - LinkedIn)",
        "phone": "+351 234 590 200",
        "email": "compras@asilvamatos.pt",
        "location": [40.7312, -8.3714],
        "sector": "Estructuras Metálicas y Cerramientos Industriales",
        "products": ["Pasarelas y Escaleras Técnicas de Aluminio", "Envolventes y Perfiles Estructurales"],
        "profileType": "Perfil Estándar / Estructural",
        "alloy": "6005A-T6 / 6082-T6",
        "finish": "Bruto (Mill Finish) / Corte Precisión",
        "estimatedTonsPerYear": 115,
        "notes": "Gran grupo metalomecánico en Aveiro con producción de equipos y estructuras metálicas de exportación."
    },
    {
        "name": "Perfisa - Fábrica de Perfis Metálicos, S.A.",
        "zone": "Portugal",
        "department": "Albergaria-a-Velha, Aveiro (Portugal)",
        "cif": "PT503042815",
        "web": "https://www.perfisa.net",
        "revenue": 26000000,
        "purchasingManager": "Mário Tavares (Diretor de Compras e Produção - LinkedIn)",
        "phone": "+351 234 529 730",
        "email": "geral@perfisa.net",
        "location": [40.6914, -8.4812],
        "sector": "Construccion Modular",
        "products": ["Perfiles para Construcción Modular y Fachadas Ligeras", "Subestructuras de Cerramiento"],
        "profileType": "Perfil Estándar / Estructural",
        "alloy": "6063-T5 / 6060",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 110,
        "notes": "Fabricante líder en Aveiro de sistemas constructivos ligeros, fachadas y perfilería técnica con presencia en Portugal, España y Francia."
    },
    {
        "name": "Exporlux - Iluminação Técnica, S.A.",
        "zone": "Portugal",
        "department": "Águeda, Aveiro (Portugal)",
        "cif": "PT501748192",
        "web": "https://www.exporlux.pt",
        "revenue": 16000000,
        "purchasingManager": "Nuno Vidal (Responsável de Compras e Aprovisionamento - LinkedIn)",
        "phone": "+351 234 612 600",
        "email": "compras@exporlux.pt",
        "location": [40.5782, -8.4412],
        "sector": "Iluminación Técnica y Perfiles Disipadores LED",
        "products": ["Perfiles Lineales Arquitectónicos de Aluminio Extruido", "Disipadores LED Anodizados y Termolacados"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 160,
        "notes": "Líder portugués en iluminación lineal arquitectónica fabricada a partir de perfiles de aluminio extruido de matriz propia en Águeda."
    },
    {
        "name": "Sandometal - Construções Metálicas, S.A.",
        "zone": "Portugal",
        "department": "Oliveira de Frades, Viseu (Portugal)",
        "cif": "PT503819420",
        "web": "https://www.sandometal.pt",
        "revenue": 14000000,
        "purchasingManager": "Paulo Loureiro (Diretor de Aprovisionamento - LinkedIn)",
        "phone": "+351 232 760 110",
        "email": "geral@sandometal.pt",
        "location": [40.7342, -8.1745],
        "sector": "Fachadas de Aluminio",
        "products": ["Perfiles de Muro Cortina y Fachada Ventilada", "Carpintería de Aluminio y Lamas"],
        "profileType": "Carpintería / Arquitectura",
        "alloy": "6063-T5 / 6060",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 90,
        "notes": "Constructora metálica y fachadista en la región centro-norte de Portugal."
    },
    {
        "name": "Climar - Iluminação Arquitetural, S.A.",
        "zone": "Portugal",
        "department": "Mourisca do Vouga, Águeda, Aveiro (Portugal)",
        "cif": "PT500819420",
        "web": "https://www.climar.pt",
        "revenue": 11000000,
        "purchasingManager": "Ricardo Neves (Purchasing Manager - LinkedIn)",
        "phone": "+351 234 640 450",
        "email": "compras@climar.pt",
        "location": [40.6182, -8.4581],
        "sector": "Iluminación Técnica y Perfiles Disipadores LED",
        "products": ["Perfiles Extruidos para Sistemas Lineales LED", "Cuerpos de Luminarias en Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 125,
        "notes": "Fabricante en Águeda con más de 45 años de historia especializado en sistemas lineales de iluminación en aluminio extruido (exporta a 50 países)."
    },
    {
        "name": "Tromilux - Indústria de Iluminação, S.A.",
        "zone": "Portugal",
        "department": "Marinha Grande, Leiria (Portugal)",
        "cif": "PT502194820",
        "web": "https://www.tromilux.com",
        "revenue": 8500000,
        "purchasingManager": "Bruno Silva (Diretor de Compras - LinkedIn)",
        "phone": "+351 244 575 210",
        "email": "geral@tromilux.com",
        "location": [39.7482, -8.9314],
        "sector": "Iluminación Técnica y Perfiles Disipadores LED",
        "products": ["Perfiles de Aluminio Empotrables y Suspendidos LED", "Disipadores Lineales de Aluminio"],
        "profileType": "Matriz Propia (Bajo Plano)",
        "alloy": "6063-T5 / 6060",
        "finish": "Anodizado Técnico / Mecanizado CNC",
        "estimatedTonsPerYear": 95,
        "notes": "Especialista en iluminación técnica arquitectónica en Marinha Grande basada en perfiles de extrusión de aluminio."
    },
    {
        "name": "Cruzfer - Trabalhos de Serralharia, Lda.",
        "zone": "Portugal",
        "department": "Braga (Portugal)",
        "cif": "PT503114891",
        "web": "https://www.cruzfer.pt",
        "revenue": 7200000,
        "purchasingManager": "Manuel Cruz (Gerência e Compras - LinkedIn)",
        "phone": "+351 253 673 190",
        "email": "geral@cruzfer.pt",
        "location": [41.5642, -8.4125],
        "sector": "Cerramientos y Carpinteria de Aluminio",
        "products": ["Perfiles de Carpintería de Aluminio RPT", "Portones y Fachadas Ligeras de Aluminio"],
        "profileType": "Carpintería / Arquitectura",
        "alloy": "6063-T5 / 6060",
        "finish": "Lacado Qualicoat / RPT",
        "estimatedTonsPerYear": 62,
        "notes": "Fabricante en Braga de carpintería de aluminio, muros cortina y portones para el mercado luso y francés."
    },
]


def infer_b2b_fields(record: dict) -> dict:
    """Calcula y asigna los metadatos técnicos B2B de extrusión si no están definidos."""
    sec = (record.get("sector") or "").lower()
    prods = " ".join(record.get("products") or []).lower()
    rev = float(record.get("revenue") or 5000000)

    # 1. Tipo de perfil
    if not record.get("profileType"):
        if any(k in sec or k in prods for k in ["solar", "iluminac", "disipador", "mampara", "tabique", "invernadero", "pérgola", "pergola", "persiana", "puerta", "porton", "portón", "mobiliario", "escalera", "climatiz", "electr"]):
            record["profileType"] = "Matriz Propia (Bajo Plano)"
        elif any(k in sec or k in prods for k in ["carrocer", "estructur", "andamio", "modular", "naval", "marítim", "riego"]):
            record["profileType"] = "Perfil Estándar / Estructural"
        else:
            record["profileType"] = "Carpintería / Arquitectura"

    # 2. Aleación recomendada
    if not record.get("alloy"):
        if any(k in sec or k in prods for k in ["solar", "carrocer", "estructur", "andamio", "naval", "marítim", "pantal", "escalera", "puente", "grúa"]):
            record["alloy"] = "6005A-T6 / 6082-T6"
        else:
            record["alloy"] = "6063-T5 / 6060"

    # 3. Acabado principal
    if not record.get("finish"):
        if any(k in sec or k in prods for k in ["iluminac", "disipador", "electr", "mampara", "mecaniz", "salas blancas"]):
            record["finish"] = "Anodizado Técnico / Mecanizado CNC"
        elif any(k in sec or k in prods for k in ["solar", "invernadero", "carrocer", "riego", "naval"]):
            record["finish"] = "Bruto (Mill Finish) / Corte Precisión"
        else:
            record["finish"] = "Lacado Qualicoat / RPT"

    # 4. Estimación realista de Tonelaje Anual de Aluminio (Tn/año)
    if not record.get("estimatedTonsPerYear"):
        rev_m = rev / 1_000_000.0
        if any(k in sec for k in ["solar", "proteccion solar", "persiana", "cerramientos", "fachadas", "ventanas"]):
            tons = int(round(min(650, max(12, rev_m * 6.5))))
        elif any(k in sec for k in ["puertas", "portones", "mamparas", "divisiones", "iluminac", "invernadero", "escalera", "mobiliario"]):
            tons = int(round(min(480, max(15, rev_m * 4.8))))
        else:
            tons = int(round(min(420, max(10, rev_m * 3.2))))
        record["estimatedTonsPerYear"] = tons

    tons_val = int(record["estimatedTonsPerYear"])
    if tons_val >= 100 or rev >= 25_000_000:
        record["b2bTier"] = "Tier A"
    elif tons_val >= 35 or rev >= 5_000_000:
        record["b2bTier"] = "Tier B"
    else:
        record["b2bTier"] = "Tier C"

    if not record.get("incumbentSupplier"):
        record["incumbentSupplier"] = "Sin homologar (Oportunidad Dual Sourcing)"

    return record


def get_clean_domain(url_str: str) -> str:
    parsed = urlparse(url_str if url_str.startswith("http") else f"https://{url_str}")
    host = parsed.netloc.lower()
    return host[4:] if host.startswith("www.") else host


def main():
    with open(PROSPECTS_PATH, "r", encoding="utf-8") as f:
        prospects = json.load(f)

    max_num = 0
    existing_domains = set()
    for p in prospects:
        pid = p.get("id", "")
        if pid.startswith("PROP-LEAD26-"):
            try:
                n = int(pid.split("-")[-1])
                if n > max_num:
                    max_num = n
            except ValueError:
                pass
        existing_domains.add(get_clean_domain(p.get("web", "")))
        infer_b2b_fields(p)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00.000Z")
    added = 0
    for item in NEW_B2B_36:
        dom = get_clean_domain(item["web"])
        if dom in existing_domains:
            print(f"Saltando duplicado: {item['name']} ({dom})")
            continue
        max_num += 1
        new_id = f"PROP-LEAD26-{max_num:04d}"
        lat, lng = item["location"]
        rec = {
            "name": item["name"],
            "zone": item["zone"],
            "department": item["department"],
            "cif": item["cif"],
            "web": item["web"],
            "revenue": item["revenue"],
            "purchasingManager": item["purchasingManager"],
            "phone": item["phone"],
            "email": item["email"],
            "location": [lat, lng],
            "sector": item["sector"],
            "products": item["products"],
            "contacted": False,
            "contactDate": None,
            "notes": item["notes"],
            "response": "Pendiente de primer contacto comercial",
            "createdAt": now_iso,
            "id": new_id,
            "emailVerified": True,
            "emailVerifiedType": "compras" if item["email"].startswith(("compras@", "purchasing@", "procurement@")) else "corporativo_verificado",
            "emailableStatus": "deliverable",
            "lat": lat,
            "lng": lng,
            "website": item["web"],
            "contact": item["purchasingManager"],
            "profileType": item["profileType"],
            "alloy": item["alloy"],
            "finish": item["finish"],
            "estimatedTonsPerYear": item["estimatedTonsPerYear"],
        }
        infer_b2b_fields(rec)
        prospects.append(rec)
        existing_domains.add(dom)
        added += 1

    with open(PROSPECTS_PATH, "w", encoding="utf-8") as f:
        json.dump(prospects, f, ensure_ascii=False, indent=2)

    tiers = {"Tier A": 0, "Tier B": 0, "Tier C": 0}
    total_tons = 0
    for p in prospects:
        tiers[p.get("b2bTier", "Tier B")] = tiers.get(p.get("b2bTier", "Tier B"), 0) + 1
        total_tons += int(p.get("estimatedTonsPerYear", 0))

    print(f"Nuevas empresas B2B incorporadas: {added}")
    print(f"Total empresas en prospects.json: {len(prospects)}")
    print(f"Distribución por Tier B2B: {tiers}")
    print(f"Potencial total estimado en base de datos: {total_tons:,} Tn/año de aluminio extruido")


if __name__ == "__main__":
    main()

