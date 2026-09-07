-- ═══════════════════════════════════════════════════════════
-- ATRIL 5.0 · ESQUEMA RELACIONAL POSTGRESQL PARA SUPABASE
-- Proyecto: avpdyesbyzxterlfxsou
-- URL: https://avpdyesbyzxterlfxsou.supabase.co
-- ═══════════════════════════════════════════════════════════

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabla para Ping de Conectividad y Health-check
CREATE TABLE IF NOT EXISTS public._atril_ping (
  id TEXT PRIMARY KEY DEFAULT 'ping',
  app TEXT DEFAULT 'Atril 5.0 Supabase',
  ok BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Tabla de Snapshot de Alta Disponibilidad de Cursos (0ms Sync)
CREATE TABLE IF NOT EXISTS public.app_courses_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  materia TEXT,
  curso TEXT,
  nivel TEXT,
  docente TEXT,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Tabla de Cursos
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  materia TEXT NOT NULL,
  curso TEXT NOT NULL,
  nivel TEXT DEFAULT 'Secundario',
  escala_key TEXT DEFAULT '10',
  periodo TEXT DEFAULT '1° Cuatrimestre',
  ciclo_lectivo TEXT DEFAULT '2026',
  docente_titular TEXT,
  institucion TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Tabla de Docentes
CREATE TABLE IF NOT EXISTS public.docentes (
  id TEXT PRIMARY KEY,
  curso_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id TEXT,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  color TEXT DEFAULT '#0C6B5D',
  rol TEXT DEFAULT 'Docente titular',
  yo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Tabla de Alumnos (Estudiantes)
CREATE TABLE IF NOT EXISTS public.alumnos (
  id TEXT PRIMARY KEY,
  curso_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  dni TEXT,
  telefono TEXT,
  email TEXT,
  color TEXT DEFAULT '#0C6B5D',
  obs TEXT,
  contacto TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Tabla de Evaluaciones & Rúbricas
CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id TEXT PRIMARY KEY,
  curso_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT DEFAULT 'individual',
  fecha TEXT,
  docentes JSONB DEFAULT '[]'::jsonb,
  notas JSONB DEFAULT '{}'::jsonb,
  rubricas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. Tabla de Asistencias
CREATE TABLE IF NOT EXISTS public.asistencias (
  id TEXT PRIMARY KEY,
  curso_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  registros JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 9. Tabla de Declaraciones Juradas (DDJJ - Ley 3416/77)
CREATE TABLE IF NOT EXISTS public.ddjj (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  curso_id TEXT,
  datos JSONB DEFAULT '{}'::jsonb,
  cargos JSONB DEFAULT '[]'::jsonb,
  horarios JSONB DEFAULT '[]'::jsonb,
  espacios JSONB DEFAULT '[]'::jsonb,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 10. Tabla de Licencias Docentes (Dec. 561-G-71)
CREATE TABLE IF NOT EXISTS public.licencias (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  curso_id TEXT,
  art TEXT,
  categoria TEXT,
  desde TEXT,
  hasta TEXT,
  dias INTEGER DEFAULT 1,
  suplente TEXT,
  certificado TEXT,
  estado TEXT DEFAULT 'Aprobada',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ═══════════════════════════════════════════════════════════
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_docentes_curso ON public.docentes(curso_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_curso ON public.alumnos(curso_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_curso ON public.evaluaciones(curso_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_curso ON public.asistencias(curso_id);
CREATE INDEX IF NOT EXISTS idx_ddjj_user ON public.ddjj(user_id);
CREATE INDEX IF NOT EXISTS idx_licencias_user ON public.licencias(user_id);

-- ═══════════════════════════════════════════════════════════
-- TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_courses_updated_at ON public.courses;
CREATE TRIGGER tr_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_app_courses_data_updated_at ON public.app_courses_data;
CREATE TRIGGER tr_app_courses_data_updated_at BEFORE UPDATE ON public.app_courses_data FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_docentes_updated_at ON public.docentes;
CREATE TRIGGER tr_docentes_updated_at BEFORE UPDATE ON public.docentes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_alumnos_updated_at ON public.alumnos;
CREATE TRIGGER tr_alumnos_updated_at BEFORE UPDATE ON public.alumnos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_evaluaciones_updated_at ON public.evaluaciones;
CREATE TRIGGER tr_evaluaciones_updated_at BEFORE UPDATE ON public.evaluaciones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_asistencias_updated_at ON public.asistencias;
CREATE TRIGGER tr_asistencias_updated_at BEFORE UPDATE ON public.asistencias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_ddjj_updated_at ON public.ddjj;
CREATE TRIGGER tr_ddjj_updated_at BEFORE UPDATE ON public.ddjj FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_licencias_updated_at ON public.licencias;
CREATE TRIGGER tr_licencias_updated_at BEFORE UPDATE ON public.licencias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════════════════
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- Permite acceso anónimo y autenticado para clientes de la webapp
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public._atril_ping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_courses_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddjj ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;

-- Políticas Permisivas para Operación Fluida
DROP POLICY IF EXISTS "Permitir todo en ping" ON public._atril_ping;
CREATE POLICY "Permitir todo en ping" ON public._atril_ping FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en app_courses_data" ON public.app_courses_data;
CREATE POLICY "Permitir todo en app_courses_data" ON public.app_courses_data FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en courses" ON public.courses;
CREATE POLICY "Permitir todo en courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en docentes" ON public.docentes;
CREATE POLICY "Permitir todo en docentes" ON public.docentes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en alumnos" ON public.alumnos;
CREATE POLICY "Permitir todo en alumnos" ON public.alumnos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en evaluaciones" ON public.evaluaciones;
CREATE POLICY "Permitir todo en evaluaciones" ON public.evaluaciones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en asistencias" ON public.asistencias;
CREATE POLICY "Permitir todo en asistencias" ON public.asistencias FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en ddjj" ON public.ddjj;
CREATE POLICY "Permitir todo en ddjj" ON public.ddjj FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en licencias" ON public.licencias;
CREATE POLICY "Permitir todo en licencias" ON public.licencias FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- HABILITACIÓN DE SUPABASE REALTIME
-- ═══════════════════════════════════════════════════════════
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_courses_data;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alumnos;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluaciones;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.asistencias;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ddjj;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.licencias;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ═══════════════════════════════════════════════════════════
-- DATO DE PRUEBA INICIAL PARA PING
-- ═══════════════════════════════════════════════════════════
INSERT INTO public._atril_ping (id, app, ok)
VALUES ('ping', 'Atril 5.0 Supabase', true)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
