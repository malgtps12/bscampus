import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/dal";

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Products GET] Error:", error.message);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Products GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu untuk menjual produk" },
        { status: 401 }
      )
    }

    const body = await request.json();

    if (!body.title || !body.price) {
      return NextResponse.json(
        { error: "Data tidak lengkap: title dan price wajib diisi" },
        { status: 400 }
      );
    }

    const price = Number.parseInt(String(body.price), 10);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Harga tidak valid" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Identitas penjual diambil dari sesi Auth, bukan dari body request.
    const productData = {
      title: body.title,
      description: body.description || "",
      price,
      category: body.category || "lainnya",
      condition: body.condition || "bekas",
      seller_name: currentUser.name,
      seller_student_id: currentUser.studentId,
      seller_contact: currentUser.phone || "",
      images: body.images || [],
    };

    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select();

    if (error) {
      console.error("[Products POST] Insert error:", error.message);
      return NextResponse.json(
        { error: "Gagal menyimpan produk. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("[Products POST] Error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
