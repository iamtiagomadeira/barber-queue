import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string || 'avatars';

        if (!file) {
            return NextResponse.json(
                { error: 'Ficheiro não fornecido' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de ficheiro não suportado. Use JPEG, PNG, WebP ou GIF.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'Ficheiro demasiado grande. Máximo 5MB.' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${randomStr}.${ext}`;
        const filePath = `${folder}/${filename}`;

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Supabase Storage error:', error);
            return NextResponse.json(
                { error: 'Erro ao fazer upload: ' + error.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.path);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: data.path,
        });
    } catch (error) {
        console.error('Error in POST /api/upload:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Remove file from storage
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('path');

        if (!filePath) {
            return NextResponse.json(
                { error: 'Caminho do ficheiro não fornecido' },
                { status: 400 }
            );
        }

        const { error } = await supabase.storage
            .from('avatars')
            .remove([filePath]);

        if (error) {
            console.error('Supabase Storage delete error:', error);
            return NextResponse.json(
                { error: 'Erro ao eliminar ficheiro' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/upload:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
