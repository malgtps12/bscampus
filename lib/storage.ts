import { createClient } from "./supabase-server";

/**
 * Upload gambar produk menggunakan session Supabase Auth.
 * ownerId HARUS berasal dari DAL (public.users.id), bukan dari body request.
 * Path: products/<public.users.id>/<random>.<ext>
 */
export async function uploadProductImages(
  files: File[],
  ownerId: string,
): Promise<string[]> {
  if (!ownerId) throw new Error("Owner id wajib diisi");
  if (files.length === 0) return [];

  const supabase = await createClient();
  const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

  return Promise.all(
    files.map(async (file) => {
      const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const ext = allowedExtensions.has(rawExt) ? rawExt : "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `products/${ownerId}/${fileName}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("[Storage] Upload error:", error.message);
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      return publicUrl;
    }),
  );
}

/** Hapus gambar hanya bila path berada di folder owner yang diberikan. */
export async function deleteProductImage(url: string, ownerId: string): Promise<void> {
  const path = url.split("/product-images/")[1];
  if (!path || !ownerId || !path.startsWith(`products/${ownerId}/`)) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from("product-images").remove([path]);
  if (error) console.error("[Storage] Delete error:", error.message);
}
