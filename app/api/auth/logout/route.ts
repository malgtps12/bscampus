import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[Logout] signOut error:", error.message);
  }

  const response = NextResponse.json({ success: true });

  // Cookie JWT lama (user) dan admin tetap dibersihkan.
  response.cookies.set({ name: "user_token", value: "", path: "/", maxAge: 0 });
  response.cookies.set({ name: "admin_token", value: "", path: "/", maxAge: 0 });

  return response;
}
