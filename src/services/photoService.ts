import { Paths, File, Directory } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { PlantPhoto } from '../types';

const PHOTOS_DIR_NAME = 'plant-photos';

function getPlantDir(plantId: string): string {
  return `${Paths.document.uri}${PHOTOS_DIR_NAME}/${plantId}/`;
}

async function ensureDir(dirUri: string): Promise<void> {
  // Ensure parent directory (plant-photos/) exists first
  const parentUri = `${Paths.document.uri}${PHOTOS_DIR_NAME}/`;
  const parentDir = new Directory(parentUri);
  try {
    if (!parentDir.exists) {
      parentDir.create();
    }
  } catch {
    // May already exist from a race condition
  }

  // Then ensure the plant-specific subdirectory
  const dir = new Directory(dirUri);
  try {
    if (!dir.exists) {
      dir.create();
    }
  } catch {
    // May already exist from a race condition
  }
}

async function resizeImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function pickPhoto(source: 'camera' | 'gallery'): Promise<string | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  } else {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }
}

export async function savePhoto(plantId: string, imageUri: string): Promise<PlantPhoto> {
  const dir = getPlantDir(plantId);
  await ensureDir(dir);

  // Resize to max 1200px wide, JPEG 0.8
  const resizedUri = await resizeImage(imageUri);

  const id = Date.now().toString();
  const destUri = `${dir}${id}.jpg`;

  const source = new File(resizedUri);
  source.copy(new File(destUri));

  return {
    id,
    uri: destUri,
    date: new Date().toISOString(),
  };
}

export async function deletePhoto(plantId: string, photoId: string): Promise<void> {
  const filePath = `${getPlantDir(plantId)}${photoId}.jpg`;
  const file = new File(filePath);
  if (file.exists) {
    file.delete();
  }
}

export async function deleteAllPhotos(plantId: string): Promise<void> {
  const dir = new Directory(getPlantDir(plantId));
  if (dir.exists) {
    dir.delete();
  }
}
