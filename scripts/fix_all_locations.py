import json

# Diccionario de correcciones maestras por ID
CORRECTIONS = {
    # 1. Acristalia S.L. (Málaga, Andalucía)
    "PROP-VERIF-0016": {
        "name": "Acristalia S.L.",
        "zone": "Andalucia",
        "department": "Mijas Costa (Málaga)",
        "location": [36.5417, -4.6433],
        "notes_add": "Sede central y fábrica de cortinas de cristal y cerramientos en Pol. Ind. El Manantial, Mijas Costa (Málaga, Andalucía)."
    },
    # 2. Todocristal Cerramientos (AllGlass Confort Systems S.L. - Málaga, Andalucía)
    "PROP-VERIF-0017": {
        "name": "Todocristal Cerramientos (AllGlass Confort Systems)",
        "zone": "Andalucia",
        "department": "Málaga (Málaga)",
        "location": [36.6842, -4.4891],
        "notes_add": "Sede central y fábrica nacional de cerramientos sin perfiles y cortinas de cristal en Pol. Ind. Guadalhorce, Málaga (Andalucía)."
    },
    # 3. Lumon Cristales España (Antequera, Málaga, Andalucía)
    "PROP-VERIF-0018": {
        "name": "Lumon Cristales España",
        "zone": "Andalucia",
        "department": "Antequera (Málaga)",
        "location": [37.0392, -4.5621],
        "notes_add": "Fábrica principal de acristalamientos para terrazas de Lumon en España ubicada en Antequera (Málaga, Andalucía)."
    },
    # 4. Gradhermetic S.A.E. (Castellbisbal, Barcelona, Cataluña)
    "PROP-VERIF-0019": {
        "name": "Gradhermetic S.A.E.",
        "zone": "Cataluña",
        "department": "Castellbisbal (Barcelona)",
        "location": [41.4794, 1.9822],
        "notes_add": "Sede central y planta de fabricación de celosías, persianas y falsos techos de aluminio en Castellbisbal (Barcelona, Cataluña)."
    },
    # 5. Tvitec System Glass S.L. (Cubillos del Sil, León, Castilla y León)
    "PROP-CAMARA-0246": {
        "name": "Tvitec System Glass S.L.",
        "zone": "Castilla y Leon",
        "department": "Cubillos del Sil (León)",
        "location": [42.6186, -6.5684],
        "notes_add": "Sede y macroplanta de vidrio arquitectónico y envolventes con perfiles estructurales de aluminio en El Bierzo / Cubillos del Sil (León, Castilla y León)."
    },
    # 6. Puertas Roper S.A. (Maliaño / Camargo, Cantabria)
    "PROP-VERIF-0156": {
        "name": "Puertas Roper S.A.",
        "zone": "Cantabria",
        "department": "Maliaño (Cantabria)",
        "location": [43.4182, -3.8427],
        "notes_add": "Sede central y fábrica de puertas de aluminio seccionales, enrollables y de garaje en Maliaño (Cantabria)."
    },
    # 7. Dynamobel S.A. (Peralta, Navarra)
    "PROP-VERIF-0202": {
        "name": "Dynamobel S.A. (Mamparas y Divisiones)",
        "zone": "Navarra",
        "department": "Peralta (Navarra)",
        "location": [42.3402, -1.8021],
        "notes_add": "Sede central y factoría de mamparas de oficina, tabiques móviles y perfiles técnicos de aluminio en Peralta (Navarra)."
    },
    # 8. Araven Mobiliario y Hostelería S.L. (Zaragoza, Aragón)
    "PROP-VERIF-0209": {
        "name": "Araven Mobiliario y Hostelería S.L.",
        "zone": "Aragon",
        "department": "Zaragoza (Zaragoza)",
        "location": [41.6521, -0.8034],
        "notes_add": "Sede central y fábrica en Pol. Ind. Malpica, Zaragoza (Aragón)."
    },
    # 9. Novagric Invernaderos de Aluminio (Alhama de Murcia, Murcia)
    "PROP-VERIF-0182": {
        "name": "Novagric Invernaderos de Aluminio",
        "zone": "Murcia",
        "department": "Alhama de Murcia (Murcia)",
        "location": [37.8504, -1.4258],
        "notes_add": "Sede central y fábrica tecnológica de estructuras de aluminio para agricultura e invernaderos en Alhama de Murcia (Murcia)."
    },
    # 10. Balat Módulos Prefabricados S.L. (Beriáin / Pamplona, Navarra)
    "PROP-VERIF-0204": {
        "name": "Balat Módulos Prefabricados S.L.",
        "zone": "Navarra",
        "department": "Beriáin (Navarra)",
        "location": [42.7482, -1.6421],
        "notes_add": "Sede central y planta de construcciones modulares con carpintería de aluminio en Beriáin (Navarra)."
    },
    # 11. Carpintería Cantabria S.L. (Santander, Cantabria)
    "PROP-VERIF-0121": {
        "name": "Carpintería Cantabria S.L.",
        "zone": "Cantabria",
        "department": "Santander (Cantabria)",
        "location": [43.4623, -3.8099],
        "notes_add": "Fabricante de carpintería de aluminio en Santander (Cantabria)."
    },
    # 12. Aluvidal Carpintería S.L. (Zaragoza, Aragón)
    "PROP-VERIF-0119": {
        "name": "Aluvidal Carpintería S.L.",
        "zone": "Aragon",
        "department": "Zaragoza (Zaragoza)",
        "location": [41.6782, -0.8654],
        "notes_add": "Sede y taller de fabricación de ventanas y cerramientos de aluminio en Pol. Ind. Alcalde Caballero, Zaragoza (Aragón)."
    },
    # 13. Bandalux Industrial S.A. (Moraña, Pontevedra, Galicia)
    "PROP-VERIF-0029": {
        "name": "Bandalux Industrial S.A.",
        "zone": "Galicia",
        "department": "Moraña (Pontevedra)",
        "location": [42.5539, -8.5878],
        "notes_add": "Fábrica central de producción y mecanizado de perfiles de aluminio para protección solar en Moraña (Pontevedra, Galicia)."
    },
    # 14. Ventanas Arsan S.L. (Camargo, Cantabria)
    "PROP-VERIF-0120": {
        "name": "Ventanas Arsan S.L.",
        "zone": "Cantabria",
        "department": "Camargo (Cantabria)",
        "location": [43.4241, -3.8562],
        "notes_add": "Fabricación e instalación de ventanas y cerramientos de aluminio en Camargo / Santander (Cantabria)."
    },
    # 15. Hörmann España S.A. (Terrassa, Barcelona, Cataluña)
    "PROP-VERIF-0031": {
        "name": "Hörmann España S.A.",
        "zone": "Cataluña",
        "department": "Terrassa (Barcelona)",
        "location": [41.5632, 2.0089],
        "notes_add": "Sede central de Hörmann en España ubicada en Terrassa (Barcelona, Cataluña)."
    },
    # 16. Angel Mir - Puertas Portis S.L. (Corçà, Girona, Cataluña)
    "PROP-VERIF-0030": {
        "name": "Angel Mir - Puertas Portis S.L.",
        "zone": "Cataluña",
        "department": "Corçà (Girona)",
        "location": [41.9892, 3.0181],
        "notes_add": "Sede central y fábrica principal de puertas seccionales, cancelas y cerramientos en Corçà (Girona, Cataluña)."
    },
    # 17. INSO Estructuras Solares (Aluminios La Serena) (Villanueva de la Serena, Badajoz, Extremadura)
    "PROP-VERIF-0193": {
        "name": "INSO Estructuras Solares (Aluminios La Serena)",
        "zone": "Extremadura",
        "department": "Villanueva de la Serena (Badajoz)",
        "location": [38.9745, -5.7984],
        "notes_add": "Sede y planta de perfiles y estructuras de aluminio en Villanueva de la Serena (Badajoz, Extremadura)."
    },
    # 18. ESLA Plataformas de Aluminio S.L. (Cuarte de Huerva, Zaragoza, Aragón)
    "PROP-VERIF-0177": {
        "name": "ESLA Plataformas de Aluminio S.L.",
        "zone": "Aragon",
        "department": "Cuarte de Huerva (Zaragoza)",
        "location": [41.5954, -0.9328],
        "notes_add": "Sede y planta de plataformas y escaleras de aluminio en Cuarte de Huerva (Zaragoza, Aragón)."
    },
    # 19. Mecanizados Solares S.L. (Mecasolar) (Fustiñana, Navarra)
    "PROP-MECASOLAR-0477": {
        "name": "Mecanizados Solares S.L. (Mecasolar)",
        "zone": "Navarra",
        "department": "Fustiñana (Navarra)",
        "location": [41.9889, -1.5034],
        "notes_add": "Sede fabril y centro de mecanizado de perfiles de aluminio y seguidores solares en Fustiñana (Navarra)."
    },
    # 20. Técnicas Expansivas, S.L. (INDEX Fixing Systems) (Logroño, La Rioja)
    "PROP-GENERA-0495": {
        "name": "Técnicas Expansivas, S.L. (INDEX Fixing Systems)",
        "zone": "La Rioja",
        "department": "Logroño (La Rioja)",
        "location": [42.465, -2.4456],
        "notes_add": "Sede central y centro logístico/industrial en Pol. Ind. La Portalada, Logroño (La Rioja)."
    },
    # 21. Ingeniería y Construcciones del Aluminio S.A. (INCONAL) (Agoncillo, La Rioja)
    "PROP-LINKEDIN-0503": {
        "name": "Ingeniería y Construcciones del Aluminio S.A. (INCONAL)",
        "zone": "La Rioja",
        "department": "Agoncillo (La Rioja)",
        "location": [42.4464, -2.2908],
        "notes_add": "Sede y talleres de muros cortina en Pol. Ind. El Sequero, Agoncillo (La Rioja)."
    },
    # 22. K-Line Fenêtres S.A.S. (Les Herbiers, Francia)
    "PROP-VERIF-0107": {
        "name": "K-Line Fenêtres S.A.S.",
        "zone": "Francia",
        "department": "Les Herbiers (Francia)",
        "location": [46.8719, -1.0131],
        "notes_add": "Sede central y fábrica principal de ventanas de aluminio en Les Herbiers (Vendée, Francia)."
    },
    # 23. Lecitrailer S.A. (Casetas, Zaragoza, Aragón)
    "PROP-VERIF-0185": {
        "name": "Lecitrailer S.A.",
        "zone": "Aragon",
        "department": "Casetas, Zaragoza (Aragón)",
        "location": [41.7186, -1.0258],
        "notes_add": "Sede principal y macrofactoría de semirremolques de aluminio en Casetas (Zaragoza, Aragón)."
    },
    # 24. Giménez Ganga S.L.U. (Saxun) (Sax, Alicante, Comunidad Valenciana)
    "PROP-VERIF-0009": {
        "name": "Giménez Ganga S.L.U. (Saxun)",
        "zone": "Comunidad Valenciana",
        "department": "Sax (Alicante)",
        "location": [38.5372, -0.8172],
        "notes_add": "Sede central y planta de producción de persianas, lamas y pérgolas bioclimáticas en Sax (Alicante, Comunidad Valenciana)."
    },
    # 25. C3 Systems S.L. (Elche, Alicante, Comunidad Valenciana)
    "PROP-VERIF-0010": {
        "name": "C3 Systems S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Elche (Alicante)",
        "location": [38.2669, -0.6983],
        "notes_add": "Sede central y centro de fabricación de cerramientos de cristal en Elche Parque Empresarial (Alicante, Comunidad Valenciana)."
    },
    # 26. Kauma Cerramientos S.L. (Alicante, Comunidad Valenciana)
    "PROP-VERIF-0011": {
        "name": "Kauma Cerramientos S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Alicante (Alicante)",
        "location": [38.3452, -0.481],
        "notes_add": "Sede en Alicante capital (Comunidad Valenciana)."
    },
    # 27. Alumed Sistemas S.L. (Alicante, Comunidad Valenciana)
    "PROP-VERIF-0012": {
        "name": "Alumed Sistemas S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Alicante (Alicante)",
        "location": [38.3452, -0.481],
        "notes_add": "Distribución y sistemas de perfiles de aluminio en Alicante (Comunidad Valenciana)."
    },
    # 28. Alumar Cerramientos S.L. (Alicante, Comunidad Valenciana)
    "PROP-VERIF-0008": {
        "name": "Alumar Cerramientos S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Alicante (Alicante)",
        "location": [38.3452, -0.481],
        "notes_add": "Carpintería y cerramientos de aluminio en Alicante (Comunidad Valenciana)."
    },
    # 29. Profiltek España S.A. (Quartell, Valencia, Comunidad Valenciana)
    "PROP-VERIF-0013": {
        "name": "Profiltek España S.A.",
        "zone": "Comunidad Valenciana",
        "department": "Quartell (Valencia)",
        "location": [39.7381, -0.2647],
        "notes_add": "Sede central y fábrica de mamparas y perfiles de aluminio en Quartell (Valencia, Comunidad Valenciana)."
    },
    # 30. Vicente Vila, S.L. (Alzira, Valencia, Comunidad Valenciana)
    "PROP-VERIF-0015": {
        "name": "Vicente Vila, S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Alzira (Valencia)",
        "location": [39.1512, -0.4344],
        "notes_add": "Fábrica de persianas y cerramientos de aluminio en Alzira (Valencia, Comunidad Valenciana)."
    },
    # 31. Cermasol Puertas y Ventanas S.L. (Málaga, Andalucía)
    "PROP-VERIF-0093": {
        "name": "Cermasol Puertas y Ventanas S.L.",
        "zone": "Andalucia",
        "department": "Málaga (Málaga)",
        "location": [36.7213, -4.4214],
        "notes_add": "Carpintería de aluminio en Málaga capital (Andalucía)."
    },
    # 32. El Arcángel Industrias Metálicas (Córdoba, Andalucía)
    "PROP-VERIF-0094": {
        "name": "El Arcángel Industrias Metálicas",
        "zone": "Andalucia",
        "department": "Córdoba (Córdoba)",
        "location": [37.8882, -4.7794],
        "notes_add": "Industrias metálicas y cerramientos en Córdoba (Andalucía)."
    },
    # 33. Aluminios Galiot S.L. (Córdoba, Andalucía)
    "PROP-VERIF-0095": {
        "name": "Aluminios Galiot S.L.",
        "zone": "Andalucia",
        "department": "Córdoba (Córdoba)",
        "location": [37.8882, -4.7794],
        "notes_add": "Carpintería y perfilería de aluminio en Córdoba (Andalucía)."
    },
    # 34. Novo-Glass S.L. (El Puerto de Santa María, Cádiz, Andalucía)
    "PROP-VERIF-0123": {
        "name": "Novo-Glass S.L.",
        "zone": "Andalucia",
        "department": "El Puerto de Santa María (Cádiz)",
        "location": [36.5997, -6.2309],
        "notes_add": "Cerramientos y cristalería en El Puerto de Santa María (Cádiz, Andalucía)."
    },
    # 35. AluKort Sistemas S.L. (Cádiz, Andalucía)
    "PROP-VERIF-0124": {
        "name": "AluKort Sistemas S.L.",
        "zone": "Andalucia",
        "department": "Cádiz (Cádiz)",
        "location": [36.5298, -6.2925],
        "notes_add": "Sistemas de carpintería de aluminio en Cádiz (Andalucía)."
    },
    # 36. Hermanos Gómez Almería S.L. (Almería, Andalucía)
    "PROP-VERIF-0130": {
        "name": "Hermanos Gómez Almería S.L.",
        "zone": "Andalucia",
        "department": "Almería (Almería)",
        "location": [36.8381, -2.4597],
        "notes_add": "Carpintería metálica de aluminio en Almería (Andalucía)."
    },
    # 37. Inalpe Cerramientos S.L. (Tolosa, Gipuzkoa, País Vasco)
    "PROP-VERIF-0043": {
        "name": "Inalpe Cerramientos S.L.",
        "zone": "Pais Vasco",
        "department": "Tolosa (Gipuzkoa)",
        "location": [43.1361, -2.0767],
        "notes_add": "Fabricación de cerramientos de aluminio en Tolosa (Gipuzkoa, País Vasco)."
    },
    # 38. Alumdec S.L. (Sabadell, Barcelona, Cataluña)
    "PROP-VERIF-0141": {
        "name": "Alumdec S.L.",
        "zone": "Cataluña",
        "department": "Sabadell (Barcelona)",
        "location": [41.5433, 2.1094],
        "notes_add": "Carpintería técnica de aluminio en Sabadell (Barcelona, Cataluña)."
    },
    # 39. Aluminis Montper S.L. (Mataró, Barcelona, Cataluña)
    "PROP-VERIF-0144": {
        "name": "Aluminis Montper S.L.",
        "zone": "Cataluña",
        "department": "Mataró (Barcelona)",
        "location": [41.5381, 2.4447],
        "notes_add": "Fabricación de ventanas de aluminio en Mataró (Barcelona, Cataluña)."
    },
    # 40. ALUPRAC Carpintería S.L. (Granollers, Barcelona, Cataluña)
    "PROP-VERIF-0147": {
        "name": "ALUPRAC Carpintería S.L.",
        "zone": "Cataluña",
        "department": "Granollers (Barcelona)",
        "location": [41.6078, 2.2878],
        "notes_add": "Carpintería de aluminio en Granollers (Barcelona, Cataluña)."
    },
    # 41. Aluminis Tècnics Barcelona S.L. (Alella, Barcelona, Cataluña)
    "PROP-VERIF-0083": {
        "name": "Aluminis Tècnics Barcelona S.L.",
        "zone": "Cataluña",
        "department": "Alella (Barcelona)",
        "location": [41.4939, 2.2953],
        "notes_add": "Cerramientos y carpintería de aluminio en Alella (Barcelona, Cataluña)."
    },
    # 42. Sonseca (Toledo) - Aluminios Valsan S.L.
    "PROP-VERIF-0059": {
        "name": "Aluminios Valsan S.L.",
        "zone": "Castilla-La Mancha",
        "department": "Sonseca (Toledo)",
        "location": [39.6806, -3.9736],
        "notes_add": "Carpintería de aluminio en Sonseca (Toledo, Castilla-La Mancha)."
    },
    # 43. Hellín (Albacete) - Aluminer Cerramientos S.L.
    "PROP-VERIF-0062": {
        "name": "Aluminer Cerramientos S.L.",
        "zone": "Castilla-La Mancha",
        "department": "Hellín (Albacete)",
        "location": [38.5106, -1.7011],
        "notes_add": "Cerramientos y perfilería en Hellín (Albacete, Castilla-La Mancha)."
    },
    # 44. Aluminios Rojas S.L. (Getafe, Madrid)
    "PROP-VERIF-0138": {
        "name": "Aluminios Rojas S.L.",
        "zone": "Comunidad de Madrid",
        "department": "Getafe (Madrid)",
        "location": [40.3083, -3.7328],
        "notes_add": "Carpintería de aluminio en Getafe (Madrid)."
    },
    # 45. Aluminios Elche S.L. (Elche, Alicante, Comunidad Valenciana)
    "PROP-CUSTOM-0479": {
        "name": "Aluminios Elche S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Elche (Alicante)",
        "location": [38.2669, -0.6983],
        "notes_add": "Carpintería y cerramientos de aluminio en Elche (Alicante, Comunidad Valenciana)."
    },
    # 46. Aluminios Segovia S.L. (Segovia, Castilla y León)
    "PROP-CUSTOM-0478": {
        "name": "Aluminios Segovia S.L.",
        "zone": "Castilla y Leon",
        "department": "Segovia (Segovia)",
        "location": [40.9429, -4.1088],
        "notes_add": "Carpintería de aluminio en Segovia (Castilla y León)."
    },
    # 47. Metálicas Huelva S.L. (Huelva, Andalucía)
    "PROP-CUSTOM-0480": {
        "name": "Metálicas Huelva S.L.",
        "zone": "Andalucia",
        "department": "Huelva (Huelva)",
        "location": [37.2614, -6.9447],
        "notes_add": "Estructuras y carpintería de aluminio en Huelva (Andalucía)."
    },
    # 48. Aluminios Cuenca S.L. (Cuenca, Castilla-La Mancha)
    "PROP-CUSTOM-0481": {
        "name": "Aluminios Cuenca S.L.",
        "zone": "Castilla-La Mancha",
        "department": "Cuenca (Cuenca)",
        "location": [40.0704, -2.1374],
        "notes_add": "Carpintería de aluminio en Cuenca (Castilla-La Mancha)."
    },
    # 49. Aluminios Bierzo S.L. (Ponferrada, León, Castilla y León)
    "PROP-CUSTOM-0482": {
        "name": "Aluminios Bierzo S.L.",
        "zone": "Castilla y Leon",
        "department": "Ponferrada (León)",
        "location": [42.5467, -6.5908],
        "notes_add": "Carpintería de aluminio en Ponferrada / El Bierzo (León, Castilla y León)."
    },
    # 50. All For Padel S.L. (Madrid)
    "PROP-PADEL-0483": {
        "name": "All For Padel S.L. (AFP Courts / Adidas Padel)",
        "zone": "Comunidad de Madrid",
        "department": "Madrid (Madrid)",
        "location": [40.4168, -3.7038],
        "notes_add": "Sede central de diseño de pistas de pádel en Madrid."
    },
    # 51. Padelfan Valencia S.L. (Valencia)
    "PROP-PADEL-0484": {
        "name": "Padelfan Valencia S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Valencia (Valencia)",
        "location": [39.4699, -0.3763],
        "notes_add": "Pistas de pádel y estructuras de aluminio en Valencia (Comunidad Valenciana)."
    },
    # 52. Cubinor Construcciones Deportivas S.L. (Siero, Asturias)
    "PROP-PADEL-0485": {
        "name": "Cubinor Construcciones Deportivas S.L.",
        "zone": "Asturias",
        "department": "Siero (Asturias)",
        "location": [43.3912, -5.6614],
        "notes_add": "Cubiertas y estructuras para pistas deportivas en Siero (Asturias)."
    },
    # 53. Alusín Solar S.L.U. (Avilés, Asturias)
    "PROP-SOLAR-0486": {
        "name": "Alusín Solar S.L.U.",
        "zone": "Asturias",
        "department": "Avilés (Asturias)",
        "location": [43.5562, -5.9248],
        "notes_add": "Sistemas de fijación y perfiles de aluminio para paneles solares en Avilés (Asturias)."
    },
    # 54. Cerramientos del Sureste S.A. (CESUR) (San Vicente del Raspeig, Alicante)
    "PROP-ASEFAVE-0487": {
        "name": "Cerramientos del Sureste S.A. (CESUR)",
        "zone": "Comunidad Valenciana",
        "department": "San Vicente del Raspeig (Alicante)",
        "location": [38.3962, -0.5255],
        "notes_add": "Fabricación de ventanas y cerramientos de aluminio en San Vicente del Raspeig (Alicante, Comunidad Valenciana)."
    },
    # 55. Aluminios y PVC Ochoa S.L. (Konner Ventanas) (Santander, Cantabria)
    "PROP-ASEFAVE-0488": {
        "name": "Aluminios y PVC Ochoa S.L. (Konner Ventanas)",
        "zone": "Cantabria",
        "department": "Santander (Cantabria)",
        "location": [43.4623, -3.8099],
        "notes_add": "Fabricación de ventanas de aluminio y cerramientos en Santander (Cantabria)."
    },
    # 56. Industrias Teyco S.L. (Cornellà de Llobregat, Barcelona, Cataluña)
    "PROP-VETECO-0490": {
        "name": "Industrias Teyco S.L. (D'Glass Aluminium Systems)",
        "zone": "Cataluña",
        "department": "Cornellà de Llobregat (Barcelona)",
        "location": [41.3582, 2.0722],
        "notes_add": "Sistemas correderos y carpintería de aluminio en Cornellà de Llobregat (Barcelona, Cataluña)."
    },
    # 57. Pórtico Gestión e Ingeniería S.L. (Pórtico Sport) (Mérida, Badajoz, Extremadura)
    "PROP-PADEL-0492": {
        "name": "Pórtico Gestión e Ingeniería S.L. (Pórtico Sport)",
        "zone": "Extremadura",
        "department": "Mérida (Badajoz)",
        "location": [38.9161, -6.3437],
        "notes_add": "Ingeniería y pistas de pádel con estructura de aluminio en Mérida (Badajoz, Extremadura)."
    },
    # 58. Sunsupport S.L. (Peligros, Granada, Andalucía)
    "PROP-SOLAR-0493": {
        "name": "Sunsupport S.L.",
        "zone": "Andalucia",
        "department": "Peligros (Granada)",
        "location": [37.2312, -3.6289],
        "notes_add": "Diseño y fabricación de soportes y estructuras de aluminio para fotovoltaica en Pol. Ind. Asegra, Peligros (Granada, Andalucía)."
    },
    # 59. Basadre e Hijos S.L. (Outeiro de Rei, Lugo, Galicia)
    "PROP-CARROC-0494": {
        "name": "Basadre e Hijos S.L.",
        "zone": "Galicia",
        "department": "Outeiro de Rei (Lugo)",
        "location": [43.1025, -7.6133],
        "notes_add": "Carrocerías y perfiles de aluminio para vehículos industriales en Outeiro de Rei (Lugo, Galicia)."
    },
    # 60. Mediterraneo Aluminio Teknico Murcia 2016 S.L. (San Ginés, Murcia)
    "PROP-CUSTOM-0496": {
        "name": "Mediterraneo Aluminio Teknico Murcia 2016 S.L.",
        "zone": "Murcia",
        "department": "San Ginés (Murcia)",
        "location": [37.9542, -1.1895],
        "notes_add": "Distribución y perfilería de aluminio en Pol. Ind. Oeste, San Ginés (Murcia)."
    },
    # 61. Carpintería Eurometal S.L. (Molina de Segura, Murcia)
    "PROP-CUSTOM-0497": {
        "name": "Carpintería Eurometal S.L.",
        "zone": "Murcia",
        "department": "Molina de Segura (Murcia)",
        "location": [38.0538, -1.2115],
        "notes_add": "Carpintería metálica y cerramientos de aluminio en Molina de Segura (Murcia)."
    },
    # 62. Alvidur 2005 S.L. (Alvidur) (Dúrcal, Granada, Andalucía)
    "PROP-CUSTOM-0498": {
        "name": "Alvidur 2005 S.L. (Alvidur)",
        "zone": "Andalucia",
        "department": "Dúrcal (Granada)",
        "location": [36.9881, -3.5684],
        "notes_add": "Fabricación e instalación de carpintería de aluminio en Pol. Ind. San Blas, Dúrcal (Granada, Andalucía)."
    },
    # 63. Andemoy Granada S.L. (Armilla, Granada, Andalucía)
    "PROP-CUSTOM-0499": {
        "name": "Andemoy Granada S.L.",
        "zone": "Andalucia",
        "department": "Armilla (Granada)",
        "location": [37.1488, -3.6453],
        "notes_add": "Sistemas de andamios y perfiles modulares de aluminio en Armilla (Granada, Andalucía)."
    },
    # 64. Talleres Metálicos Gutiérrez S.L. (Atarfe, Granada, Andalucía)
    "PROP-CUSTOM-0500": {
        "name": "Talleres Metálicos Gutiérrez S.L.",
        "zone": "Andalucia",
        "department": "Atarfe (Granada)",
        "location": [37.2346, -3.6872],
        "notes_add": "Talleres de cerramientos y estructuras de aluminio en Pol. Ind. El Rey, Atarfe (Granada, Andalucía)."
    },
    # 65. 833 Solar Estructuras S.L. (Alicante, Comunidad Valenciana)
    "PROP-VERIF-0192": {
        "name": "833 Solar Estructuras S.L.",
        "zone": "Comunidad Valenciana",
        "department": "Alicante (Alicante)",
        "location": [38.3452, -0.481],
        "notes_add": "Estructuras solares de aluminio con sede en Alicante (Comunidad Valenciana)."
    }
}

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

applied_count = 0
for p in prospects:
    pid = p.get('id')
    if pid in CORRECTIONS:
        corr = CORRECTIONS[pid]
        p['zone'] = corr['zone']
        p['department'] = corr['department']
        p['location'] = corr['location']
        if 'name' in corr:
            p['name'] = corr['name']
        if 'notes_add' in corr:
            # Añadir o reemplazar nota si es necesario
            if corr['notes_add'] not in p.get('notes', ''):
                p['notes'] = corr['notes_add'] + " " + p.get('notes', '')
        applied_count += 1

print(f"Total correcciones aplicadas directamente: {applied_count}")

# Además, asegurar que todas las zonas 'Catalua' sean 'Cataluña'
fixed_catalua = 0
for p in prospects:
    if p.get('zone') == 'Catalua':
        p['zone'] = 'Cataluña'
        fixed_catalua += 1

print(f"Zonas 'Catalua' corregidas a 'Cataluña': {fixed_catalua}")

# Guardar de vuelta en src/data/prospects.json con formato limpio
with open('src/data/prospects.json', 'w', encoding='utf-8') as f:
    json.dump(prospects, f, ensure_ascii=False, indent=2)

print("src/data/prospects.json actualizado correctamente con indentación 2.")
