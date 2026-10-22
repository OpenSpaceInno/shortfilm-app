import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, Lock, Mail, MonitorPlay, Shield, UserCheck, Film, Scissors, Clapperboard, PieChart, Coins } from "lucide-react";
import { useAdmin } from "@/lib/admin-state";
import type { AdminRole } from "@/lib/admin-data";

/* ==========================================================================
   ADMIN LOGIN PAGE
   /admin — When not authenticated, show login form with role presets.
   When authenticated, redirect to /admin/dashboard.
   ========================================================================== */

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "ShortReel Admin — Sign In" },
      { name: "description", content: "ShortReel internal administration and content management." },
    ],
  }),
  component: AdminLoginPage,
});

const rolePresets: { role: AdminRole; email: string; title: string; badge: string; icon: typeof Shield }[] = [
  { role: "Super Admin", email: "admin@shortreel.in", title: "Full Platform Executive", badge: "All Modules", icon: Shield },
  { role: "Content Admin", email: "content@shortreel.in", title: "Series & Catalog Operations", badge: "Content & Series", icon: Film },
  { role: "Editor", email: "editor@shortreel.in", title: "Story Branching & Episodes", badge: "Story Studio", icon: Scissors },
  { role: "Creator Manager", email: "creator.manager@shortreel.in", title: "Talent & Submissions", badge: "Creator Ecosystem", icon: Clapperboard },
  { role: "Analyst", email: "analyst@shortreel.in", title: "Telemetry & Intelligence", badge: "Metrics & Reports", icon: PieChart },
  { role: "Finance", email: "finance@shortreel.in", title: "Revenue & Subscriptions", badge: "Monetisation", icon: Coins },
];

function AdminLoginPage() {
  const { isAuthenticated, login } = useAdmin();
  const [selectedRole, setSelectedRole] = useState<AdminRole>("Super Admin");
  const [email, setEmail] = useState("admin@shortreel.in");
  const [password, setPassword] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 400));

    const success = login(email, password, selectedRole);
    if (!success) {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  const handleQuickLogin = (preset: typeof rolePresets[number]) => {
    setSelectedRole(preset.role);
    setEmail(preset.email);
    setPassword("admin");
    setLoading(true);
    setTimeout(() => {
      login(preset.email, "admin", preset.role);
      setLoading(false);
    }, 250);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      <div className="relative w-full max-w-lg space-y-6">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-bold shadow-lg shadow-primary/20">
            SR
          </div>
          <h1 className="mt-3 font-display text-3xl tracking-wider text-foreground font-bold">
            SHORTREEL ADMIN
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Role-Based Content, Talent &amp; Operations Command
          </p>
        </div>

        {/* Quick Role Selection Cards */}
        <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Shield className="size-3.5 text-primary" /> Select Role to Sign In
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Click any role to test its custom dashboard
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {rolePresets.map((preset) => {
              const isSelected = selectedRole === preset.role;
              const Icon = preset.icon;
              return (
                <button
                  type="button"
                  key={preset.role}
                  onClick={() => handleQuickLogin(preset)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                      : "border-border/70 bg-background/50 hover:bg-muted/40 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`grid size-6 place-items-center rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {preset.badge}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-foreground truncate w-full">
                    {preset.role}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full">
                    {preset.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-2xl space-y-4"
        >
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-xs text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <span className="text-[10px] text-primary font-medium">
                Logging in as: <strong>{selectedRole}</strong>
              </span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shortreel.in"
                autoComplete="email"
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-border bg-background pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Remember / Forgot */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-border accent-primary"
              />
              Remember me
            </label>
            <span className="text-[11px] text-muted-foreground">
              Auto-grants <strong>{selectedRole}</strong> access
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl py-3 font-bold text-sm tracking-wide transition-all shadow-lg active:scale-[0.99] ${
              loading
                ? "bg-primary/50 text-primary-foreground cursor-wait"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
            }`}
          >
            {loading ? "AUTHENTICATING..." : `SIGN IN AS ${selectedRole.toUpperCase()}`}
          </button>
        </form>

        {/* Consumer app link */}
        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MonitorPlay className="size-3.5" />
            Back to ShortReel Consumer App
          </a>
        </div>
      </div>
    </div>
  );
}
