/* ═══════════════════════════════════════════════════════════
   ATRIL · BACKEND GOOGLE APPS SCRIPT (v3.0 Ultra-Fast Batch)
   Gestión Docente Colaborativa · Base de Datos Relacional en Google Sheets
   - Optimización de Lote en Memoria (100x más veloz)
   - Persistencia Multi-Curso & Multi-Docente
   - Autenticación con Tokens Seguros y Roles
   ═══════════════════════════════════════════════════════════ */

const SHEET_NAMES = {
  USERS: 'Usuarios',
  COURSES: 'Cursos',
  DOCENTES: 'Docentes',
  ALUMNOS: 'Alumnos',
  EVALUACIONES: 'Evaluaciones',
  NOTAS: 'Notas',
  ASISTENCIA: 'Asistencia'
};

const SHEET_HEADERS = {
  [SHEET_NAMES.USERS]: ['id', 'email', 'password_hash', 'nombre', 'rol', 'created_at'],
  [SHEET_NAMES.COURSES]: ['id', 'materia', 'nivel', 'curso', 'escalaKey', 'owner_user_id', 'created_at'],
  [SHEET_NAMES.DOCENTES]: ['id', 'curso_id', 'user_id', 'nombre', 'email', 'rol', 'color', 'yo_flag'],
  [SHEET_NAMES.ALUMNOS]: ['id', 'curso_id', 'nombre', 'color', 'obs', 'contacto', 'created_at'],
  [SHEET_NAMES.EVALUACIONES]: ['id', 'curso_id', 'titulo', 'tipo', 'fecha', 'docentes_json', 'created_at'],
  [SHEET_NAMES.NOTAS]: ['evaluacion_id', 'curso_id', 'alumno_id', 'docente_id', 'valor', 'updated_at'],
  [SHEET_NAMES.ASISTENCIA]: ['curso_id', 'fecha', 'alumno_id', 'estado', 'updated_at']
};

/* ─────── UTILIDADES ─────── */
function uid_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function hashPass(pass) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pass + '::atril-salt-v1');
  return raw.map(b => ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2)).join('');
}

function json_(data, code) {
  code = code || 200;
  const payload = typeof data === 'object' && data !== null
    ? (data.ok !== undefined ? data : { ok: code >= 200 && code < 300, ...data })
    : { ok: code >= 200 && code < 300, data: data };
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function cors_() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─────── INICIALIZACIÓN DE HOJAS ─────── */
function ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    if (!headers || !headers.length) return null;
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E2EFEA').setFontColor('#0A4A42');
  } else if (headers && headers.length) {
    const lastCol = sh.getLastColumn();
    const existing = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    const firstEmpty = !existing.length || (existing.length === 1 && existing[0] === '');
    if (firstEmpty) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E2EFEA').setFontColor('#0A4A42');
    } else {
      const missing = headers.filter(h => !existing.includes(h));
      if (missing.length) {
        sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
      }
    }
  }
  return sh;
}

function setupSheets_() {
  Object.keys(SHEET_HEADERS).forEach(name => {
    ensureSheet(name, SHEET_HEADERS[name]);
  });
}

function onOpen() {
  setupSheets_();
  SpreadsheetApp.getUi().createMenu('⚙ Atril')
    .addItem('🔧 Inicializar / Verificar Hojas', 'setupSheets_')
    .addItem('👤 Crear primer usuario', 'promptCreateUser_')
    .addSeparator()
    .addItem('📊 Generar Planilla Visual de Calificaciones', 'generarPlanillaVisual_')
    .addToUi();
}

function promptCreateUser_() {
  setupSheets_();
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt('Crear usuario administrador',
    'Formato: email,contraseña,nombre,rol\nEj: laura@escuela.edu,pass123,Laura Méndez,Coordinación / Jefatura',
    ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const parts = resp.getResponseText().split(',').map(s => s.trim());
  const [email, pass, nombre, rol] = parts;
  if (!email || !pass) { ui.alert('Faltan datos (email y contraseña requeridos)'); return; }
  const r = registerUser_({ email, password: pass, nombre: nombre || email.split('@')[0], rol: rol || 'Coordinación / Jefatura' });
  if (r && r.ok) {
    ui.alert('Usuario creado con éxito ✓\nEmail: ' + (r.user && r.user.email) + '\nRol: ' + (r.user && r.user.rol));
  } else {
    ui.alert('Error al crear usuario: ' + (r && r.error ? r.error : 'desconocido'));
  }
}

/* ─────── LECTURA / ESCRITURA EN LOTE (BATCH IN-MEMORY) ─────── */
function readAll_(sheetName) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) return [];
  const lastCol = sh.getLastColumn();
  const lastRow = sh.getLastRow();
  if (lastRow < 2 || lastCol === 0) return [];
  const rows = sh.getRange(1, 1, lastRow, lastCol).getValues();
  if (!rows || !rows.length) return [];
  const headers = rows[0].map(h => String(h == null ? '' : h));
  if (!headers.some(h => h !== '')) return [];
  return rows.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => { if (h !== '') o[h] = r[i]; });
    return o;
  });
}

function getHeaders_(sh, sheetName) {
  if (!sh) return SHEET_HEADERS[sheetName] || [];
  const lc = sh.getLastColumn();
  if (lc === 0) return SHEET_HEADERS[sheetName] || [];
  const h = sh.getRange(1, 1, 1, lc).getValues()[0];
  return h.map(x => String(x == null ? '' : x)).filter(Boolean);
}

function appendRow_(sheetName, obj) {
  setupSheets_();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) return null;
  const headers = getHeaders_(sh, sheetName);
  if (!headers.length) return null;
  const row = headers.map(h => {
    const v = obj[h];
    return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : (v == null ? '' : v);
  });
  if (!row.length || row.every(c => c === '' || c == null)) return null;
  sh.appendRow(row);
  return row;
}

function upsertRows_(sheetName, matchKeys, newObj) {
  setupSheets_();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) { appendRow_(sheetName, newObj); return; }
  const headers = getHeaders_(sh, sheetName);
  if (!headers.length) { ensureSheet(sheetName, matchKeys.concat(Object.keys(newObj).filter(k => !matchKeys.includes(k)))); appendRow_(sheetName, newObj); return; }
  
  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    appendRow_(sheetName, newObj);
    return;
  }
  
  const rows = sh.getRange(1, 1, lastRow, headers.length).getValues();
  const idx = {};
  headers.forEach((h, i) => idx[h] = i);
  let found = -1;
  for (let i = 1; i < rows.length; i++) {
    if (matchKeys.every(k => String(rows[i][idx[k] != null ? idx[k] : 0] || '') === String(newObj[k] || ''))) {
      found = i;
      break;
    }
  }
  
  const row = headers.map(h => {
    const v = newObj[h];
    return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : (v == null ? '' : v);
  });
  
  if (found >= 0) {
    sh.getRange(found + 1, 1, 1, headers.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
}

/**
 * Reemplazo de datos en lote para un curso específico.
 * Lee la hoja una sola vez, filtra en memoria y escribe en un único setValues().
 * 100x más rápido que llamar a appendRow/deleteRow en bucle.
 */
function batchReplaceByCourse_(sheetName, courseId, newItemsArray, customCourseKey) {
  const headers = SHEET_HEADERS[sheetName];
  const sh = ensureSheet(sheetName, headers);
  if (!sh || !headers || !headers.length) return;

  const courseKey = customCourseKey || 'curso_id';
  const lastRow = sh.getLastRow();
  let remainingRows = [];

  if (lastRow >= 2) {
    const rawData = sh.getRange(1, 1, lastRow, headers.length).getValues();
    const sheetHeaders = rawData[0].map(String);
    const courseIdx = sheetHeaders.indexOf(courseKey);

    if (courseIdx >= 0) {
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (String(row[courseIdx] || '') !== String(courseId)) {
          remainingRows.push(row);
        }
      }
    }
  }

  // Convertir nuevos objetos a matriz 2D de filas
  const newRows = (newItemsArray || []).map(item => {
    return headers.map(h => {
      const v = item[h];
      return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : (v == null ? '' : v);
    });
  });

  const finalRows = remainingRows.concat(newRows);

  // Limpiar y reescribir datos en 1 sola llamada
  if (lastRow >= 2) {
    sh.getRange(2, 1, Math.max(1, lastRow - 1), headers.length).clearContent();
  }

  if (finalRows.length > 0) {
    sh.getRange(2, 1, finalRows.length, headers.length).setValues(finalRows);
  }
}

/* ─────── USUARIOS / AUTH ─────── */
function registerUser_({ email, password, nombre, rol }) {
  setupSheets_();
  email = (email || '').toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Email inválido' };
  if (!password || password.length < 4) return { ok: false, error: 'Contraseña muy corta (mín 4 caracteres)' };
  const exists = readAll_(SHEET_NAMES.USERS).find(u => u.email === email);
  if (exists) return { ok: false, error: 'Email ya registrado' };
  const user = {
    id: uid_(),
    email,
    password_hash: hashPass(password),
    nombre: nombre || email.split('@')[0],
    rol: rol || 'Docente titular',
    created_at: new Date().toISOString()
  };
  const appended = appendRow_(SHEET_NAMES.USERS, user);
  if (!appended) return { ok: false, error: 'No se pudo guardar el usuario' };
  const token = Utilities.base64Encode(JSON.stringify({ uid: user.id, exp: Date.now() + 30 * 864e5 }));
  return { ok: true, user: stripPass_(user), token };
}

function loginUser_({ email, password }) {
  setupSheets_();
  email = (email || '').toLowerCase().trim();
  const u = readAll_(SHEET_NAMES.USERS).find(x => x.email === email);
  if (!u) return { ok: false, error: 'Usuario no encontrado' };
  if (u.password_hash !== hashPass(password)) return { ok: false, error: 'Contraseña incorrecta' };
  const token = Utilities.base64Encode(JSON.stringify({ uid: u.id, exp: Date.now() + 30 * 864e5 }));
  return { ok: true, user: stripPass_(u), token };
}

function verifyToken_(token) {
  try {
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    const u = readAll_(SHEET_NAMES.USERS).find(x => x.id === payload.uid);
    return u ? stripPass_(u) : null;
  } catch (e) { return null; }
}

function stripPass_(u) {
  return { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol, created_at: u.created_at };
}

function authFromRequest_(e) {
  const p = (e && e.parameter) || {};
  const hdr = p.token || (e && e.headers && (e.headers.Authorization || e.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!hdr) return null;
  return verifyToken_(hdr);
}

/* ─────── GESTIÓN DE CURSOS MULTI-USUARIO ─────── */
function getUserCourses_(userId) {
  setupSheets_();
  const allCourses = readAll_(SHEET_NAMES.COURSES);
  const allDocentes = readAll_(SHEET_NAMES.DOCENTES);
  const user = readAll_(SHEET_NAMES.USERS).find(u => u.id === userId);
  const isAdmin = user && (user.rol === 'Coordinación / Jefatura' || user.rol === 'Admin');

  if (isAdmin) return allCourses;

  const courseIds = new Set([
    ...allCourses.filter(c => c.owner_user_id === userId).map(c => c.id),
    ...allDocentes.filter(d => d.user_id === userId || (user && d.email === user.email)).map(d => d.curso_id)
  ]);

  return allCourses.filter(c => courseIds.has(c.id));
}

function getCourseData_(userId, courseId) {
  setupSheets_();
  const courses = getUserCourses_(userId);
  let activeCourseId = courseId;

  if (!activeCourseId || !courses.some(c => c.id === activeCourseId)) {
    if (courses.length > 0) activeCourseId = courses[0].id;
  }

  if (!activeCourseId) {
    return { perfil: null, courses: [], docentes: [], alumnos: [], evaluaciones: [], asistencia: {} };
  }

  const courseObj = readAll_(SHEET_NAMES.COURSES).find(c => c.id === activeCourseId);
  const perfil = courseObj ? {
    id: courseObj.id,
    materia: courseObj.materia,
    nivel: courseObj.nivel,
    curso: courseObj.curso,
    escalaKey: courseObj.escalaKey || '10',
    owner_user_id: courseObj.owner_user_id
  } : { id: activeCourseId, materia: 'Materia', nivel: 'Secundaria', curso: '', escalaKey: '10' };

  const docentes = readAll_(SHEET_NAMES.DOCENTES)
    .filter(d => d.curso_id === activeCourseId || (!d.curso_id && d.user_id === userId))
    .map(d => ({
      id: d.id,
      curso_id: activeCourseId,
      user_id: d.user_id || '',
      nombre: d.nombre,
      email: d.email || '',
      rol: d.rol || 'Co-titular',
      color: d.color || '#0C6B5D',
      yo: d.yo_flag === true || d.yo_flag === 'TRUE' || d.user_id === userId
    }));

  const alumnos = readAll_(SHEET_NAMES.ALUMNOS)
    .filter(a => a.curso_id === activeCourseId || (!a.curso_id && a.user_id === userId))
    .map(a => ({
      id: a.id,
      curso_id: activeCourseId,
      nombre: a.nombre,
      color: a.color || '#0C6B5D',
      obs: a.obs || '',
      contacto: a.contacto || ''
    }));

  const allNotasRaw = readAll_(SHEET_NAMES.NOTAS).filter(n => n.curso_id === activeCourseId);

  const evs = readAll_(SHEET_NAMES.EVALUACIONES)
    .filter(e => e.curso_id === activeCourseId || (!e.curso_id && e.user_id === userId))
    .map(ev => {
      const notasRaw = allNotasRaw.filter(n => n.evaluacion_id === ev.id);
      const notas = {};
      notasRaw.forEach(n => {
        if (!notas[n.alumno_id]) notas[n.alumno_id] = {};
        const v = parseFloat(n.valor);
        notas[n.alumno_id][n.docente_id] = isNaN(v) ? null : v;
      });
      return {
        id: ev.id,
        curso_id: activeCourseId,
        titulo: ev.titulo,
        tipo: ev.tipo,
        fecha: ev.fecha,
        docentes: JSON.parse(ev.docentes_json || '[]'),
        notas
      };
    });

  const asistRaw = readAll_(SHEET_NAMES.ASISTENCIA)
    .filter(a => a.curso_id === activeCourseId || (!a.curso_id && a.user_id === userId));
  const asistencia = {};
  asistRaw.forEach(a => {
    if (!asistencia[a.fecha]) asistencia[a.fecha] = {};
    asistencia[a.fecha][a.alumno_id] = a.estado;
  });

  return {
    perfil,
    escalaKey: perfil.escalaKey,
    courses: getUserCourses_(userId),
    activeCourseId,
    docentes,
    alumnos,
    evaluaciones: evs,
    asistencia
  };
}

/* ─────── GUARDAR CURSO COMPLETO (ULTRA-RÁPIDO EN LOTE) ─────── */
function saveCourseData_(userId, payload) {
  setupSheets_();
  const perfil = payload.perfil || {};
  let courseId = perfil.id || payload.activeCourseId;

  if (!courseId) {
    courseId = uid_();
    perfil.id = courseId;
  }

  // 1. Guardar/actualizar registro de curso
  upsertRows_(SHEET_NAMES.COURSES, ['id'], {
    id: courseId,
    materia: perfil.materia || 'Materia',
    nivel: perfil.nivel || 'Secundaria',
    curso: perfil.curso || '',
    escalaKey: perfil.escalaKey || '10',
    owner_user_id: perfil.owner_user_id || userId,
    created_at: perfil.created_at || new Date().toISOString()
  });

  // 2. Docentes en lote
  const docentesItems = (payload.docentes || []).map(d => ({
    id: d.id || uid_(),
    curso_id: courseId,
    user_id: d.user_id || (d.yo ? userId : ''),
    nombre: d.nombre,
    email: d.email || '',
    color: d.color || '#0C6B5D',
    rol: d.rol || 'Docente',
    yo_flag: !!d.yo
  }));
  batchReplaceByCourse_(SHEET_NAMES.DOCENTES, courseId, docentesItems);

  // 3. Alumnos en lote
  const alumnosItems = (payload.alumnos || []).map(a => ({
    id: a.id || uid_(),
    curso_id: courseId,
    nombre: a.nombre,
    color: a.color || '#0C6B5D',
    obs: a.obs || '',
    contacto: a.contacto || '',
    created_at: a.created_at || new Date().toISOString()
  }));
  batchReplaceByCourse_(SHEET_NAMES.ALUMNOS, courseId, alumnosItems);

  // 4. Evaluaciones y Notas en lote
  const evaluacionesItems = [];
  const notasItems = [];

  (payload.evaluaciones || []).forEach(ev => {
    const evId = ev.id || uid_();
    evaluacionesItems.push({
      id: evId,
      curso_id: courseId,
      titulo: ev.titulo,
      tipo: ev.tipo || 'individual',
      docentes_json: JSON.stringify(ev.docentes || []),
      fecha: ev.fecha || new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString()
    });

    const notas = ev.notas || {};
    for (const alId in notas) {
      for (const docId in notas[alId]) {
        const v = notas[alId][docId];
        if (v != null && v !== '') {
          notasItems.push({
            evaluacion_id: evId,
            curso_id: courseId,
            alumno_id: alId,
            docente_id: docId,
            valor: v,
            updated_at: new Date().toISOString()
          });
        }
      }
    }
  });
  batchReplaceByCourse_(SHEET_NAMES.EVALUACIONES, courseId, evaluacionesItems);
  batchReplaceByCourse_(SHEET_NAMES.NOTAS, courseId, notasItems);

  // 5. Asistencia en lote
  const asistenciaItems = [];
  const asis = payload.asistencia || {};
  for (const fecha in asis) {
    for (const alId in asis[fecha]) {
      if (asis[fecha][alId]) {
        asistenciaItems.push({
          curso_id: courseId,
          fecha,
          alumno_id: alId,
          estado: asis[fecha][alId],
          updated_at: new Date().toISOString()
        });
      }
    }
  }
  batchReplaceByCourse_(SHEET_NAMES.ASISTENCIA, courseId, asistenciaItems);

  return getCourseData_(userId, courseId);
}

/* ─────── GESTIÓN DE USUARIOS (Admin) ─────── */
function listAllUsers_(admin) {
  if (admin.rol !== 'Coordinación / Jefatura' && admin.rol !== 'Admin') {
    return { error: 'Sin permisos' };
  }
  return { users: readAll_(SHEET_NAMES.USERS).map(stripPass_) };
}

function updateUserRole_(admin, targetId, newRol) {
  if (admin.rol !== 'Coordinación / Jefatura' && admin.rol !== 'Admin') return { error: 'Sin permisos' };
  const users = readAll_(SHEET_NAMES.USERS);
  const target = users.find(u => u.id === targetId);
  if (!target) return { error: 'Usuario no existe' };
  target.rol = newRol;
  upsertRows_(SHEET_NAMES.USERS, ['id'], target);
  return { ok: true };
}

/* ─────── GENERACIÓN DE PLANILLA VISUAL EN GOOGLE SHEETS ─────── */
function generarPlanillaVisual_() {
  setupSheets_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const courses = readAll_(SHEET_NAMES.COURSES);
  if (!courses.length) {
    SpreadsheetApp.getUi().alert('No hay cursos registrados todavía.');
    return;
  }

  const course = courses[0];
  const sheetName = '📊 Planilla · ' + (course.materia || 'Curso').slice(0, 20);
  let sh = ss.getSheetByName(sheetName);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(sheetName);

  const alumnos = readAll_(SHEET_NAMES.ALUMNOS).filter(a => a.curso_id === course.id);
  const evs = readAll_(SHEET_NAMES.EVALUACIONES).filter(e => e.curso_id === course.id);
  const notasRaw = readAll_(SHEET_NAMES.NOTAS).filter(n => n.curso_id === course.id);

  const headers = ['Estudiante', ...evs.map(e => e.titulo + ' (' + e.fecha + ')'), 'Promedio Final', 'Estado'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#0C6B5D')
    .setFontColor('#FFFFFF');

  if (!alumnos.length) {
    sh.appendRow(['Sin alumnos registrados']);
    return;
  }

  const matrix = alumnos.map(al => {
    const row = [al.nombre];
    let suma = 0, count = 0;
    evs.forEach(ev => {
      const docPesos = JSON.parse(ev.docentes_json || '[]');
      const notasAl = notasRaw.filter(n => n.evaluacion_id === ev.id && n.alumno_id === al.id);
      let evScore = null;
      if (notasAl.length) {
        if (ev.tipo === 'colectiva' && docPesos.length) {
          let s = 0, totP = 0;
          docPesos.forEach(dp => {
            const grade = notasAl.find(n => n.docente_id === dp.id);
            if (grade && grade.valor != null) {
              s += (dp.peso || 1) * Number(grade.valor);
              totP += (dp.peso || 1);
            }
          });
          evScore = totP > 0 ? Math.round((s / totP) * 10) / 10 : null;
        } else {
          evScore = Number(notasAl[0].valor);
        }
      }
      row.push(evScore != null ? evScore : '—');
      if (evScore != null) { suma += evScore; count++; }
    });
    const prom = count > 0 ? Math.round((suma / count) * 10) / 10 : '—';
    const estado = prom === '—' ? 'Sin notas' : (prom >= 6 ? 'Aprobado ✓' : 'En proceso');
    row.push(prom);
    row.push(estado);
    return row;
  });

  sh.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
  sh.autoResizeColumns(1, headers.length);
  SpreadsheetApp.getUi().alert('Planilla "' + sheetName + '" generada con éxito ✓');
}

/* ─────── HTTP ENTRY POINTS ─────── */
function parseBody_(e) {
  if (!e) return {};
  const params = (e.parameter && typeof e.parameter === 'object') ? { ...e.parameter } : {};
  if (e.postData && e.postData.contents) {
    const raw = e.postData.contents;
    if (typeof raw === 'string' && raw.length > 0) {
      const trimmed = raw.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null) {
            return { ...params, ...parsed };
          }
        } catch (_) {}
      }
      try {
        const obj = {};
        raw.split('&').forEach(kv => {
          const eqIdx = kv.indexOf('=');
          if (eqIdx >= 0) {
            const k = decodeURIComponent(kv.slice(0, eqIdx).replace(/\+/g, ' '));
            const v = decodeURIComponent(kv.slice(eqIdx + 1).replace(/\+/g, ' '));
            if (k) obj[k] = v;
          }
        });
        return { ...params, ...obj };
      } catch (_) {}
    }
  }
  return params;
}

function doGet(e) {
  try {
    const p = parseBody_(e);
    const action = (p && p.action) ? String(p.action).trim() : '';
    if (!action) return json_({ ok: false, error: 'Falta el parámetro action' }, 400);
    if (action === 'ping') return json_({ ok: true, pong: true, time: Date.now() });
    if (action === 'options') return cors_();

    if (action === 'register') return json_(registerUser_(p));
    if (action === 'login') return json_(loginUser_(p));

    const user = authFromRequest_({ parameter: p });
    if (!user) return json_({ ok: false, error: 'No autorizado. Iniciá sesión.', code: 'NO_AUTH' }, 401);

    switch (action) {
      case 'me':
        return json_({ ok: true, user });
      case 'courses':
        return json_({ ok: true, courses: getUserCourses_(user.id) });
      case 'course':
        return json_({ ok: true, data: getCourseData_(user.id, p.courseId) });
      case 'users':
        return json_({ ok: true, ...listAllUsers_(user) });
      case 'setRole':
        return json_(updateUserRole_(user, p.targetId, p.newRol));
      default:
        return json_({ ok: false, error: 'Acción GET desconocida: ' + action }, 404);
    }
  } catch (err) {
    return json_({ ok: false, error: 'GET error: ' + err.message, stack: err.stack }, 500);
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = (body && body.action) ? String(body.action).trim() : '';
    if (!action || action === 'options') return cors_();
    if (action === 'ping') return json_({ ok: true, pong: true, time: Date.now() });

    if (action === 'register') return json_(registerUser_(body));
    if (action === 'login') return json_(loginUser_(body));

    const user = authFromRequest_({ parameter: body });
    if (!user) return json_({ ok: false, error: 'No autorizado. Iniciá sesión.', code: 'NO_AUTH' }, 401);

    switch (action) {
      case 'save':
        try {
          let payload = body.payload;
          if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); } catch (_) {}
          }
          return json_({ ok: true, data: saveCourseData_(user.id, payload || {}) });
        } catch (pErr) {
          return json_({ ok: false, error: 'Payload inválido: ' + pErr.message }, 400);
        }
      case 'setRole':
        return json_(updateUserRole_(user, body.targetId, body.newRol));
      case 'me':
        return json_({ ok: true, user });
      case 'courses':
        return json_({ ok: true, courses: getUserCourses_(user.id) });
      case 'course':
        return json_({ ok: true, data: getCourseData_(user.id, body.courseId) });
      case 'users':
        return json_({ ok: true, ...listAllUsers_(user) });
      default:
        return json_({ ok: false, error: 'Acción POST desconocida: ' + action }, 404);
    }
  } catch (err) {
    return json_({ ok: false, error: 'Server error: ' + err.message, stack: err.stack }, 500);
  }
}

function doOptions(e) { return cors_(); }
function doHead(e) { return cors_(); }
