import json
import re

with open('src/data/prospects.json', 'r', encoding='utf-8') as f:
    prospects = json.load(f)

print(f"Total prospectos cargados: {len(prospects)}")

# 1. Listar empresas de Comunidad Valenciana
valencia = [p for p in prospects if p.get('zone') == 'Comunidad Valenciana']
print(f"\n--- Empresas asignadas a Comunidad Valenciana ({len(valencia)}) ---")
for p in valencia:
    dept = p.get('department', '')
    name = p.get('name', '')
    loc = p.get('location', [])
    notes = p.get('notes', '')[:60]
    print(f"[{p.get('id')}] {name} | Dept: {dept} | Loc: {loc} | Web: {p.get('web')}")

# 2. Buscar si hay empresas con 'Andaluc' o 'Malaga' en department o notes pero con zone != 'Andalucia'
print("\n--- Posibles empresas de Andalucía asignadas a otra zona ---")
for p in prospects:
    zone = p.get('zone', '')
    dept = p.get('department', '').lower()
    name = p.get('name', '')
    notes = p.get('notes', '').lower()
    web = p.get('web', '').lower()
    
    andalucia_keywords = ['andaluc', 'málaga', 'malaga', 'sevilla', 'cadiz', 'cádiz', 'cordoba', 'córdoba', 'granada', 'huelva', 'jaen', 'jaén', 'almeria', 'almería', 'mijas']
    has_andalucia = any(k in dept or k in notes for k in andalucia_keywords)
    
    if has_andalucia and zone != 'Andalucia':
        print(f"ALERTA: [{p.get('id')}] {name} tiene keywords andaluzas pero zone='{zone}'! Dept: {p.get('department')} | Loc: {p.get('location')}")

# 3. Buscar si hay empresas con 'valenc' o 'alicante' o 'castellon' en department o notes pero con zone != 'Comunidad Valenciana'
print("\n--- Posibles empresas de Comunidad Valenciana asignadas a otra zona ---")
for p in prospects:
    zone = p.get('zone', '')
    dept = p.get('department', '').lower()
    name = p.get('name', '')
    notes = p.get('notes', '').lower()
    valencia_keywords = ['valenc', 'alicante', 'alacant', 'castellon', 'castellón', 'elche', 'elx', 'alcoy', 'alboy', 'gandia', 'sagunto']
    has_valencia = any(k in dept or k in notes for k in valencia_keywords)
    if has_valencia and zone != 'Comunidad Valenciana':
        print(f"ALERTA: [{p.get('id')}] {name} tiene keywords valencianas pero zone='{zone}'! Dept: {p.get('department')} | Loc: {p.get('location')}")
