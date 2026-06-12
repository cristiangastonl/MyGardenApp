import * as ImageManipulator from 'expo-image-manipulator';

export interface NormalizedImage {
  uri: string;
  base64: string | null;
}

/**
 * Android gallery picks can come back as content:// URIs and/or HEIF-encoded
 * images, both of which <Image> may render as a blank frame even though the
 * raw bytes are valid (PlantNet/Gemini still identify them fine). Re-encoding
 * through expo-image-manipulator yields a file:// JPEG that previews reliably
 * everywhere and uploads smaller. Falls back to the original asset untouched
 * if manipulation fails (unsupported source, low storage, etc.).
 */
export async function normalizePickedImage(asset: {
  uri: string;
  base64?: string | null;
}): Promise<NormalizedImage> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return { uri: result.uri, base64: result.base64 ?? asset.base64 ?? null };
  } catch {
    return { uri: asset.uri, base64: asset.base64 ?? null };
  }
}
