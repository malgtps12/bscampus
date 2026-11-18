import { redirect } from "next/navigation";

/**
 * Alur lama memakai email Supabase Auth sudah tidak dipakai.
 * Bookmark/link lama diarahkan ke halaman reset kode 6 digit.
 */
export default function UpdatePasswordPage() {
  redirect("/forgot-password");
}
