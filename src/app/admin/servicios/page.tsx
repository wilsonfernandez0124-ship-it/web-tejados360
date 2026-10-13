'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadOptimizedImage } from '@/lib/supabase/uploadService';
import Link from 'next/link';
import { Plus, Trash2, Upload, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';

interface Service {
  id: string;
  badge: string;
  title: string;
  label: string;
  text: string;
  bullets: string[];
  service: string;
  cta: string;
  img: string;
  images?: string[];
  order_index?: number;
}

const EMPTY_SERVICE: Service = {
  id: '',
  badge: 'Nuevo Servicio',
  title: '',
  label: '',
  text: '',
  bullets: [''],
  service: '',
  cta: 'Solicitar información',
  img: '',
  images: [],
  order_index: 0,
};

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploadingImgIndex, setUploadingImgIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error al obtener servicios:', error);
    } else if (data) {
      // Garantizar que la lista de imágenes exista siempre como arreglo
      const formatted = data.map((s) => ({
        ...s,
        images: s.images && s.images.length > 0 ? s.images : s.img ? [s.img] : [],
      }));
      setServices(formatted);
    }
    setLoading(false);
  };

  // Crear un nuevo servicio
  const handleCreateNew = () => {
    const newId = `servicio-${Date.now()}`;
    setEditingService({
      ...EMPTY_SERVICE,
      id: newId,
      order_index: services.length + 1,
    });
    setIsNew(true);
  };

  // Subida de imagen comprimida (soporta hasta 3 imágenes)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetIndex: number) => {
    const file = e.target.files?.[0];
    if (!file || !editingService) return;

    try {
      setUploadingImgIndex(targetIndex);

      // Compresión automática WebP
      const publicUrl = await uploadOptimizedImage(file, 'media');

      const currentImages = editingService.images ? [...editingService.images] : [];
      currentImages[targetIndex] = publicUrl;

      // Mantener img (principal) alineada con la primera foto de la lista
      const mainImg = currentImages[0] || publicUrl;

      setEditingService({
        ...editingService,
        img: mainImg,
        images: currentImages,
      });
    } catch (error: any) {
      alert('Error subiendo la imagen: ' + (error.message || error));
    } finally {
      setUploadingImgIndex(null);
    }
  };

  // Eliminar una foto de la galería
  const handleRemoveImage = (indexToRemove: number) => {
    if (!editingService || !editingService.images) return;

    const newImages = editingService.images.filter((_, idx) => idx !== indexToRemove);
    const mainImg = newImages[0] || '';

    setEditingService({
      ...editingService,
      img: mainImg,
      images: newImages,
    });
  };

  // Guardar servicio en Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    if (!editingService.title.trim() || !editingService.label.trim()) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    setSaving(true);

    const payload = {
      ...editingService,
      img: editingService.images?.[0] || editingService.img || '',
    };

    const { error } = await supabase.from('services').upsert(payload);

    if (error) {
      alert('Error al guardar el servicio: ' + error.message);
    } else {
      alert(isNew ? '¡Nuevo servicio creado con éxito!' : '¡Servicio actualizado con éxito!');
      setEditingService(null);
      setIsNew(false);
      fetchServices();
    }
    setSaving(false);
  };

  // Gestión de puntos clave (bullets)
  const handleBulletChange = (index: number, value: string) => {
    if (!editingService) return;
    const newBullets = [...editingService.bullets];
    newBullets[index] = value;
    setEditingService({ ...editingService, bullets: newBullets });
  };

  const addBullet = () => {
    if (!editingService) return;
    setEditingService({
      ...editingService,
      bullets: [...editingService.bullets, ''],
    });
  };

  const removeBullet = (index: number) => {
    if (!editingService) return;
    const newBullets = editingService.bullets.filter((_, i) => i !== index);
    setEditingService({ ...editingService, bullets: newBullets });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-100">
      <div className="mx-auto max-w-5xl">
        {/* Cabecera */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-[#F26522] hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al Panel Principal
            </Link>
            <h1 className="mt-2 text-2xl font-black text-white">Gestión de Servicios</h1>
          </div>
          {!editingService && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 rounded-xl bg-[#F26522] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" /> Crear Nuevo Servicio
            </button>
          )}
        </div>

        {/* Carga / Formulario / Catálogo */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#F26522] border-t-transparent" />
            <p className="text-sm">Cargando catálogo desde la base de datos...</p>
          </div>
        ) : editingService ? (
          /* FORMULARIO DE EDICIÓN O CREACIÓN */
          <form onSubmit={handleSave} className="rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">
                {isNew ? 'Creando Nuevo Servicio' : `Editando: ${editingService.label}`}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setIsNew(false);
                }}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Etiqueta Menú (Label) *</label>
                <input
                  type="text"
                  placeholder="Ej. Inspección con dron"
                  value={editingService.label}
                  onChange={(e) => setEditingService({ ...editingService, label: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white focus:border-[#F26522] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Insignia Destacada (Badge) *</label>
                <input
                  type="text"
                  placeholder="Ej. Diagnóstico Aéreo HD"
                  value={editingService.badge}
                  onChange={(e) => setEditingService({ ...editingService, badge: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white focus:border-[#F26522] focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-300">Título Principal *</label>
                <input
                  type="text"
                  placeholder="Ej. Inspección y presupuesto técnico con dron"
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white focus:border-[#F26522] focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-300">Descripción Detallada *</label>
                <textarea
                  rows={4}
                  placeholder="Escriba la descripción comercial y técnica del servicio..."
                  value={editingService.text}
                  onChange={(e) => setEditingService({ ...editingService, text: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white focus:border-[#F26522] focus:outline-none"
                  required
                />
              </div>

              {/* Viñetas / Bullets */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold text-slate-300">Puntos Clave / Beneficios</label>
                {editingService.bullets.map((b, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Punto clave del servicio"
                      value={b}
                      onChange={(e) => handleBulletChange(idx, e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-sm text-white focus:border-[#F26522] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(idx)}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-xs font-bold text-red-400 hover:bg-red-500/20"
                    >
                      X
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBullet}
                  className="mt-1 text-xs font-bold text-[#F26522] hover:underline"
                >
                  + Agregar punto clave
                </button>
              </div>

              {/* GALERÍA DE HASTA 3 FOTOS (COMPRESIÓN WEBP AUTOMÁTICA) */}
              <div className="md:col-span-2 border-t border-white/10 pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    Galería de Fotos del Servicio (Máximo 3 imágenes optimizadas)
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {editingService.images?.length || 0} / 3 fotos cargadas
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[0, 1, 2].map((slotIndex) => {
                    const currentImg = editingService.images?.[slotIndex];
                    const isUploadingThis = uploadingImgIndex === slotIndex;

                    return (
                      <div
                        key={slotIndex}
                        className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950 p-3 text-center min-h-[160px]"
                      >
                        {isUploadingThis ? (
                          <div className="py-6 text-center text-amber-400">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin mb-1" />
                            <span className="text-[11px] font-semibold">Comprimiendo...</span>
                          </div>
                        ) : currentImg ? (
                          <div className="relative w-full h-full group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentImg}
                              alt={`Foto ${slotIndex + 1}`}
                              className="h-32 w-full rounded-xl object-cover border border-white/10"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(slotIndex)}
                              className="absolute top-2 right-2 rounded-lg bg-red-600 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-700"
                              title="Eliminar foto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <span className="mt-1 block text-[10px] text-slate-400 font-medium">
                              Foto {slotIndex + 1} {slotIndex === 0 ? '(Principal)' : ''}
                            </span>
                          </div>
                        ) : (
                          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 p-4 transition hover:border-[#F26522] hover:bg-white/[0.02]">
                            <Upload className="mb-2 h-5 w-5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-300">Subir Foto {slotIndex + 1}</span>
                            <span className="text-[10px] text-slate-500">Auto-compresión WebP</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, slotIndex)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setIsNew(false);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImgIndex !== null}
                className="rounded-xl bg-[#F26522] px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Servicio'}
              </button>
            </div>
          </form>
        ) : (
          /* LISTA DE SERVICIOS */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {services.map((s) => (
              <div key={s.id} className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-xl backdrop-blur-md">
                <div>
                  <div className="flex gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.images?.[0] || s.img} alt={s.title} className="h-24 w-28 rounded-2xl border border-white/10 object-cover" />
                    <div>
                      <span className="rounded-full bg-[#F26522]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#F26522]">
                        {s.badge}
                      </span>
                      <h3 className="mt-1 font-bold text-white">{s.label}</h3>
                      <p className="line-clamp-2 text-xs text-slate-400">{s.title}</p>
                    </div>
                  </div>

                  {/* Indicador de número de fotos */}
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <ImageIcon className="h-3.5 w-3.5 text-[#F26522]" />
                    <span>{s.images?.length || (s.img ? 1 : 0)} de 3 fotos cargadas</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
                  <button
                    onClick={() => {
                      setEditingService(s);
                      setIsNew(false);
                    }}
                    className="rounded-xl bg-white/10 px-5 py-2 text-xs font-bold text-white transition hover:bg-[#F26522]"
                  >
                    Editar Servicio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}