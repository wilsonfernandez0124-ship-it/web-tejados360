'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import imageCompression from 'browser-image-compression';
import { Upload, RefreshCw, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* FUNCIÓN DE COMPRESIÓN CLIENT-SIDE CON BROWSER-IMAGE-COMPRESSION    */
/* ------------------------------------------------------------------ */
export async function compressAndOptimizeImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.2,            // Límite objetivo: ~200 KB
    maxWidthOrHeight: 1200,    // Máximo 1200px
    useWebWorker: true,        // Web Worker en hilo secundario
    fileType: 'image/webp',    // Formato WebP
    initialQuality: 0.8        // 80% calidad
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

export default function AdminImagesManager() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [externalUrlInput, setExternalUrlInput] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_images')
        .select('*')
        .order('section_name');
      
      if (data) setImages(data);
      if (error) console.error('Error al obtener imágenes:', error);
    } catch (err) {
      console.error('Error de conexión:', err);
    } finally {
      setLoading(false);
    }
  }

  // Manejador de subida optimizada
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, id: string) {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setUploadingId(id);
    setMsg('');

    try {
      // 1. Comprimir y convertir a WebP (~100-200 KB)
      const optimizedFile = await compressAndOptimizeImage(originalFile);
      
      const fileName = `${id}-${Date.now()}.webp`;
      const filePath = `sections/${fileName}`;

      // 2. Subir el archivo WebP a Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('site-assets')
        .upload(filePath, optimizedFile, {
          contentType: 'image/webp',
          cacheControl: '36000',
          upsert: true
        });

      if (uploadErr) throw uploadErr;

      // 3. Obtener la URL pública del archivo subido
      const { data: publicUrlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // 4. Actualizar en la base de datos Supabase
      await updateImageUrlInDB(id, publicUrl);
    } catch (err: any) {
      alert(`Error al procesar la imagen: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  }

  // Vincular URL Externa ($0 consumo)
  async function handleSaveExternalUrl(id: string) {
    const url = externalUrlInput[id];
    if (!url || !url.trim().startsWith('http')) {
      alert('Ingresa una URL válida que empiece con http:// o https://');
      return;
    }

    setUploadingId(id);
    try {
      await updateImageUrlInDB(id, url.trim());
      setExternalUrlInput((prev) => ({ ...prev, [id]: '' }));
    } catch (err: any) {
      alert(`Error al guardar la URL: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  }

  async function updateImageUrlInDB(id: string, url: string) {
    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from('site_images')
      .update({ image_url: url, updated_at: updatedAt })
      .eq('id', id);

    if (error) throw error;

    // Actualización inmediata en el estado local (React UI) sin esperar a recargar
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, image_url: url, updated_at: updatedAt } : img))
    );

    setMsg(`¡Imagen "${id}" actualizada con éxito!`);
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium">Cargando gestor optimizado...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0A2540]">Gestor de Imágenes de la Web</h1>
          <p className="text-xs text-slate-500">
            Compresión automática a <b>WebP (~150 KB)</b> mediante Web Worker para mantener el plan gratuito de Supabase.
          </p>
        </div>
        {msg && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 animate-in fade-in">
            {msg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((img) => (
          <div key={img.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522] bg-[#F26522]/10 px-2.5 py-0.5 rounded-full">
                  ID: {img.id}
                </span>
                <h3 className="text-base font-bold text-[#0A2540] mt-1">{img.section_name}</h3>
              </div>
              <span className="text-[10px] text-slate-400">
                {img.updated_at ? new Date(img.updated_at).toLocaleDateString() : ''}
              </span>
            </div>

            <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
              <img
                src={img.image_url}
                alt={img.alt_text || img.section_name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback si la URL guardada no carga o está rota
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop';
                }}
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#0A2540] hover:bg-[#F26522] text-white px-4 py-2 text-xs font-bold transition">
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
                  placeholder="O pega URL externa (Unsplash, Imgur...)"
                  value={externalUrlInput[img.id] || ''}
                  onChange={(e) => setExternalUrlInput({ ...externalUrlInput, [img.id]: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F26522]"
                />
                <button
                  onClick={() => handleSaveExternalUrl(img.id)}
                  disabled={uploadingId === img.id}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition flex items-center gap-1"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Vincular</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}