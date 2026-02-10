-- ============================================================================
-- Storage Setup: Bucket para fotos de plantas
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================================

-- Crear bucket público para imágenes de plantas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plant-images',
  'plant-images',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Cualquiera puede ver imágenes (bucket público)
CREATE POLICY "Public read access for plant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-images');

-- Política: Usuarios autenticados pueden subir imágenes
CREATE POLICY "Authenticated users can upload plant images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plant-images');

-- Política: Usuarios autenticados pueden actualizar sus imágenes
CREATE POLICY "Authenticated users can update plant images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'plant-images');

-- Política: Usuarios autenticados pueden eliminar imágenes
CREATE POLICY "Authenticated users can delete plant images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'plant-images');

-- Nota: También se puede crear el bucket desde el Dashboard:
-- 1. Ir a Storage en el sidebar
-- 2. Click "New bucket"
-- 3. Nombre: plant-images
-- 4. Marcar "Public bucket"
-- 5. Guardar
