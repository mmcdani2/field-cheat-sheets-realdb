import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { API_BASE, getStoredToken, setStoredToken, type LoginResponse } from "../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@laurelstreetcreative.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = getStoredToken();

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as LoginResponse | { error?: string };

      if (!res.ok) {
        setError("error" in data ? data.error || "Login failed." : "Login failed.");
        return;
      }

      const loginData = data as LoginResponse;
      setStoredToken(loginData.token);
      navigate("/dashboard");
    } catch {
      setError("Could not reach API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      kicker="Urban Admin"
      title="Field Admin"
      subtitle="Sign in to review logs, technician activity, and field submissions."
    >
      <div className="mx-auto max-w-xl">
        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl sm:p-6"
        >
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-16 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-5 text-lg text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-16 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-5 text-lg text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-16 rounded-2xl bg-[#fbbf24] px-5 text-lg font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}