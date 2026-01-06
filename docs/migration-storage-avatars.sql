-- =====================================================
-- MIGRAÇÃO: Storage Bucket para Avatares
-- =====================================================
-- Executar no Supabase SQL Editor APÓS criar o bucket "avatars" no Dashboard

-- Primeiro, criar o bucket manualmente no Supabase Dashboard:
-- Storage → New bucket → "avatars" → Public: ON

-- Depois, executar estas políticas:

-- Política: Upload por utilizadores autenticados
CREATE POLICY "auth_users_can_upload_avatars" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Política: Leitura pública (para mostrar as fotos)
CREATE POLICY "public_can_read_avatars" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política: Utilizadores autenticados podem atualizar os seus ficheiros
CREATE POLICY "auth_users_can_update_avatars" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Política: Utilizadores autenticados podem eliminar ficheiros
CREATE POLICY "auth_users_can_delete_avatars" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
