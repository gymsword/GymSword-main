import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { GymSwordLogo } from "@/components/GymSwordLogo";
import { AUTH } from "@/constants/testIds";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setDone(true);
      if (data.dev_reset_token) setDevToken(data.dev_reset_token);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-10"><Link to="/"><GymSwordLogo /></Link></div>
        <h1 className="font-display uppercase font-black text-3xl mb-3">Forgot Password</h1>
        <p className="text-black/60 text-sm mb-8">Enter your email and we will send a reset link.</p>
        {!done ? (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <div className="text-overline text-black/60 mb-2">Email</div>
              <input
                data-testid={AUTH.emailInput}
                type="email"
                required
                className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button data-testid={AUTH.submit} disabled={loading} className="btn-luxury-primary w-full">
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="p-6 border border-black/10">
            <div className="text-overline mb-3">Check your email</div>
            <p className="text-sm text-black/60">If an account exists, a reset link has been sent.</p>
            {devToken && (
              <div className="mt-6 text-xs">
                <div className="text-overline mb-2">Dev token (this environment)</div>
                <Link to={`/reset-password?token=${devToken}`} className="luxury-link break-all">
                  Reset now →
                </Link>
              </div>
            )}
          </div>
        )}
        <div className="mt-8 text-center text-xs">
          <Link to="/login" className="luxury-link text-overline">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const token = params.get("token") || "";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      toast.success("Password updated. Please sign in.");
      navigate("/login");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-10"><Link to="/"><GymSwordLogo /></Link></div>
        <h1 className="font-display uppercase font-black text-3xl mb-8">Reset Password</h1>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <div className="text-overline text-black/60 mb-2">New Password</div>
            <input
              data-testid={AUTH.passwordInput}
              type="password"
              required
              minLength={6}
              className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button data-testid={AUTH.resetSubmit} disabled={loading || !token} className="btn-luxury-primary w-full">
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
