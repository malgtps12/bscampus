"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, Loader } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim() || !password) {
      setError("Username dan password harus diisi");
      setLoading(false);
      return;
    }

    if (username.length > 100 || password.length > 100) {
      setError("Input terlalu panjang");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      if (response.status === 429) {
        setError("Terlalu banyak percobaan login. Coba lagi dalam 15 menit.");
        setAttempts((prev) => prev + 1);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Username atau password salah");
        setAttempts((prev) => prev + 1);
        setLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem("admin_token", data.token);
      
      router.push("/admin/transactions");
    } catch (error) {
      console.error("Login error:", error);
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 dark:bg-slate-900">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
              BC
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">BSCampus Admin</h1>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
            Login untuk mengelola produk
          </p>

          {error && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 text-sm ${
              error.includes("berhasil") 
                ? "bg-green-100 border border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
                : "bg-red-100 border border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200"
            }`}>
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {attempts > 0 && attempts < 3 && (
            <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-sm dark:bg-amber-900 dark:border-amber-700 dark:text-amber-200">
              Percobaan gagal: {attempts}/5
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={100}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={100}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || attempts >= 5}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Login
                </>
              )}
            </button>
          </form>

          {attempts >= 5 && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm text-center dark:bg-red-900 dark:border-red-700 dark:text-red-200">
              Akun terkunci. Coba lagi dalam 15 menit.
            </div>
          )}

          <div className="mt-6 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-xs text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">🔒 Keamanan Berlapis:</p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Rate limiting (5 percobaan/15 menit)</li>
              <li>Input validation & SQL injection protection</li>
              <li>Secure JWT tokens (httpOnly cookies)</li>
              <li>CSRF protection</li>
              <li>IP logging & monitoring</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
