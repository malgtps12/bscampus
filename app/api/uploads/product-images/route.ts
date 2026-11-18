import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { uploadProductImages } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Upload gambar produk - hanya user dengan session Supabase Auth. */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Anda harus login untuk mengunggah gambar" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => typeof File !== "undefined" && value instanceof File && value.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "Minimal satu gambar diperlukan" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_FILES} gambar per produk` },
        { status: 400 },
      );
    }

    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      return NextResponse.json(
        { error: "Ukuran setiap gambar maksimal 5 MB" },
        { status: 400 },
      );
    }

    const urls = await uploadProductImages(files, currentUser.id);
    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah gambar. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
