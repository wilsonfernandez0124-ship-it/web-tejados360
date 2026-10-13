import imageCompression from 'browser-image-compression';

export async function compressAndOptimizeImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.2,            // Límite máximo objetivo: ~200 KB por imagen
    maxWidthOrHeight: 1200,    // Redimensiona dimensiones si superan 1200px
    useWebWorker: true,        // Ejecuta en hilo secundario para no congelar la UI
    fileType: 'image/webp',    // Convierte a formato WebP altamente optimizado
    initialQuality: 0.8        // 80% de calidad (imperceptible para la vista)
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Renombrar extensión a .webp
    const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
    return new File([compressedBlob], fileName, { type: 'image/webp' });
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    return file; // Si falla, retorna el archivo original como fallback
  }
}