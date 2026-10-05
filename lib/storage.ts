import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadProductImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  });

  return Promise.all(uploadPromises);
}

export async function deleteProductImage(url: string): Promise<void> {
  try {
    const path = url.split('/product-images/')[1];
    if (path) {
      await supabase.storage.from('product-images').remove([path]);
    }
  } catch (error) {
    console.error('Delete error:', error);
  }
}
