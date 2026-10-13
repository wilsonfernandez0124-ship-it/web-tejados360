'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  LayoutDashboard,
  Table,
  Award,
  Video,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon
} from 'lucide-react';

interface Appointment {
  id: string;
  created_at: string;
  nombre: string;
  telefono: string;
  email: string | null;
  direccion: string;
  localidad: string;
  servicio_interes: string;
  fecha_cita: string | null;
  franja_horaria: string | null;
  comentarios: string | null;
  estado: string;
}

interface SiteImage {
  id: string;
  section_name: string;
  image_url: string;
  alt_text?: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* COMPRESIÓN DE IMÁGENES EN HILO SECUNDARIO (WEB WORKER)             */
/* ------------------------------------------------------------------ */
async function compressAndOptimizeImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.2,            // Límite máximo objetivo: ~200 KB
    maxWidthOrHeight: 1200,    // Redimensiona dimensiones si superan 1200px
    useWebWorker: true,        // Ejecuta en Web Worker para no congelar la UI
    fileType: 'image/webp',    // Convierte a formato WebP altamente optimizado
    initialQuality: 0.8        // 80% de calidad
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
    return new File([compressedBlob], fileName, { type: 'image/webp' });
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    return file;
  }
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'table' | 'images'>('overview');

  // Estado del Calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[] | null>(null);

  // Estado del Gestor de Imágenes
  const [siteImages, setSiteImages] = useState<SiteImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [externalUrlInput, setExternalUrlInput] = useState<Record<string, string>>({});
  const [imgMsg, setImgMsg] = useState('');

  const supabase = createClient();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, created_at, nombre, telefono, email, direccion, localidad, servicio_interes, fecha_cita, franja_horaria, estado, comentarios')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error al obtener las reservas:', error);
      } else if (data) {
        setAppointments(data as Appointment[]);
      }
    } catch (err) {
      console.error('Error de conexión:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchSiteImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const { data, error } = await supabase.from('site_images').select('*').order('section_name');
      if (error) throw error;
      if (data) setSiteImages(data as SiteImage[]);
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
    } finally {
      setLoadingImages(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAppointments();
    fetchSiteImages();
  }, [fetchAppointments, fetchSiteImages]);

  const updateEstado = async (id: string, estado: string) => {
    setAppointments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estado } : item))
    );

    const { error } = await supabase.from('appointments').update({ estado }).eq('id', id);
    if (error) {
      alert('Error al actualizar estado: ' + error.message);
      fetchAppointments();
    }
  };

  /* ------------------------------------------------------------------ */
  /* MANEJADORES DE CARGA DE IMÁGENES DENTRO DEL PANEL ADMIN            */
  /* ------------------------------------------------------------------ */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, id: string) {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setUploadingId(id);
    setImgMsg('');

    try {
      // 1. Compresión WebP en Web Worker (<200KB)
      const optimizedFile = await compressAndOptimizeImage(originalFile);
      const fileName = `${id}-${Date.now()}.webp`;

      // 2. Subida limpia al bucket site-assets
      const { error: uploadErr } = await supabase.storage
        .from('site-assets')
        .upload(fileName, optimizedFile, {
          contentType: 'image/webp',
          cacheControl: '36000',
          upsert: true
        });

      if (uploadErr) throw uploadErr;

      // 3. Obtención de URL Pública
      const { data: publicUrlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      console.log('URL pública generada:', publicUrl);

      // 4. Guardar URL en la base de datos y refrescar estado
      await updateImageUrlInDB(id, publicUrl);
    } catch (err: any) {
      console.error('Error al subir imagen:', err);
      alert(`Error al procesar la imagen: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  }

  async function handleSaveExternalUrl(id: string) {
    const url = externalUrlInput[id]?.trim();
    if (!url || !url.startsWith('http')) {
      alert('Ingresa una URL válida que empiece con http:// o https://');
      return;
    }

    setUploadingId(id);
    try {
      await updateImageUrlInDB(id, url);
      setExternalUrlInput((prev) => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      alert(`Error al guardar la URL: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  }

  async function updateImageUrlInDB(id: string, url: string) {
    const nowISO = new Date().toISOString();

    const { error } = await supabase
      .from('site_images')
      .update({ image_url: url, updated_at: nowISO })
      .eq('id', id);

    if (error) throw error;

    // Actualización inmediata en el estado de React
    setSiteImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, image_url: url, updated_at: nowISO } : img))
    );

    setImgMsg(`¡Imagen "${id}" actualizada con éxito!`);
  }

  // Contadores memorizados
  const { totalAppointments, pendingCount, confirmedCount, completedCount } = useMemo(() => {
    return {
      totalAppointments: appointments.length,
      pendingCount: appointments.filter((a) => (a.estado || 'pendiente') === 'pendiente').length,
      confirmedCount: appointments.filter((a) => a.estado === 'confirmada').length,
      completedCount: appointments.filter((a) => a.estado === 'completada').length,
    };
  }, [appointments]);

  /* ------------------------------------------------------------------ */
  /* LÓGICA DEL CALENDARIO                                              */
  /* ------------------------------------------------------------------ */
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((acc, app) => {
      if (app.fecha_cita) {
        const dateKey = app.fecha_cita.includes('T')
          ? app.fecha_cita.split('T')[0]
          : app.fecha_cita;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(app);
      }
      return acc;
    }, {} as Record<string, Appointment[]>);
  }, [appointments]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-[#F26522] selection:text-white">
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* BARRA LATERAL NAVEGABLE */}
        <aside className="w-full lg:w-64 bg-slate-900/90 border-r border-white/10 p-6 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F26522] text-xs font-black text-white shadow-lg shadow-[#F26522]/30">
                360
              </span>
              <div>
                <h1 className="text-sm font-black tracking-wide text-white">TEJADOS 360</h1>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#F26522]">Console Admin</p>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Panel General</span>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Agenda Calendario</span>
              </button>

              <button
                onClick={() => setActiveTab('table')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'table'
                    ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Table className="h-4 w-4" />
                <span>Lista de Citas</span>
              </button>

              <button
                onClick={() => setActiveTab('images')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === 'images'
                    ? 'bg-[#F26522] text-white shadow-lg shadow-[#F26522]/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Gestor de Imágenes</span>
              </button>
            </nav>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Módulos Web</p>
              <div className="space-y-1">
                <Link
                  href="/admin/hero"
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
                >
                  <Video className="h-4 w-4 text-amber-400" />
                  <span>Video Hero</span>
                </Link>
                <Link
                  href="/admin/servicios"
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition"
                >
                  <Wrench className="h-4 w-4 text-[#F26522]" />
                  <span>Servicios</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-4 text-[11px] text-slate-500">
            <p>Sistema Tejados 360 v2.0</p>
            <p className="text-slate-600">Servidor Supabase Conectado</p>
          </div>
        </aside>

        {/* ÁREA DE CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          
          {/* CABECERA DE SECCIÓN */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-2xl font-black text-white">
                  {activeTab === 'overview' && 'Panel de Métricas & Actividad'}
                  {activeTab === 'calendar' && 'Calendario de Visitas Técnicas'}
                  {activeTab === 'table' && 'Gestión Detallada de Solicitudes'}
                  {activeTab === 'images' && 'Edición de Imágenes por Sección'}
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">Administrador en tiempo real de Tejados 360</p>
            </div>

            <button
              onClick={activeTab === 'images' ? fetchSiteImages : fetchAppointments}
              disabled={loading || loadingImages}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${(loading || loadingImages) ? 'animate-spin' : ''}`} />
              <span>{(loading || loadingImages) ? 'Actualizando...' : 'Sincronizar'}</span>
            </button>
          </div>

          {/* VISTA 1: DASHBOARD OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-wider">Total Citas</p>
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="mt-3 text-4xl font-black text-white">{totalAppointments}</p>
                </div>

                <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between text-amber-400">
                    <p className="text-xs font-bold uppercase tracking-wider">Pendientes</p>
                    <Clock className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-4xl font-black text-amber-400">{pendingCount}</p>
                </div>

                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between text-emerald-400">
                    <p className="text-xs font-bold uppercase tracking-wider">Confirmadas</p>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-4xl font-black text-emerald-400">{confirmedCount}</p>
                </div>

                <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between text-blue-400">
                    <p className="text-xs font-bold uppercase tracking-wider">Completadas</p>
                    <Award className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-4xl font-black text-blue-400">{completedCount}</p>
                </div>
              </div>

              {/* Lista Rápida */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="mb-4 text-base font-bold text-white">Últimas Solicitudes Entrantes</h3>
                {loading ? (
                  <div className="py-8 text-center text-slate-500 text-xs">Cargando registros...</div>
                ) : appointments.length === 0 ? (
                  <p className="text-xs text-slate-500">No hay registros de citas aún.</p>
                ) : (
                  appointments.slice(0, 5).map((a) => (
                    <div key={a.id} className="mb-3 flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950 p-4">
                      <div>
                        <p className="font-bold text-white text-sm">{a.nombre}</p>
                        <p className="text-xs text-slate-400">{a.servicio_interes} · {a.direccion} ({a.localidad})</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        a.estado === 'confirmada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {a.estado || 'pendiente'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VISTA 2: AGENDA CALENDARIO INTERACTIVO */}
          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-white">
                      {monthNames[month]} {year}
                    </h3>
                    <button
                      onClick={goToToday}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-white/10"
                    >
                      Hoy
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={prevMonth} className="rounded-xl border border-white/10 bg-slate-950 p-2 text-white hover:bg-white/10">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={nextMonth} className="rounded-xl border border-white/10 bg-slate-950 p-2 text-white hover:bg-white/10">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mié</span>
                  <span>Jue</span>
                  <span>Vie</span>
                  <span>Sáb</span>
                  <span>Dom</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[90px] rounded-2xl bg-slate-950/30 opacity-30" />
                  ))}

                  {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                    const dayNumber = i + 1;
                    const dateFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                    const dayAppointments = appointmentsByDate[dateFormatted] || [];
                    const isToday = new Date().toISOString().split('T')[0] === dateFormatted;

                    return (
                      <div
                        key={dayNumber}
                        onClick={() => setSelectedDateAppointments(dayAppointments)}
                        className={`min-h-[90px] rounded-2xl border p-2 flex flex-col justify-between transition cursor-pointer ${
                          isToday
                            ? 'border-[#F26522] bg-[#F26522]/10'
                            : dayAppointments.length > 0
                            ? 'border-white/20 bg-slate-950 hover:border-[#F26522]/50'
                            : 'border-white/5 bg-slate-950/50 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isToday ? 'text-[#F26522]' : 'text-slate-300'}`}>
                            {dayNumber}
                          </span>
                          {dayAppointments.length > 0 && (
                            <span className="h-2 w-2 rounded-full bg-[#F26522] animate-pulse" />
                          )}
                        </div>

                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((app) => (
                            <div
                              key={app.id}
                              className={`truncate rounded-lg px-1.5 py-0.5 text-[9px] font-bold ${
                                app.estado === 'confirmada'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {app.nombre}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <p className="text-[9px] font-bold text-slate-500">+{dayAppointments.length - 2} más</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                <h3 className="mb-4 text-lg font-bold text-white">Inspecciones Agendadas</h3>

                {!selectedDateAppointments || selectedDateAppointments.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                    <CalendarIcon className="mx-auto h-8 w-8 mb-2 text-slate-600" />
                    <p className="text-xs">Haz clic en un día del calendario para ver las citas programadas.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDateAppointments.map((app) => (
                      <div key={app.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-white text-sm">{app.nombre}</span>
                          <span className="text-[10px] font-bold uppercase text-[#F26522] bg-[#F26522]/10 px-2 py-0.5 rounded-full">
                            {app.franja_horaria || 'Mañana'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mb-1 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" /> {app.direccion} ({app.localidad})
                        </p>
                        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-400" /> {app.telefono}
                        </p>
                        <select
                          value={app.estado || 'pendiente'}
                          onChange={(e) => updateEstado(app.id, e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-900 p-2 text-xs font-semibold text-white focus:outline-none"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VISTA 3: TABLA EN LISTA DETALLADA */}
          {activeTab === 'table' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Cargando lista completa...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="border-b border-white/10 bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Contacto</th>
                        <th className="p-4">Ubicación</th>
                        <th className="p-4">Servicio</th>
                        <th className="p-4">Fecha Cita</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {appointments.map((a) => (
                        <tr key={a.id} className="transition hover:bg-white/[0.02]">
                          <td className="p-4">
                            <p className="font-bold text-white">{a.nombre || 'Sin Nombre'}</p>
                            {a.comentarios && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{a.comentarios}</p>}
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-300">
                            <a
                              href={`https://wa.me/${a.telefono?.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline"
                            >
                              📱 {a.telefono}
                            </a>
                            {a.email && <p className="mt-0.5 text-[11px] text-slate-500">{a.email}</p>}
                          </td>
                          <td className="p-4 text-xs text-slate-300">
                            <p className="font-semibold text-white">{a.direccion}</p>
                            <p className="text-slate-500">{a.localidad}</p>
                          </td>
                          <td className="p-4">
                            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200 border border-white/5">
                              {a.servicio_interes || 'Consulta General'}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            <p className="font-bold text-slate-200">
                              {a.fecha_cita ? new Date(a.fecha_cita).toLocaleDateString('es-ES') : 'Por definir'}
                            </p>
                            {a.franja_horaria && <p className="text-[11px] text-slate-500">{a.franja_horaria}</p>}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${
                                a.estado === 'confirmada'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : a.estado === 'completada'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : a.estado === 'cancelada'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {a.estado || 'pendiente'}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={a.estado || 'pendiente'}
                              onChange={(e) => updateEstado(a.id, e.target.value)}
                              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-[#F26522] focus:outline-none"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="confirmada">Confirmada</option>
                              <option value="completada">Completada</option>
                              <option value="cancelada">Cancelada</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VISTA 4: GESTOR DE IMÁGENES OPTIMIZADO CON FALLBACK Y VINCULACIÓN MÁS ROBUSTA */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Edición de Imágenes del Sitio</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Carga o vincula imágenes para cada sección. Las imágenes subidas se optimizan en formato <b>WebP (&lt;200KB)</b> mediante Web Worker.
                  </p>
                </div>
                {imgMsg && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                    {imgMsg}
                  </span>
                )}
              </div>

              {loadingImages ? (
                <div className="py-12 text-center text-slate-500 text-xs">Cargando gestor de imágenes...</div>
              ) : siteImages.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-400 text-xs">
                  No se encontraron registros de imágenes en la base de datos.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {siteImages.map((img) => (
                    <div key={img.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522] bg-[#F26522]/10 border border-[#F26522]/20 px-2.5 py-0.5 rounded-full">
                          ID: {img.id}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Actualizado: {img.updated_at ? new Date(img.updated_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{img.section_name}</h4>

                      <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
                        <img
                          src={img.image_url}
                          alt={img.alt_text || img.section_name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Si la imagen falla o está rota, poner una foto de respaldo para que no quede en negro
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop';
                          }}
                        />
                      </div>

                      <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#F26522] hover:bg-[#E65100] text-white px-4 py-2 text-xs font-bold transition">
                            {uploadingId === img.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            <span>{uploadingId === img.id ? 'Optimizando WebP...' : 'Subir e Optimizar'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, img.id)}
                              disabled={uploadingId === img.id}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="O pega URL externa ($0 consumo)"
                            value={externalUrlInput[img.id] || ''}
                            onChange={(e) => setExternalUrlInput({ ...externalUrlInput, [img.id]: e.target.value })}
                            className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#F26522]"
                          />
                          <button
                            onClick={() => handleSaveExternalUrl(img.id)}
                            disabled={uploadingId === img.id}
                            className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-slate-200 transition flex items-center gap-1"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            <span>Vincular</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}