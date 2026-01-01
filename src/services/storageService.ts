import { supabase } from './supabase';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const uploadImage = async (
    bucket: string,
    folder: string,
    uri: string
): Promise<{ url: string | null; error: string | null }> => {
    try {
        // 1. Read file as Base64
        const base64 = await readAsStringAsync(uri, {
            encoding: 'base64',
        });

        // 2. Convert to ArrayBuffer
        const fileData = decode(base64);

        // 3. Generate path and metadata
        const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${folder}/${fileName}`;
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

        // 4. Upload to Supabase
        const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileData, {
                contentType: contentType,
                upsert: false,
            });

        if (error) {
            return { url: null, error: error.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { url: publicUrl, error: null };
    } catch (error: any) {
        return { url: null, error: error.message || 'An unexpected error occurred during upload' };
    }
};
