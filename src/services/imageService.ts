import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { readAsStringAsync } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'plant-images';

/**
 * Sube una imagen a Supabase Storage
 * @param imageUri URI local de la imagen (file://) o base64
 * @param plantId ID de la planta (para nombrar el archivo)
 * @returns URL pública de la imagen o null si falla
 */
export async function uploadPlantImage(
  imageUri: string,
  plantId: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.log('[ImageService] Supabase no configurado, no se puede subir imagen');
    return null;
  }

  try {
    let base64Data: string;

    // Si es una URI de archivo, leer como base64
    if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
      const base64 = await readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      base64Data = base64;
    } else if (imageUri.startsWith('data:image')) {
      // Si ya es data URL, extraer el base64
      base64Data = imageUri.split(',')[1];
    } else {
      // Asumir que ya es base64 puro
      base64Data = imageUri;
    }

    // Nombre único para el archivo
    const fileName = `${plantId}_${Date.now()}.jpg`;
    const filePath = `plants/${fileName}`;

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('[ImageService] Error uploading:', error);
      return null;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('[ImageService] Imagen subida:', urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error('[ImageService] Error:', error);
    return null;
  }
}

/**
 * Elimina una imagen de Supabase Storage
 * @param imageUrl URL completa de la imagen
 */
export async function deletePlantImage(imageUrl: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !imageUrl) {
    return false;
  }

  try {
    // Extraer el path del archivo de la URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/plant-images\/(.+)/);
    if (!pathMatch) {
      console.warn('[ImageService] No se pudo extraer path de:', imageUrl);
      return false;
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('[ImageService] Error deleting:', error);
      return false;
    }

    console.log('[ImageService] Imagen eliminada:', filePath);
    return true;

  } catch (error) {
    console.error('[ImageService] Error:', error);
    return false;
  }
}
