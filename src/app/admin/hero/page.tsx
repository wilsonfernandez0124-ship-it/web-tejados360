'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadOptimizedImage } from '@/lib/supabase/uploadService';
import Link from 'next/link';

export default function AdminHero() {
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [pendingVideoUrl, setPendingVideoUrl] = useState('');
  const [pendingPosterUrl, setPendingPosterUrl] = useState('');
  
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  // Cargar la configuración actual del Hero
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('hero_video_url, hero_poster_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.hero_video_url) setVideoUrl(data.hero_video_url);
        if (data?.hero_poster_url) setPosterUrl(data.hero_poster_url);
      });
  }, []);

  // Función interna para capturar un fotograma del video y convertirlo en WebP comprimido
  const generatePosterFromVideo = (videoFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = 1; // Capturar el segundo 1
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No se pudo inicializar canvas');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const posterFile = new File([blob], 'hero-poster-auto.webp', { type: 'image/webp' });
            resolve(posterFile);
          } else {
            reject('Error al convertir fotograma a blob');
          }
        }, 'image/webp', 0.8);
      };

      video.onerror = (err) => reject(err);
    });
  };

  // 1. Subida y optimización del Video Hero + generación automática de Poster
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de peso máximo (15 MB)
    const MAX_SIZE_MB = 15;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`El video supera los ${MAX_SIZE_MB}MB permitidos. Por favor comprímelo antes de subir.`);
      return;
    }

    try {
      setUploadingVideo(true);

      // A) Subir Video al almacenamiento
      const fileName = `hero-video-${Date.now()}.mp4`;
      const { error: videoErr } = await supabase.storage.from('media').upload(fileName, file, {
        upsert: true,
        cacheControl: '3600',
      });

      if (videoErr) throw videoErr;

      const { data: { publicUrl: newVideoUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
      setPendingVideoUrl(newVideoUrl);

      // B) Generar automáticamente imagen Poster comprimida (WebP) del primer fotograma
      try {
        const posterFile = await generatePosterFromVideo(file);
        const newPosterUrl = await uploadOptimizedImage(posterFile, 'media');
        setPendingPosterUrl(newPosterUrl);
      } catch (posterErr) {
        console.warn('No se pudo autogenerar el poster del video:', posterErr);
      }

    } catch (error: any) {
      alert('Error subiendo el video: ' + error.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  // 2. Subida manual opcional de una imagen Poster personalizada
  const handleCustomPosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPoster(true);
      const publicUrl = await uploadOptimizedImage(file, 'media');
      setPendingPosterUrl(publicUrl);
    } catch (error: any) {
      alert('Error subiendo la imagen de portada: ' + error.message);
    } finally {
      setUploadingPoster(false);
    }
  };

  // 3. Guardar cambios en la base de datos
  const handleSaveChanges = async () => {
    const finalVideo = pendingVideoUrl || videoUrl;
    const finalPoster = pendingPosterUrl || posterUrl;

    if (!finalVideo) return;

    setSaving(true);

    const { error } = await supabase
      .from('site_settings')
      .upsert({
        id: 1,
        hero_video_url: finalVideo,
        hero_poster_url: finalPoster,
      });

    if (error) {
      alert('Error al guardar en la base de datos: ' + error.message);
    } else {
      setVideoUrl(finalVideo);
      setPosterUrl(finalPoster);
      setPendingVideoUrl('');
      setPendingPosterUrl('');
      alert('¡Configuración multimedia del Hero actualizada con éxito!');
    }

    setSaving(false);
  };

  const previewVideo = pendingVideoUrl || videoUrl;
  const previewPoster = pendingPosterUrl || posterUrl;
  const hasChanges = Boolean(pendingVideoUrl || pendingPosterUrl);

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-100">
      <div className="mx-auto max-w-4xl">
        {/* Cabecera */}
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <Link href="/admin" className="text-xs font-bold text-[#F26522] hover:underline">
              ← Volver al Panel Principal
            </Link>
            <h1 className="mt-2 text-2xl font-black text-white">Configuración Multimedia · Hero</h1>
          </div>
        </div>

        <div className="space-y-8 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Bloque 1: Subir Video */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Video Principal MP4 (Máx 15 MB)
            </label>
            <input
              type="file"
              accept="video/mp4"
              onChange={handleVideoUpload}
              disabled={uploadingVideo || saving}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#F26522]/20 file:px-3 file:py-1 file:text-xs file:font-bold file:text-[#F26522]"
            />
            {uploadingVideo && (
              <p className="mt-2 text-xs font-semibold text-amber-400 animate-pulse">
                ⏳ Subiendo video y extrayendo fotograma WebP de alta velocidad...
              </p>
            )}
          </div>

          {/* Bloque 2: Imagen de Carga Rápida (Poster WebP) */}
          <div className="border-t border-white/10 pt-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Portada Estática de Carga Rápida (Poster WebP)
              </label>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Optimizador WebP Activo
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Esta imagen se muestra instantáneamente antes de que el video empiece a reproducirse, mejorando notablemente la velocidad percibida.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomPosterUpload}
              disabled={uploadingPoster || saving}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-200"
            />
            {uploadingPoster && (
              <p className="mt-2 text-xs font-semibold text-amber-400 animate-pulse">
                ⚡ Comprimiendo imagen y subiendo a servidor...
              </p>
            )}
          </div>

          {/* Previsualización Dual */}
          {(previewVideo || previewPoster) && (
            <div className="border-t border-white/10 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-white">Vista Previa Configurada:</p>
                {hasChanges && (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                    Cambios sin guardar
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Previsualización Video */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-400">Reproductor de Video:</p>
                  {previewVideo ? (
                    <video
                      key={previewVideo}
                      src={previewVideo}
                      poster={previewPoster}
                      controls
                      className="aspect-video w-full rounded-2xl border border-white/10 bg-black object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950 text-xs text-slate-500">
                      Sin video configurado
                    </div>
                  )}
                </div>

                {/* Previsualización Poster WebP */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-400">Portada WebP Estática:</p>
                  {previewPoster ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={previewPoster}
                      alt="Portada Hero"
                      className="aspect-video w-full rounded-2xl border border-white/10 bg-slate-950 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950 text-xs text-slate-500">
                      Sin imagen de portada
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-6">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingVideoUrl('');
                      setPendingPosterUrl('');
                    }}
                    disabled={saving}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
                  >
                    Descartar Cambios
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || saving || uploadingVideo || uploadingPoster}
                  className="rounded-xl bg-[#F26522] px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}