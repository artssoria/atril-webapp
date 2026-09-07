// ═══════════════════════════════════════════════════════════
// ATRIL 5.0 - Netlify / CI Production Build Script
// Genera de forma segura config.js a partir de variables de entorno
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || 'https://avpdyesbyzxterlfxsou.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2cGR5ZXNieXp4dGVybGZ4c291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODczNDgsImV4cCI6MjA1Njg2MzM0OH0.c1e8gT-r4pL0mN8qY7sX5zK9wJ1vB3dE2aF4hG6iH0k';

const configContent = `/**
 * ATRIL 5.0 - Inyección Segura de Variables de Entorno
 * Generado automáticamente durante el proceso de build.
 * NO EDITAR MANUALMENTE.
 */
window.__ENV__ = {
  SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
  SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)}
};
`;

try {
  const targetDir = path.join(__dirname, '..', 'src', 'js');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(path.join(targetDir, 'config.js'), configContent, 'utf8');
  console.log('🔒 [ATRIL Security] Runtime configuration generated securely at src/js/config.js.');
} catch (err) {
  console.error('❌ [ATRIL Security] Error generating runtime configuration:', err);
  process.exit(1);
}
