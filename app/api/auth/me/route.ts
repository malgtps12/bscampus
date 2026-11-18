import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";

export const runtime = "nodejs";

export async function GET() {
  try {
    const current = await getCurrentUser();

    if (!current) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: current.id,
        authUserId: current.authUserId,
        name: current.name,
        studentId: current.studentId,
        email: current.email,
        phone: current.phone,
        campus: current.campus,
        bankName: current.bankName,
        accountNumber: current.accountNumber,
        accountHolderName: current.accountHolderName,
        ewalletType: current.ewalletType,
        ewalletNumber: current.ewalletNumber,
        createdAt: current.createdAt,
      },
    });
  } catch (error) {
    console.error("[Auth Me] Error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
