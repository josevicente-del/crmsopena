const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Generador de Base de Datos B2B Grupo Sopeña (v3.0)
// Utiliza la clasificación sectorial y de productos fijada previamente:
// Sectores: Carpintería de Aluminio, Fachadas y Envolventes, Perfilería y Cerramientos, Transformación y Mecanizado, Energía Solar y Fotovoltaica, Puertas y Ventanas Industriales, Estructuras Metálicas, etc.
// Productos: Perfiles, Lamas, Fachadas Ligeras, Paneles Composite, Cerramientos, Cortinas de Cristal, Sistemas Fotovoltaicos, Estructuras Solares, Ventanas RPT, Puertas Industriales, Mosquiteras, Envolventes Térmicas, Rotura Puente Térmico, Muro Cortina, Chapas de Aluminio, Accesorios, Perfiles Ranurados.

try {
  const pythonScript = path.join(__dirname, '..', '.gemini', 'antigravity-ide', 'brain', '5ed53131-75d6-48d5-8719-97d5523b9399', 'scratch', 'build_real_db.py');
  execSync(`python "${pythonScript}"`, { stdio: 'inherit' });
  console.log('✅ Base de datos sincronizada con éxito en src/data/prospects.json.');
} catch (e) {
  console.error('Error al ejecutar generador python:', e);
}
