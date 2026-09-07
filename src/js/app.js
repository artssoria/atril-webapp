/* ═══════════════════════════════════════════════════════════
   ATRIL · FRONTEND APP (v3.1 SaaS & Academic Grade)
   - Arquitectura Local-First con UI Optimista (0ms de latencia)
   - Dashboard Multi-Columna para Escritorio + Experiencia Móvil
   - Matriz Interactiva de Calificaciones (Gradebook Spreadsheet)
   - Master-Detail Split View para Estudiantes con Dossier Fijo
   - CRUD Completo de Docentes (Editar, Eliminar, Roles, Ponderaciones)
   - Conexión Directa a WhatsApp (wa.me) & Correo (mailto)
   - Reporte Oficial Estructurado para PDF / Impresión con Firmas
   - Radar de Alumnos en Riesgo Pedagógico & Alertas Tempranas
   - Command Palette (Ctrl+K) & Atajos de Productividad
   - Soporte de Temas (Modo Oscuro / Modo Claro)
   - Importador Masivo (Excel/CSV/Texto) & Exportación CSV
   ═══════════════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ═════════ SWEETALERT 2 CUSTOM INTEGRATION ═════════ */
const AtrilSwal = {
  isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  },
  baseConfig() {
    const dark = this.isDark();
    return {
      background: dark ? '#0F2629' : '#FFFFFF',
      color: dark ? '#ECF3F2' : '#0B1C1E',
      customClass: {
        popup: 'atril-swal-popup',
        title: 'atril-swal-title',
        htmlContainer: 'atril-swal-html',
        confirmButton: 'btn btn-p atril-swal-confirm',
        cancelButton: 'btn btn-s atril-swal-cancel',
        denyButton: 'btn btn-danger atril-swal-deny'
      },
      buttonsStyling: false,
      focusCancel: true
    };
  },
  async confirm({ title = '¿Estás seguro?', text = '', icon = 'question', confirmText = 'Continuar', cancelText = 'Cancelar' }) {
    if (typeof Swal === 'undefined') {
      return window.confirm(`${title}\n${text}`);
    }
    const res = await Swal.fire({
      ...this.baseConfig(),
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText
    });
    return !!res.isConfirmed;
  },
  async danger({ title = '¿Estás seguro?', text = '', confirmText = '🗑 Sí, eliminar', cancelText = 'Cancelar' }) {
    if (typeof Swal === 'undefined') {
      return window.confirm(`${title}\n${text}`);
    }
    const res = await Swal.fire({
      ...this.baseConfig(),
      title,
      text,
      icon: 'warning',
      iconColor: '#DE4C28',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: {
        popup: 'atril-swal-popup',
        title: 'atril-swal-title',
        htmlContainer: 'atril-swal-html',
        confirmButton: 'btn btn-danger atril-swal-confirm',
        cancelButton: 'btn btn-s atril-swal-cancel'
      }
    });
    return !!res.isConfirmed;
  },
  async success(title, text = '') {
    if (typeof Swal === 'undefined') {
      toast(title, 'ok');
      return;
    }
    return Swal.fire({
      ...this.baseConfig(),
      title,
      text,
      icon: 'success',
      iconColor: '#0C6B5D',
      timer: 2200,
      showConfirmButton: false
    });
  },
  async info(title, text = '') {
    if (typeof Swal === 'undefined') {
      toast(title, 'ok');
      return;
    }
    return Swal.fire({
      ...this.baseConfig(),
      title,
      text,
      icon: 'info',
      iconColor: '#1C6EAA',
      confirmButtonText: 'Entendido'
    });
  }
};

const LS_KEYS = {
  COURSE: 'atril-course-v3',
  COURSES_LIST: 'atril-courses-list-v3',
  TOKEN: 'atril-token-v1',
  API_URL: 'atril-api-url-v1',
  USER: 'atril-user-v1',
  DEMO: 'atril-demo-mode-v1',
  THEME: 'atril-theme-v1',
  DDJJ: 'atril-ddjj-v4',
  LICENCIAS: 'atril-licencias-v4'
};

const PALETTE = ['#0C6B5D', '#E69600', '#DE4C28', '#1C6EAA', '#6E4598', '#15B89F', '#C2456E', '#2E77AE'];
const ESCALAS = {
  '10': { max: 10, paso: 0.5, aprob: 6 },
  '100': { max: 100, paso: 1, aprob: 60 },
  '7': { max: 7, paso: 0.5, aprob: 4 }
};
const ROLES_ADMIN = ['Coordinación / Jefatura', 'Admin', 'Coordinación', 'Jefatura'];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const localISO = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const diasAtras = k => localISO(new Date(Date.now() - k * 864e5));
const fmt = (iso, o = { day: 'numeric', month: 'short' }) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('es', o);
};
const cap = s => (s || '').charAt(0).toUpperCase() + (s || '').slice(1);
const ini = n => (n || '').trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();

/* ═════════ COMUNICACIÓN DIRECTA (WHATSAPP & EMAIL) ═════════ */
function limpiarTelefono(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  // Si empieza con 0 (ej: 011... en Argentina), quitamos el 0
  if (digits.startsWith('0')) digits = digits.slice(1);
  // Si no tiene código de país (10 dígitos en Argentina como 1145678901), agregamos 549
  if (digits.length === 10 && (digits.startsWith('11') || digits.startsWith('15') || digits.startsWith('2') || digits.startsWith('3') || digits.startsWith('9'))) {
    digits = '549' + digits;
  }
  return digits;
}

function getWhatsAppUrl(telefono, mensaje = '') {
  const clean = limpiarTelefono(telefono);
  if (!clean) return '';
  return `https://wa.me/${clean}?text=${encodeURIComponent(mensaje)}`;
}

function getEmailUrl(email, asunto = '', cuerpo = '') {
  if (!email || !email.includes('@')) return '';
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

/* ═════════ ESTADO GLOBAL ═════════ */
let S = null;
let tab = 'inicio';
let calEv = null;
let calDoc = null;
let filtroNotas = 'todas';
let filtroAl = '';
let criterioOrdenAlumnos = 'az';
let fechaAsist = localISO();
let authMode = 'login';
let demoMode = !!localStorage.getItem(LS_KEYS.DEMO);
let syncT = null;
const SYNC_DEBOUNCE = 1500;

let alumnoSeleccionadoMaster = null;
let vistaNotasModo = 'matrix';
let colorSeleccionadoNuevoAl = PALETTE[0];
let colorSeleccionadoEditAl = PALETTE[0];
let colorSeleccionadoDoc = PALETTE[2];
let colorSeleccionadoEditDoc = PALETTE[2];

let listaImportacionPendiente = [];
let modoImportacionMerge = 'append';

/* ═══════════════════════════════════════════════════════════
   ATRIL 5.0: SUPABASE PRODUCTION CLOUD ENGINE
   - Arquitectura Segura con Variables de Entorno
   - Inyección en Build (Netlify/CI) + config.js local (protegido por .gitignore)
   - Sincronización Dual: Snapshot JSONB (0ms) + Persistencia Relacional
   ═══════════════════════════════════════════════════════════ */

const getSupabaseConfig = () => {
  const env = (typeof window !== 'undefined' && window.__ENV__) || {};
  const localCfg = (typeof window !== 'undefined' && window.ATRIL_CONFIG) || {};
  const proc = (typeof process !== 'undefined' && process.env) || {};

  return {
    url: env.SUPABASE_URL || localCfg.SUPABASE_URL || proc.SUPABASE_URL || "https://avpdyesbyzxterlfxsou.supabase.co",
    anonKey: env.SUPABASE_ANON_KEY || localCfg.SUPABASE_ANON_KEY || proc.SUPABASE_ANON_KEY || "",
    autoSync: true
  };
};

const SUPABASE_CONFIG = getSupabaseConfig();

const SB = {
  initialized: false,
  client: null,
  realtimeChannel: null,
  isRemoteUpdating: false,
  lastSyncTime: null,

  async init() {
    try {
      if (typeof supabase === 'undefined' || !supabase.createClient) {
        console.warn('⚡ Supabase JS SDK no disponible en el cliente.');
        this.updateStatusBadge('offline');
        return false;
      }

      if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.warn('🔒 [ATRIL Security] Claves de Supabase no configuradas o vacías. Operando en modo de almacenamiento local protegido.');
        this.updateStatusBadge('offline');
        return false;
      }

      this.client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
        realtime: { params: { eventsPerSecond: 10 } }
      });

      this.initialized = true;
      this.updateStatusBadge('ok');

      if (SUPABASE_CONFIG.autoSync) {
        this.startRealtimeListener();
      }

      console.log('⚡ Supabase 5.0 (PostgreSQL + Realtime) conectado de forma segura.');
      return true;
    } catch (err) {
      console.error('⚡ Error inicializando Supabase:', err);
      this.updateStatusBadge('err');
      return false;
    }
  },

  updateStatusBadge(state) {
    const chip = $('#sb-status-chip');
    if (chip) {
      if (state === 'ok') {
        chip.className = 'chip c-teal';
        chip.innerHTML = '⚡ Conectado en Tiempo Real';
      } else if (state === 'sync') {
        chip.className = 'chip c-amber';
        chip.innerHTML = '⚡ Sincronizando…';
      } else if (state === 'err') {
        chip.className = 'chip c-coral';
        chip.innerHTML = '⚠️ Sin conexión remota';
      } else {
        chip.className = 'chip c-gray';
        chip.innerHTML = 'Local';
      }
    }

    if (state === 'ok') {
      setSync('ok', '⚡ Supabase en vivo');
    }
  },

  startRealtimeListener() {
    if (!this.client || !this.initialized) return;
    if (this.realtimeChannel) {
      try { this.client.removeChannel(this.realtimeChannel); } catch (_) {}
      this.realtimeChannel = null;
    }

    const courseId = S?.activeCourseId || S?.perfil?.id || 'curso-atril-default';

    try {
      this.realtimeChannel = this.client
        .channel(`live_course_${courseId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_courses_data', filter: `id=eq.${courseId}` },
          payload => {
            if (this.isRemoteUpdating) return;
            const record = payload?.new;
            if (record && record.data && record.data.alumnos && Array.isArray(record.data.alumnos)) {
              console.log('⚡ Actualización remota recibida vía Supabase Realtime, refrescando vista...');
              this.isRemoteUpdating = true;
              S = normalizeFromCloud(record.data);
              try {
                localStorage.setItem(LS_KEYS.COURSE, JSON.stringify(S));
              } catch (_) {}
              renderAll();
              this.isRemoteUpdating = false;
              toast('⚡ Actualizado en tiempo real desde Supabase', 'ok');
            }
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            this.updateStatusBadge('ok');
          }
        });
    } catch (e) {
      console.warn('⚡ No se pudo vincular escucha Realtime:', e);
    }
  },

  async syncCourseToSupabase(courseData) {
    if (!this.initialized || !this.client || this.isRemoteUpdating) return;
    if (!courseData) return;

    const courseId = courseData?.activeCourseId || courseData?.perfil?.id || 'curso-atril-default';

    try {
      this.updateStatusBadge('sync');
      const cleanData = JSON.parse(JSON.stringify(courseData));
      cleanData._updatedAt = Date.now();

      // 1. Snapshot de Alta Velocidad (0ms) en app_courses_data
      const snapshotPayload = {
        id: courseId,
        data: cleanData,
        materia: courseData.perfil?.materia || '',
        curso: courseData.perfil?.curso || '',
        nivel: courseData.perfil?.nivel || 'Secundario',
        docente: (courseData.docentes || []).find(d => d.yo)?.nombre || courseData.perfil?.docenteTitular || '',
        updated_at: new Date().toISOString()
      };

      await this.client
        .from('app_courses_data')
        .upsert(snapshotPayload, { onConflict: 'id' });

      // 2. Persistencia Relacional Complementaria (asíncrona)
      this._syncRelationalTables(courseId, courseData).catch(e => console.warn('Sync relacional:', e));

      this.lastSyncTime = Date.now();
      this.updateStatusBadge('ok');
    } catch (err) {
      console.error('⚡ Error guardando en Supabase:', err);
      this.updateStatusBadge('err');
    }
  },

  async _syncRelationalTables(courseId, courseData) {
    if (!this.client) return;
    const p = courseData.perfil || {};

    // Courses table
    await this.client.from('courses').upsert({
      id: courseId,
      materia: p.materia || 'Sin materia',
      curso: p.curso || 'Sin curso',
      nivel: p.nivel || 'Secundario',
      escala_key: courseData.escalaKey || '10',
      periodo: p.periodo || '1° Cuatrimestre',
      ciclo_lectivo: p.ciclo || '2026',
      docente_titular: p.docenteTitular || '',
      institucion: p.institucion || '',
      meta: { ponderaciones: courseData.ponderaciones || {}, asistConfig: courseData.asistConfig || {} }
    }, { onConflict: 'id' });

    // Alumnos table
    if (Array.isArray(courseData.alumnos) && courseData.alumnos.length) {
      const rowsAl = courseData.alumnos.map(a => ({
        id: a.id,
        curso_id: courseId,
        nombre: a.nombre,
        dni: a.dni || '',
        telefono: a.telefono || '',
        email: a.email || '',
        color: a.color || '#0C6B5D',
        obs: a.obs || '',
        contacto: a.contacto || ''
      }));
      await this.client.from('alumnos').upsert(rowsAl, { onConflict: 'id' });
    }

    // Evaluaciones table
    if (Array.isArray(courseData.evaluaciones) && courseData.evaluaciones.length) {
      const rowsEv = courseData.evaluaciones.map(ev => ({
        id: ev.id,
        curso_id: courseId,
        titulo: ev.titulo,
        tipo: ev.tipo || 'individual',
        fecha: ev.fecha || '',
        docentes: ev.docentes || [],
        notas: ev.notas || {},
        rubricas: ev.rubricas || []
      }));
      await this.client.from('evaluaciones').upsert(rowsEv, { onConflict: 'id' });
    }
  }
};

async function forzarSincronizacionNube() {
  if (!SB.initialized) {
    showLoad('Conectando con Supabase…');
    await SB.init();
    hideLoad();
  }

  if (SB.initialized && S) {
    showLoad('Sincronizando con Supabase…');
    await SB.syncCourseToSupabase(S);
    hideLoad();
    AtrilSwal.success('Sincronización Exitosa ⚡', 'Tus materias, alumnos, notas y asistencias están respaldados y sincronizados en tiempo real en Supabase.');
  } else {
    toast('Servicio Supabase activo ⚡', 'ok');
  }
}


/* ═════════ SISTEMA DE TEMAS (DARK / LIGHT) ═════════ */
function initTheme() {
  const saved = localStorage.getItem(LS_KEYS.THEME) || 'light';
  setTheme(saved);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(LS_KEYS.THEME, theme);
  const isDark = theme === 'dark';
  const label = $('#theme-btn-label');
  if (label) label.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
  const mobBtn = $('#mobile-theme-toggle');
  if (mobBtn) mobBtn.textContent = isDark ? '☀️' : '🌙';
}

function toggleTheme() {
  const curr = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(curr === 'dark' ? 'light' : 'dark');
}

/* ═════════ UI HELPERS & NOTIFICACIONES ═════════ */
function showLoad(txt = 'Cargando…') {
  $('#loading-text').textContent = txt;
  $('#loading').classList.add('show');
}
function hideLoad() {
  $('#loading').classList.remove('show');
}

function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + (kind || '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), 2400);
  setTimeout(() => t.remove(), 2800);
}

function setSync(state, txt) {
  const pill = $('#sync-pill');
  const mobPill = $('#mobile-sync-pill');
  const txtEl = $('#sync-pill-text');

  const defaultTxt = (state === 'ok' ? 'Sincronizado ✓' : state === 'sync' ? 'Guardando…' : state === 'err' ? 'Error al guardar' : state === 'off' ? 'Local' : 'Local');
  const label = txt || defaultTxt;

  if (pill) {
    pill.className = 'sync-pill ' + state;
    if (txtEl) txtEl.textContent = label;
  }
  if (mobPill) {
    mobPill.className = 'sync-pill ' + state;
  }
}

function abrir(sel) { $(sel)?.classList.add('open'); }
function cerrarAll() {
  $$('.overlay').forEach(o => o.classList.remove('open'));
  cerrarCmd();
}

/* ═════════ API LAYER (Google Apps Script) ═════════ */
const API = {
  get url() { return localStorage.getItem(LS_KEYS.API_URL) || ''; },
  set url(v) { localStorage.setItem(LS_KEYS.API_URL, (v || '').trim()); },
  get token() { return localStorage.getItem(LS_KEYS.TOKEN) || ''; },
  set token(v) { if (v) localStorage.setItem(LS_KEYS.TOKEN, v); else localStorage.removeItem(LS_KEYS.TOKEN); },
  get user() { try { return JSON.parse(localStorage.getItem(LS_KEYS.USER) || 'null'); } catch (e) { return null; } },
  set user(v) { if (v) localStorage.setItem(LS_KEYS.USER, JSON.stringify(v)); else localStorage.removeItem(LS_KEYS.USER); },

  async _req(method, params, body, retries = 1) {
    const base = this.url;
    if (!base) return { ok: false, error: 'Sin URL de API configurada', code: 'NO_API_URL' };

    const mergedParams = { ...(params || {}) };
    if (!mergedParams.token && this.token) mergedParams.token = this.token;

    let fetchOpts = {};
    let url = base;

    if (method === 'GET' || method === 'HEAD') {
      if (body) {
        Object.keys(body).forEach(k => {
          if (body[k] != null) {
            mergedParams[k] = typeof body[k] === 'object' ? JSON.stringify(body[k]) : String(body[k]);
          }
        });
      }
      const sep = base.includes('?') ? '&' : '?';
      const qs = new URLSearchParams(mergedParams).toString();
      url = base + (qs ? sep + qs : '');
      fetchOpts = { method: 'GET', mode: 'cors', redirect: 'follow' };
    } else {
      const sep = base.includes('?') ? '&' : '?';
      const qs = new URLSearchParams(mergedParams).toString();
      url = base + (qs ? sep + qs : '');

      const fd = new URLSearchParams();
      const merged = { ...(body || {}) };
      if (this.token && !merged.token) fd.append('token', this.token);
      Object.keys(merged).forEach(k => {
        if (merged[k] == null) return;
        const v = typeof merged[k] === 'object' ? JSON.stringify(merged[k]) : String(merged[k]);
        fd.append(k, v);
      });

      fetchOpts = {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: fd.toString()
      };
    }

    let lastErr = null;
    for (let i = 0; i <= retries; i++) {
      try {
        const raw = await fetch(url, fetchOpts);
        let data = {};
        try {
          data = await raw.json();
        } catch (_) {
          try {
            const text = await raw.text();
            data = text ? { ok: raw.ok, raw: text } : { ok: raw.ok, status: raw.status };
          } catch (_2) {
            data = { ok: raw.ok, status: raw.status };
          }
        }
        if (raw.ok && (typeof data !== 'object' || data.ok !== false)) {
          return typeof data === 'object' ? data : { ok: raw.ok, data };
        }
        if (data && (data.code === 'NO_AUTH' || (data.error && String(data.error).toLowerCase().includes('no autorizado')))) {
          this.token = ''; this.user = null;
          return { ok: false, error: data.error || 'Sesión expirada', code: 'NO_AUTH' };
        }
        return data;
      } catch (err) {
        lastErr = err;
        if (i < retries) await new Promise(r => setTimeout(r, 400 + i * 500));
      }
    }
    return { ok: false, error: 'Sin conexión: ' + (lastErr ? lastErr.message : 'desconocido'), code: 'NETWORK' };
  },

  async ping() { return this._req('GET', { action: 'ping' }, null, 2); },
  async login(email, password) { return this._req('GET', { action: 'login' }, { email, password }, 1); },
  async register(data) { return this._req('GET', { action: 'register' }, data, 1); },
  async me() { return this._req('GET', { action: 'me' }, null, 1); },
  async getCourses() { return this._req('GET', { action: 'courses' }, null, 1); },
  async getCourse(courseId) { return this._req('GET', { action: 'course', courseId }, null, 1); },
  async saveCourse(payload) { return this._req('POST', { action: 'save' }, { payload }, 1); },
  async listUsers() { return this._req('GET', { action: 'users' }, null, 1); },
  async setRole(targetId, newRol) { return this._req('GET', { action: 'setRole' }, { targetId, newRol }, 1); }
};

function isOnline() { return !!navigator.onLine && !!API.url && !!API.token; }

/* ═════════ PERSISTENCIA OPTIMISTA (Local-First + Background Sync) ═════════ */
const save = () => {
  try {
    localStorage.setItem(LS_KEYS.COURSE, JSON.stringify(S));
    if (S?.courses) localStorage.setItem(LS_KEYS.COURSES_LIST, JSON.stringify(S.courses));
  } catch (e) {}

  // Sincronización en tiempo real con Supabase (PostgreSQL + Realtime)
  if (typeof SB !== 'undefined' && SB.initialized) {
    SB.syncCourseToSupabase(S);
  }

  if (isOnline() && !demoMode) {
    clearTimeout(syncT);
    setSync('sync', 'Guardando…');
    syncT = setTimeout(async () => {
      try {
        const r = await API.saveCourse(S);
        if (r.ok) {
          setSync('ok', 'Sincronizado ✓');
          if (r.data && r.data.courses) S.courses = r.data.courses;
        } else {
          setSync('err', 'Sin sincronizar');
        }
      } catch (_) {
        setSync('err', 'Sin sincronizar');
      }
    }, SYNC_DEBOUNCE);
  } else {
    setSync('off', demoMode ? 'Demo local' : 'Local');
  }
};

const load = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEYS.COURSE)) || null; } catch (e) { return null; }
};
const ESC = () => ESCALAS[S?.escalaKey || '10'] || ESCALAS['10'];

/* ═════════ DATOS DEMO / SEED ═════════ */
function seed(perfil, extra) {
  const e = ESCALAS[perfil.escalaKey || '10'];
  const cId = perfil.id || uid();
  const nombres = [
    'Valentina Ríos', 'Mateo Fernández', 'Camila Sosa', 'Thiago Aguirre',
    'Lucía Peralta', 'Bruno Cabrera', 'Emma Domínguez', 'Felipe Navarro',
    'Isabella Molina', 'Joaquín Vega', 'Martina Salas', 'Dante Herrera'
  ];
  const dnis = [
    '34.635.700', '47.813.769', '47.438.755', '39.198.177',
    '40.525.548', '47.719.254', '48.143.102', '48.805.128',
    '47.317.463', '48.804.772', '36.370.716', '46.598.765'
  ];
  const alumnos = nombres.map((nombre, i) => ({
    id: uid(),
    curso_id: cId,
    nombre,
    dni: dnis[i % dnis.length],
    telefono: '11' + (45000000 + i * 111111),
    email: `${nombre.toLowerCase().replace(/\s+/g, '.')}@familia.edu`,
    color: PALETTE[(i + 3) % 8],
    obs: i === 0 ? 'Excelente participación y entregas' : (i === 3 ? 'Requiere seguimiento en trabajos prácticos' : ''),
    contacto: 'Tutor: ' + nombre.split(' ')[1]
  }));
  const yo = { id: uid(), curso_id: cId, nombre: perfil.nombre || 'Docente', email: 'docente@escuela.edu', telefono: '1198765432', color: '#0C6B5D', yo: true, rol: perfil.rol || 'Titular' };
  const docentes = [
    yo,
    { id: uid(), curso_id: cId, nombre: 'Diego Ruiz', email: 'diego@escuela.edu', telefono: '1133445566', color: '#1C6EAA', rol: 'Co-titular' },
    { id: uid(), curso_id: cId, nombre: 'Sofía Herrera', email: 'sofia@escuela.edu', telefono: '1177889900', color: '#C2456E', rol: 'Co-titular' },
    ...(extra || []).filter(Boolean).map((n, i) => ({ id: uid(), curso_id: cId, nombre: n, email: `${n.toLowerCase().replace(/\s+/g, '')}@escuela.edu`, telefono: '', color: PALETTE[(i + 4) % 8], rol: 'Co-titular' }))
  ];
  const [_, d1, d2] = docentes;
  const val = f => Math.round(f * e.max / e.paso) * e.paso;
  const fr = [.92, .78, .66, .85, .44, .71, .58, .88, .74, .53, .95, .62];
  const n1 = {}, n2 = {};
  alumnos.forEach((a, i) => {
    n1[a.id] = { [yo.id]: val(fr[i]) };
    n2[a.id] = { [yo.id]: val(fr[(i + 2) % 12] * .9 + .05), [d1.id]: val(fr[(i + 5) % 12] * .9 + .05) };
    if (i % 4 !== 0) n2[a.id][d2.id] = val(fr[(i + 8) % 12] * .9 + .05);
  });
  const evaluaciones = [
    { id: uid(), curso_id: cId, titulo: 'Diagnóstico inicial', tipo: 'individual', docentes: [{ id: yo.id, peso: 100 }], fecha: diasAtras(14), notas: n1 },
    { id: uid(), curso_id: cId, titulo: 'TP integrador colaborativo', tipo: 'colectiva', docentes: [{ id: yo.id, peso: 50 }, { id: d1.id, peso: 25 }, { id: d2.id, peso: 25 }], fecha: diasAtras(6), notas: n2 },
    { id: uid(), curso_id: cId, titulo: 'Examen parcial · nota compartida', tipo: 'colectiva', docentes: [{ id: yo.id, peso: 40 }, { id: d1.id, peso: 30 }, { id: d2.id, peso: 30 }], fecha: localISO(), notas: {} }
  ];
  const asistencia = {};
  [0, 1, 2, 3].forEach(k => {
    const f = diasAtras(k);
    asistencia[f] = {};
    alumnos.forEach((a, i) => {
      asistencia[f][a.id] = k === 0 ? (i === 3 ? 'A' : i === 7 ? 'T' : 'P')
        : (((i + k) % 8 === 0) ? 'A' : ((i + k) % 5 === 0) ? 'T' : 'P');
    });
  });
  return {
    perfil: { id: cId, ...perfil },
    escalaKey: perfil.escalaKey || '10',
    courses: [{ id: cId, materia: perfil.materia, curso: perfil.curso, nivel: perfil.nivel, escalaKey: perfil.escalaKey }],
    activeCourseId: cId,
    docentes,
    alumnos,
    evaluaciones,
    asistencia
  };
}

/* ═════════ CÁLCULOS & PONDERACIONES ═════════ */
function pesos(ev) {
  const t = (ev.docentes || []).reduce((s, d) => s + (+d.peso || 0), 0) || 1;
  const m = {};
  (ev.docentes || []).forEach(d => { m[d.id] = (+d.peso || 0) / t * 100; });
  return m;
}
const notaDoc = (ev, al, d) => (ev && ev.notas && ev.notas[al] && ev.notas[al][d] != null) ? ev.notas[al][d] : null;
function red1(x) { if (x == null) return x; return ESC().max === 100 ? Math.round(x) : Math.round(x * 10) / 10; }
function finalDe(ev, al) {
  const p = pesos(ev);
  let s = 0, h = false;
  for (const d of (ev.docentes || [])) {
    const v = notaDoc(ev, al, d.id);
    if (v == null) continue;
    s += p[d.id] / 100 * v;
    h = true;
  }
  return h ? red1(s) : null;
}
function promedioAlumno(al) {
  const f = (S?.evaluaciones || []).map(ev => finalDe(ev, al)).filter(v => v != null);
  return f.length ? f.reduce((a, b) => a + b, 0) / f.length : null;
}
function asistAl(al) {
  let t = 0, p = 0, aCount = 0, tCount = 0, pCount = 0;
  for (const f in (S?.asistencia || {})) {
    const v = S.asistencia[f][al];
    if (!v) continue;
    t++;
    if (v === 'P') { p += 1; pCount++; }
    else if (v === 'T') { p += 0.5; tCount++; }
    else if (v === 'A') { aCount++; }
  }
  return {
    pct: t ? Math.round(p / t * 100) : null,
    total: t, presentes: pCount, tardes: tCount, ausentes: aCount
  };
}
function promedioClase() {
  const v = (S?.alumnos || []).map(a => promedioAlumno(a.id)).filter(x => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function pctAsistencia(f) {
  const m = (S?.asistencia || {})[f] || {};
  const vs = Object.values(m);
  if (!vs.length) return null;
  return Math.round(vs.reduce((s, v) => s + ((v === 'P') ? 1 : (v === 'T' ? 0.5 : 0)), 0) / vs.length * 100);
}
function claseNota(v) {
  if (v == null || isNaN(v)) return '';
  const e = ESC(), r = v / e.max, ap = e.aprob / e.max;
  return r >= (ap + (1 - ap) * 0.5) ? 'n-ok' : r >= ap ? 'n-med' : 'n-bad';
}
const docenteDe = id => (S?.docentes || []).find(d => d.id === id);
const yo = () => (S?.docentes || []).find(d => d.yo) || (S?.docentes || [])[0];
function estadoEv(ev) {
  const n = (S?.alumnos || []).length;
  let fin = 0, alg = 0;
  (S?.alumnos || []).forEach(a => {
    if (finalDe(ev, a.id) != null) fin++;
    if ((ev.docentes || []).some(d => notaDoc(ev, a.id, d.id) != null)) alg++;
  });
  return { fin, alg, n, txt: alg === 0 ? 'Para calificar' : fin === n ? 'Completada' : 'En curso' };
}
function avStack(ev, sz = 'av-s') {
  return '<span class="av-stack">' + (ev.docentes || []).map(d => {
    const dc = docenteDe(d.id);
    return dc ? `<span class="av ${sz}" style="background:${dc.color}" title="${esc(dc.nombre)} (${d.peso || ''}%)">${ini(dc.nombre)}</span>` : '';
  }).join('') + '</span>';
}

/* ═════════ RENDERERS PRINCIPALES ═════════ */
function anima(el, fin, dec = 0) {
  if (!el) return;
  if (fin == null || isNaN(fin)) { el.textContent = '—'; return; }
  const t0 = performance.now();
  (function paso(t) {
    const k = Math.min(1, (t - t0) / 450);
    const v = fin * (1 - Math.pow(1 - k, 3));
    el.textContent = v.toFixed(dec);
    if (k < 1) requestAnimationFrame(paso);
  })(t0);
}

function renderColorPickers() {
  const pintar = (wrapId, selColor, onPick) => {
    const el = $(wrapId);
    if (!el) return;
    el.innerHTML = PALETTE.map(c => `
      <div class="color-dot ${c.toLowerCase() === (selColor || '').toLowerCase() ? 'selected' : ''}"
           style="background:${c}" data-color="${c}"></div>
    `).join('');
    el.querySelectorAll('.color-dot').forEach(dot => {
      dot.onclick = () => {
        el.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        onPick(dot.dataset.color);
      };
    });
  };
  pintar('#na-colores', colorSeleccionadoNuevoAl, c => colorSeleccionadoNuevoAl = c);
  pintar('#ea-colores', colorSeleccionadoEditAl, c => colorSeleccionadoEditAl = c);
  pintar('#nd-colores', colorSeleccionadoDoc, c => colorSeleccionadoDoc = c);
  pintar('#ed-colores', colorSeleccionadoEditDoc, c => colorSeleccionadoEditDoc = c);
}

function renderSidebarAndHeader() {
  if (!S) return;
  const mat = S.perfil?.materia || 'Materia';
  const cur = S.perfil?.curso ? S.perfil.curso : 'División';
  const escTxt = `Escala 1 a ${ESC().max}`;

  // Sidebar
  $('#sb-materia-nombre').textContent = mat;
  $('#sb-materia-meta').textContent = `${cur} · ${escTxt}`;

  // Topbar
  $('#dt-course-title').textContent = `${mat} (${cur})`;
  $('#in-materia-badge').textContent = mat;

  const y = yo();
  if (y) {
    $('#sb-user-name').textContent = y.nombre;
    $('#sb-user-role').textContent = y.rol || 'Titular';
    const av = $('#sb-user-avatar');
    if (av) { av.textContent = ini(y.nombre); av.style.background = y.color; }
    const mobAv = $('#mobile-avatar');
    if (mobAv) { mobAv.textContent = ini(y.nombre); mobAv.style.background = y.color; mobAv.style.color = '#fff'; }
  }
}

function renderInicio() {
  if (!S) return;
  renderSidebarAndHeader();
  const h = new Date().getHours();
  $('#in-fecha').textContent = cap(new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }));
  const y = yo();
  $('#in-hola').textContent = (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches') + ', ' + (y ? y.nombre.split(' ')[0] : 'Docente') + ' 👋';

  const dec = ESC().max === 100 ? 0 : 1;
  anima($('#st-alu'), (S.alumnos || []).length, 0);
  anima($('#st-prom'), promedioClase(), dec);
  anima($('#st-asist'), pctAsistencia(localISO()), 0);
  if ($('#st-evs-count')) anima($('#st-evs-count'), (S.evaluaciones || []).length, 0);

  // Radar de Alumnos en Riesgo Pedagógico
  renderRadarRiesgo();

  // Evaluaciones Recientes
  const evs = [...(S.evaluaciones || [])].slice(0, 4);
  $('#in-evs').innerHTML = evs.length ? evs.map(ev => {
    const st = estadoEv(ev);
    const pct = Math.round((st.fin / Math.max(1, (S.alumnos || []).length)) * 100);
    return `<div class="item" data-cal="${ev.id}">
      <div class="grow">
        <div class="row" style="justify-content:space-between">
          <h4>${esc(ev.titulo)}</h4>
          <span class="chip ${ev.tipo === 'colectiva' ? 'c-blue' : 'c-teal'}">${ev.tipo === 'colectiva' ? '👥 Compartida' : '👤 Individual'}</span>
        </div>
        <div class="row" style="margin-top:8px;gap:10px">
          <div class="pbar"><i style="width:${pct}%"></i></div>
          <small style="white-space:nowrap">${st.fin}/${(S.alumnos || []).length} calificados</small>
          ${avStack(ev)}
        </div>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Sin evaluaciones creadas todavía.</div>';

  // Rendimiento en Inicio
  const als = S.alumnos || [];
  const proms = als.map(a => promedioAlumno(a.id)).filter(x => x != null);
  const sobres = proms.filter(v => v >= ESC().max * 0.85).length;
  const aprob = proms.filter(v => v >= ESC().aprob && v < ESC().max * 0.85).length;
  const reprob = proms.filter(v => v < ESC().aprob).length;
  const maxBar = Math.max(1, sobres, aprob, reprob);

  $('#in-dist-wrap').innerHTML = `
    <div class="dist">
      <div class="col"><div class="bar" style="height:${(sobres / maxBar) * 100}%;background:var(--teal)"></div><b>${sobres}</b><small>Destacados</small></div>
      <div class="col"><div class="bar" style="height:${(aprob / maxBar) * 100}%;background:var(--amber)"></div><b>${aprob}</b><small>Aprobados</small></div>
      <div class="col"><div class="bar" style="height:${(reprob / maxBar) * 100}%;background:var(--coral)"></div><b>${reprob}</b><small>A reforzar</small></div>
    </div>
  `;
}

function renderRadarRiesgo() {
  const wrap = $('#in-radar-wrap');
  if (!wrap || !S) return;

  const enRiesgo = (S.alumnos || []).filter(a => {
    const p = promedioAlumno(a.id);
    const asist = asistAl(a.id);
    return (p != null && p < ESC().aprob) || (asist.pct != null && asist.pct < 75);
  });

  if (!enRiesgo.length) {
    wrap.innerHTML = '';
    return;
  }

  const dec = ESC().max === 100 ? 0 : 1;
  const y = yo();
  const mat = S.perfil?.materia || 'la materia';

  const rows = enRiesgo.slice(0, 4).map(al => {
    const p = promedioAlumno(al.id);
    const asist = asistAl(al.id);
    const tel = al.telefono || al.contacto;
    const msg = `Hola! Me comunico desde la materia ${mat} en relación al estudiante ${al.nombre}. Su estado actual es: Promedio ${p != null ? p.toFixed(dec) : '—'} y Asistencia ${asist.pct != null ? asist.pct + '%' : '—'}. Saludos cordiales, Prof. ${y?.nombre || 'Docente'}.`;
    const waUrl = getWhatsAppUrl(tel, msg);

    return `
      <div class="risk-student-item">
        <div class="row" style="gap:10px">
          <span class="av av-s" style="background:${al.color}">${ini(al.nombre)}</span>
          <div>
            <b style="font-size:13.5px">${esc(al.nombre)}</b>
            <div style="font-size:11.5px;color:var(--coral-d)">
              ${p != null && p < ESC().aprob ? `Promedio: ${p.toFixed(dec)} (Requiere apoyo)` : ''}
              ${asist.pct != null && asist.pct < 75 ? ` · Asistencia: ${asist.pct}%` : ''}
            </div>
          </div>
        </div>
        ${waUrl ? `
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp" style="padding:4px 10px;font-size:11.5px">
            <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
            Avisar
          </a>` : ''}
      </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="risk-radar-box">
      <div class="risk-radar-header">
        <h4>⚠️ Radar de Alumnos en Riesgo (${enRiesgo.length})</h4>
        <button class="btn btn-ghost btn-xs" data-nav="alumnos" style="color:var(--coral-d)">Ver nómina →</button>
      </div>
      <p style="font-size:12.5px;color:var(--ink);margin-bottom:8px">Estudiantes con promedio menor a ${ESC().aprob} o asistencia menor al 75%.</p>
      ${rows}
    </div>
  `;
}

/* ═════════ RENDER ESTUDIANTES & MASTER-DETAIL ═════════ */
function renderAlumnos() {
  if (!S) return;
  renderSidebarAndHeader();
  const q = filtroAl.trim().toLowerCase();
  let list = (S.alumnos || []).filter(a => !q || a.nombre.toLowerCase().includes(q) || (a.obs || '').toLowerCase().includes(q) || (a.contacto || '').toLowerCase().includes(q) || (a.telefono || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q));

  if (criterioOrdenAlumnos === 'az') list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  else if (criterioOrdenAlumnos === 'za') list.sort((a, b) => b.nombre.localeCompare(a.nombre));
  else if (criterioOrdenAlumnos === 'promedio') list.sort((a, b) => (promedioAlumno(b.id) ?? -1) - (promedioAlumno(a.id) ?? -1));
  else if (criterioOrdenAlumnos === 'asistencia') list.sort((a, b) => (asistAl(b.id).pct ?? -1) - (asistAl(a.id).pct ?? -1));

  $('#al-sub').textContent = `${(S.alumnos || []).length} matriculados en ${S.perfil?.materia || 'este curso'}`;
  const dec = ESC().max === 100 ? 0 : 1;

  const clearBtn = $('#buscar-clear');
  if (clearBtn) clearBtn.classList.toggle('show', !!q);

  if (!list.length) {
    $('#lista-alumnos').innerHTML = (S.alumnos || []).length === 0 ? `
      <div class="card" style="text-align:center;padding:32px 20px">
        <div style="font-size:42px;margin-bottom:8px">🎒</div>
        <h3 style="font-size:18px;margin-bottom:6px">Nómina vacía</h3>
        <p style="font-size:13.5px;color:var(--ink2);margin-bottom:18px">No hay estudiantes cargados en esta materia. Podés agregarlos de a uno o importar la lista completa desde Excel o CSV.</p>
        <div class="row" style="gap:10px;justify-content:center">
          <button class="btn btn-p btn-sm" data-action="nuevo-al">＋ Agregar estudiante</button>
          <button class="btn btn-s btn-sm" id="btn-empty-importar">📥 Importar Excel / CSV</button>
        </div>
      </div>` : '<div class="empty">No se encontraron estudiantes que coincidan con la búsqueda.</div>';
    $('#btn-empty-importar')?.addEventListener('click', abrirModalImportar);
    return;
  }

  // Auto-seleccionar primer alumno para el dossier si no hay ninguno seleccionado
  if (!alumnoSeleccionadoMaster || !list.some(a => a.id === alumnoSeleccionadoMaster.id)) {
    alumnoSeleccionadoMaster = list[0];
  }

  $('#lista-alumnos').innerHTML = list.map(a => {
    const prom = promedioAlumno(a.id);
    const asist = asistAl(a.id);
    const cl = prom != null ? claseNota(prom) : '';
    const isSelected = alumnoSeleccionadoMaster && alumnoSeleccionadoMaster.id === a.id;
    const tel = a.telefono || a.contacto;
    const dni = formatearDni(a.dni);
    const waUrl = getWhatsAppUrl(tel, `Hola! Me comunico desde la materia ${S.perfil?.materia || ''} en relación al estudiante ${a.nombre}.`);

    return `
      <div class="item ${isSelected ? 'sel' : ''}" data-alumno="${a.id}">
        <span class="av" style="background:${a.color || '#0C6B5D'}">${ini(a.nombre)}</span>
        <div class="grow">
          <div class="row" style="justify-content:space-between">
            <h4>${esc(a.nombre)}</h4>
            ${prom != null ? `<span class="chip ${cl === 'n-ok' ? 'c-teal' : cl === 'n-med' ? 'c-amber' : 'c-coral'}">Prom. ${prom.toFixed(dec)}</span>` : '<span class="chip c-gray">Sin notas</span>'}
          </div>
          <div class="row" style="margin-top:4px;gap:10px;flex-wrap:wrap">
            ${dni ? `<small style="font-family:monospace;font-weight:600">DNI: ${esc(dni)}</small>` : ''}
            <small>${asist.pct != null ? 'Asistencia: ' + asist.pct + '%' : 'Sin asistencia'}</small>
            ${tel ? `<small style="color:var(--ink2)">📞 ${esc(tel.slice(0, 15))}</small>` : ''}
          </div>
        </div>
        ${waUrl ? `
          <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp" title="Contactar por WhatsApp" style="padding:6px 10px;font-size:11px" onclick="event.stopPropagation()">
            <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
          </a>` : ''}
        <button class="icon-btn btn-xs" data-edit-al="${a.id}" title="Editar estudiante" style="width:34px;height:34px">✏️</button>
      </div>`;
  }).join('');

  renderStudentDossier(alumnoSeleccionadoMaster);
}

function renderStudentDossier(al) {
  const panel = $('#student-dossier-panel');
  if (!panel || !al) return;

  const prom = promedioAlumno(al.id);
  const asist = asistAl(al.id);
  const dec = ESC().max === 100 ? 0 : 1;
  const mat = S.perfil?.materia || 'la materia';
  const cur = S.perfil?.curso || '';
  const y = yo();
  const dni = formatearDni(al.dni);

  const tel = al.telefono || al.contacto;
  const msgWA = `Hola! Me comunico desde la materia ${mat} (${cur}) en relación al estudiante ${al.nombre}. Estado actual: Promedio ${prom != null ? prom.toFixed(dec) : '—'} y Asistencia ${asist.pct != null ? asist.pct + '%' : '—'}. Saludos cordiales, Prof. ${y?.nombre || 'Docente'}.`;
  const waUrl = getWhatsAppUrl(tel, msgWA);
  const mailUrl = getEmailUrl(al.email, `Seguimiento Pedagógico - ${mat} - ${al.nombre}`, msgWA);

  const evFilas = (S.evaluaciones || []).map(ev => {
    const fin = finalDe(ev, al.id);
    const notasDoc = (ev.docentes || []).map(d => {
      const dc = docenteDe(d.id);
      const v = notaDoc(ev, al.id, d.id);
      return `<span style="font-size:12px;color:var(--ink2)">${esc(dc?.nombre || 'Docente')}: <b>${v != null ? v : '—'}</b> (${d.peso || ''}%)</span>`;
    }).join(' · ');

    return `
      <div class="grade-breakdown-row">
        <div>
          <h5 style="font-size:13.5px;font-weight:700">${esc(ev.titulo)} <span style="font-weight:400;font-size:11.5px;color:var(--ink2)">(${fmt(ev.fecha)})</span></h5>
          <div>${notasDoc}</div>
        </div>
        <b style="font:800 16px 'Sora';color:${fin != null ? (fin >= ESC().aprob ? 'var(--teal)' : 'var(--coral)') : 'var(--ink2)'}">
          ${fin != null ? fin.toFixed(dec) : '—'}
        </b>
      </div>`;
  }).join('') || '<p style="color:var(--ink2);font-size:13px">Sin evaluaciones cargadas.</p>';

  panel.innerHTML = `
    <div class="profile-hero">
      <span class="av av-lg" style="background:${al.color}">${ini(al.nombre)}</span>
      <div class="grow">
        <h3 style="font-size:18px;font-weight:800">${esc(al.nombre)}</h3>
        ${dni ? `<p style="font-family:monospace;font-size:13px;font-weight:600;color:var(--ink2);margin-top:2px">🆔 DNI: ${esc(dni)}</p>` : ''}
        <p style="font-size:13px;color:var(--ink2);margin-top:2px">${tel ? '📞 ' + esc(tel) : 'Sin teléfono cargado'}</p>
        ${al.email ? `<p style="font-size:12.5px;color:var(--ink2)">✉️ ${esc(al.email)}</p>` : ''}
        ${al.obs ? `<p style="font-size:12.5px;color:var(--ink2);margin-top:4px">📝 <i>${esc(al.obs)}</i></p>` : ''}
      </div>
    </div>

    <!-- Botones de Comunicación Rápida -->
    <div class="row" style="gap:8px;margin-bottom:16px;flex-wrap:wrap">
      ${waUrl ? `
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp grow" style="justify-content:center">
          <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
          WhatsApp Tutor
        </a>` : `<button class="btn btn-s btn-sm grow" onclick="abrirEditarAlumno('${al.id}')">＋ Cargar WhatsApp</button>`}
      ${mailUrl ? `
        <a href="${mailUrl}" class="btn-email grow" style="justify-content:center">
          ✉️ Enviar Correo
        </a>` : ''}
    </div>

    <div class="profile-stats">
      <div class="pstat-box">
        <b style="color:${prom != null && prom >= ESC().aprob ? 'var(--teal)' : 'var(--coral)'}">
          ${prom != null ? prom.toFixed(dec) : '—'}
        </b>
        <small>Promedio Final</small>
      </div>
      <div class="pstat-box">
        <b style="color:var(--teal)">${asist.pct != null ? asist.pct + '%' : '—'}</b>
        <small>Asistencia (${asist.presentes}P / ${asist.tardes}T / ${asist.ausentes}A)</small>
      </div>
    </div>

    <h4 style="font-size:14px;margin:16px 0 10px">Historial de Calificaciones</h4>
    <div style="max-height:240px;overflow-y:auto">${evFilas}</div>

    <div class="row" style="margin-top:20px;gap:10px">
      <button class="btn btn-s btn-sm" id="btn-dossier-edit" style="flex:1">✏️ Editar ficha</button>
      <button class="btn btn-p btn-sm" id="btn-dossier-calificar" style="flex:1">📝 Calificar</button>
    </div>
  `;

  $('#btn-dossier-edit').onclick = () => abrirEditarAlumno(al.id);
  $('#btn-dossier-calificar').onclick = () => navTo('notas');
}

function abrirPerfilAlumno(id) {
  const al = (S.alumnos || []).find(x => x.id === id);
  if (!al) return;
  alumnoSeleccionadoMaster = al;

  if (window.innerWidth >= 900) {
    renderAlumnos();
  } else {
    renderStudentDossierModal(al);
  }
}

function renderStudentDossierModal(al) {
  const prom = promedioAlumno(al.id);
  const asist = asistAl(al.id);
  const dec = ESC().max === 100 ? 0 : 1;
  const mat = S.perfil?.materia || 'la materia';
  const cur = S.perfil?.curso || '';
  const y = yo();
  const dni = formatearDni(al.dni);

  const tel = al.telefono || al.contacto;
  const msgWA = `Hola! Me comunico desde la materia ${mat} (${cur}) en relación al estudiante ${al.nombre}. Estado actual: Promedio ${prom != null ? prom.toFixed(dec) : '—'} y Asistencia ${asist.pct != null ? asist.pct + '%' : '—'}. Saludos cordiales, Prof. ${y?.nombre || 'Docente'}.`;
  const waUrl = getWhatsAppUrl(tel, msgWA);
  const mailUrl = getEmailUrl(al.email, `Seguimiento Pedagógico - ${mat} - ${al.nombre}`, msgWA);

  const evFilas = (S.evaluaciones || []).map(ev => {
    const fin = finalDe(ev, al.id);
    return `
      <div class="grade-breakdown-row">
        <div>
          <h5>${esc(ev.titulo)} <span style="font-weight:400;font-size:11.5px;color:var(--ink2)">(${fmt(ev.fecha)})</span></h5>
        </div>
        <b style="font:800 16px 'Sora';color:${fin != null ? (fin >= ESC().aprob ? 'var(--teal)' : 'var(--coral)') : 'var(--ink2)'}">
          ${fin != null ? fin.toFixed(dec) : '—'}
        </b>
      </div>`;
  }).join('') || '<p style="color:var(--ink2);font-size:13px">Sin evaluaciones cargadas.</p>';

  $('#perfil-body').innerHTML = `
    <div class="profile-hero">
      <span class="av av-lg" style="background:${al.color}">${ini(al.nombre)}</span>
      <div class="grow">
        <h3>${esc(al.nombre)}</h3>
        ${dni ? `<p style="font-family:monospace;font-size:13px;font-weight:600;color:var(--ink2);margin-top:2px">🆔 DNI: ${esc(dni)}</p>` : ''}
        <p class="sub">${tel ? '📞 ' + esc(tel) : 'Sin teléfono cargado'}</p>
        ${al.email ? `<p style="font-size:12.5px;color:var(--ink2)">✉️ ${esc(al.email)}</p>` : ''}
        ${al.obs ? `<p style="font-size:13px;color:var(--ink2);margin-top:4px">📝 <i>${esc(al.obs)}</i></p>` : ''}
      </div>
    </div>

    <!-- Botones de Comunicación -->
    <div class="row" style="gap:8px;margin-bottom:14px;flex-wrap:wrap">
      ${waUrl ? `
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp grow" style="justify-content:center">
          <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
          WhatsApp Tutor
        </a>` : ''}
      ${mailUrl ? `
        <a href="${mailUrl}" class="btn-email grow" style="justify-content:center">
          ✉️ Enviar Correo
        </a>` : ''}
    </div>

    <div class="profile-stats">
      <div class="pstat-box">
        <b style="color:${prom != null && prom >= ESC().aprob ? 'var(--teal)' : 'var(--coral)'}">${prom != null ? prom.toFixed(dec) : '—'}</b>
        <small>Promedio</small>
      </div>
      <div class="pstat-box">
        <b style="color:var(--teal)">${asist.pct != null ? asist.pct + '%' : '—'}</b>
        <small>Asistencia (${asist.presentes}P / ${asist.ausentes}A)</small>
      </div>
    </div>
    <h4 style="font-size:14px;margin:14px 0 8px">Calificaciones</h4>
    ${evFilas}
    <div class="row" style="margin-top:20px;gap:10px">
      <button class="btn btn-s" id="btn-modal-edit" style="flex:1">✏️ Editar</button>
      <button class="btn btn-p" data-close style="flex:1">Listo ✓</button>
    </div>
  `;

  $('#btn-modal-edit').onclick = () => { cerrarAll(); abrirEditarAlumno(al.id); };
  abrir('#m-perfil-alumno');
}

function abrirEditarAlumno(id) {
  const al = (S.alumnos || []).find(x => x.id === id);
  if (!al) return;
  $('#ea-id').value = al.id;
  $('#ea-nombre').value = al.nombre;
  $('#ea-dni').value = al.dni || '';
  $('#ea-telefono').value = al.telefono || al.contacto || '';
  $('#ea-email').value = al.email || '';
  $('#ea-obs').value = al.obs || '';
  colorSeleccionadoEditAl = al.color || PALETTE[0];
  renderColorPickers();
  abrir('#m-edit-alumno');
}

async function eliminarAlumno(id) {
  const al = (S.alumnos || []).find(x => x.id === id);
  if (!al) return;
  const ok = await AtrilSwal.danger({
    title: '¿Eliminar estudiante?',
    text: `¿Estás seguro de eliminar a ${al.nombre} del curso? Se borrarán sus calificaciones y asistencias registradas.`,
    confirmText: '🗑 Sí, eliminar estudiante',
    cancelText: 'Cancelar'
  });
  if (!ok) return;

  S.alumnos = S.alumnos.filter(a => a.id !== id);
  (S.evaluaciones || []).forEach(ev => {
    if (ev.notas && ev.notas[id]) delete ev.notas[id];
  });
  for (const f in (S.asistencia || {})) {
    if (S.asistencia[f][id]) delete S.asistencia[f][id];
  }
  save();
  cerrarAll();
  renderAll();
  toast(`🗑 ${al.nombre} fue eliminado`, 'warn');
}

function abrirModalBorrarTodos() {
  const n = (S.alumnos || []).length;
  if (!n) { toast('No hay estudiantes cargados en esta materia', 'warn'); return; }
  $('#bta-count').textContent = n;
  $('#bta-materia').textContent = S.perfil?.materia || 'este curso';
  abrir('#m-borrar-todos');
}

function ejecutarBorradoTotalAlumnos() {
  const n = (S.alumnos || []).length;
  S.alumnos = [];
  (S.evaluaciones || []).forEach(ev => { ev.notas = {}; });
  S.asistencia = {};
  save();
  cerrarAll();
  renderAll();
  toast(`🗑 Se eliminaron los ${n} estudiantes del curso`, 'warn');
}

/* ═════════ MATRIZ INTERACTIVA DE CALIFICACIONES (SPREADSHEET GRADEBOOK) ═════════ */
function renderNotas() {
  if (!S) return;
  renderSidebarAndHeader();
  const flt = filtroNotas;
  const evs = (S.evaluaciones || []).filter(e => flt === 'todas' || e.tipo === flt);
  const als = S.alumnos || [];
  const dec = ESC().max === 100 ? 0 : 1;

  const matrixWrap = $('#matrix-table-wrap');
  if (!als.length || !evs.length) {
    matrixWrap.innerHTML = `
      <div class="empty" style="padding:40px 20px">
        <div style="font-size:36px;margin-bottom:8px">📝</div>
        <h4>${!als.length ? 'No hay estudiantes matriculados' : 'No hay evaluaciones creadas'}</h4>
        <p style="font-size:13px;color:var(--ink2);margin-top:4px">
          ${!als.length ? 'Agregá alumnos desde la sección Estudiantes para comenzar a calificar.' : 'Creá tu primera evaluación con el botón "＋ Nueva Evaluación".'}
        </p>
      </div>`;
  } else {
    const thCols = evs.map((ev, evIdx) => {
      return `
        <th>
          <div style="font-size:13.5px;font-weight:700">${esc(ev.titulo)}</div>
          <div style="font-size:11px;font-weight:500;color:var(--ink2);margin-top:2px">${fmt(ev.fecha)} · ${ev.tipo === 'colectiva' ? '👥' : '👤'}</div>
          <div style="margin-top:4px">
            <button class="btn btn-ghost btn-xs" data-cal="${ev.id}" style="padding:2px 6px">Calificar →</button>
          </div>
        </th>`;
    }).join('');

    const trRows = als.map((al, alIdx) => {
      const prom = promedioAlumno(al.id);
      const clProm = prom != null ? claseNota(prom) : '';

      const tdNotes = evs.map((ev, evIdx) => {
        const fin = finalDe(ev, al.id);
        const cl = fin != null ? claseNota(fin) : '';

        if (ev.tipo === 'individual') {
          const docId = (ev.docentes[0] || yo()).id;
          const v = notaDoc(ev, al.id, docId);
          return `
            <td class="matrix-grade-cell">
              <input type="text" inputmode="decimal" class="matrix-grade-input ${cl}"
                     data-nota data-ev="${ev.id}" data-al="${al.id}" data-doc="${docId}"
                     data-row="${alIdx}" data-col="${evIdx}"
                     placeholder="—" value="${v != null ? v : ''}" autocomplete="off">
            </td>`;
        } else {
          return `
            <td class="matrix-grade-cell" data-cal="${ev.id}" style="cursor:pointer" title="Evaluación compartida · Clic para calificar">
              <span class="chip ${cl === 'n-ok' ? 'c-teal' : cl === 'n-med' ? 'c-amber' : cl === 'n-bad' ? 'c-coral' : 'c-gray'}">
                ${fin != null ? fin.toFixed(dec) : '—'}
              </span>
            </td>`;
        }
      }).join('');

      return `
        <tr>
          <td class="td-student">
            <div class="row" style="gap:8px">
              <span class="av av-s" style="background:${al.color}">${ini(al.nombre)}</span>
              <span style="font-weight:600">${esc(al.nombre)}</span>
            </div>
          </td>
          ${tdNotes}
          <td style="font-weight:800;font-size:15px;background:var(--bg-subtle)" class="${clProm === 'n-ok' ? 'c-teal' : clProm === 'n-med' ? 'c-amber' : 'c-coral'}">
            ${prom != null ? prom.toFixed(dec) : '—'}
          </td>
        </tr>`;
    }).join('');

    matrixWrap.innerHTML = `
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="th-student">Estudiante (${als.length})</th>
            ${thCols}
            <th class="th-summary">Promedio Final</th>
          </tr>
        </thead>
        <tbody>${trRows}</tbody>
      </table>`;
  }

  $('#lista-evs-cards').innerHTML = evs.length ? evs.map(ev => {
    const st = estadoEv(ev);
    const pct = Math.round((st.fin / Math.max(1, (S.alumnos || []).length)) * 100);
    return `
      <div class="item" data-cal="${ev.id}">
        <div class="grow">
          <div class="row" style="justify-content:space-between">
            <h4>${esc(ev.titulo)}</h4>
            <span class="chip ${ev.tipo === 'colectiva' ? 'c-blue' : 'c-teal'}">${ev.tipo === 'colectiva' ? '👥 Compartida' : '👤 Individual'}</span>
          </div>
          <div class="row" style="margin-top:8px;gap:10px">
            <div class="pbar"><i style="width:${pct}%"></i></div>
            <small>${st.fin}/${(S.alumnos || []).length} (${pct}%)</small>
            ${avStack(ev)}
          </div>
        </div>
        <button class="icon-btn btn-xs" data-edit-ev="${ev.id}" title="Configurar evaluación" style="width:34px;height:34px">⚙</button>
      </div>`;
  }).join('') : '<div class="empty">No hay evaluaciones registradas con este filtro.</div>';
}

/* ═════════ PANTALLA: CALIFICAR EVALUACIÓN ESPECÍFICA (CON BARRA NUMÉRICA) ═════════ */
let alumnoCalificarFocoId = null;

function parseNotaValor(raw) {
  if (raw == null) return null;
  const str = String(raw).trim().replace(',', '.');
  if (str === '') return null;
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  const max = ESC().max;
  return Math.min(max, Math.max(0, num));
}

function abrirCalificar(id) {
  calEv = (S.evaluaciones || []).find(x => x.id === id);
  if (!calEv) return;
  calDoc = calDoc || yo()?.id;
  const als = S.alumnos || [];
  if (als.length) alumnoCalificarFocoId = als[0].id;
  navTo('calificar');
  renderCalificar();
}

function renderCalificar() {
  if (!calEv) return;
  $('#cal-titulo').textContent = calEv.titulo;
  $('#cal-sub').textContent = `${calEv.tipo === 'colectiva' ? '👥 Compartida' : '👤 Individual'} · Fecha: ${fmt(calEv.fecha)}`;

  const docs = calEv.docentes || [];
  $('#cal-docwrap').innerHTML = docs.length > 1 ? `
    <div class="seg">
      ${docs.map(d => {
        const dc = docenteDe(d.id);
        return `<button data-doc="${d.id}" class="${calDoc === d.id ? 'on' : ''}">${esc(dc?.nombre || 'Docente')} (${d.peso || ''}%)</button>`;
      }).join('')}
    </div>` : '';

  actualizarProg();
  const dec = ESC().max === 100 ? 0 : 1;
  const max = ESC().max;

  // Renderizar Teclado Numérico Lateral
  renderLateralKeypad();

  const als = S.alumnos || [];
  if (!alumnoCalificarFocoId && als.length) {
    alumnoCalificarFocoId = als[0].id;
  }

  // Generar números rápidos según escala
  let quickNums = [];
  if (max === 10) quickNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  else if (max === 7) quickNums = [1, 2, 3, 4, 5, 6, 7];
  else if (max === 100) quickNums = [20, 40, 50, 60, 70, 80, 90, 100];
  else quickNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  $('#cal-lista').innerHTML = als.map((al, idx) => {
    const fin = finalDe(calEv, al.id);
    const notaActual = notaDoc(calEv, al.id, calDoc);
    const cl = notaActual != null ? claseNota(notaActual) : '';
    const isActive = alumnoCalificarFocoId === al.id;

    const inlineBtns = quickNums.map(n => `
      <button type="button" class="num-btn ${notaActual != null && notaActual === n ? 'active-val' : ''}"
              data-quick-num="${n}" data-al="${al.id}" title="Poner ${n}">
        ${n}
      </button>
    `).join('');

    return `
      <div class="cal-student-row ${isActive ? 'active-row' : ''}" id="cal-row-${al.id}" data-focus-al="${al.id}">
        <div class="cal-student-header">
          <div class="row" style="gap:10px">
            <span class="av av-s" style="background:${al.color}">${ini(al.nombre)}</span>
            <div>
              <h4 style="font-size:15px;font-weight:700">${esc(al.nombre)}</h4>
              ${calEv.tipo === 'colectiva' ? `<small style="color:var(--ink2)">Final: <b>${fin != null ? fin.toFixed(dec) : '—'}</b></small>` : ''}
            </div>
          </div>

          <div class="grade-box-wrap">
            <input type="text" inputmode="decimal" class="grade-box-input ${cl}" id="cal-input-${al.id}"
                   data-nota data-ev="${calEv.id}" data-al="${al.id}" data-doc="${calDoc}" data-idx="${idx}"
                   placeholder="—" value="${notaActual != null ? notaActual : ''}" autocomplete="off">
          </div>
        </div>

        <div class="inline-num-bar">
          <span style="font-size:11px;font-weight:700;color:var(--ink3);margin-right:2px">1-Clic:</span>
          ${inlineBtns}
          <button type="button" class="num-btn btn-half" data-quick-half="${al.id}" title="Sumar .5">+.5</button>
          <button type="button" class="num-btn btn-clear" data-quick-clear="${al.id}" title="Borrar nota">✕</button>
        </div>
      </div>`;
  }).join('') || '<div class="empty">Sin estudiantes en el curso.</div>';

  actualizarLateralPreview(alumnoCalificarFocoId);
}

function renderLateralKeypad() {
  const box = $('#gl-keypad-buttons');
  if (!box) return;
  const max = ESC().max;

  let keyNumbers = [];
  if (max === 10) {
    keyNumbers = [
      { label: '1', val: 1 }, { label: '2', val: 2 }, { label: '3', val: 3 },
      { label: '4', val: 4 }, { label: '5', val: 5 }, { label: '6', val: 6 },
      { label: '7', val: 7 }, { label: '8', val: 8 }, { label: '9', val: 9 },
      { label: '10', val: 10 }, { label: '+.5', type: 'half' }, { label: '⌫ Borrar', type: 'clear' }
    ];
  } else if (max === 7) {
    keyNumbers = [
      { label: '1', val: 1 }, { label: '2', val: 2 }, { label: '3', val: 3 },
      { label: '4', val: 4 }, { label: '5', val: 5 }, { label: '6', val: 6 },
      { label: '7', val: 7 }, { label: '+.5', type: 'half' }, { label: '⌫ Borrar', type: 'clear' }
    ];
  } else {
    keyNumbers = [
      { label: '10', val: 10 }, { label: '20', val: 20 }, { label: '30', val: 30 },
      { label: '40', val: 40 }, { label: '50', val: 50 }, { label: '60', val: 60 },
      { label: '70', val: 70 }, { label: '80', val: 80 }, { label: '90', val: 90 },
      { label: '100', val: 100 }, { label: '+5', type: 'plus5' }, { label: '⌫ Borrar', type: 'clear' }
    ];
  }

  box.innerHTML = keyNumbers.map(k => {
    if (k.type === 'clear') {
      return `<button type="button" class="gl-key-btn key-action key-clear" data-keypad-action="clear">${k.label}</button>`;
    }
    if (k.type === 'half') {
      return `<button type="button" class="gl-key-btn key-action key-half" data-keypad-action="half">${k.label}</button>`;
    }
    if (k.type === 'plus5') {
      return `<button type="button" class="gl-key-btn key-action key-half" data-keypad-action="plus5">${k.label}</button>`;
    }
    return `<button type="button" class="gl-key-btn" data-keypad-val="${k.val}">${k.label}</button>`;
  }).join('');
}

function setNotaAlumno(evId, alId, docId, valor, autoAvanzar = false) {
  const ev = (S.evaluaciones || []).find(x => x.id === evId);
  if (!ev) return;
  const vNum = parseNotaValor(valor);
  (ev.notas[alId] = ev.notas[alId] || {})[docId] = vNum;
  save();

  // Actualizar input correspondiente en el DOM si existe
  const inp = $(`input[data-nota][data-ev="${evId}"][data-al="${alId}"][data-doc="${docId}"]`);
  if (inp) {
    inp.value = vNum != null ? vNum : '';
    inp.className = inp.className.replace(/\bn-(ok|med|bad)\b/g, '').trim() + ' ' + claseNota(vNum);
  }

  // Actualizar botones inline activos
  const rowEl = $(`#cal-row-${alId}`);
  if (rowEl) {
    rowEl.querySelectorAll('.num-btn').forEach(btn => {
      const bVal = btn.dataset.quickNum;
      btn.classList.toggle('active-val', bVal !== undefined && vNum != null && +bVal === vNum);
    });
  }

  if (calEv && calEv.id === evId) {
    actualizarProg();
    actualizarLateralPreview(alId);
  }

  if (autoAvanzar) {
    avanzarSiguienteAlumno(alId);
  }
}

function actualizarLateralPreview(alId) {
  const al = (S.alumnos || []).find(x => x.id === alId) || (S.alumnos || [])[0];
  if (!al || !calEv) return;
  alumnoCalificarFocoId = al.id;

  // Marcar fila activa en lista
  $$('.cal-student-row').forEach(r => r.classList.toggle('active-row', r.id === `cal-row-${al.id}`));

  const v = notaDoc(calEv, al.id, calDoc);
  const fin = finalDe(calEv, al.id);
  const dec = ESC().max === 100 ? 0 : 1;

  const avEl = $('#gl-preview-av');
  if (avEl) {
    avEl.style.background = al.color;
    avEl.textContent = ini(al.nombre);
  }
  const nameEl = $('#gl-preview-name');
  if (nameEl) nameEl.textContent = al.nombre;

  const metaEl = $('#gl-preview-meta');
  if (metaEl) {
    metaEl.textContent = calEv.tipo === 'colectiva' ? `Final colectiva: ${fin != null ? fin.toFixed(dec) : '—'}` : 'Calificación directa';
  }

  const scoreEl = $('#gl-preview-score');
  if (scoreEl) {
    scoreEl.textContent = v != null ? (ESC().max === 100 ? v : v.toFixed(dec)) : '—';
    scoreEl.style.color = v != null ? (v >= ESC().aprob ? 'var(--teal)' : 'var(--coral)') : 'var(--ink2)';
  }
}

function avanzarSiguienteAlumno(currAlId) {
  const als = S.alumnos || [];
  const idx = als.findIndex(a => a.id === currAlId);
  if (idx !== -1 && idx < als.length - 1) {
    const nextAl = als[idx + 1];
    enfocarAlumnoCalificar(nextAl.id);
  }
}

function retrocederAlumno(currAlId) {
  const als = S.alumnos || [];
  const idx = als.findIndex(a => a.id === currAlId);
  if (idx > 0) {
    const prevAl = als[idx - 1];
    enfocarAlumnoCalificar(prevAl.id);
  }
}

function enfocarAlumnoCalificar(alId) {
  actualizarLateralPreview(alId);
  const inp = $(`#cal-input-${alId}`);
  if (inp) {
    inp.focus();
    inp.select();
    inp.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function actualizarProg() {
  if (!calEv) return;
  const st = estadoEv(calEv);
  const pct = Math.round((st.fin / Math.max(1, (S.alumnos || []).length)) * 100);
  $('#cal-bar').style.width = pct + '%';
  $('#cal-prog').textContent = `${st.fin}/${(S.alumnos || []).length} calificados (${pct}%)`;
}

function abrirEditarEvaluacion(id) {
  const ev = (S.evaluaciones || []).find(x => x.id === id);
  if (!ev) return;
  $('#eev-id').value = ev.id;
  $('#eev-titulo').value = ev.titulo;
  $('#eev-fecha').value = ev.fecha || localISO();

  $$('#eev-tipo button').forEach(b => b.classList.toggle('on', b.dataset.tipo === ev.tipo));
  $('#eev-colectiva').style.display = ev.tipo === 'colectiva' ? 'block' : 'none';

  const pintarPesosEdit = () => {
    const sel = new Set((ev.docentes || []).map(d => d.id));
    $('#eev-docentes').innerHTML = (S.docentes || []).map((d, i) => {
      const activo = sel.has(d.id);
      const currPeso = (ev.docentes || []).find(x => x.id === d.id)?.peso || 33;
      return `<label class="check-doc ${activo ? 'sel' : ''}" style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg-subtle);border-radius:10px;margin-top:6px">
        <input type="checkbox" data-ed="${d.id}" ${activo ? 'checked' : ''} style="width:18px;height:18px">
        <span class="av av-s" style="background:${d.color}">${ini(d.nombre)}</span>
        <span class="grow" style="font-weight:600;font-size:13.5px">${esc(d.nombre)}</span>
        ${activo ? `<input type="number" data-epeso="${d.id}" min="5" max="100" step="5" value="${currPeso}" style="width:70px;text-align:center"><span style="font-size:12px;font-weight:700">%</span>` : ''}
      </label>`;
    }).join('');
  };
  pintarPesosEdit();

  $('#eev-docentes').onchange = e => {
    if (e.target.type === 'checkbox') {
      const dId = e.target.dataset.ed;
      if (e.target.checked) {
        ev.docentes.push({ id: dId, peso: 20 });
      } else {
        if (ev.docentes.length <= 1) { e.target.checked = true; toast('Debe haber al menos 1 docente', 'warn'); return; }
        ev.docentes = ev.docentes.filter(x => x.id !== dId);
      }
      pintarPesosEdit();
    }
  };

  $$('#eev-tipo button').forEach(btn => {
    btn.onclick = () => {
      $$('#eev-tipo button').forEach(b => b.classList.toggle('on', b === btn));
      $('#eev-colectiva').style.display = btn.dataset.tipo === 'colectiva' ? 'block' : 'none';
    };
  });

  abrir('#m-edit-eval');
}

async function eliminarEvaluacion(id) {
  const ev = (S.evaluaciones || []).find(x => x.id === id);
  if (!ev) return;
  const ok = await AtrilSwal.danger({
    title: '¿Eliminar evaluación?',
    text: `Estás a punto de borrar "${ev.titulo}". Se perderán todas las notas cargadas en esta evaluación.`,
    confirmText: '🗑 Sí, eliminar evaluación',
    cancelText: 'Cancelar'
  });
  if (!ok) return;

  S.evaluaciones = S.evaluaciones.filter(e => e.id !== id);
  save();
  cerrarAll();
  navTo('notas');
  renderAll();
  toast(`🗑 Evaluación "${ev.titulo}" eliminada`, 'warn');
}

/* ═════════ ASISTENCIA ═════════ */
function renderAsistencia() {
  if (!S) return;
  renderSidebarAndHeader();
  $('#fecha-asist').value = fechaAsist;
  const mapa = (S.asistencia || {})[fechaAsist] || {};
  let p = 0, a = 0, t = 0;
  (S.alumnos || []).forEach(al => {
    const st = mapa[al.id];
    if (st === 'P') p++;
    else if (st === 'A') a++;
    else if (st === 'T') t++;
  });
  const tot = (S.alumnos || []).length;
  const pct = tot ? Math.round((p + t * 0.5) / tot * 100) : 0;

  $('#as-resumen').innerHTML = `
    <span class="chip c-teal">Presentes: ${p}</span>
    <span class="chip c-amber">Tardes: ${t}</span>
    <span class="chip c-coral">Ausentes: ${a}</span>
    <span class="chip c-blue">Asistencia: ${pct}%</span>
  `;

  $('#lista-asist').innerHTML = (S.alumnos || []).map(al => {
    const st = mapa[al.id] || '';
    return `
      <div class="item">
        <span class="av av-s" style="background:${al.color}">${ini(al.nombre)}</span>
        <h4 class="grow">${esc(al.nombre)}</h4>
        <div class="as-seg">
          <button data-as="P" data-al="${al.id}" class="${st === 'P' ? 'on-P' : ''}">P</button>
          <button data-as="T" data-al="${al.id}" class="${st === 'T' ? 'on-T' : ''}">T</button>
          <button data-as="A" data-al="${al.id}" class="${st === 'A' ? 'on-A' : ''}">A</button>
        </div>
      </div>`;
  }).join('') || '<div class="empty">Sin estudiantes en el curso.</div>';
}

/* ═════════ FORMATEO DNI, NOTAS EN LETRAS Y CONDICIÓN ═════════ */
function formatearDni(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length >= 7 && digits.length <= 8) {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  return String(raw).trim();
}

function notaEnLetras(num) {
  if (num == null || isNaN(num)) return '—';
  const enteros = ['Cero', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez'];
  const n = Math.round(Number(num) * 10) / 10;
  const entero = Math.floor(n);
  const decimal = Math.round((n - entero) * 10);

  if (entero >= 0 && entero <= 10) {
    if (decimal === 5) return `${enteros[entero]} con 50`;
    if (decimal > 0) return `${enteros[entero]} con ${decimal}`;
    return enteros[entero];
  }
  return String(n);
}

function calcularTpAprobPct(alId) {
  const evs = S.evaluaciones || [];
  if (!evs.length) return null;
  let aprobados = 0;
  let calificados = 0;
  evs.forEach(ev => {
    const f = finalDe(ev, alId);
    if (f != null) {
      calificados++;
      if (f >= ESC().aprob) aprobados++;
    }
  });
  if (!calificados) return null;
  return Math.round((aprobados / calificados) * 100);
}

function condicionFinalAlumno(alId) {
  const p = promedioAlumno(alId);
  const asist = asistAl(alId);
  const pctAsist = asist.pct != null ? asist.pct : 100;
  const tpPct = calcularTpAprobPct(alId);
  const aprob = ESC().aprob;

  if (p == null) return 'Sin Calificar';
  if (pctAsist < 75) return 'Libre';
  if (p >= (ESC().max === 10 ? 8 : (ESC().max === 100 ? 80 : 5.5)) && pctAsist >= 80 && (tpPct == null || tpPct >= 80)) {
    return 'Promociona';
  }
  if (p >= aprob && pctAsist >= 75) {
    return 'Regular';
  }
  return 'Libre';
}

/* ═════════ INFORMES & REPORTE OFICIAL PDF (GRILLA A4, ACTA Y DESGLOSE) ═════════ */
let modoVistaInforme = 'grilla'; // 'grilla' | 'oficial' | 'evaluaciones'
let orientacionPdf = 'portrait'; // 'portrait' | 'landscape'
let filtroPdfCondicion = 'todos'; // 'todos' | 'promociona' | 'regular' | 'libre'
let configPdf = {
  mostrarNotas: true,
  mostrarAsistencia: true,
  mostrarObservaciones: true,
  mostrarFirmas: true
};

function renderInformes() {
  if (!S) return;
  renderSidebarAndHeader();
  const mat = S.perfil?.materia || 'Materia';
  const cur = S.perfil?.curso || 'División';
  const niv = S.perfil?.nivel || 'Secundaria';
  const allAls = S.alumnos || [];
  const evs = S.evaluaciones || [];
  const dec = ESC().max === 100 ? 0 : 1;
  const allDocs = S.docentes || [];
  const titular = allDocs.find(d => {
    const r = (d.rol || '').toLowerCase();
    return r.includes('titular') && !r.includes('co-titular') && !r.includes('cotitular');
  }) || allDocs.find(d => d.yo) || allDocs[0] || { nombre: 'Docente Titular', rol: 'Docente Titular' };
  const coDocs = allDocs.filter(d => d.id !== titular.id);

  $('#inf-sub').textContent = `${mat} · ${cur} (${allAls.length} estudiantes matriculados)`;

  // Listeners de pestañas de informe
  $$('#inf-view-tabs button').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.infTab === modoVistaInforme);
    btn.onclick = () => {
      modoVistaInforme = btn.dataset.infTab;
      renderInformes();
    };
  });

  // Listeners de controles de PDF
  const orientBtns = $$('#pdf-orientacion button');
  orientBtns.forEach(btn => {
    btn.classList.toggle('on', btn.dataset.orient === orientacionPdf);
    btn.onclick = () => {
      orientacionPdf = btn.dataset.orient;
      orientBtns.forEach(b => b.classList.toggle('on', b.dataset.orient === orientacionPdf));
      renderInformes();
    };
  });

  const selFiltro = $('#pdf-filtro-condicion');
  if (selFiltro) {
    selFiltro.value = filtroPdfCondicion;
    selFiltro.onchange = () => {
      filtroPdfCondicion = selFiltro.value;
      renderInformes();
    };
  }

  // Checkboxes de configuración
  const chkEvals = $('#pdf-chk-evals');
  if (chkEvals) {
    chkEvals.checked = configPdf.mostrarNotas;
    chkEvals.onchange = () => { configPdf.mostrarNotas = chkEvals.checked; renderInformes(); };
  }
  const chkAsist = $('#pdf-chk-asist');
  if (chkAsist) {
    chkAsist.checked = configPdf.mostrarAsistencia;
    chkAsist.onchange = () => { configPdf.mostrarAsistencia = chkAsist.checked; renderInformes(); };
  }
  const chkObs = $('#pdf-chk-obs');
  if (chkObs) {
    chkObs.checked = configPdf.mostrarObservaciones;
    chkObs.onchange = () => { configPdf.mostrarObservaciones = chkObs.checked; renderInformes(); };
  }
  const chkFirmas = $('#pdf-chk-firmas');
  if (chkFirmas) {
    chkFirmas.checked = configPdf.mostrarFirmas;
    chkFirmas.onchange = () => {
      configPdf.mostrarFirmas = chkFirmas.checked;
      const sigBlock = $('#pdf-signatures-block');
      if (sigBlock) sigBlock.style.display = configPdf.mostrarFirmas ? '' : 'none';
    };
  }

  // Filtrado de estudiantes según condición
  let als = allAls;
  if (filtroPdfCondicion === 'promociona') {
    als = allAls.filter(a => condicionFinalAlumno(a.id) === 'Promociona');
  } else if (filtroPdfCondicion === 'regular') {
    als = allAls.filter(a => condicionFinalAlumno(a.id) === 'Regular');
  } else if (filtroPdfCondicion === 'libre') {
    als = allAls.filter(a => condicionFinalAlumno(a.id) === 'Libre');
  }

  // Encabezado Oficial Institucional para PDF e Impresión
  $('#pdf-header-block').innerHTML = `
    <div class="inst-logo">
      <div style="width:38px;height:38px;border-radius:9px;background:#0C6B5D;color:#fff;display:grid;place-items:center;font:800 16pt 'Sora'">A</div>
      <div>
        <b style="font:800 16pt 'Sora';color:#0C6B5D">ATRIL</b>
        <div style="font-size:8.5pt;color:#333;font-weight:800;letter-spacing:0.04em">
          ${modoVistaInforme === 'grilla' ? 'FICHAS PEDAGÓGICAS DE RENDIMIENTO Y SEGUIMIENTO' : (modoVistaInforme === 'oficial' ? 'PLANILLA OFICIAL DE CALIFICACIONES Y ASISTENCIA (ACTA)' : 'MATRIZ ANALÍTICA DESGLOSADA POR EVALUACIONES')}
        </div>
      </div>
    </div>
    <div class="doc-meta">
      <b>Materia:</b> ${esc(mat)} (${esc(cur)}) · <b>Nivel:</b> ${esc(niv)}<br>
      <b>Docente Titular:</b> ${esc(titular.nombre)} ${coDocs.length ? `· <b>Equipo Docente:</b> ${coDocs.map(d => `${esc(d.nombre)} (${esc(d.rol || 'Co-titular')})`).join(', ')}` : ''}<br>
      <b>Escala Oficial:</b> 1 a ${ESC().max} (Aprueba con ${ESC().aprob}) · <b>Formato:</b> A4 ${orientacionPdf === 'portrait' ? 'Vertical' : 'Horizontal'} · <b>Emisión:</b> ${fmt(localISO(), { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  `;

  // Métricas de Rendimiento
  const proms = allAls.map(a => promedioAlumno(a.id)).filter(x => x != null);
  const sobres = proms.filter(v => v >= ESC().max * 0.85).length;
  const aprob = proms.filter(v => v >= ESC().aprob && v < ESC().max * 0.85).length;
  const reprob = proms.filter(v => v < ESC().aprob).length;
  const maxBar = Math.max(1, sobres, aprob, reprob);

  // VISTA 1: GRILLA DE FICHAS PERSONALIZADAS A4
  const gridHtml = renderPdfStudentGrid(als, evs, dec);

  // VISTA 2: PLANILLA OFICIAL (Formato Acta / Libro Matriz Institucional)
  const officialRowsHtml = als.map((a, idx) => {
    const p = promedioAlumno(a.id);
    const asist = asistAl(a.id);
    const tpPct = calcularTpAprobPct(a.id);
    const cond = condicionFinalAlumno(a.id);

    return `
      <tr>
        <td style="font-weight:700;color:var(--ink2)">${idx + 1}</td>
        <td style="font-family:monospace;font-weight:600;font-size:13px">${formatearDni(a.dni) || '—'}</td>
        <td class="td-left">${esc(a.nombre)}</td>
        <td style="font-weight:600">${asist.pct != null ? asist.pct + '%' : '—'}</td>
        <td style="font-weight:600">${tpPct != null ? tpPct + '%' : '—'}</td>
        <td style="font-weight:800;font-size:15px;color:${p != null ? (p >= ESC().aprob ? 'var(--teal)' : 'var(--coral)') : 'var(--ink2)'}">
          ${p != null ? p.toFixed(dec) : '—'}
        </td>
        <td style="font-style:italic;font-size:12.5px;color:var(--ink)">${notaEnLetras(p)}</td>
        <td>
          <span class="chip ${cond === 'Promociona' ? 'c-teal' : cond === 'Regular' ? 'c-blue' : 'c-coral'}">
            ${cond}
          </span>
        </td>
      </tr>`;
  }).join('');

  const officialTableHtml = `
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
      <table class="official-academic-table">
        <thead>
          <tr>
            <th rowspan="2" style="width:38px">Nº</th>
            <th rowspan="2" style="width:110px">DNI</th>
            <th rowspan="2" style="text-align:left;padding-left:12px">Apellido y Nombre</th>
            <th rowspan="2" style="width:90px">% Asistencia</th>
            <th rowspan="2" style="width:95px">% TP-Aprob.</th>
            <th colspan="2" style="text-align:center">Calificación</th>
            <th rowspan="2" style="width:140px">Promocion ó/<br>Regularizo / Libre</th>
          </tr>
          <tr>
            <th style="width:60px;text-align:center">Nº</th>
            <th style="width:130px;text-align:center">Letras</th>
          </tr>
        </thead>
        <tbody>${officialRowsHtml || '<tr><td colspan="8" style="padding:24px;text-align:center">No hay estudiantes cargados en este curso</td></tr>'}</tbody>
      </table>
    </div>`;

  // VISTA 3: DESGLOSE COMPLETO POR EVALUACIONES
  const evalHeadersHtml = `
    <tr>
      <th style="width:36px;text-align:center">Nº</th>
      <th style="width:105px;text-align:center">DNI</th>
      <th style="text-align:left;padding-left:12px;min-width:200px">Apellido y Nombre</th>
      ${evs.map(e => `<th>${esc(e.titulo)}<br><small style="font-weight:400;opacity:0.85">${fmt(e.fecha)}</small></th>`).join('')}
      <th style="min-width:90px">Promedio</th>
      <th style="min-width:80px">Asistencia</th>
      <th style="text-align:left;min-width:130px">Observaciones</th>
    </tr>`;

  const evalRowsHtml = als.map((a, idx) => {
    const p = promedioAlumno(a.id);
    const asist = asistAl(a.id);
    const evNotas = evs.map(e => {
      const v = finalDe(e, a.id);
      return `<td style="font-weight:600;color:${v != null ? (v >= ESC().aprob ? 'var(--teal)' : 'var(--coral)') : 'var(--ink2)'}">
        ${v != null ? v.toFixed(dec) : '—'}
      </td>`;
    }).join('');

    return `
      <tr>
        <td style="text-align:center;font-weight:700;color:var(--ink2)">${idx + 1}</td>
        <td style="font-family:monospace;font-size:12.5px">${formatearDni(a.dni) || '—'}</td>
        <td style="text-align:left;padding-left:12px">
          <span style="font-weight:700">${esc(a.nombre)}</span>
        </td>
        ${evNotas}
        <td style="font-weight:800;font-size:14px;color:${p != null ? (p >= ESC().aprob ? 'var(--teal)' : 'var(--coral)') : 'var(--ink2)'}">
          ${p != null ? p.toFixed(dec) : '—'}
        </td>
        <td>${asist.pct != null ? asist.pct + '%' : '—'}</td>
        <td style="text-align:left;font-size:12px;color:var(--ink2)">${esc(a.obs || '—')}</td>
      </tr>`;
  }).join('');

  const evalTableHtml = `
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
      <table class="matrix-table" style="border:none">
        <thead>${evalHeadersHtml}</thead>
        <tbody>${evalRowsHtml || '<tr><td colspan="7" style="padding:20px;text-align:center">Sin datos</td></tr>'}</tbody>
      </table>
    </div>`;

  let mainContentHtml = '';
  if (modoVistaInforme === 'grilla') {
    mainContentHtml = `
      <div class="no-print" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <h4 style="font-size:16px">Fichas Pedagógicas en Grilla A4</h4>
        <span class="chip c-gray">${als.length} de ${allAls.length} estudiantes</span>
      </div>
      ${gridHtml}
    `;
  } else {
    mainContentHtml = `
      <div class="card" style="padding:0;overflow:hidden">
        <div class="no-print" style="padding:16px 20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <h4 style="font-size:16px">${modoVistaInforme === 'oficial' ? 'Planilla Oficial de Cursada y Aprobación (Acta)' : 'Planilla Desglosada por Evaluaciones'}</h4>
          <span class="chip c-gray">${als.length} de ${allAls.length} estudiantes</span>
        </div>
        ${modoVistaInforme === 'oficial' ? officialTableHtml : evalTableHtml}
      </div>
    `;
  }

  $('#inf-body').innerHTML = `
    <div class="card no-print" style="margin-bottom:14px">
      <h4 style="font-size:16px;margin-bottom:14px">Distribución de Rendimiento del Curso</h4>
      <div class="dist">
        <div class="col"><div class="bar" style="height:${(sobres / maxBar) * 100}%;background:var(--teal)"></div><b>${sobres}</b><small>Destacados</small></div>
        <div class="col"><div class="bar" style="height:${(aprob / maxBar) * 100}%;background:var(--amber)"></div><b>${aprob}</b><small>Aprobados</small></div>
        <div class="col"><div class="bar" style="height:${(reprob / maxBar) * 100}%;background:var(--coral)"></div><b>${reprob}</b><small>A reforzar</small></div>
      </div>
    </div>

    ${mainContentHtml}
  `;

  // Bloque de Firmas Dinámico para Impresión / PDF (se adapta al número real de docentes activos)
  const sigBlock = $('#pdf-signatures-block');
  if (sigBlock) {
    if (configPdf.mostrarFirmas) {
      sigBlock.style.display = '';
      
      let sigBoxesHtml = `
        <div class="pdf-sig-box">
          <b>${esc(titular.nombre)}</b>
          <small>Firma Docente Titular</small>
        </div>
      `;

      coDocs.forEach(d => {
        sigBoxesHtml += `
          <div class="pdf-sig-box">
            <b>${esc(d.nombre)}</b>
            <small>Firma ${esc(d.rol || 'Docente Co-titular')}</small>
          </div>
        `;
      });

      sigBoxesHtml += `
        <div class="pdf-sig-box">
          <b>Secretaría / Dirección</b>
          <small>Firma y Sello Institucional</small>
        </div>
      `;

      sigBlock.innerHTML = sigBoxesHtml;
    } else {
      sigBlock.style.display = 'none';
      sigBlock.innerHTML = '';
    }
  }
}

function renderPdfStudentGrid(als, evs, dec) {
  if (!als.length) {
    return `<div class="card" style="padding:32px;text-align:center">
      <div style="font-size:36px;margin-bottom:8px">📋</div>
      <h4 style="font-size:16px;margin-bottom:4px">No hay estudiantes para mostrar</h4>
      <p style="font-size:13px;color:var(--ink2)">Probá cambiando el filtro de condición o seleccionando "Todos los alumnos".</p>
    </div>`;
  }

  const cardsHtml = als.map((a, idx) => {
    const p = promedioAlumno(a.id);
    const asist = asistAl(a.id);
    const tpPct = calcularTpAprobPct(a.id);
    const cond = condicionFinalAlumno(a.id);
    const condChipClass = cond === 'Promociona' ? 'c-teal' : (cond === 'Regular' ? 'c-blue' : 'c-coral');
    const pColor = p != null ? (p >= ESC().aprob ? 'var(--teal)' : 'var(--coral)') : 'var(--ink2)';

    // Evaluaciones
    let evsHtml = '';
    if (configPdf.mostrarNotas && evs.length) {
      const evRows = evs.map(e => {
        const v = finalDe(e, a.id);
        const vColor = v != null ? (v >= ESC().aprob ? 'var(--teal)' : 'var(--coral)') : 'var(--ink3)';
        return `
          <div class="pdf-grade-row">
            <span class="title" title="${esc(e.titulo)}">${esc(e.titulo)}</span>
            <span class="grade" style="color:${vColor}">${v != null ? v.toFixed(dec) : '—'}</span>
          </div>`;
      }).join('');
      evsHtml = `
        <div style="margin-top:4px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:var(--ink3);margin-bottom:3px">
            Evaluaciones y TPs (${evs.length})
          </div>
          <div class="pdf-grades-list">${evRows}</div>
        </div>`;
    }

    // Asistencia
    let asistHtml = '';
    if (configPdf.mostrarAsistencia) {
      asistHtml = `
        <div class="pdf-asist-bar-wrap">
          <span><b>Asistencia:</b> ${asist.pct != null ? asist.pct + '%' : '—'}</span>
          <span>(${asist.presentes || 0}P · ${asist.tardes || 0}T · ${asist.ausentes || 0}A)</span>
        </div>`;
    }

    // Observaciones
    let obsHtml = '';
    if (configPdf.mostrarObservaciones && a.obs) {
      obsHtml = `
        <div class="pdf-obs-box">
          <b>Obs:</b> ${esc(a.obs)}
        </div>`;
    }

    return `
      <div class="pdf-student-card">
        <div class="card-top">
          <span class="av av-s" style="background:${a.color || '#0C6B5D'};color:#fff;font-weight:800">${ini(a.nombre)}</span>
          <div class="grow" style="min-width:0">
            <div class="st-name" title="${esc(a.nombre)}">${esc(a.nombre)}</div>
            <div class="st-dni">DNI: ${formatearDni(a.dni) || '—'} · Nº ${idx + 1}</div>
          </div>
          <span class="chip ${condChipClass}" style="font-size:10.5px;padding:2px 8px">${cond}</span>
        </div>

        <div class="card-kpis">
          <div class="pdf-kpi-item">
            <b style="color:${pColor}">${p != null ? p.toFixed(dec) : '—'}</b>
            <small>Promedio</small>
            <div style="font-size:8.5px;color:var(--ink2);font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${notaEnLetras(p)}</div>
          </div>
          <div class="pdf-kpi-item">
            <b style="color:var(--teal)">${asist.pct != null ? asist.pct + '%' : '—'}</b>
            <small>% Asist.</small>
          </div>
          <div class="pdf-kpi-item">
            <b style="color:var(--blue)">${tpPct != null ? tpPct + '%' : '—'}</b>
            <small>% TPs</small>
          </div>
        </div>

        ${evsHtml}
        ${asistHtml}
        ${obsHtml}
      </div>`;
  }).join('');

  return `<div class="pdf-student-grid">${cardsHtml}</div>`;
}

function imprimirPDF() {
  document.body.classList.remove('print-portrait', 'print-landscape');
  document.body.classList.add(orientacionPdf === 'landscape' ? 'print-landscape' : 'print-portrait');

  let styleTag = document.getElementById('dynamic-print-page-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-print-page-style';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `@page { size: A4 ${orientacionPdf}; margin: 8mm 8mm 10mm 8mm; }`;

  navTo('informes');
  window.print();
}

function exportarCSV() {
  if (!S) return;
  const als = S.alumnos || [];
  const evs = S.evaluaciones || [];
  const dec = ESC().max === 100 ? 0 : 1;

  const headers = [
    'Nº', 'DNI', 'Apellido y Nombre', 'Teléfono / WhatsApp', 'Email',
    '% Asistencia', '% TP-Aprob.', 'Calificación Nº', 'Calificación Letras',
    'Condición Final', ...evs.map(e => `"${e.titulo.replace(/"/g, '""')} (${e.fecha})"`), 'Observaciones'
  ];
  const lines = [headers.join(',')];

  als.forEach((a, i) => {
    const p = promedioAlumno(a.id);
    const asist = asistAl(a.id);
    const tpPct = calcularTpAprobPct(a.id);
    const cond = condicionFinalAlumno(a.id);

    const row = [
      i + 1,
      `"${formatearDni(a.dni)}"`,
      `"${a.nombre.replace(/"/g, '""')}"`,
      `"${(a.telefono || a.contacto || '').replace(/"/g, '""')}"`,
      `"${(a.email || '').replace(/"/g, '""')}"`,
      asist.pct != null ? asist.pct + '%' : '',
      tpPct != null ? tpPct + '%' : '',
      p != null ? p.toFixed(dec) : '',
      `"${notaEnLetras(p)}"`,
      `"${cond}"`,
      ...evs.map(e => {
        const v = finalDe(e, a.id);
        return v != null ? v.toFixed(dec) : '';
      }),
      `"${(a.obs || '').replace(/"/g, '""')}"`
    ];
    lines.push(row.join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const materia = (S.perfil?.materia || 'Atril').replace(/\s+/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Planilla_Oficial_${materia}_${localISO()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast('📊 Planilla Oficial CSV descargada con éxito ✓', 'ok');
}

/* ═════════ MULTI-CURSO & GESTIÓN ═════════ */
function renderListaCursos() {
  const list = S?.courses || [];
  const currId = S?.activeCourseId || S?.perfil?.id;

  $('#lista-cursos').innerHTML = list.length ? list.map(c => `
    <div class="item ${c.id === currId ? 'sel' : ''}" data-switch-course="${c.id}">
      <span class="av av-s" style="background:var(--teal)">📚</span>
      <div class="grow">
        <h4>${esc(c.materia)}</h4>
        <small>${esc(c.nivel || 'Secundaria')} · ${esc(c.curso || 'División')} · Escala: ${c.escalaKey || '10'}</small>
      </div>
      ${c.id === currId ? '<span class="chip c-teal">Activo</span>' : '<span class="chip c-gray">Abrir →</span>'}
    </div>
  `).join('') : '<div class="empty">No hay otros cursos registrados.</div>';
}

async function cambiarCurso(courseId) {
  if (courseId === S?.activeCourseId) { cerrarAll(); return; }
  showLoad('Cargando materia…');
  try {
    if (isOnline()) {
      const r = await API.getCourse(courseId);
      if (r.ok && r.data) {
        S = normalizeFromCloud(r.data);
        save();
      }
    } else {
      S.activeCourseId = courseId;
    }
  } catch (_) {}
  hideLoad();
  cerrarAll();
  renderAll();
  toast(`📚 Materia activa: ${S.perfil?.materia || 'Curso'}`, 'ok');
}

/* ═════════ EQUIPO DOCENTE & CRUD DE DOCENTES ═════════ */
function renderEquipo() {
  if (!S) return;
  renderSidebarAndHeader();
  $('#eq-sub').textContent = `Materia: ${S.perfil?.materia || 'Curso'} · Escala 1 a ${ESC().max}`;

  $('#eq-lista').innerHTML = (S.docentes || []).map(d => {
    const tel = d.telefono;
    const msgWA = `Hola ${d.nombre}, te contacto respecto a la materia ${S.perfil?.materia || ''} en Atril.`;
    const waUrl = getWhatsAppUrl(tel, msgWA);
    const mailUrl = getEmailUrl(d.email, `Coordinación Materia ${S.perfil?.materia || ''}`, msgWA);

    // Normalizar detección de rol
    const rLower = (d.rol || '').toLowerCase();
    const isTitular = rLower.includes('titular') && !rLower.includes('co-titular') && !rLower.includes('cotitular');
    const isCoTitular = rLower.includes('co-titular') || rLower.includes('cotitular');
    const isAuxiliar = rLower.includes('auxiliar') || rLower.includes('ayudante') || rLower.includes('jtp');
    const isCoordinacion = rLower.includes('coordinaci') || rLower.includes('jefatura');

    let rolBadgeText = 'Docente Co-titular';
    let rolChipClass = 'c-blue';

    if (isTitular) {
      rolBadgeText = 'Docente Titular';
      rolChipClass = 'c-teal';
    } else if (isCoordinacion) {
      rolBadgeText = 'Coordinación / Jefatura';
      rolChipClass = 'c-purple';
    } else if (isAuxiliar) {
      rolBadgeText = 'Docente Auxiliar';
      rolChipClass = 'c-amber';
    } else if (isCoTitular) {
      rolBadgeText = 'Docente Co-titular';
      rolChipClass = 'c-blue';
    }

    return `
      <div class="item" style="border-left: 4px solid ${isTitular ? 'var(--teal)' : (isCoordinacion ? 'var(--purple)' : 'var(--blue)')};">
        <span class="av" style="background:${d.color}">${ini(d.nombre)}</span>
        <div class="grow">
          <div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <div class="row" style="gap:6px;align-items:center">
              <h4 style="font-size:15px;font-weight:700">${esc(d.nombre)}</h4>
              ${d.yo ? '<span class="chip c-teal" style="font-size:10px;padding:2px 7px;font-weight:800">Vos</span>' : ''}
            </div>
            <span class="chip ${rolChipClass}" style="font-weight:700">${isTitular ? '⭐ ' : (isCoTitular ? '👥 ' : '')}${esc(rolBadgeText)}</span>
          </div>
          <div class="row" style="margin-top:4px;gap:8px;flex-wrap:wrap">
            ${d.email ? `<small style="color:var(--ink2)">✉️ ${esc(d.email)}</small>` : '<small style="color:var(--ink3)">Sin correo</small>'}
            ${tel ? `<small style="color:var(--ink2)">· 📞 ${esc(tel)}</small>` : ''}
          </div>
        </div>
        <div class="row" style="gap:6px">
          ${waUrl ? `
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn-whatsapp" title="Contactar por WhatsApp" style="padding:6px 10px;font-size:11px" onclick="event.stopPropagation()">
              <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
            </a>` : ''}
          ${mailUrl ? `
            <a href="${mailUrl}" class="btn-email" title="Enviar correo" style="padding:6px 10px;font-size:11px" onclick="event.stopPropagation()">
              ✉️
            </a>` : ''}
          <button class="icon-btn btn-xs" data-edit-doc="${d.id}" title="Editar docente" style="width:34px;height:34px">✏️</button>
        </div>
      </div>`;
  }).join('') || '<div class="empty">Sin docentes en el equipo.</div>';

  const me = API.user;
  const esAdmin = me && ROLES_ADMIN.includes(me.rol);
  $('#usr-admin').style.display = esAdmin ? 'inline-block' : 'none';
}

function abrirEditarDocente(docId) {
  const doc = (S.docentes || []).find(d => d.id === docId);
  if (!doc) return;
  $('#ed-id').value = doc.id;
  $('#ed-nombre').value = doc.nombre;
  $('#ed-email').value = doc.email || '';
  $('#ed-telefono').value = doc.telefono || '';

  const rLower = (doc.rol || '').toLowerCase();
  if (rLower.includes('co-titular') || rLower.includes('cotitular')) {
    $('#ed-rol').value = 'Co-titular';
  } else if (rLower.includes('titular')) {
    $('#ed-rol').value = 'Titular';
  } else if (rLower.includes('auxiliar') || rLower.includes('ayudante') || rLower.includes('jtp')) {
    $('#ed-rol').value = 'Auxiliar';
  } else if (rLower.includes('coordinaci') || rLower.includes('jefatura')) {
    $('#ed-rol').value = 'Coordinación';
  } else {
    $('#ed-rol').value = 'Co-titular';
  }

  colorSeleccionadoEditDoc = doc.color || PALETTE[2];
  renderColorPickers();
  abrir('#m-edit-docente');
}

function guardarEdicionDocente() {
  const id = $('#ed-id').value;
  const doc = (S.docentes || []).find(d => d.id === id);
  if (!doc) return;
  const n = ($('#ed-nombre').value || '').trim();
  if (!n) { toast('El nombre del docente no puede estar vacío', 'warn'); return; }

  doc.nombre = n;
  doc.email = ($('#ed-email').value || '').trim();
  doc.telefono = ($('#ed-telefono').value || '').trim();
  doc.rol = $('#ed-rol').value;
  doc.color = colorSeleccionadoEditDoc || doc.color;

  save();
  cerrarAll();
  renderAll();
  toast('Docente actualizado con éxito ✓', 'ok');
}

async function eliminarDocente(docId) {
  const doc = (S.docentes || []).find(d => d.id === docId);
  if (!doc) return;

  if ((S.docentes || []).length <= 1) {
    AtrilSwal.info('Docente único', 'No podés eliminar al único docente registrado en la materia.');
    return;
  }

  const ok = await AtrilSwal.danger({
    title: '¿Eliminar docente?',
    text: `¿Estás seguro de eliminar a ${doc.nombre} del equipo docente de esta materia? Sus ponderaciones y asignaciones se sincronizarán globalmente.`,
    confirmText: '🗑 Sí, eliminar docente',
    cancelText: 'Cancelar'
  });
  if (!ok) return;

  // 1. Remover docente de la nómina
  S.docentes = S.docentes.filter(d => d.id !== docId);

  // Asegurar que si el docente eliminado era titular, otro docente asuma como titular
  const hasTitular = S.docentes.some(d => {
    const r = (d.rol || '').toLowerCase();
    return r.includes('titular') && !r.includes('co-titular') && !r.includes('cotitular');
  });
  if (!hasTitular && S.docentes.length > 0) {
    S.docentes[0].rol = 'Docente titular';
  }

  const primerDocId = S.docentes[0]?.id || 'doc1';

  // 2. Limpiar referencias y normalizar ponderaciones en evaluaciones
  (S.evaluaciones || []).forEach(ev => {
    if (ev.docentes && ev.docentes.some(d => d.id === docId)) {
      ev.docentes = ev.docentes.filter(d => d.id !== docId);
      
      if (!ev.docentes.length) {
        ev.docentes = [{ id: primerDocId, peso: 100 }];
        ev.tipo = 'individual';
      } else if (ev.docentes.length === 1) {
        ev.docentes[0].peso = 100;
        ev.tipo = 'individual';
      } else {
        const sumP = ev.docentes.reduce((s, d) => s + (+d.peso || 0), 0) || 1;
        ev.docentes.forEach(d => {
          d.peso = Math.round((+d.peso || 0) / sumP * 100);
        });
      }
    }

    // Limpiar notas residuales registradas por el docente eliminado
    if (ev.notas) {
      Object.keys(ev.notas).forEach(alId => {
        if (ev.notas[alId] && ev.notas[alId][docId] !== undefined) {
          delete ev.notas[alId][docId];
        }
      });
    }
  });

  // 3. Si la evaluación activa en pantalla fue afectada, refrescarla
  if (calEv && (calEv.docentes || []).some(d => d.id === docId)) {
    calEv.docentes = calEv.docentes.filter(d => d.id !== docId);
    if (!calEv.docentes.length) calEv.docentes = [{ id: primerDocId, peso: 100 }];
  }

  save();
  cerrarAll();
  renderAll();
  toast(`🗑 Docente ${doc.nombre} eliminado del equipo`, 'warn');
}

async function renderUsuarios() {
  $('#usr-lista').innerHTML = '<div class="empty">Cargando usuarios…</div>';
  const r = await API.listUsers();
  if (!r.ok) { $('#usr-lista').innerHTML = `<div class="empty">${esc(r.error || 'Error al cargar')}</div>`; return; }
  const me = API.user;
  const roles = ['Docente titular', 'Docente co-titular', 'Coordinación / Jefatura'];
  $('#usr-lista').innerHTML = (r.users || []).map(u => `
    <div class="item" style="flex-direction:column;align-items:stretch;gap:8px">
      <div class="row" style="justify-content:space-between">
        <div><h4>${esc(u.nombre || u.email)}</h4><small>${esc(u.email)}</small></div>
        ${u.id === me?.id ? '<span class="chip c-teal">Vos</span>' : ''}
      </div>
      <div class="row" style="gap:6px;flex-wrap:wrap">
        ${roles.map(rol => `<button class="btn btn-s btn-xs ${u.rol === rol ? 'btn-p' : ''}" data-uid="${u.id}" data-rol="${rol}" ${u.id === me?.id ? 'disabled' : ''}>${esc(rol.split(' / ')[0])}</button>`).join('')}
      </div>
    </div>`).join('') || '<div class="empty">Sin usuarios.</div>';
}

/* ═════════ COMMAND PALETTE (CTRL + K) ═════════ */
let cmdSelectedIndex = 0;
let cmdResults = [];

function abrirCmd() {
  $('#cmd-overlay').classList.add('open');
  $('#cmd-input').value = '';
  actualizarCmdResults('');
  setTimeout(() => $('#cmd-input').focus(), 50);
}

function cerrarCmd() {
  $('#cmd-overlay').classList.remove('open');
}

function actualizarCmdResults(query) {
  const q = query.trim().toLowerCase();
  const res = [];

  // Navegación rápida
  const navItems = [
    { title: 'Ir a Inicio / Dashboard', cat: 'Navegación', act: () => navTo('inicio') },
    { title: 'Ver Nómina de Estudiantes', cat: 'Navegación', act: () => navTo('alumnos') },
    { title: 'Ver Planilla de Calificaciones', cat: 'Navegación', act: () => navTo('notas') },
    { title: 'Pase de Lista (Asistencia)', cat: 'Navegación', act: () => navTo('asistencia') },
    { title: 'Informes & Reporte Oficial PDF', cat: 'Navegación', act: () => navTo('informes') },
    { title: 'Declaración Jurada (Ley 3416/77)', cat: 'Navegación', act: () => navTo('ddjj') },
    { title: 'Régimen de Licencias (Dec. 561/71)', cat: 'Navegación', act: () => navTo('licencias') },
    { title: 'Estatuto Docente & Simulador de Puntaje', cat: 'Navegación', act: () => navTo('estatuto') },
    { title: 'Equipo Docente & Ajustes', cat: 'Navegación', act: () => navTo('equipo') }
  ];

  // Acciones Rápidas
  const actionItems = [
    { title: '＋ Nuevo Estudiante', cat: 'Acciones', act: () => { $('#na-nombre').value = ''; abrir('#m-alumno'); } },
    { title: '＋ Nueva Evaluación', cat: 'Acciones', act: () => { prepararEvModal(); abrir('#m-eval'); } },
    { title: '＋ Registrar Solicitud de Licencia Docente', cat: 'Acciones', act: () => abrirModalNuevaLicencia() },
    { title: '＋ Agregar Cargo en Declaración Jurada', cat: 'Acciones', act: () => abrirModalCargoDDJJ() },
    { title: '📸 Escanear Nómina con Foto / Cámara (OCR)', cat: 'Acciones', act: () => abrirModalImportar('foto') },
    { title: '📊 Calcular Puntaje de Junta (LUOM)', cat: 'Acciones', act: () => { navTo('estatuto'); cambiarTabEstatuto('simulador'); } },
    { title: '＋ Sumar Docente al Equipo', cat: 'Acciones', act: () => { $('#nd-nombre').value = ''; abrir('#m-docente'); } },
    { title: '📥 Importar Estudiantes desde Excel / CSV', cat: 'Acciones', act: () => abrirModalImportar('archivo') },
    { title: '📊 Descargar Planilla CSV', cat: 'Acciones', act: exportarCSV },
    { title: '🖨 Imprimir Formulario Oficial DDJJ (A4)', cat: 'Acciones', act: () => { navTo('ddjj'); setTimeout(imprimirDDJJOficial, 300); } },
    { title: '🖨 Imprimir / Guardar Reporte PDF', cat: 'Acciones', act: () => window.print() },
    { title: '🌓 Alternar Modo Oscuro / Claro', cat: 'Ajustes', act: toggleTheme },
    { title: '🔄 Forzar Sincronización con Google Sheets', cat: 'Ajustes', act: () => { if (isOnline()) API.saveCourse(S); } }
  ];

  // Estudiantes
  const studentItems = (S?.alumnos || []).map(a => ({
    title: a.nombre,
    cat: 'Estudiantes',
    badge: 'Ver ficha',
    act: () => { navTo('alumnos'); abrirPerfilAlumno(a.id); }
  }));

  // Docentes
  const teacherItems = (S?.docentes || []).map(d => ({
    title: d.nombre + (d.yo ? ' (Vos)' : ''),
    cat: 'Docentes',
    badge: d.rol || 'Docente',
    act: () => { navTo('equipo'); abrirEditarDocente(d.id); }
  }));

  // Evaluaciones
  const evalItems = (S?.evaluaciones || []).map(e => ({
    title: e.titulo,
    cat: 'Evaluaciones',
    badge: e.tipo === 'colectiva' ? 'Compartida' : 'Individual',
    act: () => abrirCalificar(e.id)
  }));

  const all = [...actionItems, ...navItems, ...studentItems, ...teacherItems, ...evalItems];
  cmdResults = all.filter(item => !q || item.title.toLowerCase().includes(q) || item.cat.toLowerCase().includes(q));

  cmdSelectedIndex = 0;
  renderCmdList();
}

function renderCmdList() {
  const box = $('#cmd-results');
  if (!cmdResults.length) {
    box.innerHTML = '<div class="empty" style="padding:20px">No se encontraron comandos ni resultados.</div>';
    return;
  }

  box.innerHTML = cmdResults.slice(0, 10).map((item, idx) => `
    <div class="cmd-item ${idx === cmdSelectedIndex ? 'selected' : ''}" data-cmd-idx="${idx}">
      <span>${esc(item.title)}</span>
      <span class="cmd-badge">${esc(item.badge || item.cat)}</span>
    </div>
  `).join('');

  box.querySelectorAll('.cmd-item').forEach(el => {
    el.onclick = () => {
      const idx = +el.dataset.cmdIdx;
      cerrarCmd();
      cmdResults[idx]?.act();
    };
  });
}

/* ═════════ IMPORTADOR MASIVO (EXCEL / CSV / TEXTO) ═════════ */
function abrirModalImportar() {
  listaImportacionPendiente = [];
  modoImportacionMerge = 'append';
  $('#imp-textarea').value = '';
  $('#imp-file-input').value = '';
  $('#imp-drop-title').textContent = 'Arrastrá tu archivo Excel o CSV acá';
  $('#imp-drop-sub').textContent = 'o hacé clic para seleccionar (.xlsx, .xls, .csv, .txt)';

  $$('#import-mode-tabs button').forEach(b => b.classList.toggle('on', b.dataset.impTab === 'texto'));
  $('#imp-tab-texto').style.display = 'block';
  $('#imp-tab-archivo').style.display = 'none';

  $$('#imp-merge-mode button').forEach(b => b.classList.toggle('on', b.dataset.merge === 'append'));

  actualizarPreviewImportacion();
  abrir('#m-importar');
}

function parsearTextoNomina(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const lines = raw.split(/\r?\n/);
  const result = [];
  const headersRegex = /^(nombre|apellido|alumno|estudiante|name|full\s*name|datos|n°|nro|orden|dni|documento)/i;

  lines.forEach(l => {
    let line = l.trim();
    if (!line) return;
    line = line.replace(/^[\d]+[\.\)\-\s]+/, '').replace(/^[\•\-\*]\s*/, '').trim();
    if (!line || line.length < 2) return;

    let parts = [];
    if (line.includes('\t')) parts = line.split('\t');
    else if (line.includes(';')) parts = line.split(';');
    else if (line.includes('|')) parts = line.split('|');
    else if ((line.match(/,/g) || []).length >= 2) parts = line.split(',');
    else parts = [line];

    parts = parts.map(p => p.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    let nombre = '';
    let dni = '';
    let contacto = '';
    let email = '';
    let obs = '';

    parts.forEach(p => {
      if (p.includes('@')) {
        email = p;
      } else if (/^\d{1,2}\.?\d{3}\.?\d{3}$/.test(p) || (/^\d{7,8}$/.test(p) && !p.startsWith('11') && !p.startsWith('15') && !p.startsWith('54'))) {
        dni = p;
      } else if (/\d{6,}/.test(p)) {
        contacto = p;
      } else if (!nombre && !headersRegex.test(p) && p.length >= 3) {
        nombre = p;
      } else if (nombre) {
        obs = obs ? obs + ' · ' + p : p;
      }
    });

    if (!nombre && parts[0]) nombre = parts[0];

    if (headersRegex.test(nombre) && (nombre.toLowerCase().includes('nombre') || nombre.toLowerCase().includes('alumno') || nombre.toLowerCase().includes('estudiante') || nombre.toLowerCase().includes('dni'))) return;

    if (nombre.includes(',') && !contacto) {
      const sub = nombre.split(',').map(s => s.trim());
      if (sub.length === 2 && sub[0] && sub[1]) nombre = `${sub[1]} ${sub[0]}`;
    }

    if (nombre.length >= 2) {
      result.push({ nombre: cap(nombre), dni: dni || '', contacto: contacto || '', email: email || '', obs: obs || '' });
    }
  });

  return result;
}

function parsearArchivoImportar(file) {
  if (!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  showLoad('Analizando archivo…');

  if ((ext === 'xlsx' || ext === 'xls') && typeof XLSX !== 'undefined') {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const rawLines = [];
        jsonRows.forEach(row => {
          if (Array.isArray(row) && row.length) {
            const line = row.filter(c => c != null && String(c).trim() !== '').join('\t');
            if (line) rawLines.push(line);
          }
        });

        listaImportacionPendiente = parsearTextoNomina(rawLines.join('\n'));
        $('#imp-drop-title').textContent = file.name;
        $('#imp-drop-sub').textContent = `${listaImportacionPendiente.length} estudiantes detectados`;
        actualizarPreviewImportacion();
        hideLoad();
        toast(`📄 ${listaImportacionPendiente.length} nombres leídos de Excel`, 'ok');
      } catch (err) {
        hideLoad();
        toast('Error al leer Excel: ' + err.message, 'err');
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        listaImportacionPendiente = parsearTextoNomina(e.target.result);
        $('#imp-drop-title').textContent = file.name;
        $('#imp-drop-sub').textContent = `${listaImportacionPendiente.length} estudiantes detectados`;
        actualizarPreviewImportacion();
        hideLoad();
        toast(`📄 ${listaImportacionPendiente.length} nombres leídos`, 'ok');
      } catch (err) {
        hideLoad();
        toast('Error al leer archivo: ' + err.message, 'err');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }
}

function actualizarPreviewImportacion() {
  const box = $('#imp-preview-box');
  const chip = $('#imp-count-chip');
  const btn = $('#imp-submit-btn');

  const count = listaImportacionPendiente.length;
  chip.textContent = `${count} detectados`;
  btn.disabled = count === 0;
  btn.textContent = count > 0 ? `📥 Importar ${count} estudiantes ahora →` : '📥 Importar nómina →';

  if (count === 0) {
    box.innerHTML = '<div class="empty" style="padding:12px">Escribí o subí un archivo para previsualizar.</div>';
    return;
  }

  box.innerHTML = listaImportacionPendiente.map((al, idx) => `
    <div class="row" style="justify-content:space-between;padding:6px 10px;border-bottom:1px solid var(--line-light)">
      <div>
        <b>${idx + 1}. ${esc(al.nombre)}</b>
        ${al.dni || al.contacto || al.email || al.obs ? `<small style="display:block;color:var(--ink2);font-size:11.5px">${esc([al.dni ? 'DNI: ' + al.dni : '', al.contacto, al.email, al.obs].filter(Boolean).join(' · '))}</small>` : ''}
      </div>
      <button class="icon-btn btn-xs" data-rm-imp="${idx}" style="width:24px;height:24px">✕</button>
    </div>
  `).join('');

  box.querySelectorAll('[data-rm-imp]').forEach(b => {
    b.onclick = e => {
      const idx = +e.currentTarget.dataset.rmImp;
      listaImportacionPendiente.splice(idx, 1);
      actualizarPreviewImportacion();
    };
  });
}

function ejecutarImportacion() {
  if (!listaImportacionPendiente.length) return;
  const count = listaImportacionPendiente.length;

  if (modoImportacionMerge === 'replace') {
    S.alumnos = [];
    (S.evaluaciones || []).forEach(ev => { ev.notas = {}; });
    S.asistencia = {};
  }

  const cId = S?.activeCourseId;
  listaImportacionPendiente.forEach((p, i) => {
    S.alumnos.push({
      id: uid(),
      curso_id: cId,
      nombre: p.nombre,
      dni: p.dni || '',
      telefono: p.contacto || '',
      email: p.email || '',
      color: PALETTE[(S.alumnos.length + i) % 8],
      obs: p.obs || '',
      contacto: p.contacto || ''
    });
  });

  save();
  cerrarAll();
  renderAll();
  toast(`📥 ¡${count} estudiantes importados con éxito! ✓`, 'ok');
}

function descargarPlantillaCSV() {
  const content = '\uFEFFNombre y Apellido,Telefono / WhatsApp,Email,Observaciones\r\n"Ana Torres","5491145678901","ana@familia.edu","Excelente desempeño"\r\n"Bruno Cabrera","5491144556677","carlos.cabrera@correo.com","Participativo"\r\n"Camila Sosa","5491122334455","camila@escuela.edu","Entregas al día"';
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Plantilla_Nomina_Estudiantes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('📄 Plantilla CSV descargada', 'ok');
}

/* ═══════════════════════════════════════════════════════════
   ATRIL 4.0: MÓDULOS DE LEGISLACIÓN, TRÁMITES Y OCR INTELIGENTE
   - Declaración Jurada de Cargos e Incompatibilidad (Ley 3416/77)
   - Régimen de Licencias, Justificaciones y Permisos (Dec. 561-G-71)
   - Estatuto del Personal Docente & Simulador de Puntaje (Ley 3520/78)
   - Extracción y Escaneo de Nóminas vía OCR con Tesseract.js
   ═══════════════════════════════════════════════════════════ */

/* ═════════ DATOS NORMATIVOS: CATÁLOGO DE LICENCIAS (DEC. 561-G-71) ═════════ */
const CATALOGO_LICENCIAS = [
  {
    art: 'art2',
    titulo: 'Art. 2: Enfermedades Comunes e Intervenciones Menores',
    dias: '30 días año / 40 días cirugía menor',
    goce: 'Con goce íntegro de haberes',
    cat: 'salud',
    desc: 'Corresponde por enfermedades comunes o incapacidad temporaria resultante de accidentes acaecidos fuera de servicio. Se amplía hasta 40 días en caso de intervenciones quirúrgicas menores.',
    requisitos: 'Avisar hasta 1 hora después del ingreso. Justificación con certificado médico dentro de las 48 horas hábiles. Certificado expedido por el Departamento de Reconocimientos Médicos de la Provincia.'
  },
  {
    art: 'art3',
    titulo: 'Art. 3 (Res. 071/91): Desempeño de Cargo de Mayor Jerarquía',
    dias: 'Hasta 3 años continuos',
    goce: 'Sin goce de haberes',
    cat: 'institucional',
    desc: 'Por desempeñar cargos de mayor jerarquía en el sistema educativo provincial o nacional, siempre que se respete el escalafón y la acumulación legal.',
    requisitos: 'Acreditar el nombramiento y toma de posesión del cargo de mayor jerarquía dentro de los límites de acumulación permitidos.'
  },
  {
    art: 'art5',
    titulo: 'Art. 5 (Res. 071/91 / Res. 5477/94): Perfeccionamiento Docente',
    dias: 'Hasta 6 días con goce (+4 sin goce)',
    goce: 'Con goce de haberes (6 ds) / Sin goce (4 ds)',
    cat: 'estudios',
    desc: 'Para asistir a cursos, cursillos, seminarios, congresos o exposiciones oficiales afines a la especialidad docente, excepto en días de exámenes finales.',
    requisitos: 'Solicitud con 5 días hábiles de anticipación mínima especificando tema, lugar y fecha. Acreditación de asistencia dentro de las 24 horas reglamentarias.'
  },
  {
    art: 'art8',
    titulo: 'Art. 8: Enfermedad de Largo Tratamiento',
    dias: '365 ds al 100% + 365 ds al 50% + 180 ds sin sueldo',
    goce: 'Escalonado (100%, 50% y sin goce)',
    cat: 'salud',
    desc: 'Por afecciones graves o intervenciones quirúrgicas mayores que inhabiliten para el desempeño. 365 días continuos o discontinuos al 100%, ampliación de 365 días al 50%, y prórroga de 180 días sin goce.',
    requisitos: 'Dictamen exclusivo de Junta Médica de la Subsecretaría de Salud Pública Provincial. Incompatible con otra función pública o privada.'
  },
  {
    art: 'art9',
    titulo: 'Art. 9: Atención de Miembro del Grupo Familiar Enfermo',
    dias: '10 días hábiles con goce (+20 sin goce)',
    goce: '10 ds con goce / 20 ds sin goce',
    cat: 'familiar',
    desc: 'Para consagrarse a la atención indispensable de un familiar enfermo que integre el grupo familiar conviviente y no pueda valerse por sí mismo.',
    requisitos: 'Certificado de Reconocimiento Médico y Declaración Jurada que especifique: ser único familiar, convivencia en el mismo domicilio e imposibilidad del paciente de valerse solo.'
  },
  {
    art: 'art12',
    titulo: 'Art. 12: Licencia por Maternidad',
    dias: '84 días corridos (105 ds parto múltiple)',
    goce: 'Con goce íntegro de haberes',
    cat: 'familiar',
    desc: 'Licencia por maternidad dividida preferentemente en dos períodos (pre-parto y post-parto no menor a 42 días). Parto múltiple: 105 días corridos con post-parto no menor a 63 días.',
    requisitos: 'Certificado médico con fecha probable de parto. En caso de parto diferido se reajusta con Art. 2 y 8.'
  },
  {
    art: 'art14',
    titulo: 'Art. 14: Franquicia por Lactancia (Ley 12.568)',
    dias: '240 días corridos desde nacimiento',
    goce: 'Reducción de jornada laboral',
    cat: 'familiar',
    desc: 'Toda madre lactante en jornadas superiores a 4 horas diarias tiene derecho a dos descansos de 1/2 hora o disminución de 1 hora al inicio o final de la jornada laboral.',
    requisitos: 'Acreditación de nacimiento y jornada laboral docente.'
  },
  {
    art: 'art15',
    titulo: 'Art. 15: Razones Políticas y Cargos Electivos',
    dias: 'Mientras dure el mandato electivo',
    goce: 'Sin goce de haberes',
    cat: 'institucional',
    desc: 'Por haber sido elegido miembro de los poderes ejecutivo o legislativo de la nación, provincia o municipalidades.',
    requisitos: 'Antigüedad docente no inferior a 3 años de servicio en la repartición.'
  },
  {
    art: 'art16',
    titulo: 'Art. 16: Desempeño de Cargos Gremiales (Ley 14.455)',
    dias: 'Mientras dure el mandato sindical',
    goce: 'Sin goce de haberes',
    cat: 'institucional',
    desc: 'Para desempeñar cargos directivos en asociaciones profesionales y gremiales con personería jurídica reconocida.',
    requisitos: 'Certificación oficial de personería gremial y designación en el cargo directivo.'
  },
  {
    art: 'art17_mat',
    titulo: 'Art. 17 Inc. 1: Matrimonio del Agente o de Hijos',
    dias: '10 días corridos (agente) / 1 día (hijos)',
    goce: 'Con goce íntegro de haberes',
    cat: 'familiar',
    desc: 'Matrimonio del docente: 10 días corridos continuos. Matrimonio de hijos: 1 día laborable.',
    requisitos: 'Acta o certificado de matrimonio oficial dentro de las 48 hs de reintegro.'
  },
  {
    art: 'art17_nac',
    titulo: 'Art. 17 Inc. 2: Nacimiento de Hijos (Agente Varón)',
    dias: '2 días laborables',
    goce: 'Con goce íntegro de haberes',
    cat: 'familiar',
    desc: 'Por nacimiento de hijos del agente docente varón.',
    requisitos: 'Partida o certificado de nacimiento expedido por el Registro Civil.'
  },
  {
    art: 'art17_fal',
    titulo: 'Art. 17 Inc. 3: Fallecimiento de Familiares (Duelo)',
    dias: '5 días (1er grado) / 2 días (2do grado)',
    goce: 'Con goce íntegro de haberes',
    cat: 'familiar',
    desc: 'Por fallecimiento de cónyuge o consanguíneo en 1er grado (padres, hijos): 5 días laborables. Parientes afines de 1er grado y 2do grado (hermanos, abuelos, nietos): 2 días laborables.',
    requisitos: 'Certificado de defunción y constancia del vínculo de parentesco.'
  },
  {
    art: 'art18',
    titulo: 'Art. 18: Licencia Decenal Extraordinaria',
    dias: '6 meses cada 10 años (fraccionable)',
    goce: 'Sin goce de haberes',
    cat: 'particulares',
    desc: 'En el transcurso de cada decenio, licencia sin sueldo por 6 meses fraccionables en dos períodos. No acumulable entre decenios.',
    requisitos: 'Antigüedad docente ininterrumpida mínima de 3 años. Intervalo mínimo de 2 años entre licencias de distintos decenios. Presentar DDJJ al finalizar.'
  },
  {
    art: 'art19',
    titulo: 'Art. 19: Congresos, Conferencias e Investigaciones',
    dias: 'A determinar por Dirección General',
    goce: 'Con goce de haberes',
    cat: 'estudios',
    desc: 'Por razones de interés público y auspicio oficial para investigaciones, congresos científicos, técnicos o artísticos.',
    requisitos: 'Antigüedad mínima de 2 años en la DIGEMAS. Compromiso de no retirarse del cargo por al menos 2 años tras su reintegro.'
  },
  {
    art: 'art20',
    titulo: 'Art. 20: Razones Particulares de Fuerza Mayor',
    dias: 'Hasta 6 días hábiles al año (máx 2 por mes)',
    goce: 'Con goce íntegro de haberes',
    cat: 'particulares',
    desc: 'Para justificar inasistencias por razones particulares de fuerza mayor. No podrán exceder de dos días por mes ni de seis en el año calendario.',
    requisitos: 'Aviso y justificación dentro de las 24 horas hábiles de producida la inasistencia. No aplicable en días de examen final ni reuniones obligatorias.'
  },
  {
    art: 'art24',
    titulo: 'Art. 24: Citaciones Judiciales',
    dias: 'Por el tiempo que insuma la diligencia',
    goce: 'Con goce de haberes',
    cat: 'institucional',
    desc: 'Por comparecencia obligatoria ante juzgados, tribunales o citaciones judiciales debidamente notificadas.',
    requisitos: 'Cédula o citación judicial con constancia de asistencia y horario emitida por el tribunal.'
  },
  {
    art: 'art27',
    titulo: 'Art. 27: Rendir Exámenes en Nivel Terciario o Universitario',
    dias: 'Hasta 28 días hábiles en el año',
    goce: 'Con goce íntegro de haberes',
    cat: 'estudios',
    desc: 'Para rendir examen en establecimientos oficiales o incorporados, en períodos no superiores a 7 días hábiles por turno.',
    requisitos: 'Certificado de examen rendido con fecha, materia y firma de la mesa examinadora presentado dentro de las 48 hs.'
  },
  {
    art: 'art27bis',
    titulo: 'Art. 27 Bis (Dec. 1813-G-73): Vacaciones Directivos y Secretaría',
    dias: '10 a 25 días hábiles según antigüedad',
    goce: 'Con goce íntegro de haberes',
    cat: 'institucional',
    desc: 'Licencia obligatoria en mes de enero para personal directivo y secretaría docente: 10 días (>6 meses a 5 años), 15 días (>5 a 10 años), 20 días (>10 a 20 años), 25 días (>20 años).',
    requisitos: 'Cómputo según antigüedad docente certificada.'
  }
];

/* ═════════ DATOS NORMATIVOS: ESTATUTO DEL DOCENTE (LEY 3520/78) ═════════ */
const COMPENDIO_ESTATUTO = [
  {
    num: 1, cap: 'I', capNombre: 'Disposiciones Generales',
    titulo: 'Concepto de Docente',
    texto: 'Se consideran docentes, a los efectos de esta Ley, a todos aquellos que imparten, dirijan, supervisen u orienten la educación general y la enseñanza sistematizada, así como a quienes colaboren directamente en esas funciones con sujeción a normas pedagógicas y reglamentaciones del presente Estatuto.',
    regl: 'D. 3672-G-78: Clasifica a quienes imparten enseñanza directa, directores sin dirección libre, supervisores, directivos superiores y auxiliares de la enseñanza.'
  },
  {
    num: 2, cap: 'II', capNombre: 'Del Personal Docente',
    titulo: 'Situaciones de Revista (Activa, Pasiva, Retiro)',
    texto: 'Determina los deberes y derechos del personal docente desde el momento de su designación: a) ACTIVA: en funciones específicas o en uso de licencia con goce de sueldo; b) PASIVA: en uso de licencia sin goce de sueldos, adscripciones, servicio militar o suspendidos; c) RETIRO: personal jubilado.',
    regl: 'D. 3672-G-78: El docente que toma posesión como titular, interino o suplente entra automáticamente en situación activa.'
  },
  {
    num: 3, cap: 'II', capNombre: 'Del Personal Docente',
    titulo: 'Extinción de Deberes y Derechos',
    texto: 'Los deberes y derechos del personal docente se extinguen: a) Por renuncia aceptada; b) Por cesantía; c) Por exoneración.',
    regl: 'D. 3672-G-78: La renuncia tiene efectos a partir de la aceptación ministerial formal.'
  },
  {
    num: 4, cap: 'III', capNombre: 'Deberes y Derechos',
    titulo: 'Deberes de los Docentes',
    texto: 'Son deberes del docente: a) Desempeñar digna, eficaz y lealmente las funciones; b) Educar en los principios democráticos con absoluta prescindencia partidista; c) Respetar la jurisdicción técnica, administrativa y la vía jerárquica; d) Observar conducta acorde con la dignidad docente; e) Propender al perfeccionamiento pedagógico continuo; f) Cumplir horarios fijados.',
    regl: 'Norma de cumplimiento obligatorio para todo el personal docente.'
  },
  {
    num: 5, cap: 'III', capNombre: 'Deberes y Derechos',
    titulo: 'Derechos de los Docentes',
    texto: 'Son derechos del docente: a) Estabilidad en el cargo y jerarquía; b) Remuneración y jubilación justas actualizadas; c) Derecho al ascenso, aumento de clases semanales, traslado y permuta por concurso; d) Cambio de funciones sin merma salarial por pérdida de aptitud psicofísica (a los 10 años de servicio); e) Concentración de tareas; f) Condiciones dignas de higiene y local; g) Licencias especiales.',
    regl: 'D. 3672-G-78: Regula el reconocimiento médico por autoridad competente y el derecho a asistencia social extensible a cónyuges e hijos.'
  },
  {
    num: 6, cap: 'IV', capNombre: 'Clasificación Establecimientos',
    titulo: 'Categorías y Ubicación Escolar',
    texto: 'Clasifica los establecimientos: 1º Por tipo (Media, Especial); 2º Por número de alumnos y divisiones: Primera Categoría (18+ divisiones o 600+ alumnos), Segunda Categoría (10 a 17 divisiones o 350+ alumnos), Tercera Categoría (<10 divisiones); 3º Por ubicación: Favorable, Desfavorable, Muy Desfavorable.',
    regl: 'D. 3672-G-78: Establece coeficientes y bonificaciones por radio urbano y aislamiento.'
  },
  {
    num: 7, cap: 'V', capNombre: 'Ejercicio de la Docencia',
    titulo: 'Requisitos Generales para el Ingreso',
    texto: 'Para el ejercicio docente se requiere: a) Ser argentino (con 5 años de residencia en la provincia para naturalizados); b) Acreditar aptitud psico-física adecuada mediante certificado oficial; c) No registrar procesos penales ni exoneraciones en la función pública; d) Poseer título docente expedido por Universidad o Instituto Terciario reconocido.',
    regl: 'D. 3168-G-91: Define los alcances y validez de títulos para nivel inicial, primario y medio.'
  },
  {
    num: 8, cap: 'V', capNombre: 'Ejercicio de la Docencia',
    titulo: 'Clasificación de Títulos Docentes',
    texto: 'Los títulos se clasifican con valorización de mérito: a) Título Docente para la especialidad: 9 puntos; b) Título Habilitante en la especialidad: 6 puntos; c) Título Supletorio: 3 puntos.',
    regl: 'D. 1681-EC-94: Se establece el orden excluyente: Docentes desplazan a Habilitantes y estos a Supletorios.'
  },
  {
    num: 12, cap: 'VI', capNombre: 'Nombramientos',
    titulo: 'Época de Designación de Titulares',
    texto: 'Las designaciones de personal docente titular se harán en dos períodos fijos: a) Del 1 de enero al 15 de febrero (para iniciar el ciclo lectivo); b) Del 1 de julio al 31 de julio. Toma de posesión dentro de 30 días de la notificación.',
    regl: 'D. 1774-G-83: La falta de toma de posesión injustificada inhabilita para concursar por 3 años.'
  },
  {
    num: 13, cap: 'VII', capNombre: 'De la Estabilidad',
    titulo: 'Garantía de Estabilidad',
    texto: 'El personal docente tendrá derecho a la estabilidad en el cargo mientras dure su buena conducta, conserve las condiciones morales, eficiencia y capacidad física. El provisional sólo podrá ser desplazado por un titular.',
    regl: 'D. 3672-G-78: La eficiencia se constata por concepto profesional (Sobresaliente, Muy Bueno, Bueno, Regular, Deficiente).'
  },
  {
    num: 16, cap: 'VII', capNombre: 'De la Estabilidad',
    titulo: 'Disponibilidad por Cambio de Plan o Cierre',
    texto: 'Cuando fueren suprimidas asignaturas o divisiones y los titulares queden en disponibilidad, ésta será con goce de sueldo hasta 1 año. La Junta procederá a su reubicación en cargos afines.',
    regl: 'D. 3672-G-78: El docente tiene derecho a expresar preferencia de destino dentro de los 10 días hábiles.'
  },
  {
    num: 17, cap: 'VIII', capNombre: 'Destino de las Vacantes',
    titulo: 'Distribución Anual de Vacantes',
    texto: 'Hasta el 40% de las vacantes se cubrirá por traslados y concentración de tareas o razones de salud. El otro 60% se destinará a acrecentamiento de horas e ingreso titular a la docencia.',
    regl: 'D. 3672-G-78: Publicación semestral de vacantes por la Junta de Clasificación.'
  },
  {
    num: 19, cap: 'X', capNombre: 'Titularización y Baremo',
    titulo: 'Valoración de Títulos y Antecedentes (LUOM)',
    texto: 'Ingreso por concurso. Baremo oficial: Título Docente 9 pts; Otros títulos superiores afines hasta 2 pts; Antigüedad de título 0.25 pt/año (máx 3 pts); Antigüedad docente 0.25 pt/año (máx 6 pts); Conceptos Sobresaliente 1 pt/año, Muy Bueno 0.5 pt/año; Cursos 0.01 pt cada 10 hs (máx 7 pts); Publicaciones hasta 3 pts.',
    regl: 'D. 3168-G-91: Tabla unificada de puntuación para el Listado Único de Orden de Mérito provincial.'
  },
  {
    num: 20, cap: 'X', capNombre: 'Titularización y Baremo',
    titulo: 'Límite Máximo de Horas Cátedra (36 Horas)',
    texto: 'El personal titular podrá acrecentar horas cátedra hasta alcanzar un máximo legal de treinta y seis (36) horas cátedra semanales, sean éstas de jurisdicción nacional, provincial o municipal.',
    regl: 'D. 3168-G-91: El docente debe encuadrar su situación dentro de los límites de acumulación de cargos permitidos.'
  },
  {
    num: 27, cap: 'XI', capNombre: 'De los Ascensos',
    titulo: 'Requisitos para Ascensos Jerárquicos',
    texto: 'Para optar a cargos directivos se requiere revistar como titular en servicio activo con concepto no inferior a Muy Bueno y acreditar antigüedad: 7 años para Vicedirector, 10 años para Director/Rector, 12 años para Supervisor.',
    regl: 'D. 3672-G-78: Concurso de antecedentes y pruebas de oposición teóricas y prácticas ante jurado.'
  },
  {
    num: 34, cap: 'XII', capNombre: 'Permutas y Traslados',
    titulo: 'Régimen de Permutas',
    texto: 'El personal en situación activa o pasiva tiene derecho a permutar con otro docente titular de igual jerarquía, denominación y horas, en cualquier época excepto en los dos últimos meses del ciclo escolar.',
    regl: 'D. 3672-G-78: Dictamen de la Junta de Clasificación dentro de los 10 días hábiles de la presentación.'
  },
  {
    num: 40, cap: 'XIV', capNombre: 'Interinatos y Suplencias',
    titulo: 'Inscripción y Orden de Mérito para Suplencias',
    texto: 'Los aspirantes a interinatos y suplencias deben cumplir las mismas condiciones que para titulares. Inscripciones ordinarias en agosto y complementarias en enero y marzo.',
    regl: 'D. 3672-G-78 / D. 531-EC-93: Inscripción abierta en todos los establecimientos para títulos docentes.'
  },
  {
    num: 47, cap: 'XV', capNombre: 'Junta de Clasificación',
    titulo: 'Composición y Elección de la Junta',
    texto: 'Organismo permanente de 5 miembros: 3 elegidos por voto directo, secreto y obligatorio de los docentes titulares e interinos (duran 4 años), y 2 designados por el Poder Ejecutivo (duran 2 años).',
    regl: 'D. 3168-G-91: Elabora legajos, califica antecedentes y confecciona las listas de orden de mérito anuales.'
  },
  {
    num: 66, cap: 'XVI', capNombre: 'Disciplina y Sanciones',
    titulo: 'Escala de Sanciones Disciplinarias',
    texto: 'Las faltas del personal docente serán sancionadas con: a) Amonestación; b) Apercibimiento; c) Suspensión hasta cinco días; d) Suspensión de seis a noventa días; e) Postergación de ascenso; f) Retrogradación de jerarquía; g) Cesantía; h) Exoneración.',
    regl: 'Ninguna suspensión mayor a 5 días ni cesantía podrá aplicarse sin previo sumario que garantice el derecho de defensa (Art. 76).'
  },
  {
    num: 85, cap: 'XVI', capNombre: 'Disciplina y Sanciones',
    titulo: 'Sanciones por Incumplimiento de Horario',
    texto: 'El personal que sin causa justificada incurriere en incumplimiento de horario se hará pasible de: 1º falta: sin sanción; 2ª a 5ª: amonestación; 6ª a 8ª: apercibimiento; 9ª: 1 día de suspensión; 10ª: 2 días de suspensión; más de 10 faltas en el año: sanciones graves.',
    regl: 'Norma de computación anual automática en legajo profesional.'
  },
  {
    num: 92, cap: 'XVI', capNombre: 'Disciplina y Sanciones',
    titulo: 'Cómputo de Tardanzas (4 Tardanzas = 1 Inasistencia)',
    texto: 'Cuando el agente llegare hasta 10 minutos después de la hora fijada incurrirá en falta de puntualidad. CUATRO (4) FALTAS DE PUNTUALIDAD SERÁN COMPUTADAS COMO UNA INASISTENCIA COMPLETA. Cuando la tardanza supere los 10 minutos se considerará ausente.',
    regl: 'Las inasistencias resultantes de acumulación de tardanzas darán lugar al descuento correspondiente según Art. 91.'
  },
  {
    num: 93, cap: 'XVI', capNombre: 'Disciplina y Sanciones',
    titulo: 'Plazo de Justificación de Inasistencias (24 Horas)',
    texto: 'La presentación de certificados y el pedido de justificación de inasistencias se realizará dentro de las veinticuatro (24) horas hábiles de producida la inasistencia.',
    regl: 'Las faltas sin aviso dentro del plazo se consideran injustificadas y acumulativas para cesantía.'
  }
];


/* ═════════ ATRIL 4.0: DECLARACIÓN JURADA (LEY 3416/77) ═════════ */
let modoVistaDDJJ = 'cuadro1';

function getDDJJ() {
  if (S && S.ddjj) return S.ddjj;
  try {
    const raw = localStorage.getItem(LS_KEYS.DDJJ);
    if (raw) {
      const data = JSON.parse(raw);
      if (S) S.ddjj = data;
      return data;
    }
  } catch (e) {}

  const def = {
    datos: {
      nombre: S?.docentes?.[0]?.nombre || 'Leonel Gimenez',
      dni: '34.635.700',
      cuil: '20-34635700-4',
      fnac: '1989-05-14',
      titulo: 'Profesor en Educación Secundaria',
      domicilio: 'Belgrano 1245',
      barrio: 'Los Perales',
      localidad: 'San Salvador de Jujuy',
      fechaPres: localISO()
    },
    cargos: [
      {
        id: 'cg1',
        orden: 1,
        ministerio: 'Educación',
        establecimiento: 'Colegio Secundario Nº 1',
        jurisdiccion: 'Provincial',
        horas: '12 hs',
        nivel: 'Nivel Medio (NM)',
        tipo: 'Docente',
        caracter: 'Titular',
        desde: '2022-03-01',
        hasta: 'Continúa',
        situacion: 'Activo',
        lun: '07:30-11:50',
        mar: '',
        mie: '07:30-11:50',
        jue: '',
        vie: '07:30-09:40',
        sab: ''
      },
      {
        id: 'cg2',
        orden: 2,
        ministerio: 'Educación',
        establecimiento: 'Escuela Provincial de Comercio Nº 3',
        jurisdiccion: 'Provincial',
        horas: '8 hs',
        nivel: 'Nivel Medio (NM)',
        tipo: 'Docente',
        caracter: 'Prov. / Interino',
        desde: '2023-04-15',
        hasta: 'Continúa',
        situacion: 'Activo',
        lun: '',
        mar: '14:00-18:00',
        mie: '',
        jue: '14:00-18:00',
        vie: '',
        sab: ''
      }
    ],
    espacios: [
      {
        id: 'esp1',
        orden: 1,
        espacio: 'Lengua y Literatura I',
        horas: '4 hs',
        caracter: 'Anual',
        curso: '1º Año',
        division: '1ª'
      }
    ]
  };

  if (S) S.ddjj = def;
  saveDDJJ(def);
  return def;
}

function saveDDJJ(ddjj) {
  if (S) S.ddjj = ddjj;
  try {
    localStorage.setItem(LS_KEYS.DDJJ, JSON.stringify(ddjj));
  } catch (e) {}
  save();
}

function cambiarTabDDJJ(tabId) {
  modoVistaDDJJ = tabId;
  $$('#ddjj-tabs button').forEach(b => b.classList.toggle('on', b.dataset.ddjjTab === tabId));
  $$('.ddjj-panel').forEach(p => p.style.display = 'none');
  const panel = $(`#ddjj-panel-${tabId}`);
  if (panel) panel.style.display = 'block';

  if (tabId === 'vista-oficial') renderDDJJOficialA4();
}

function renderDDJJ() {
  const d = getDDJJ();
  if (!d) return;

  // Llenar campos de datos personales si están disponibles
  if (d.datos) {
    if ($('#ddjj-nombre')) $('#ddjj-nombre').value = d.datos.nombre || '';
    if ($('#ddjj-dni')) $('#ddjj-dni').value = d.datos.dni || '';
    if ($('#ddjj-cuil')) $('#ddjj-cuil').value = d.datos.cuil || '';
    if ($('#ddjj-fnac')) $('#ddjj-fnac').value = d.datos.fnac || '';
    if ($('#ddjj-titulo')) $('#ddjj-titulo').value = d.datos.titulo || '';
    if ($('#ddjj-domicilio')) $('#ddjj-domicilio').value = d.datos.domicilio || '';
    if ($('#ddjj-barrio')) $('#ddjj-barrio').value = d.datos.barrio || '';
    if ($('#ddjj-localidad')) $('#ddjj-localidad').value = d.datos.localidad || '';
  }

  renderDDJJCargos();
  renderDDJJHorarios();
  renderDDJJEspacios();
  verificarIncompatibilidadDDJJ();
}

function renderDDJJCargos() {
  const d = getDDJJ();
  const tbody = $('#ddjj-cargos-tbody');
  if (!tbody) return;

  const cargos = d.cargos || [];
  if (!cargos.length) {
    tbody.innerHTML = '<tr><td colspan="11" style="padding:28px;text-align:center;color:var(--ink2)">No hay cargos cargados. Hacé clic en "＋ Agregar Cargo" para registrar.</td></tr>';
    return;
  }

  tbody.innerHTML = cargos.map(c => `
    <tr>
      <td style="font-weight:700">${c.orden || 1}</td>
      <td>${esc(c.ministerio || 'Educación')}</td>
      <td class="td-left" style="font-weight:700">${esc(c.establecimiento || '—')}</td>
      <td><span class="chip c-gray">${esc(c.jurisdiccion || 'Provincial')}</span></td>
      <td style="font-weight:800;color:var(--teal)">${esc(c.horas || '—')}</td>
      <td>${esc(c.nivel || '—')}</td>
      <td>${esc(c.tipo || 'Docente')}</td>
      <td><span class="chip ${c.caracter === 'Titular' ? 'c-teal' : 'c-blue'}">${esc(c.caracter || 'Titular')}</span></td>
      <td style="font-size:12px">${esc(c.desde || '—')} a ${esc(c.hasta || 'Continúa')}</td>
      <td><span class="chip ${c.situacion === 'Activo' ? 'c-teal' : 'c-coral'}">${esc(c.situacion || 'Activo')}</span></td>
      <td class="no-print" style="white-space:nowrap">
        <button class="icon-btn btn-xs" data-edit-cargo="${c.id}" title="Editar cargo">✎</button>
        <button class="icon-btn btn-xs" data-del-cargo="${c.id}" title="Eliminar cargo" style="color:var(--coral)">✕</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit-cargo]').forEach(b => {
    b.onclick = () => abrirModalCargoDDJJ(b.dataset.editCargo);
  });
  tbody.querySelectorAll('[data-del-cargo]').forEach(b => {
    b.onclick = () => eliminarCargoDDJJ(b.dataset.delCargo);
  });
}

function renderDDJJHorarios() {
  const d = getDDJJ();
  const tbody = $('#ddjj-horarios-tbody');
  if (!tbody) return;

  const cargos = d.cargos || [];
  if (!cargos.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center">Cargá cargos en el Cuadro 1 para definir sus horarios.</td></tr>';
    return;
  }

  tbody.innerHTML = cargos.map(c => `
    <tr>
      <td style="font-weight:800">${c.orden || 1}</td>
      <td class="td-left"><b>${esc(c.establecimiento)}</b><br><small style="color:var(--ink2)">${esc(c.horas || '')}</small></td>
      <td>${c.lun ? `<span class="chip c-teal" style="font-size:11.5px">${esc(c.lun)}</span>` : '—'}</td>
      <td>${c.mar ? `<span class="chip c-teal" style="font-size:11.5px">${esc(c.mar)}</span>` : '—'}</td>
      <td>${c.mie ? `<span class="chip c-teal" style="font-size:11.5px">${esc(c.mie)}</span>` : '—'}</td>
      <td>${c.jue ? `<span class="chip c-teal" style="font-size:11.5px">${esc(c.jue)}</span>` : '—'}</td>
      <td>${c.vie ? `<span class="chip c-teal" style="font-size:11.5px">${esc(c.vie)}</span>` : '—'}</td>
      <td>${c.sab ? `<span class="chip c-amber" style="font-size:11.5px">${esc(c.sab)}</span>` : '—'}</td>
      <td style="font-weight:700">${esc(c.horas || '—')}</td>
    </tr>
  `).join('');
}

function renderDDJJEspacios() {
  const d = getDDJJ();
  const tbody = $('#ddjj-espacios-tbody');
  if (!tbody) return;

  const espacios = d.espacios || [];
  if (!espacios.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:24px;text-align:center;color:var(--ink2)">Sin espacios curriculares de nivel superior registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = espacios.map((esp, i) => `
    <tr>
      <td style="font-weight:700">${esp.orden || i + 1}</td>
      <td class="td-left" style="font-weight:700">${esc(esp.espacio)}</td>
      <td><span class="chip c-teal">${esc(esp.horas || '—')}</span></td>
      <td>${esc(esp.caracter || 'Anual')}</td>
      <td>${esc(esp.curso || '—')}</td>
      <td>${esc(esp.division || '—')}</td>
      <td class="no-print">
        <button class="icon-btn btn-xs" data-del-espacio="${esp.id}" style="color:var(--coral)">✕</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-del-espacio]').forEach(b => {
    b.onclick = () => eliminarEspacioDDJJ(b.dataset.delEspacio);
  });
}

function verificarIncompatibilidadDDJJ() {
  const d = getDDJJ();
  const badge = $('#ddjj-status-badge');
  const desc = $('#ddjj-status-desc');
  if (!badge || !desc) return;

  const cargos = d.cargos || [];
  let totalHsNumericas = 0;

  cargos.forEach(c => {
    const num = parseInt(String(c.horas || '').replace(/\D/g, ''), 10);
    if (!isNaN(num)) totalHsNumericas += num;
  });

  // Verificar superposición horaria en días
  const dias = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
  let colision = null;

  for (let dia of dias) {
    const asignados = cargos.filter(c => c[dia] && c[dia].includes('-'));
    if (asignados.length > 1) {
      for (let i = 0; i < asignados.length; i++) {
        for (let j = i + 1; j < asignados.length; j++) {
          const c1 = asignados[i];
          const c2 = asignados[j];
          const [ini1, fin1] = c1[dia].split('-').map(t => t.trim());
          const [ini2, fin2] = c2[dia].split('-').map(t => t.trim());
          if (ini1 && fin1 && ini2 && fin2) {
            // Verificar si los rangos se cruzan
            if (ini1 < fin2 && ini2 < fin1) {
              colision = {
                dia: dia.toUpperCase(),
                c1: c1.establecimiento,
                h1: c1[dia],
                c2: c2.establecimiento,
                h2: c2[dia]
              };
              break;
            }
          }
        }
        if (colision) break;
      }
    }
    if (colision) break;
  }

  if (colision) {
    badge.className = 'chip c-coral';
    badge.textContent = '⚠️ Incompatibilidad Horaria';
    desc.innerHTML = `Superposición el día <b>${colision.dia}</b> entre <b>${esc(colision.c1)}</b> (${esc(colision.h1)}) y <b>${esc(colision.c2)}</b> (${esc(colision.h2)}).`;
  } else if (totalHsNumericas > 36) {
    badge.className = 'chip c-coral';
    badge.textContent = '⚠️ Exceso de Horas Cátedra';
    desc.innerHTML = `Total de <b>${totalHsNumericas} hs</b> supera el tope legal de 36 horas cátedra semanales (Art. 20 Ley 3520/78).`;
  } else {
    badge.className = 'chip c-teal';
    badge.textContent = '✓ Horarios Compatibles';
    desc.innerHTML = `Sin superposición horaria detectada. Carga total declarada: <b>${totalHsNumericas || cargos.length * 4} hs</b> semanales.`;
  }
}

function renderDDJJOficialA4() {
  const d = getDDJJ();
  const container = $('#ddjj-printable-container');
  if (!container) return;

  const dat = d.datos || {};
  const cargos = d.cargos || [];
  const espacios = d.espacios || [];
  const fPres = dat.fechaPres ? dat.fechaPres.split('-') : localISO().split('-');

  // Rellenar filas vacías hasta 8 para completar la grilla oficial
  const rowsCargos = [...cargos];
  while (rowsCargos.length < 7) {
    rowsCargos.push({ orden: rowsCargos.length + 1, ministerio: '', establecimiento: '', jurisdiccion: '', horas: '', nivel: '', tipo: '', caracter: '', desde: '', hasta: '', situacion: '' });
  }

  const rowsHorarios = [...cargos];
  while (rowsHorarios.length < 7) {
    rowsHorarios.push({ orden: rowsHorarios.length + 1, establecimiento: '', lun: '', mar: '', mie: '', jue: '', vie: '', sab: '', horas: '' });
  }

  const rowsEspacios = [...espacios];
  while (rowsEspacios.length < 4) {
    rowsEspacios.push({ orden: rowsEspacios.length + 1, espacio: '', horas: '', caracter: '', curso: '', division: '' });
  }

  container.innerHTML = `
    <!-- PÁGINA 1: FORMULARIO OFICIAL LEY 3416/77 -->
    <div class="ddjj-page">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="font-size:10pt;font-weight:700">Declaración Jurada Ley Provincial Nº 3416/77</div>
        <div style="text-align:center">
          <div style="font-size:24px;margin-bottom:2px">🏛</div>
          <b style="font:800 13pt 'Sora', sans-serif;letter-spacing:0.06em">MINISTERIO DE EDUCACION</b>
        </div>
        <table style="border-collapse:collapse;border:1.5px solid #222;font-size:8.5pt">
          <tr><th colspan="3" style="background:#efefef;border:1px solid #222;padding:2px 6px;text-align:center">FECHA DE PRESENTACION</th></tr>
          <tr style="text-align:center">
            <td style="border:1px solid #222;padding:2px 8px;width:32px"><small style="display:block;font-size:7pt">Día</small><b>${fPres[2] || ''}</b></td>
            <td style="border:1px solid #222;padding:2px 8px;width:32px"><small style="display:block;font-size:7pt">Mes</small><b>${fPres[1] || ''}</b></td>
            <td style="border:1px solid #222;padding:2px 8px;width:40px"><small style="display:block;font-size:7pt">Año</small><b>${fPres[0] || ''}</b></td>
          </tr>
        </table>
      </div>

      <table class="ddjj-meta-table">
        <tr>
          <td colspan="4"><b>Apellido y Nombre:</b> ${esc(dat.nombre || '')}</td>
        </tr>
        <tr>
          <td style="width:25%"><b>D.N.I./L.C./L.E.:</b> ${esc(dat.dni || '')}</td>
          <td style="width:25%"><b>CUIL:</b> ${esc(dat.cuil || '')}</td>
          <td style="width:25%"><b>Fecha de Nacimiento:</b> ${esc(dat.fnac || '')}</td>
          <td style="width:25%"><b>Título:</b> ${esc(dat.titulo || '')}</td>
        </tr>
        <tr>
          <td colspan="2"><b>Domicilio:</b> ${esc(dat.domicilio || '')}</td>
          <td><b>Bº:</b> ${esc(dat.barrio || '')}</td>
          <td><b>Localidad:</b> ${esc(dat.localidad || 'Jujuy')}</td>
        </tr>
      </table>

      <div style="font:700 9.5pt 'Sora', sans-serif;margin:10px 0 6px">
        DATOS RELACIONADOS CON LAS FUNCIONES, CARGOS Y OCUPACIONES (cuadro 1):
      </div>

      <table class="ddjj-table-oficial">
        <thead>
          <tr>
            <th rowspan="2" style="width:25px">Nº ord</th>
            <th rowspan="2" style="width:75px">Ministerio</th>
            <th rowspan="2" style="min-width:140px">Establecimiento / Jurisdicción</th>
            <th rowspan="2" style="width:70px">Jurisdicción (1)</th>
            <th rowspan="2" style="width:55px">Cargo horas (2)</th>
            <th rowspan="2" style="width:65px">Nivel ó Ciclo (3)</th>
            <th rowspan="2" style="width:70px">Tipo cargo (4)</th>
            <th colspan="5">CARACTER</th>
            <th rowspan="2" style="width:65px">Situación (5)</th>
            <th rowspan="2" style="width:110px">Certificación establecimiento (Firma-Sello-Fecha)</th>
          </tr>
          <tr>
            <th style="width:28px">Tit.</th>
            <th style="width:36px">Prov. Inter.</th>
            <th style="width:32px">Supl.</th>
            <th style="width:60px">Desde</th>
            <th style="width:60px">Hasta</th>
          </tr>
        </thead>
        <tbody>
          ${rowsCargos.map(c => `
            <tr style="height:26px">
              <td style="font-weight:700">${c.orden || ''}</td>
              <td>${esc(c.ministerio || '')}</td>
              <td style="text-align:left;padding-left:6px">${esc(c.establecimiento || '')}</td>
              <td>${esc(c.jurisdiccion || '')}</td>
              <td style="font-weight:700">${esc(c.horas || '')}</td>
              <td>${esc(c.nivel || '')}</td>
              <td>${esc(c.tipo || '')}</td>
              <td>${c.caracter === 'Titular' ? 'X' : ''}</td>
              <td>${c.caracter === 'Prov. / Interino' ? 'X' : ''}</td>
              <td>${c.caracter === 'Suplente' ? 'X' : ''}</td>
              <td style="font-size:8pt">${esc(c.desde || '')}</td>
              <td style="font-size:8pt">${esc(c.hasta || '')}</td>
              <td>${esc(c.situacion || '')}</td>
              <td></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="font-size:9pt;font-weight:700;margin:6px 0">
        Observaciones: CON FUNCIÓN ADMINISTRATIVA. -
      </div>

      <div class="ddjj-instructions">
        <b>Instrucciones:</b><br>
        <b>En (1):</b> Nacional, provincial, municipal o privado.<br>
        <b>En (2):</b> Cargo o total de horas según corresponda. Se utilizará una línea para cargo y una para horas en el caso de registrar ambas situaciones.<br>
        <b>En (3):</b> Nivel o ciclo del cargo u horas: Nivel Medio (NM), Nivel Terciario (NT), Inicial (IN), EGB1 (E1), EGB2 (E2), EGB3 (E3) ó Polimodal (PO).<br>
        <b>En (4):</b> Administrativo – docente – profesional – técnico profesional, etc.<br>
        <b>En (5):</b> Activo-Pasivo (Los comprendidos en el art. 2º de la ley 3520/78).<br>
        <b>En (6):</b> En caso de encontrarse en uso de licencia sin goce de haberes se consignará tal situación en el horario que corresponda y en observaciones.
      </div>

      <div class="ddjj-sig-box">
        <div class="ddjj-sig-line">
          Firma y Aclaración del Docente
        </div>
      </div>
    </div>

    <!-- PÁGINA 2: DISTRIBUCIÓN HORARIA Y CUADRO 2 (NIVEL SUPERIOR) -->
    <div class="ddjj-page">
      <div style="font:700 9.5pt 'Sora', sans-serif;margin-bottom:8px">
        Horario (5): Certificado del /la Establecimiento / Repartición y Discriminado de Acuerdo con los Números de Orden de la Declaración
      </div>

      <table class="ddjj-table-oficial">
        <thead>
          <tr>
            <th style="width:40px">Orden</th>
            <th>LUNES</th>
            <th>MARTES</th>
            <th>MIERCOLES</th>
            <th>JUEVES</th>
            <th>VIERNES</th>
            <th>SABADO</th>
            <th style="width:140px">CERTIF. / ESTABLEC.</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHorarios.map(h => `
            <tr style="height:26px">
              <td style="font-weight:800">${h.orden || ''}</td>
              <td>${esc(h.lun || '')}</td>
              <td>${esc(h.mar || '')}</td>
              <td>${esc(h.mie || '')}</td>
              <td>${esc(h.jue || '')}</td>
              <td>${esc(h.vie || '')}</td>
              <td>${esc(h.sab || '')}</td>
              <td></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="font:700 9.5pt 'Sora', sans-serif;margin:16px 0 8px">
        DETALLE DE LOS ESPACIOS CURRICULARES (Cuadro 2): únicamente para horas y/o cargos de nivel superior no universitario.
      </div>

      <table class="ddjj-table-oficial">
        <thead>
          <tr>
            <th rowspan="2" style="width:40px">Orden</th>
            <th rowspan="2" style="min-width:200px">Espacio Curricular</th>
            <th rowspan="2" style="width:65px">Horas</th>
            <th colspan="3">Carácter</th>
            <th rowspan="2" style="width:80px">Curso</th>
            <th rowspan="2" style="width:80px">División</th>
          </tr>
          <tr>
            <th style="width:50px">1ro. C</th>
            <th style="width:50px">2do. C</th>
            <th style="width:50px">Anual</th>
          </tr>
        </thead>
        <tbody>
          ${rowsEspacios.map(e => `
            <tr style="height:26px">
              <td style="font-weight:700">${e.orden || ''}</td>
              <td style="text-align:left;padding-left:8px">${esc(e.espacio || '')}</td>
              <td>${esc(e.horas || '')}</td>
              <td>${e.caracter === '1ro. C' || e.caracter === '1º Cuatrimestre' ? 'X' : ''}</td>
              <td>${e.caracter === '2do. C' || e.caracter === '2º Cuatrimestre' ? 'X' : ''}</td>
              <td>${e.caracter === 'Anual' || !e.caracter && e.espacio ? 'X' : ''}</td>
              <td>${esc(e.curso || '')}</td>
              <td>${esc(e.division || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top:14px;font-size:9pt">
        <b>Observaciones:</b> __________________________________________________________________________________
      </div>

      <div style="margin-top:14px;font-size:9pt;font-weight:800">
        NOTA: El cuadro 1 es de llenado obligatorio
      </div>

      <div class="ddjj-sig-box" style="margin-top:48px">
        <div class="ddjj-sig-line">
          Firma y Aclaración
        </div>
      </div>
    </div>
  `;
}

function abrirModalCargoDDJJ(cargoId = null) {
  const d = getDDJJ();
  $('#cddjj-id').value = cargoId || '';

  if (cargoId) {
    const c = (d.cargos || []).find(x => x.id === cargoId);
    if (c) {
      $('#m-cargo-ddjj-title').textContent = 'Editar Cargo / Horas (Cuadro 1)';
      $('#cddjj-orden').value = c.orden || 1;
      $('#cddjj-ministerio').value = c.ministerio || 'Educación';
      $('#cddjj-jurisdiccion').value = c.jurisdiccion || 'Provincial';
      $('#cddjj-establecimiento').value = c.establecimiento || '';
      $('#cddjj-horas').value = c.horas || '';
      $('#cddjj-nivel').value = c.nivel || 'Nivel Medio (NM)';
      $('#cddjj-tipo').value = c.tipo || 'Docente';
      $('#cddjj-caracter').value = c.caracter || 'Titular';
      $('#cddjj-situacion').value = c.situacion || 'Activo';
      $('#cddjj-desde').value = c.desde || '';
      $('#cddjj-hasta').value = c.hasta || 'Continúa';
      $('#cddjj-h-lun').value = c.lun || '';
      $('#cddjj-h-mar').value = c.mar || '';
      $('#cddjj-h-mie').value = c.mie || '';
      $('#cddjj-h-jue').value = c.jue || '';
      $('#cddjj-h-vie').value = c.vie || '';
      $('#cddjj-h-sab').value = c.sab || '';
    }
  } else {
    $('#m-cargo-ddjj-title').textContent = 'Agregar Cargo / Ocupación (Cuadro 1)';
    $('#cddjj-orden').value = (d.cargos || []).length + 1;
    $('#cddjj-ministerio').value = 'Educación';
    $('#cddjj-jurisdiccion').value = 'Provincial';
    $('#cddjj-establecimiento').value = '';
    $('#cddjj-horas').value = '12 hs';
    $('#cddjj-nivel').value = 'Nivel Medio (NM)';
    $('#cddjj-tipo').value = 'Docente';
    $('#cddjj-caracter').value = 'Titular';
    $('#cddjj-situacion').value = 'Activo';
    $('#cddjj-desde').value = localISO();
    $('#cddjj-hasta').value = 'Continúa';
    $('#cddjj-h-lun').value = '07:30-11:50';
    $('#cddjj-h-mar').value = '';
    $('#cddjj-h-mie').value = '07:30-11:50';
    $('#cddjj-h-jue').value = '';
    $('#cddjj-h-vie').value = '';
    $('#cddjj-h-sab').value = '';
  }

  abrir('#m-cargo-ddjj');
}

function guardarCargoDDJJ() {
  const d = getDDJJ();
  const cId = $('#cddjj-id').value;
  const estab = ($('#cddjj-establecimiento').value || '').trim();

  if (!estab) {
    AtrilSwal.info('Faltan datos', 'Por favor ingresá el nombre del establecimiento o repartición.');
    return;
  }

  const cargoData = {
    id: cId || uid(),
    orden: parseInt($('#cddjj-orden').value, 10) || (d.cargos || []).length + 1,
    ministerio: $('#cddjj-ministerio').value.trim() || 'Educación',
    jurisdiccion: $('#cddjj-jurisdiccion').value,
    establecimiento: estab,
    horas: $('#cddjj-horas').value.trim() || '12 hs',
    nivel: $('#cddjj-nivel').value,
    tipo: $('#cddjj-tipo').value,
    caracter: $('#cddjj-caracter').value,
    situacion: $('#cddjj-situacion').value,
    desde: $('#cddjj-desde').value || '',
    hasta: $('#cddjj-hasta').value.trim() || 'Continúa',
    lun: $('#cddjj-h-lun').value.trim(),
    mar: $('#cddjj-h-mar').value.trim(),
    mie: $('#cddjj-h-mie').value.trim(),
    jue: $('#cddjj-h-jue').value.trim(),
    vie: $('#cddjj-h-vie').value.trim(),
    sab: $('#cddjj-h-sab').value.trim()
  };

  if (!d.cargos) d.cargos = [];
  if (cId) {
    const idx = d.cargos.findIndex(x => x.id === cId);
    if (idx !== -1) d.cargos[idx] = cargoData;
  } else {
    d.cargos.push(cargoData);
  }

  d.cargos.sort((a, b) => (a.orden || 0) - (b.orden || 0));
  saveDDJJ(d);
  cerrarAll();
  renderDDJJ();
  toast('Cargo guardado en Declaración Jurada ✓', 'ok');
}

async function eliminarCargoDDJJ(cargoId) {
  const d = getDDJJ();
  const c = (d.cargos || []).find(x => x.id === cargoId);
  if (!c) return;

  const ok = await AtrilSwal.danger({
    title: '¿Eliminar cargo?',
    text: `Se eliminará "${c.establecimiento}" de tu Declaración Jurada.`,
    confirmText: '🗑 Sí, eliminar',
    cancelText: 'Cancelar'
  });
  if (!ok) return;

  d.cargos = d.cargos.filter(x => x.id !== cargoId);
  // Re-enumerar orden
  d.cargos.forEach((cg, i) => cg.orden = i + 1);
  saveDDJJ(d);
  renderDDJJ();
  toast('Cargo eliminado de la DDJJ', 'warn');
}

function precargarDDJJDesdeCursoActual() {
  const d = getDDJJ();
  const mat = S?.perfil?.materia || 'Materia';
  const cur = S?.perfil?.curso || '1º Año';
  const niv = S?.perfil?.nivel || 'Secundaria';

  if (!d.cargos) d.cargos = [];
  const yaExiste = d.cargos.some(c => c.establecimiento.includes(mat));
  if (yaExiste) {
    AtrilSwal.info('Ya incorporado', 'El curso actual ya forma parte de tu Declaración Jurada.');
    return;
  }

  d.cargos.push({
    id: uid(),
    orden: d.cargos.length + 1,
    ministerio: 'Educación',
    establecimiento: `Colegio Secundario (${mat} ${cur})`,
    jurisdiccion: 'Provincial',
    horas: '8 hs',
    nivel: niv.toLowerCase().includes('superior') ? 'Nivel Terciario (NT)' : 'Nivel Medio (NM)',
    tipo: 'Docente',
    caracter: 'Titular',
    desde: localISO(),
    hasta: 'Continúa',
    situacion: 'Activo',
    lun: '07:30-11:50',
    mar: '',
    mie: '07:30-11:50',
    jue: '',
    vie: '',
    sab: ''
  });

  if (niv.toLowerCase().includes('superior')) {
    if (!d.espacios) d.espacios = [];
    d.espacios.push({
      id: uid(),
      orden: d.espacios.length + 1,
      espacio: mat,
      horas: '8 hs',
      caracter: 'Anual',
      curso: cur,
      division: 'Única'
    });
  }

  saveDDJJ(d);
  renderDDJJ();
  AtrilSwal.success('Curso vinculado a DDJJ', `Se incorporó "${mat} (${cur})" a tus cargos declarados.`);
}

async function limpiarDDJJ() {
  const ok = await AtrilSwal.danger({
    title: '¿Vaciar Declaración Jurada?',
    text: 'Se borrarán todos los cargos y horarios registrados en la declaración jurada local.',
    confirmText: '🧹 Sí, vaciar',
    cancelText: 'Cancelar'
  });
  if (!ok) return;

  const d = getDDJJ();
  d.cargos = [];
  d.espacios = [];
  saveDDJJ(d);
  renderDDJJ();
  toast('Declaración Jurada vaciada', 'warn');
}

function imprimirDDJJOficial() {
  cambiarTabDDJJ('vista-oficial');
  document.body.classList.add('printing-ddjj');
  setTimeout(() => {
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-ddjj');
    }, { once: true });
  }, 250);
}

/* ═════════ ATRIL 4.0: RÉGIMEN DE LICENCIAS (DEC. 561-G-71) ═════════ */
let modoVistaLic = 'historial';
let licSeleccionadaParaNota = null;

function getLicencias() {
  if (S && S.licencias && Array.isArray(S.licencias)) return S.licencias;
  try {
    const raw = localStorage.getItem(LS_KEYS.LICENCIAS);
    if (raw) {
      const data = JSON.parse(raw);
      if (S) S.licencias = data;
      return data;
    }
  } catch (e) {}

  const def = [
    {
      id: 'lic1',
      articulo: 'art20',
      causa: 'Razones Particulares de Fuerza Mayor (Art. 20)',
      desde: localISO(),
      hasta: localISO(),
      dias: 1,
      goce: 'Con goce de haberes',
      escuela: S?.perfil?.materia ? `Colegio (${S.perfil.materia})` : 'Colegio Secundario Nº 1',
      obs: 'Trámite personal impostergable en entidad pública',
      estado: 'Justificada',
      fechaReg: localISO()
    }
  ];

  if (S) S.licencias = def;
  saveLicencias(def);
  return def;
}

function saveLicencias(lics) {
  if (S) S.licencias = lics;
  try {
    localStorage.setItem(LS_KEYS.LICENCIAS, JSON.stringify(lics));
  } catch (e) {}
  save();
}

function cambiarTabLicencias(tabId) {
  modoVistaLic = tabId;
  $$('#lic-tabs button').forEach(b => b.classList.toggle('on', b.dataset.licTab === tabId));
  $$('.lic-panel').forEach(p => p.style.display = 'none');
  const panel = $(`#lic-panel-${tabId}`);
  if (panel) panel.style.display = 'block';

  if (tabId === 'catalogo') renderLicenciasCatalogo();
  else if (tabId === 'historial') renderLicenciasHistorial();
}

function renderLicencias() {
  const lics = getLicencias();
  const añoActual = new Date().getFullYear();

  // Calcular días consumidos en el año
  let diasArt20 = 0;
  let diasArt2 = 0;
  let diasArt9 = 0;
  let diasArt27 = 0;

  lics.forEach(l => {
    const lYear = l.desde ? new Date(l.desde).getFullYear() : añoActual;
    if (lYear === añoActual) {
      const d = parseInt(l.dias, 10) || 1;
      if (l.articulo === 'art20') diasArt20 += d;
      else if (l.articulo === 'art2') diasArt2 += d;
      else if (l.articulo === 'art9') diasArt9 += d;
      else if (l.articulo === 'art27') diasArt27 += d;
    }
  });

  if ($('#lic-kpi-art20')) $('#lic-kpi-art20').textContent = `${diasArt20} / 6 ds`;
  if ($('#lic-kpi-art2')) $('#lic-kpi-art2').textContent = `${diasArt2} / 30 ds`;
  if ($('#lic-kpi-art9')) $('#lic-kpi-art9').textContent = `${diasArt9} / 10 ds`;
  if ($('#lic-kpi-art27')) $('#lic-kpi-art27').textContent = `${diasArt27} / 28 ds`;

  renderLicenciasHistorial();
  renderLicenciasCatalogo();
  if (lics.length) renderNotaLicencia(lics[0]);
}

function renderLicenciasHistorial() {
  const lics = getLicencias();
  const tbody = $('#lic-tbody-historial');
  if (!tbody) return;

  if (!lics.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="padding:28px;text-align:center;color:var(--ink2)">No hay licencias solicitadas en el período. Hacé clic en "＋ Registrar Licencia".</td></tr>';
    return;
  }

  tbody.innerHTML = lics.map((l, i) => `
    <tr>
      <td style="font-weight:700">${i + 1}</td>
      <td><span class="chip c-teal" style="font-weight:800">${l.articulo ? l.articulo.toUpperCase() : 'ART.'}</span></td>
      <td class="td-left"><b>${esc(l.causa || '—')}</b><br><small style="color:var(--ink2)">${esc(l.escuela || '')}</small></td>
      <td>${fmt(l.desde)}</td>
      <td>${fmt(l.hasta)}</td>
      <td style="font-weight:800;color:var(--teal)">${l.dias} d</td>
      <td><small>${esc(l.goce || 'Con goce')}</small></td>
      <td><span class="chip ${l.estado === 'Justificada' ? 'c-teal' : 'c-amber'}">${esc(l.estado || 'En trámite')}</span></td>
      <td class="no-print" style="white-space:nowrap">
        <button class="btn btn-s btn-xs" data-nota-lic="${l.id}" title="Generar Nota Formal">📄 Nota</button>
        <button class="icon-btn btn-xs" data-del-lic="${l.id}" title="Borrar" style="color:var(--coral)">✕</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-nota-lic]').forEach(b => {
    b.onclick = () => {
      const l = lics.find(x => x.id === b.dataset.notaLic);
      if (l) {
        renderNotaLicencia(l);
        cambiarTabLicencias('nota');
      }
    };
  });

  tbody.querySelectorAll('[data-del-lic]').forEach(b => {
    b.onclick = () => eliminarLicencia(b.dataset.delLic);
  });
}

function renderLicenciasCatalogo() {
  const grid = $('#lic-catalogo-grid');
  if (!grid) return;

  const q = ($('#lic-buscador-input')?.value || '').trim().toLowerCase();
  const cat = $('#lic-filtro-categoria')?.value || 'todas';

  const filtrados = CATALOGO_LICENCIAS.filter(item => {
    const matchQ = !q || item.titulo.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.art.toLowerCase().includes(q);
    const matchCat = cat === 'todas' || item.cat === cat;
    return matchQ && matchCat;
  });

  if (!filtrados.length) {
    grid.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--ink2)">No se encontraron artículos que coincidan con la búsqueda.</div>';
    return;
  }

  grid.innerHTML = filtrados.map(item => `
    <div class="lic-card">
      <div style="flex:1">
        <div class="row" style="gap:8px;align-items:center;margin-bottom:6px">
          <span class="lic-badge-art">${esc(item.art.toUpperCase())}</span>
          <h4 style="font-size:15.5px;margin:0">${esc(item.titulo)}</h4>
        </div>
        <p style="font-size:13.5px;color:var(--ink);line-height:1.45;margin-bottom:8px">${esc(item.desc)}</p>
        <div style="font-size:12px;color:var(--ink2);background:var(--bg-subtle);padding:8px 12px;border-radius:8px;border-left:3px solid var(--teal)">
          <b>Requisitos y plazos:</b> ${esc(item.requisitos)}
        </div>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <span class="lic-dias-pill">${esc(item.dias)}</span>
        <span class="chip c-gray" style="font-size:11px">${esc(item.goce)}</span>
        <button class="btn btn-p btn-xs" data-pedir-art="${item.art}">＋ Solicitar</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('[data-pedir-art]').forEach(b => {
    b.onclick = () => abrirModalNuevaLicencia(b.dataset.pedirArt);
  });
}

function renderNotaLicencia(lic) {
  const container = $('#lic-nota-container');
  if (!container) return;
  licSeleccionadaParaNota = lic;

  const ddjj = getDDJJ();
  const dat = ddjj.datos || {};
  const hoyFmt = fmt(localISO(), { day: 'numeric', month: 'long', year: 'numeric' });

  container.innerHTML = `
    <div style="text-align:right;font-size:11pt;margin-bottom:28px">
      San Salvador de Jujuy, ${hoyFmt}
    </div>

    <div style="font-size:11pt;line-height:1.4;margin-bottom:24px">
      <b>A la Dirección / Secretaría del Establecimiento:</b><br>
      <u>${esc(lic.escuela || S?.perfil?.materia ? `Colegio Secundario - ${S?.perfil?.materia}` : 'Unidad Educativa Provincial')}</u><br>
      <b>S. / D.</b>
    </div>

    <div style="font-size:11.5pt;line-height:1.75;text-align:justify;margin-bottom:30px">
      De mi mayor consideración:<br><br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Me dirijo a Ud. a los efectos de solicitar la justificación de inasistencia / concesión de licencia bajo el régimen del <b>Decreto Nº 561-G-71</b> y concordantes, amparado/a en las disposiciones del <b>${esc(lic.causa || lic.articulo.toUpperCase())}</b>, por el término de <b>${lic.dias} día(s)</b>, a partir del <b>${fmt(lic.desde, { day: 'numeric', month: 'long', year: 'numeric' })}</b> hasta el <b>${fmt(lic.hasta, { day: 'numeric', month: 'long', year: 'numeric' })}</b> inclusive.<br><br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Acompaño a la presente la documentación respaldatoria pertinente (${esc(lic.obs || 'Certificación médica / constancia probatoria')}), para su debida elevación ante el Departamento de Reconocimientos Médicos / Junta de Clasificación según corresponda.<br><br>
      Sin otro particular, saludo a Ud. con mi más distinguida consideración.
    </div>

    <div style="display:flex;justify-content:space-between;margin-top:60px">
      <div style="width:230px;border-top:1.5px dashed #444;padding-top:8px;font-size:9pt;text-align:center">
        <b>Recepción Secretaría / Dirección</b><br>
        <small>Firma, Sello y Fecha de Entrada</small>
      </div>
      <div style="width:230px;border-top:1.5px dashed #444;padding-top:8px;font-size:9pt;text-align:center">
        <b>${esc(dat.nombre || S?.docentes?.[0]?.nombre || 'Firma Docente')}</b><br>
        DNI: ${esc(dat.dni || '—')} · CUIL: ${esc(dat.cuil || '—')}
      </div>
    </div>
  `;
}

function abrirModalNuevaLicencia(artPreset = 'art20') {
  $('#lic-form-articulo').value = artPreset;
  $('#lic-form-desde').value = localISO();
  $('#lic-form-hasta').value = localISO();
  $('#lic-form-dias').value = 1;
  $('#lic-form-escuela').value = S?.perfil?.materia ? `${S.perfil.materia} (${S.perfil.curso})` : 'Colegio Secundario Nº 1';
  $('#lic-form-obs').value = '';

  abrir('#m-licencia-doc');
}

function guardarLicenciaDocente() {
  const artKey = $('#lic-form-articulo').value;
  const itemNorma = CATALOGO_LICENCIAS.find(x => x.art === artKey);
  const dias = parseInt($('#lic-form-dias').value, 10) || 1;
  const desde = $('#lic-form-desde').value || localISO();
  const hasta = $('#lic-form-hasta').value || desde;
  const escuela = ($('#lic-form-escuela').value || '').trim() || 'Establecimiento Educativo';
  const obs = ($('#lic-form-obs').value || '').trim();

  const nueva = {
    id: uid(),
    articulo: artKey,
    causa: itemNorma ? itemNorma.titulo : 'Licencia Reglamentaria',
    desde,
    hasta,
    dias,
    goce: itemNorma ? itemNorma.goce : 'Con goce de haberes',
    escuela,
    obs: obs || 'Solicitud formal de licencia',
    estado: 'Registrada',
    fechaReg: localISO()
  };

  const lics = getLicencias();
  lics.unshift(nueva);
  saveLicencias(lics);
  cerrarAll();
  renderLicencias();

  AtrilSwal.success('Licencia Registrada ✓', `Se registró la solicitud de ${dias} día(s) por ${itemNorma ? itemNorma.art.toUpperCase() : 'artículo legal'}. Podés emitir tu nota formal para presentar en Secretaría.`);
}

async function eliminarLicencia(licId) {
  const lics = getLicencias();
  const l = lics.find(x => x.id === licId);
  if (!l) return;

  const ok = await AtrilSwal.danger({
    title: '¿Eliminar registro de licencia?',
    text: `Se eliminará la solicitud de ${l.causa}.`,
    confirmText: '🗑 Sí, eliminar',
    cancelText: 'Cancelar'
  });
  if (!ok) return;

  const rest = lics.filter(x => x.id !== licId);
  saveLicencias(rest);
  renderLicencias();
  toast('Registro de licencia eliminado', 'warn');
}

/* ═════════ ATRIL 4.0: ESTATUTO DEL DOCENTE & SIMULADOR (LEY 3520/78) ═════════ */
let modoVistaEstatuto = 'simulador';

function cambiarTabEstatuto(tabId) {
  modoVistaEstatuto = tabId;
  $$('#estatuto-tabs button').forEach(b => b.classList.toggle('on', b.dataset.estTab === tabId));
  $$('.est-panel').forEach(p => p.style.display = 'none');
  const panel = $(`#est-panel-${tabId}`);
  if (panel) panel.style.display = 'block';

  if (tabId === 'compendio') renderEstatutoCompendio();
  else if (tabId === 'simulador') calcularPuntajeEstatuto();
  else if (tabId === 'tardanzas') calcularTardanzas();
}

function renderEstatuto() {
  calcularPuntajeEstatuto();
  renderEstatutoCompendio();
  calcularTardanzas();
}

function calcularPuntajeEstatuto() {
  const pTitulo = parseFloat($('#sim-titulo-tipo')?.value || 9);
  const pPromedio = parseFloat($('#sim-titulo-promedio')?.value || 1);
  const pOtrosTit = parseFloat($('#sim-otros-titulos')?.value || 0);

  const aTitulo = Math.min(3, (parseFloat($('#sim-ant-titulo')?.value || 0) * 0.25));
  const aDocencia = Math.min(6, (parseFloat($('#sim-ant-docencia')?.value || 0) * 0.25));

  const c1 = parseFloat($('#sim-conc-1')?.value || 1);
  const c2 = parseFloat($('#sim-conc-2')?.value || 1);
  const c3 = parseFloat($('#sim-conc-3')?.value || 1);
  const pConceptos = Math.min(3, c1 + c2 + c3);

  const hsCursos = parseFloat($('#sim-horas-cursos')?.value || 0);
  const pCursos = Math.min(7, (hsCursos * 0.001 * 10)); // 0.01 pt cada 10 hs

  const pPostitulo = parseFloat($('#sim-postitulo')?.value || 0);
  const pPublicaciones = parseFloat($('#sim-publicaciones')?.value || 0);
  const pConcursos = parseFloat($('#sim-concursos')?.value || 0);

  const total = pTitulo + pPromedio + pOtrosTit + aTitulo + aDocencia + pConceptos + pCursos + pPostitulo + pPublicaciones + pConcursos;

  if ($('#sim-score-total')) $('#sim-score-total').textContent = total.toFixed(2);

  const desgloseBox = $('#sim-desglose-box');
  if (desgloseBox) {
    desgloseBox.innerHTML = `
      <div class="row" style="justify-content:space-between"><span>Título de base (Art. 8º):</span><b>${pTitulo.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Promedio de título:</span><b>${pPromedio.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Otros títulos afines:</span><b>${pOtrosTit.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Antigüedad de título docente:</span><b>${aTitulo.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Antigüedad en docencia:</span><b>${aDocencia.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Conceptos profesionales (3 años):</span><b>${pConceptos.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Cursos y perfeccionamiento:</span><b>${pCursos.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Post-título / Especialización:</span><b>${pPostitulo.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Publicaciones / Libros:</span><b>${pPublicaciones.toFixed(2)} pts</b></div>
      <div class="row" style="justify-content:space-between"><span>Concursos / Cargos directivos:</span><b>${pConcursos.toFixed(2)} pts</b></div>
    `;
  }
}

function renderEstatutoCompendio() {
  const lista = $('#est-articulos-lista');
  if (!lista) return;

  const q = ($('#est-buscador-input')?.value || '').trim().toLowerCase();
  const cap = $('#est-filtro-capitulo')?.value || 'todos';

  const filtrados = COMPENDIO_ESTATUTO.filter(item => {
    const matchQ = !q || item.titulo.toLowerCase().includes(q) || item.texto.toLowerCase().includes(q) || String(item.num).includes(q) || item.regl.toLowerCase().includes(q);
    const matchCap = cap === 'todos' || item.cap === cap;
    return matchQ && matchCap;
  });

  if (!filtrados.length) {
    lista.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--ink2)">No se encontraron artículos que coincidan con la búsqueda.</div>';
    return;
  }

  lista.innerHTML = filtrados.map(item => `
    <div class="estatuto-card">
      <div class="estatuto-cap-tag">Capítulo ${item.cap} · ${esc(item.capNombre)}</div>
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <h4 style="font-size:16px;margin:0 0 6px">Art. ${item.num}º: ${esc(item.titulo)}</h4>
        <span class="chip c-teal">Ley 3520/78</span>
      </div>
      <div class="estatuto-text">${esc(item.texto)}</div>
      ${item.regl ? `<div class="estatuto-regl"><b>Reglamentación:</b> ${esc(item.regl)}</div>` : ''}
    </div>
  `).join('');
}

function calcularTardanzas() {
  const input = $('#calc-tardanzas-input');
  const resBox = $('#calc-tardanzas-resultado');
  if (!input || !resBox) return;

  const t = Math.max(0, parseInt(input.value, 10) || 0);
  const inasistenciasCompletas = Math.floor(t / 4);
  const fraccion = (t % 4) / 4;
  const totalInasistencias = inasistenciasCompletas + fraccion;

  let advertenciaSancion = 'Sin sanción disciplinaria registrada.';
  let badgeColor = 'c-teal';

  if (t === 0) {
    advertenciaSancion = 'Puntualidad perfecta ✓';
  } else if (t === 1) {
    advertenciaSancion = '1º incumplimiento: sin sanción reglamentaria.';
  } else if (t >= 2 && t <= 5) {
    advertenciaSancion = '2º a 5º incumplimiento: corresponde <b>Amonestación</b> formal con constancia en legajo.';
    badgeColor = 'c-amber';
  } else if (t >= 6 && t <= 8) {
    advertenciaSancion = '6º a 8º incumplimiento: corresponden <b>Apercibimientos sucesivos</b>.';
    badgeColor = 'c-amber';
  } else if (t === 9) {
    advertenciaSancion = '9º incumplimiento: corresponde <b>1 día de suspensión</b> sin goce de haberes.';
    badgeColor = 'c-coral';
  } else if (t === 10) {
    advertenciaSancion = '10º incumplimiento: corresponde <b>2 días de suspensión</b>.';
    badgeColor = 'c-coral';
  } else {
    advertenciaSancion = 'Más de 10 incumplimientos en el año: corresponde sumario disciplinario y solicitud de <b>Cesantía</b> (Art. 84 y 90).';
    badgeColor = 'c-coral';
  }

  resBox.innerHTML = `
    <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-size:14px">Inasistencias computadas:</span>
      <b style="font-size:22px;color:var(--teal)">${totalInasistencias.toFixed(2)} inasist.</b>
    </div>
    <div style="font-size:12.5px;color:var(--ink2);margin-bottom:10px">
      Equivale a <b>${inasistenciasCompletas}</b> día(s) completo(s) y <b>${fraccion * 4}/4</b> de inasistencia (Art. 92º).
    </div>
    <div style="padding:10px 14px;background:#fff;border-radius:8px;border-left:4px solid var(--teal);font-size:13px">
      <span class="chip ${badgeColor}" style="margin-bottom:4px;display:inline-block">Encuadre Legal Art. 85º</span><br>
      ${advertenciaSancion}
    </div>
  `;
}

function imprimirPuntajePDF() {
  calcularPuntajeEstatuto();
  window.print();
}

/* ═════════ ATRIL 4.0: EXTRACCIÓN OCR DE ESTUDIANTES (TESSERACT.JS) ═════════ */
function cambiarTabImportar(tabId) {
  $$('#import-mode-tabs button').forEach(b => b.classList.toggle('on', b.dataset.impTab === tabId));
  $('#imp-tab-texto').style.display = tabId === 'texto' ? 'block' : 'none';
  $('#imp-tab-archivo').style.display = tabId === 'archivo' ? 'block' : 'none';
  const ocrTab = $('#imp-tab-foto');
  if (ocrTab) ocrTab.style.display = tabId === 'foto' ? 'block' : 'none';
}

async function procesarImagenOCR(file) {
  if (!file) return;
  const statusBox = $('#ocr-status-box');
  const statusText = $('#ocr-status-text');
  const statusPct = $('#ocr-status-pct');
  const progressBar = $('#ocr-progress-bar');
  const previewCanvas = $('#ocr-canvas-preview');
  const previewContainer = $('#ocr-preview-container');

  if (statusBox) statusBox.style.display = 'block';
  if (statusText) statusText.textContent = 'Cargando y optimizando imagen...';
  if (statusPct) statusPct.textContent = '10%';
  if (progressBar) progressBar.style.width = '10%';

  try {
    const imgUrl = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgUrl;
    });

    // 2. Preprocesamiento en Canvas para mejorar contraste y nitidez OCR
    const maxDim = 1800;
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
      if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
      else { w = Math.round((w * maxDim) / h); h = maxDim; }
    }

    previewCanvas.width = w;
    previewCanvas.height = h;
    const ctx = previewCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    // Ajuste de contraste y escala de grises
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const contrast = (v - 128) * 1.35 + 128;
      const finalV = Math.min(255, Math.max(0, contrast));
      d[i] = finalV;
      d[i + 1] = finalV;
      d[i + 2] = finalV;
    }
    ctx.putImageData(imgData, 0, 0);
    if (previewContainer) previewContainer.style.display = 'block';

    if (statusText) statusText.textContent = 'Iniciando motor Tesseract OCR (Español)...';
    if (statusPct) statusPct.textContent = '25%';
    if (progressBar) progressBar.style.width = '25%';

    // 3. Ejecutar OCR con Tesseract.js v5
    if (typeof Tesseract === 'undefined') {
      throw new Error('La biblioteca Tesseract OCR no está disponible. Verificá tu conexión a internet.');
    }

    const { data: { text } } = await Tesseract.recognize(previewCanvas, 'spa', {
      logger: m => {
        if (m.status === 'recognizing text') {
          const pct = Math.round((m.progress || 0) * 100);
          if (statusText) statusText.textContent = `Reconociendo caracteres: ${pct}%...`;
          if (statusPct) statusPct.textContent = `${pct}%`;
          if (progressBar) progressBar.style.width = `${Math.max(25, pct)}%`;
        }
      }
    });

    if (statusText) statusText.textContent = 'Extrayendo nombres y documentos de estudiantes...';
    if (statusPct) statusPct.textContent = '95%';
    if (progressBar) progressBar.style.width = '95%';

    const estudiantes = parsearTextoOCR(text);

    if (progressBar) progressBar.style.width = '100%';
    if (statusPct) statusPct.textContent = '100%';
    if (statusText) statusText.textContent = `¡Reconocimiento finalizado! ${estudiantes.length} estudiantes encontrados.`;

    if (!estudiantes.length) {
      AtrilSwal.info('OCR sin resultados claros', 'No se pudieron extraer nombres ni documentos con nitidez suficiente. Podés probar tomando la foto más de cerca o con mejor iluminación.');
      return;
    }

    listaImportacionPendiente = [...listaImportacionPendiente, ...estudiantes];
    actualizarPreviewImportacion();

    AtrilSwal.success(`¡${estudiantes.length} estudiantes detectados!`, 'Revisá la vista previa para corregir cualquier detalle antes de incorporarlos a tu curso.');
  } catch (err) {
    if (statusBox) statusBox.style.display = 'none';
    AtrilSwal.info('Aviso sobre OCR', 'Hubo un inconveniente al procesar la imagen: ' + (err.message || err));
  }
}

function parsearTextoOCR(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const lines = raw.split(/\r?\n/);
  const result = [];
  const dniRegex = /\b(\d{1,2})[\.\s]?(\d{3})[\.\s]?(\d{3})\b/;
  const standaloneNumberRegex = /\b(\d{7,8})\b/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\b(\+?54\s?9?)?\s?(\d{2,4})[\s\-\.]?(\d{6,8})\b/;
  const ignoreKeywords = /^(n°|nro|orden|apellido|nombre|dni|documento|alumno|estudiante|firma|asistencia|materia|curso|colegio|escuela|instituto|profesor|profesora|fecha|total|divisi[oó]n|turno|observaci)/i;

  lines.forEach(l => {
    let line = l.trim();
    if (!line || line.length < 3) return;
    if (ignoreKeywords.test(line)) return;

    let dni = '';
    const matchDni = line.match(dniRegex) || line.match(standaloneNumberRegex);
    if (matchDni) {
      dni = matchDni[0].replace(/\D/g, '');
      line = line.replace(matchDni[0], ' ');
    }

    let email = '';
    const matchEmail = line.match(emailRegex);
    if (matchEmail) {
      email = matchEmail[0];
      line = line.replace(email, ' ');
    }

    let telefono = '';
    const matchPhone = line.match(phoneRegex);
    if (matchPhone && matchPhone[0].length >= 8) {
      telefono = matchPhone[0];
      line = line.replace(telefono, ' ');
    }

    let nombre = line
      .replace(/^[\d]+[\.\)\-\s]+/, '')
      .replace(/[\•\*\_\#\|\~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const letras = (nombre.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || []).length;
    if (letras < 3) return;

    if (nombre.includes(',')) {
      const parts = nombre.split(',').map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        nombre = `${parts[1]} ${parts[0]}`;
      }
    }

    nombre = nombre.split(' ').map(w => w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()).join(' ');

    result.push({
      nombre,
      dni,
      contacto: telefono,
      email,
      obs: 'Importado vía OCR'
    });
  });

  return result;
}

function setupOCRImport() {
  const dropzone = $('#ocr-dropzone');
  const fileInput = $('#ocr-file-input');

  if (dropzone && fileInput) {
    dropzone.onclick = () => fileInput.click();

    dropzone.ondragover = e => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--amber)';
    };
    dropzone.ondragleave = () => {
      dropzone.style.borderColor = 'var(--teal)';
    };
    dropzone.ondrop = e => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--teal)';
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        procesarImagenOCR(file);
      }
    };

    fileInput.onchange = e => {
      const file = e.target.files?.[0];
      if (file) procesarImagenOCR(file);
    };
  }
}


/* ═════════ NAVEGACIÓN & ROUTING ═════════ */
function navTo(t) {
  tab = t;
  $$('.screen').forEach(s => s.classList.remove('active'));
  const target = $('#screen-' + t);
  if (target) target.classList.add('active');

  $$('.sidebar-link').forEach(b => b.classList.toggle('on', b.dataset.nav === t));
  $$('.bottomnav button').forEach(b => b.classList.toggle('on', b.dataset.nav === t));

  const titulos = {
    inicio: 'Inicio',
    alumnos: 'Estudiantes',
    notas: 'Calificaciones',
    calificar: 'Calificar Evaluación',
    asistencia: 'Pase de Lista',
    informes: 'Informes & PDF',
    equipo: 'Equipo Docente',
    usuarios: 'Gestión de Usuarios'
  };
  $('#dt-page-title').textContent = titulos[t] || 'Atril';

  const titulosV4 = {
    ddjj: 'Declaración Jurada Ley 3416/77',
    licencias: 'Régimen de Licencias Dec. 561/71',
    estatuto: 'Estatuto Docente & Puntaje'
  };
  if (titulosV4[t]) $('#dt-page-title').textContent = titulosV4[t];

  if (t === 'inicio') renderInicio();
  else if (t === 'alumnos') renderAlumnos();
  else if (t === 'notas') renderNotas();
  else if (t === 'asistencia') renderAsistencia();
  else if (t === 'informes') renderInformes();
  else if (t === 'ddjj') renderDDJJ();
  else if (t === 'licencias') renderLicencias();
  else if (t === 'estatuto') renderEstatuto();
  else if (t === 'usuarios') renderUsuarios();
  else if (t === 'equipo') renderEquipo();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAll() {
  renderColorPickers();
  renderInicio();
  renderAlumnos();
  renderNotas();
  renderAsistencia();
  renderInformes();
  renderEquipo();
  renderDDJJ();
  renderLicencias();
  renderEstatuto();
}

/* ═════════ AUTH & ONBOARDING FLOW ═════════ */
function setAuthMode(mode) {
  authMode = mode;
  $$('#auth-mode button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  const isReg = mode === 'register';
  $('#auth-title').textContent = isReg ? 'Creá tu cuenta' : 'Ingresá a tu aula';
  $('#auth-sub').textContent = isReg ? 'Creá tu perfil docente para gestionar materias y calificaciones.' : 'Conectá con Google Sheets y gestioná tus cursos colaborativamente.';
  $('#au-nombre-lbl').style.display = isReg ? 'block' : 'none';
  $('#au-nombre').style.display = isReg ? 'block' : 'none';
  $('#au-rol-lbl').style.display = isReg ? 'block' : 'none';
  $('#au-rol').style.display = isReg ? 'block' : 'none';
  $('#au-submit').textContent = isReg ? 'Crear cuenta' : 'Ingresar';
}

async function handleAuthSubmit() {
  const email = ($('#au-email').value || '').trim().toLowerCase();
  const pass = $('#au-pass').value || '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email inválido', 'err'); return; }
  if (!pass || pass.length < 4) { toast('Contraseña muy corta (mín 4)', 'err'); return; }
  if (!API.url) { toast('Primero configurá la URL del backend', 'warn'); $('#api-box').style.display = 'block'; return; }

  showLoad(authMode === 'register' ? 'Creando cuenta…' : 'Ingresando…');
  try {
    let r;
    if (authMode === 'register') {
      const nombre = ($('#au-nombre').value || '').trim() || email.split('@')[0];
      const rol = $('#au-rol').value;
      r = await API.register({ email, password: pass, nombre, rol });
    } else {
      r = await API.login(email, pass);
    }
    if (r.ok && r.user) {
      API.token = r.token || '';
      API.user = r.user;
      demoMode = false;
      localStorage.removeItem(LS_KEYS.DEMO);
      toast(authMode === 'register' ? '¡Cuenta creada ✓' : '¡Bienvenido!', 'ok');
      await postAuthFlow();
    } else {
      toast(r.error || 'No se pudo completar', 'err');
    }
  } finally {
    hideLoad();
  }
}

async function postAuthFlow() {
  showLoad('Cargando materias…');
  try {
    const r = await API.getCourse();
    if (r.ok && r.data && (r.data.docentes || []).length) {
      S = normalizeFromCloud(r.data);
      save();
    } else {
      S = null;
    }
  } catch (_) {}
  hideLoad();
  if (S) {
    entrar();
  } else {
    document.body.classList.add('logged');
    $$('.screen').forEach(s => s.classList.remove('active'));
    $('#onboarding').classList.add('active');
  }
}

function normalizeFromCloud(d) {
  return {
    perfil: d.perfil || { id: uid(), nombre: '', nivel: 'Secundaria', materia: 'Materia', curso: '', escalaKey: '10' },
    escalaKey: d.escalaKey || (d.perfil && d.perfil.escalaKey) || '10',
    courses: d.courses || [],
    activeCourseId: d.activeCourseId || (d.perfil && d.perfil.id),
    docentes: (d.docentes || []).map(x => ({ ...x, yo: x.yo_flag || x.yo === true || x.yo === 'TRUE' })),
    alumnos: d.alumnos || [],
    evaluaciones: (d.evaluaciones || []).map(e => ({ ...e, notas: e.notas || {} })),
    asistencia: d.asistencia || {}
  };
}

function entrar() {
  document.body.classList.add('ready');
  if (API.token) document.body.classList.add('logged');
  renderAll();
  navTo('inicio');
  setSync(demoMode ? 'off' : (isOnline() ? 'ok' : 'off'), demoMode ? 'Demo local' : (isOnline() ? 'Sincronizado ✓' : 'Local'));
}

/* ═════════ ONBOARDING PASOS ═════════ */
const ob = { paso: 1, nivel: 'Secundaria' };
function irPaso(n) {
  if (n === 2 && ($('#ob-nombre').value || '').trim().length < 2) { toast('✏️ Escribí tu nombre para continuar', 'warn'); return; }
  if (n === 3 && !($('#ob-materia').value || '').trim()) { toast('✏️ Indicá la materia que vas a trabajar', 'warn'); return; }
  ob.paso = n;
  $$('.ob-step').forEach(s => s.classList.remove('on'));
  $('#ob-' + n).classList.add('on');
  $$('.ob-dots i').forEach((dt, i) => dt.classList.toggle('on', i < n));
}

function finalizarOnboarding() {
  const nombre = ($('#ob-nombre').value || '').trim();
  if (nombre.length < 2) { toast('✏️ Escribí tu nombre', 'warn'); irPaso(1); return; }
  const materia = ($('#ob-materia').value || '').trim();
  if (!materia) { toast('✏️ Indicá la materia', 'warn'); irPaso(2); return; }
  const perfil = {
    id: uid(),
    nombre,
    rol: $('#ob-rol').value,
    nivel: ob.nivel,
    materia,
    curso: ($('#ob-curso').value || '').trim(),
    escalaKey: $('#ob-escala').value
  };
  const extra = [$('#ob-doc1').value.trim(), $('#ob-doc2').value.trim()].filter(Boolean);
  S = seed(perfil, extra);
  if (API.user) S.perfil.owner_user_id = API.user.id;
  save();
  entrar();
  toast('🎒 ¡Aula lista!', 'ok');
}

/* ═════════ EVENT LISTENERS & CRUD ═════════ */
$('#na-save').addEventListener('click', () => {
  const n = ($('#na-nombre').value || '').trim();
  if (!n) { toast('✏️ Escribí el apellido y nombre', 'warn'); return; }
  const tel = ($('#na-telefono').value || '').trim();
  const dni = ($('#na-dni')?.value || '').trim();
  const al = {
    id: uid(),
    curso_id: S?.activeCourseId,
    nombre: n,
    dni: dni,
    telefono: tel,
    email: ($('#na-email').value || '').trim(),
    color: colorSeleccionadoNuevoAl || PALETTE[S.alumnos.length % 8],
    obs: ($('#na-obs').value || '').trim(),
    contacto: tel
  };
  S.alumnos.push(al);
  alumnoSeleccionadoMaster = al;
  save();
  cerrarAll();
  renderAlumnos();
  renderInicio();
  toast(`👋 ${n.split(' ')[0]} se sumó al curso`, 'ok');
});

$('#ea-save').addEventListener('click', () => {
  const id = $('#ea-id').value;
  const al = (S.alumnos || []).find(x => x.id === id);
  if (!al) return;
  const n = ($('#ea-nombre').value || '').trim();
  if (!n) { toast('El nombre no puede estar vacío', 'warn'); return; }

  al.nombre = n;
  al.dni = ($('#ea-dni')?.value || '').trim();
  al.telefono = ($('#ea-telefono').value || '').trim();
  al.email = ($('#ea-email').value || '').trim();
  al.contacto = al.telefono || al.contacto || '';
  al.obs = ($('#ea-obs').value || '').trim();
  al.color = colorSeleccionadoEditAl || al.color;

  save();
  cerrarAll();
  renderAll();
  toast('Ficha de estudiante actualizada ✓', 'ok');
});

$('#ea-delete').addEventListener('click', () => {
  const id = $('#ea-id').value;
  eliminarAlumno(id);
});

$('#ea-tags').addEventListener('click', e => {
  const tag = e.target.dataset.addTag;
  if (!tag) return;
  const curr = $('#ea-obs').value.trim();
  $('#ea-obs').value = curr ? curr + ' · ' + tag : tag;
});

let evTipo = 'individual';
function prepararEvModal() {
  $('#ev-titulo').value = '';
  $('#ev-fecha').value = localISO();
  evTipo = 'individual';
  $$('#ev-tipo button').forEach(b => b.classList.toggle('on', b.dataset.tipo === 'individual'));
  $('#ev-colectiva').style.display = 'none';
}

$$('#ev-tipo button').forEach(b => b.addEventListener('click', () => {
  evTipo = b.dataset.tipo;
  $$('#ev-tipo button').forEach(x => x.classList.toggle('on', x === b));
  $('#ev-colectiva').style.display = evTipo === 'colectiva' ? 'block' : 'none';
  if (evTipo === 'colectiva') pintarPesosNuevaEv();
}));

function pintarPesosNuevaEv() {
  const base = (S.docentes || []).length ? (S.docentes || []).map(d => d.id) : [yo().id];
  const n = base.length;
  const igual = Math.floor(100 / n);
  $('#ev-docentes').innerHTML = (S.docentes || []).map((d, i) => {
    return `<label class="check-doc sel" style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg-subtle);border-radius:10px;margin-top:6px">
      <input type="checkbox" data-d="${d.id}" checked style="width:18px;height:18px">
      <span class="av av-s" style="background:${d.color}">${ini(d.nombre)}</span>
      <span class="grow" style="font-weight:600;font-size:13.5px">${esc(d.nombre)}${d.yo ? ' (vos)' : ''}</span>
      <input type="number" data-peso="${d.id}" min="5" max="100" step="5" value="${i === n - 1 ? 100 - igual * (n - 1) : igual}" style="width:70px;text-align:center">
      <span style="font-size:12px;font-weight:700">%</span>
    </label>`;
  }).join('');
}

$('#ev-save').addEventListener('click', () => {
  const titulo = ($('#ev-titulo').value || '').trim();
  if (!titulo) { toast('✏️ Poné un título a la evaluación', 'warn'); return; }
  let docentes;
  if (evTipo === 'individual') {
    docentes = [{ id: yo().id, peso: 100 }];
  } else {
    docentes = [...$$('#ev-docentes input[type=checkbox]:checked')].map(c => {
      const inp = $(`#ev-docentes input[data-peso="${c.dataset.d}"]`);
      return { id: c.dataset.d, peso: +((inp && inp.value) || 20) };
    });
  }
  const ev = {
    id: uid(),
    curso_id: S?.activeCourseId,
    titulo,
    tipo: evTipo,
    docentes,
    fecha: $('#ev-fecha').value || localISO(),
    notas: {}
  };
  S.evaluaciones.unshift(ev);
  save();
  cerrarAll();
  renderNotas();
  renderInicio();
  toast(evTipo === 'colectiva' ? '👥 Evaluación compartida creada' : '📝 Evaluación creada', 'ok');
});

$('#eev-save').addEventListener('click', () => {
  const id = $('#eev-id').value;
  const ev = (S.evaluaciones || []).find(x => x.id === id);
  if (!ev) return;
  const t = ($('#eev-titulo').value || '').trim();
  if (!t) { toast('El título es requerido', 'warn'); return; }

  const tipo = $('#eev-tipo button.on').dataset.tipo;
  ev.titulo = t;
  ev.fecha = $('#eev-fecha').value || ev.fecha;
  ev.tipo = tipo;

  if (tipo === 'individual') {
    ev.docentes = [{ id: yo().id, peso: 100 }];
  } else {
    ev.docentes = [...$$('#eev-docentes input[type=checkbox]:checked')].map(c => {
      const inp = $(`#eev-docentes input[data-epeso="${c.dataset.ed}"]`);
      return { id: c.dataset.ed, peso: +((inp && inp.value) || 20) };
    });
  }
  save();
  cerrarAll();
  renderAll();
  if (calEv && calEv.id === ev.id) renderCalificar();
  toast('Evaluación actualizada ✓', 'ok');
});

$('#eev-delete').addEventListener('click', () => {
  const id = $('#eev-id').value;
  eliminarEvaluacion(id);
});

$('#nd-save').addEventListener('click', () => {
  const n = ($('#nd-nombre').value || '').trim();
  if (!n) { toast('✏️ Escribí el nombre del docente', 'warn'); return; }
  const doc = {
    id: uid(),
    curso_id: S?.activeCourseId,
    nombre: n,
    email: ($('#nd-email').value || '').trim(),
    telefono: ($('#nd-telefono').value || '').trim(),
    color: colorSeleccionadoDoc || PALETTE[(S.docentes.length + 2) % 8],
    rol: $('#nd-rol').value || 'Co-titular',
    yo: false
  };
  S.docentes.push(doc);
  save();
  cerrarAll();
  renderEquipo();
  toast(`🤝 ${n} ahora es parte del equipo`, 'ok');
});

$('#ed-save').addEventListener('click', guardarEdicionDocente);
$('#ed-delete').addEventListener('click', () => {
  const id = $('#ed-id').value;
  eliminarDocente(id);
});

$('#btn-crear-nuevo-curso').addEventListener('click', () => {
  cerrarAll();
  $('#nc-materia').value = '';
  $('#nc-curso').value = '';
  abrir('#m-nuevo-curso');
});

$('#nc-save').addEventListener('click', () => {
  const mat = ($('#nc-materia').value || '').trim();
  if (!mat) { toast('✏️ Escribí el nombre de la materia', 'warn'); return; }
  const nuevoPerfil = {
    id: uid(),
    nombre: API.user?.nombre || yo()?.nombre || 'Docente',
    materia: mat,
    nivel: $('#nc-nivel').value,
    curso: ($('#nc-curso').value || '').trim(),
    escalaKey: $('#nc-escala').value
  };
  const nuevoCurso = seed(nuevoPerfil);
  if (S?.courses) {
    nuevoCurso.courses = [...S.courses, { id: nuevoPerfil.id, materia: mat, nivel: nuevoPerfil.nivel, curso: nuevoPerfil.curso, escalaKey: nuevoPerfil.escalaKey }];
  }
  S = nuevoCurso;
  save();
  cerrarAll();
  renderAll();
  toast(`🎒 Aula "${mat}" creada con éxito`, 'ok');
});

/* ═════════ EVENTOS DE IMPORTACIÓN Y BORRADO MASIVO ═════════ */
$('#btn-abrir-importar')?.addEventListener('click', abrirModalImportar);
$('#btn-abrir-borrar-todo')?.addEventListener('click', abrirModalBorrarTodos);
$('#bta-confirm')?.addEventListener('click', ejecutarBorradoTotalAlumnos);

$$('#import-mode-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    cambiarTabImportar(btn.dataset.impTab);
  });
});

// ═════════ EVENT LISTENERS ATRIL 4.0 ═════════
// DDJJ (Ley 3416/77)
$('#btn-nuevo-cargo-ddjj')?.addEventListener('click', () => abrirModalCargoDDJJ());
$('[data-action="open-modal-cargo"]')?.addEventListener('click', () => abrirModalCargoDDJJ());
$('#btn-guardar-cargo-ddjj')?.addEventListener('click', guardarCargoDDJJ);
$('#btn-imprimir-ddjj')?.addEventListener('click', imprimirDDJJOficial);
$('#btn-precargar-ddjj-curso')?.addEventListener('click', precargarDDJJDesdeCursoActual);
$('#btn-limpiar-ddjj')?.addEventListener('click', limpiarDDJJ);
$('#btn-guardar-datos-ddjj')?.addEventListener('click', () => {
  const d = getDDJJ();
  if (!d.datos) d.datos = {};
  d.datos.nombre = ($('#ddjj-nombre')?.value || '').trim();
  d.datos.dni = ($('#ddjj-dni')?.value || '').trim();
  d.datos.cuil = ($('#ddjj-cuil')?.value || '').trim();
  d.datos.fnac = $('#ddjj-fnac')?.value || '';
  d.datos.titulo = ($('#ddjj-titulo')?.value || '').trim();
  d.datos.domicilio = ($('#ddjj-domicilio')?.value || '').trim();
  d.datos.barrio = ($('#ddjj-barrio')?.value || '').trim();
  d.datos.localidad = ($('#ddjj-localidad')?.value || '').trim();
  saveDDJJ(d);
  AtrilSwal.success('Datos Personales Guardados', 'Se actualizaron los datos del declarante en la DDJJ.');
  renderDDJJOficialA4();
});
$('#btn-nuevo-espacio-ddjj')?.addEventListener('click', () => {
  const d = getDDJJ();
  if (!d.espacios) d.espacios = [];
  d.espacios.push({
    id: uid(),
    orden: d.espacios.length + 1,
    espacio: 'Nuevo Espacio Curricular',
    horas: '4 hs',
    caracter: 'Anual',
    curso: '1º Año',
    division: '1ª'
  });
  saveDDJJ(d);
  renderDDJJEspacios();
  toast('Espacio curricular añadido ✓', 'ok');
});

$$('#ddjj-tabs button').forEach(btn => {
  btn.addEventListener('click', () => cambiarTabDDJJ(btn.dataset.ddjjTab));
});

// LICENCIAS (Dec. 561-G-71)
$('#btn-abrir-modal-licencia')?.addEventListener('click', () => abrirModalNuevaLicencia());
$('[data-action="open-modal-licencia"]')?.addEventListener('click', () => abrirModalNuevaLicencia());
$('#lic-form-guardar')?.addEventListener('click', guardarLicenciaDocente);
$('#btn-nota-licencia-directo')?.addEventListener('click', () => cambiarTabLicencias('nota'));
$('#lic-buscador-input')?.addEventListener('input', renderLicenciasCatalogo);
$('#lic-filtro-categoria')?.addEventListener('change', renderLicenciasCatalogo);
$$('#lic-tabs button').forEach(btn => {
  btn.addEventListener('click', () => cambiarTabLicencias(btn.dataset.licTab));
});

// ESTATUTO & SIMULADOR (Ley 3520/78)
$('#btn-calcular-puntaje-estatuto')?.addEventListener('click', () => {
  calcularPuntajeEstatuto();
  AtrilSwal.success('Puntaje Calculado', 'Tu puntaje estimado para Junta de Clasificación fue actualizado.');
});
$$('#estatuto-tabs button').forEach(btn => {
  btn.addEventListener('click', () => cambiarTabEstatuto(btn.dataset.estTab));
});
$('#est-buscador-input')?.addEventListener('input', renderEstatutoCompendio);
$('#est-filtro-capitulo')?.addEventListener('change', renderEstatutoCompendio);
$('#calc-tardanzas-input')?.addEventListener('input', calcularTardanzas);
$('#btn-imprimir-puntaje-pdf')?.addEventListener('click', imprimirPuntajePDF);

[
  '#sim-titulo-tipo', '#sim-titulo-promedio', '#sim-otros-titulos',
  '#sim-ant-titulo', '#sim-ant-docencia', '#sim-conc-1', '#sim-conc-2', '#sim-conc-3',
  '#sim-horas-cursos', '#sim-postitulo', '#sim-publicaciones', '#sim-concursos'
].forEach(sel => {
  $(sel)?.addEventListener('input', calcularPuntajeEstatuto);
  $(sel)?.addEventListener('change', calcularPuntajeEstatuto);
});

// Inicializar OCR
setupOCRImport();

// ═════════ EVENT LISTENERS SINCRONIZACIÓN SUPABASE ═════════
$('#btn-sync-cloud-manual')?.addEventListener('click', forzarSincronizacionNube);

$$('#imp-merge-mode button').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('#imp-merge-mode button').forEach(b => b.classList.toggle('on', b === btn));
    modoImportacionMerge = btn.dataset.merge;
  });
});

$('#imp-textarea')?.addEventListener('input', e => {
  listaImportacionPendiente = parsearTextoNomina(e.target.value);
  actualizarPreviewImportacion();
});

$('#imp-ejemplo-btn')?.addEventListener('click', () => {
  const ej = `Valentina Ríos, 5491145678901, valentina@familia.edu, Participativa
Mateo Fernández, 5491144556677, mateo@correo.com, Buen desempeño
Camila Sosa, 5491122334455, camila@escuela.edu, Entregas al día
Thiago Aguirre, 5491188990011, tutor.aguirre@gmail.com, Requiere apoyo
Lucía Peralta, 5491122334455, lucia@familia.edu, Excelente
Bruno Cabrera, 5491155667788
Emma Domínguez, 5491166778899
Felipe Navarro, 5491199887766, felipe@correo.edu`;
  $('#imp-textarea').value = ej;
  listaImportacionPendiente = parsearTextoNomina(ej);
  actualizarPreviewImportacion();
  toast('Ejemplo cargado en el área de texto', 'ok');
});

const dropzone = $('#imp-dropzone');
const fileInput = $('#imp-file-input');
if (dropzone && fileInput) {
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) parsearArchivoImportar(e.target.files[0]);
  });
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) parsearArchivoImportar(e.dataTransfer.files[0]);
  });
}

$('#btn-descargar-plantilla')?.addEventListener('click', descargarPlantillaCSV);
$('#imp-submit-btn')?.addEventListener('click', ejecutarImportacion);

// Buscador de alumnos y orden
$('#buscar')?.addEventListener('input', e => {
  filtroAl = e.target.value;
  renderAlumnos();
});
$('#buscar-clear')?.addEventListener('click', () => {
  $('#buscar').value = '';
  filtroAl = '';
  renderAlumnos();
  $('#buscar').focus();
});

$$('#al-sort-bar button').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('#al-sort-bar button').forEach(b => b.classList.toggle('on', b === btn));
    criterioOrdenAlumnos = btn.dataset.sort;
    renderAlumnos();
  });
});

$('#btn-switch-cards-view')?.addEventListener('click', () => {
  vistaNotasModo = vistaNotasModo === 'matrix' ? 'cards' : 'matrix';
  $('#gradebook-matrix-box').style.display = vistaNotasModo === 'matrix' ? 'block' : 'none';
  $('#lista-evs-cards').style.display = vistaNotasModo === 'cards' ? 'flex' : 'none';
  $('#btn-switch-cards-view').textContent = vistaNotasModo === 'matrix' ? '📱 Ver modo tarjetas' : '📊 Ver planilla matriz';
});

$('#btn-toggle-theme')?.addEventListener('click', toggleTheme);
$('#mobile-theme-toggle')?.addEventListener('click', toggleTheme);
$('#btn-open-cmd')?.addEventListener('click', abrirCmd);
$('#cmd-overlay')?.addEventListener('click', e => { if (e.target === $('#cmd-overlay')) cerrarCmd(); });
$('#cmd-input')?.addEventListener('input', e => actualizarCmdResults(e.target.value));

/* ═════════ EVENTOS GLOBALES DE CLIC ═════════ */
document.addEventListener('click', e => {
  // Keypad Lateral Numérico
  const keyBtn = e.target.closest('[data-keypad-val]');
  if (keyBtn && calEv && alumnoCalificarFocoId) {
    const val = +keyBtn.dataset.keypadVal;
    setNotaAlumno(calEv.id, alumnoCalificarFocoId, calDoc, val, true);
    return;
  }

  const keyActBtn = e.target.closest('[data-keypad-action]');
  if (keyActBtn && calEv && alumnoCalificarFocoId) {
    const act = keyActBtn.dataset.keypadAction;
    if (act === 'clear') {
      setNotaAlumno(calEv.id, alumnoCalificarFocoId, calDoc, null, false);
    } else if (act === 'half') {
      const curr = notaDoc(calEv, alumnoCalificarFocoId, calDoc) || 0;
      const nuevo = Math.floor(curr) + (curr % 1 === 0 ? 0.5 : 0);
      setNotaAlumno(calEv.id, alumnoCalificarFocoId, calDoc, nuevo, true);
    } else if (act === 'plus5') {
      const curr = notaDoc(calEv, alumnoCalificarFocoId, calDoc) || 0;
      setNotaAlumno(calEv.id, alumnoCalificarFocoId, calDoc, Math.min(ESC().max, curr + 5), true);
    }
    return;
  }

  // Botones inline rápidos en cada estudiante
  const quickNumBtn = e.target.closest('[data-quick-num]');
  if (quickNumBtn && calEv) {
    const alId = quickNumBtn.dataset.al;
    const val = +quickNumBtn.dataset.quickNum;
    setNotaAlumno(calEv.id, alId, calDoc, val, true);
    return;
  }

  const quickHalfBtn = e.target.closest('[data-quick-half]');
  if (quickHalfBtn && calEv) {
    const alId = quickHalfBtn.dataset.quickHalf;
    const curr = notaDoc(calEv, alId, calDoc) || 0;
    const nuevo = Math.floor(curr) + (curr % 1 === 0 ? 0.5 : 0);
    setNotaAlumno(calEv.id, alId, calDoc, nuevo, true);
    return;
  }

  const quickClearBtn = e.target.closest('[data-quick-clear]');
  if (quickClearBtn && calEv) {
    const alId = quickClearBtn.dataset.quickClear;
    setNotaAlumno(calEv.id, alId, calDoc, null, false);
    return;
  }

  // Navegación anterior / siguiente estudiante
  if (e.target.closest('#btn-cal-prev-student')) {
    retrocederAlumno(alumnoCalificarFocoId);
    return;
  }
  if (e.target.closest('#btn-cal-next-student')) {
    avanzarSiguienteAlumno(alumnoCalificarFocoId);
    return;
  }
  if (e.target.closest('#btn-edit-current-ev') && calEv) {
    abrirEditarEvaluacion(calEv.id);
    return;
  }

  // Foco en fila de calificación
  const focusRow = e.target.closest('[data-focus-al]');
  if (focusRow && !e.target.closest('button, a, input')) {
    const alId = focusRow.dataset.focusAl;
    actualizarLateralPreview(alId);
    return;
  }

  const t = e.target.closest('[data-nav],[data-close],[data-step],[data-as],[data-doc],[data-filtro-notas],[data-nivel],[data-action],[data-alumno],[data-edit-al],[data-edit-doc],[data-edit-ev],[data-cal],[data-mode],[data-rol],[data-switch-course]');
  if (!t) return;
  const d = t.dataset;

  if (d.nav) { cerrarAll(); navTo(d.nav); }
  else if (d.close !== undefined) cerrarAll();
  else if (d.editAl) { e.stopPropagation(); abrirEditarAlumno(d.editAl); }
  else if (d.editDoc) { e.stopPropagation(); abrirEditarDocente(d.editDoc); }
  else if (d.editEv) { e.stopPropagation(); abrirEditarEvaluacion(d.editEv); }
  else if (d.alumno) abrirPerfilAlumno(d.alumno);
  else if (d.cal) abrirCalificar(d.cal);
  else if (d.switchCourse) cambiarCurso(d.switchCourse);
  else if (d.step) irPaso(+d.step);
  else if (d.mode) setAuthMode(d.mode);
  else if (d.filtroNotas) {
    filtroNotas = d.filtroNotas;
    $$('#filtro-notas button').forEach(b => b.classList.toggle('on', b.dataset.filtroNotas === filtroNotas));
    renderNotas();
  }
  else if (d.as) {
    (S.asistencia[fechaAsist] = S.asistencia[fechaAsist] || {})[d.al] = d.as;
    save();
    renderAsistencia();
  }
  else if (d.doc) { calDoc = d.doc; renderCalificar(); }
  else if (d.nivel) {
    $$('#ob-niveles button').forEach(b => b.classList.toggle('on', b === t));
    ob.nivel = d.nivel;
  }
  else if (d.rol && d.uid) {
    (async () => {
      t.disabled = true;
      const r = await API.setRole(d.uid, d.rol);
      if (r.ok) { toast('Rol actualizado ✓', 'ok'); renderUsuarios(); }
      else { toast(r.error || 'Error', 'err'); t.disabled = false; }
    })();
  }
  else if (d.action) {
    if (d.action === 'nuevo-al') {
      $('#na-nombre').value = '';
      if ($('#na-dni')) $('#na-dni').value = '';
      $('#na-telefono').value = '';
      $('#na-email').value = '';
      $('#na-obs').value = '';
      colorSeleccionadoNuevoAl = PALETTE[S.alumnos.length % 8];
      renderColorPickers();
      abrir('#m-alumno');
      setTimeout(() => $('#na-nombre').focus(), 150);
    }
    else if (d.action === 'nueva-ev') { prepararEvModal(); abrir('#m-eval'); }
    else if (d.action === 'nuevo-doc') {
      $('#nd-nombre').value = '';
      $('#nd-email').value = '';
      $('#nd-telefono').value = '';
      colorSeleccionadoDoc = PALETTE[(S.docentes.length + 2) % 8];
      renderColorPickers();
      abrir('#m-docente');
    }
    else if (d.action === 'todos-p') {
      const m = {};
      (S.alumnos || []).forEach(a => m[a.id] = 'P');
      S.asistencia[fechaAsist] = m;
      save();
      renderAsistencia();
      toast('✓ Todos marcados presentes', 'ok');
    }
    else if (d.action === 'dia-prev' || d.action === 'dia-next') {
      const dt = new Date(fechaAsist + 'T12:00');
      dt.setDate(dt.getDate() + (d.action === 'dia-next' ? 1 : -1));
      fechaAsist = localISO(dt);
      renderAsistencia();
    }
    else if (d.action === 'imprimir') imprimirPDF();
    else if (d.action === 'reset') {
      AtrilSwal.danger({
        title: '¿Reiniciar el aula local?',
        text: 'Se restablecerán todos los datos locales del curso al estado inicial de demostración.',
        confirmText: '↺ Sí, reiniciar datos',
        cancelText: 'Cancelar'
      }).then(ok => {
        if (ok) {
          localStorage.removeItem(LS_KEYS.COURSE);
          S = null;
          location.reload();
        }
      });
    }
  }
});

/* Focus Tracking para Vista Lateral */
document.addEventListener('focusin', e => {
  const t = e.target;
  if (t.dataset.nota !== undefined && t.dataset.al) {
    alumnoCalificarFocoId = t.dataset.al;
    actualizarLateralPreview(t.dataset.al);
  }
});

/* Inputs interactivos & Carga de Notas en Tiempo Real (Libre & Decimal) */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'fecha-asist' && t.value) { fechaAsist = t.value; renderAsistencia(); }
  else if (t.dataset.nota !== undefined) {
    const ev = (S.evaluaciones || []).find(x => x.id === t.dataset.ev);
    if (!ev) return;
    const raw = (t.value || '').trim();
    const vNum = parseNotaValor(raw);
    (ev.notas[t.dataset.al] = ev.notas[t.dataset.al] || {})[t.dataset.doc] = vNum;
    save();

    t.className = t.className.replace(/\bn-(ok|med|bad)\b/g, '').trim() + ' ' + claseNota(vNum);
    if (calEv && calEv.id === ev.id) {
      actualizarProg();
      actualizarLateralPreview(t.dataset.al);
    }
  }
});

/* Navegación por Teclado en Matriz de Calificaciones & Recuadros Numéricos */
document.addEventListener('keydown', e => {
  // Navegación en inputs de la pantalla Calificar
  if (e.target.classList.contains('grade-box-input')) {
    const idx = +e.target.dataset.idx;
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextInput = $(`input.grade-box-input[data-idx="${idx + 1}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = $(`input.grade-box-input[data-idx="${idx - 1}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  }

  // Navegación en celdas de la Matriz General
  if (e.target.classList.contains('matrix-grade-input')) {
    const r = +e.target.dataset.row;
    const c = +e.target.dataset.col;
    let nextInput = null;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      nextInput = $(`input.matrix-grade-input[data-row="${r + 1}"][data-col="${c}"]`);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextInput = $(`input.matrix-grade-input[data-row="${r - 1}"][data-col="${c}"]`);
    } else if (e.key === 'ArrowRight') {
      nextInput = $(`input.matrix-grade-input[data-row="${r}"][data-col="${c + 1}"]`);
    } else if (e.key === 'ArrowLeft') {
      nextInput = $(`input.matrix-grade-input[data-row="${r}"][data-col="${c - 1}"]`);
    }

    if (nextInput) {
      nextInput.focus();
      nextInput.select();
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if ($('#cmd-overlay').classList.contains('open')) cerrarCmd();
    else abrirCmd();
  }

  if ($('#cmd-overlay').classList.contains('open')) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cmdSelectedIndex = Math.min(cmdResults.length - 1, cmdSelectedIndex + 1);
      renderCmdList();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cmdSelectedIndex = Math.max(0, cmdSelectedIndex - 1);
      renderCmdList();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (cmdResults[cmdSelectedIndex]) {
        cerrarCmd();
        cmdResults[cmdSelectedIndex].act();
      }
    }
  }

  const tag = (document.activeElement?.tagName || '').toLowerCase();
  if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !$('#cmd-overlay').classList.contains('open')) {
    if (e.key === '1') navTo('inicio');
    else if (e.key === '2') navTo('alumnos');
    else if (e.key === '3') navTo('notas');
    else if (e.key === '4') navTo('asistencia');
    else if (e.key === '5') navTo('informes');
    else if (e.key === '6') navTo('equipo');
    else if (e.key.toLowerCase() === 't') toggleTheme();
  }

  if (e.key === 'Escape') cerrarAll();
});

$('#ob-fin')?.addEventListener('click', finalizarOnboarding);
$('#ob-skip')?.addEventListener('click', () => { if ($('#ob-doc1')) $('#ob-doc1').value = ''; if ($('#ob-doc2')) $('#ob-doc2').value = ''; finalizarOnboarding(); });
$$('#auth-mode button').forEach?.(b => b.addEventListener('click', () => setAuthMode(b.dataset.mode)));
$('#au-submit')?.addEventListener('click', handleAuthSubmit);
['au-email', 'au-pass', 'au-nombre'].forEach(id => {
  const el = $('#' + id);
  if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleAuthSubmit(); });
});
$('#toggle-api')?.addEventListener('click', () => {
  const box = $('#api-box');
  if (box) {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }
  if ($('#api-url')) $('#api-url').value = API.url;
});
$('#api-save')?.addEventListener('click', () => {
  const u = ($('#api-url')?.value || '').trim();
  if (!u) { toast('Pegá la URL del Web App', 'warn'); return; }
  API.url = u;
  toast('URL guardada ✓', 'ok');
});
$('#api-test')?.addEventListener('click', async () => {
  const u = ($('#api-url')?.value || '').trim();
  if (!u) { toast('Pegá una URL primero', 'warn'); return; }
  const old = API.url;
  API.url = u;
  showLoad('Probando conexión…');
  const r = await API.ping();
  hideLoad();
  if (r.ok) toast('¡Conexión exitosa ✓', 'ok');
  else { toast(r.error || 'Sin respuesta', 'err'); API.url = old; }
});
$('#demo-btn')?.addEventListener('click', () => {
  demoMode = true;
  localStorage.setItem(LS_KEYS.DEMO, '1');
  document.body.classList.add('logged');
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#onboarding')?.classList.add('active');
  toast('🧪 Modo demo local activado', 'ok');
});
$('#logout')?.addEventListener('click', async () => {
  const ok = await AtrilSwal.confirm({
    title: '¿Cerrar sesión?',
    text: 'Tus datos sincronizados en la nube se conservan. Podrás volver a ingresar en cualquier momento.',
    icon: 'question',
    confirmText: '🚪 Cerrar sesión',
    cancelText: 'Cancelar'
  });
  if (!ok) return;
  API.token = '';
  API.user = null;
  localStorage.removeItem(LS_KEYS.DEMO);
  localStorage.removeItem(LS_KEYS.COURSE);
  location.reload();
});
$('#sync-pill')?.addEventListener('click', async () => {
  if (!S) return;
  if (!isOnline()) { toast(demoMode ? 'En modo demo no hay sync' : 'Sin conexión con backend', 'warn'); return; }
  setSync('sync', 'Guardando…');
  try {
    const r = await API.saveCourse(S);
    if (r.ok) { toast('Sincronizado con Google Sheets ✓', 'ok'); setSync('ok', 'Sincronizado ✓'); }
    else { toast(r.error || 'Error de sincronización', 'err'); setSync('err', 'Sin sincronizar'); }
  } catch (_) {
    setSync('err', 'Sin sincronizar');
  }
});
$('#sb-course-card')?.addEventListener('click', () => { renderListaCursos(); abrir('#m-cursos'); });
$('#btn-mobile-cambiar-curso')?.addEventListener('click', () => { renderListaCursos(); abrir('#m-cursos'); });
$('#btn-abrir-cursos')?.addEventListener('click', () => { renderListaCursos(); abrir('#m-cursos'); });
$('#btn-export-csv')?.addEventListener('click', exportarCSV);
$('#btn-edit-current-ev')?.addEventListener('click', () => { if (calEv) abrirEditarEvaluacion(calEv.id); });
$('#usr-refresh')?.addEventListener('click', renderUsuarios);
$('#usr-admin')?.addEventListener('click', () => navTo('usuarios'));
$('#btn-asist-hoy')?.addEventListener('click', () => { fechaAsist = localISO(); renderAsistencia(); });
$$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) cerrarAll(); }));
window.addEventListener('online', () => { if (isOnline() && S) save(); });

(async function boot() {
  initTheme();
  setSync('off', 'Iniciando…');
  if (typeof SB !== 'undefined') {
    SB.init();
  }
  if ($('#api-url')) $('#api-url').value = API.url;
  S = load();

  if (API.token) {
    showLoad('Verificando sesión…');
    try {
      const me = await API.me();
      if (me.ok && me.user) {
        API.user = me.user;
        demoMode = false;
        document.body.classList.add('logged');

        API.getCourse().then(cd => {
          if (cd.ok && cd.data && (cd.data.docentes || []).length) {
            S = normalizeFromCloud(cd.data);
            save();
            renderAll();
          }
        }).catch(() => {});

        hideLoad();
        if (S) return entrar();
        $$('.screen').forEach(s => s.classList.remove('active'));
        $('#onboarding').classList.add('active');
        return;
      } else {
        API.token = ''; API.user = null;
      }
    } catch (_) {}
    hideLoad();
  }

  if (S && demoMode) {
    document.body.classList.add('logged');
    entrar();
    return;
  }

  if (S) {
    document.body.classList.add('logged');
    entrar();
    return;
  }

  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#login').classList.add('active');
})();
