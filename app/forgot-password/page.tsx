"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "email" | "code" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestCode = async (isResend: boolean) => {
    setError("");
    setMessage("");
    if (isResend) setResending(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gagal mengirim kode reset");
        return;
      }

      setStep("code");
      setMessage(
        isResend
          ? "Kode baru telah dikirim. Kode sebelumnya tidak berlaku lagi."
          : data.message,
      );
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void requestCode(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gagal mereset password");
        return;
      }

      setStep("done");
      setMessage(data.message);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BSCampus</h1>
          <p className="text-gray-600">
            Marketplace Mahasiswa Politeknik Negeri Lhokseumawe
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Lupa Password</h2>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
              {message}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Masukkan email terdaftar. Kami akan mengirim kode 6 digit
                  yang berlaku selama 10 menit.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Terdaftar
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="nama@student.pnl.ac.id"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Mengirim..." : "Kirim Kode Reset"}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
                  Kembali ke Login
                </Link>
              </div>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <p className="text-sm text-gray-600">
                Kode dikirim ke <strong>{email}</strong>. Masukkan kode tersebut
                beserta password baru Anda.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode 6 Digit
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  className="w-full px-4 py-2.5 border rounded-lg tracking-[0.4em] text-center text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Baru (min. 8 karakter)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Password baru"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ulangi password baru"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Reset Password"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => void requestCode(true)}
                  disabled={resending || loading}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {resending ? "Mengirim ulang..." : "Kirim ulang kode"}
                </button>
                <Link href="/login" className="text-blue-600 hover:text-blue-800">
                  Kembali ke Login
                </Link>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-5 text-center">
              <p className="text-sm text-gray-600">
                Password Anda sudah diganti. Silakan login memakai password baru.
              </p>
              <Link
                href="/login"
                className="block w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700"
              >
                Ke Halaman Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
