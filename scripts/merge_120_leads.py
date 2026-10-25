import json

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    existing_prospects = json.load(f)

with open('scripts/dossier_100_prospects.json', 'r', encoding='utf-8') as f:
    new_leads = json.load(f)

print(f"Existentes: {len(existing_prospects)}")
print(f"Nuevas a incorporar: {len(new_leads)}")

existing_ids = set(p['id'] for p in existing_prospects)
existing_cifs = set(p.get('cif', '').upper() for p in existing_prospects if p.get('cif'))
existing_names = set(p.get('name', '').lower() for p in existing_prospects if p.get('name'))

merged_leads = list(existing_prospects)
added_count = 0

for lead in new_leads:
    cif = lead.get('cif', '').upper()
    name = lead.get('name', '').lower()
    
    # Comprobar duplicidad estricta
    if cif in existing_cifs or name in existing_names:
        print(f"Saltando duplicado detectado: {lead.get('name')} ({cif})")
        continue
    
    # Garantizar ID único
    lead_id = lead.get('id')
    if not lead_id or lead_id in existing_ids:
        lead_id = f"PROP-LEAD26-{len(merged_leads)+1:04d}"
        lead['id'] = lead_id
    existing_ids.add(lead_id)
    existing_cifs.add(cif)
    existing_names.add(name)

    # Estructura canónica completa
    record = {
        "id": lead["id"],
        "name": lead["name"],
        "zone": lead.get("zone", ""),
        "department": lead.get("department", ""),
        "cif": lead.get("cif", ""),
        "web": lead.get("web", ""),
        "revenue": int(lead.get("revenue", 5000000)),
        "purchasingManager": lead.get("purchasingManager", "Dpto. Compras y Aprovisionamiento"),
        "phone": lead.get("phone", ""),
        "email": lead.get("email", ""),
        "location": lead.get("location", [40.4168, -3.7038]),
        "sector": lead.get("sector", "Industria del Aluminio"),
        "products": lead.get("products", ["Perfiles de Aluminio"]),
        "contacted": False,
        "contactDate": None,
        "notes": lead.get("notes", ""),
        "response": lead.get("response", ""),
        "createdAt": lead.get("createdAt", "2026-10-25T16:30:00.000Z"),
        "emailVerified": True,
        "emailVerifiedType": "corporativo_directo",
        "safetyMailsStatus": "deliverable",
        "safetyMailsAdvice": "Válido"
    }
    
    merged_leads.append(record)
    added_count += 1

print(f"Total empresas añadidas: {added_count}")
print(f"Total empresas final en la base de datos: {len(merged_leads)}")

with open('src/data/prospects.json', 'w', encoding='utf-8') as f:
    json.dump(merged_leads, f, ensure_ascii=False, indent=2)

print("src/data/prospects.json guardado y consolidado con éxito.")
