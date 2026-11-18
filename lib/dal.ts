import { redirect } from "next/navigation";
import { createServerClient } from "./supabase-server";

interface UserRow {
  id: string;
  auth_user_id: string | null;
  student_id: string;
  name: string;
  email: string;
  phone: string;
  campus: string;
  bank_name?: string | null;
  account_number?: string | null;
  account_holder_name?: string | null;
  ewallet_type?: string | null;
  ewallet_number?: string | null;
  payment_method?: string | null;
  payment_proof?: string | null;
  payment_status?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CurrentUser {
  id: string;
  authUserId: string | null;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  campus: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  ewalletType: string | null;
  ewalletNumber: string | null;
  paymentMethod: string | null;
  paymentProof: string | null;
  paymentStatus: string | null;
  createdAt: string;
}

/**
 * Maps an authenticated Supabase Auth identity to the existing public.users row.
 * auth.users.id is only used as a lookup key; public.users.id remains the primary
 * key referenced by every other table.
 */
export function toCurrentUser(user: UserRow): CurrentUser {
  return {
    id: user.id,
    authUserId: user.auth_user_id,
    studentId: user.student_id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    campus: user.campus,
    bankName: user.bank_name ?? null,
    accountNumber: user.account_number ?? null,
    accountHolderName: user.account_holder_name ?? null,
    ewalletType: user.ewallet_type ?? null,
    ewalletNumber: user.ewallet_number ?? null,
    paymentMethod: user.payment_method ?? null,
    paymentProof: user.payment_proof ?? null,
    paymentStatus: user.payment_status ?? null,
    createdAt: user.created_at,
  };
}

/**
 * Verifies (and refreshes, when needed) the Supabase session cookie via
 * getClaims(), then resolves the application user by auth_user_id.
 * Returns null when there is no valid session or no linked user row.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", data.claims.sub)
    .maybeSingle();

  if (userError || !user) return null;
  return toCurrentUser(user);
}

/** For Server Components: redirects to login when there is no valid session. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
