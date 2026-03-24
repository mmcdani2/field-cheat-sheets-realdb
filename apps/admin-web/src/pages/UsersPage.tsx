import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUserStatus,
  type AdminUser,
} from "../lib/users";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [passwordBusyId, setPasswordBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "tech">("tech");

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const rows = await listUsers();
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createUser({
        fullName,
        email,
        password,
        role,
      });

      setFullName("");
      setEmail("");
      setPassword("");
      setRole("tech");
      setSuccess("User created successfully.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(user: AdminUser) {
    try {
      setStatusBusyId(user.id);
      setError("");
      setSuccess("");

      const updated = await updateUserStatus(user.id, !user.isActive);

      setUsers((current) =>
        current.map((row) => (row.id === updated.id ? updated : row))
      );

      setSuccess(
        updated.isActive
          ? `${updated.fullName} reactivated.`
          : `${updated.fullName} deactivated.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user status."
      );
    } finally {
      setStatusBusyId(null);
    }
  }

  function openResetModal(user: AdminUser) {
    setResetTarget(user);
    setResetPasswordValue("");
    setError("");
    setSuccess("");
  }

  function closeResetModal() {
    if (passwordBusyId) return;
    setResetTarget(null);
    setResetPasswordValue("");
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!resetTarget) return;

    const trimmed = resetPasswordValue.trim();

    if (trimmed.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      setSuccess("");
      return;
    }

    try {
      setPasswordBusyId(resetTarget.id);
      setError("");
      setSuccess("");

      await resetUserPassword(resetTarget.id, trimmed);

      setSuccess(`${resetTarget.fullName}'s password was reset.`);
      setResetTarget(null);
      setResetPasswordValue("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password."
      );
    } finally {
      setPasswordBusyId(null);
    }
  }

  return (
    <Layout
      kicker="BossOS"
      title="Users"
      subtitle="Manage internal user access for admin and field workflows."
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
            {success}
          </div>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400/80">
                Access Management
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Create User</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Add a new internal user with a temporary password and the correct access role.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-orange-400/60"
                placeholder="John Smith"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-orange-400/60"
                placeholder="john@company.com"
                type="email"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                Temporary Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-orange-400/60"
                placeholder="Minimum 8 characters"
                type="password"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "tech")}
                className="h-12 rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-white outline-none transition focus:border-orange-400/60"
              >
                <option value="tech">Tech</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/50">
                New users can sign in immediately using the temporary password you set here.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-bold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400/80">
                Directory
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Current Users</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                View account status, reactivate inactive users, and reset temporary passwords.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadUsers()}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/70">
              Loading users...
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-black/30 text-left text-white/55">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-[#141414]">
                    {users.map((user) => {
                      const busyStatus = statusBusyId === user.id;
                      const busyPassword = passwordBusyId === user.id;

                      return (
                        <tr key={user.id} className="align-top">
                          <td className="px-4 py-4">
                            <div className="font-medium text-white">{user.fullName}</div>
                            <div className="mt-1 text-sm text-white/55">{user.email}</div>
                          </td>
                          <td className="px-4 py-4 text-white/75">{user.role}</td>
                          <td className="px-4 py-4">
                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                user.isActive
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-white/10 text-white/60",
                              ].join(" ")}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                disabled={busyStatus || busyPassword}
                                onClick={() => openResetModal(user)}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busyPassword ? "Resetting..." : "Reset Password"}
                              </button>

                              <button
                                type="button"
                                disabled={busyStatus || busyPassword}
                                onClick={() => void handleToggleStatus(user)}
                                className={[
                                  "inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                                  user.isActive
                                    ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                                    : "bg-orange-500 text-black hover:brightness-105",
                                ].join(" ")}
                              >
                                {busyStatus
                                  ? "Updating..."
                                  : user.isActive
                                    ? "Deactivate"
                                    : "Reactivate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                          No users found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close reset password modal"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={closeResetModal}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#171717] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)] sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400/80">
                Password Reset
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">Reset Password</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Set a new temporary password for <span className="font-medium text-white">{resetTarget.fullName}</span>.
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                  Temporary Password
                </label>
                <input
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="h-12 rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-orange-400/60"
                  placeholder="Minimum 8 characters"
                  type="password"
                  autoFocus
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeResetModal}
                  disabled={!!passwordBusyId}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!!passwordBusyId}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-orange-500 px-4 text-sm font-bold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {passwordBusyId ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
