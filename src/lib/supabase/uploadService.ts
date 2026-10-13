import { createClient } from '@/lib/supabase/client'; // Ajusta la importación según cómo exportas client.ts
import { compressAndOptimizeImage } from '@/lib/supabase/compressImage';

export async function uploadOptimizedImage(file: File, bucketName: string = 'services-images') {
  // 1. Obtener la instancia del cliente Supabase
  const supabase = createClient();

  // 2. Comprimir la imagen en el navegador a WebP
  const optimizedFile = await compressAndOptimizeImage(file);

  // 3. Generar un nombre único para evitar colisiones
  const fileExt = 'webp';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  // 4. Subir la imagen optimizada al Storage de Supabase
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, optimizedFile, {
      cacheControl: '3600000', // Caché por 1 año en CDN/Navegador para no volver a descargar
      upsert: false,
      contentType: 'image/webp'
    });

  if (error) {
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }

  // 5. Obtener y retornar la URL pública
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}