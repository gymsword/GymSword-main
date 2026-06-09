import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { GymSwordLogo } from "@/components/GymSwordLogo";
import { AUTH } from "@/constants/testIds";

export default function Login() {
  const { login, formatErr } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.from || "/account";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate(next);
    } catch (e) {
      setError(formatErr(e.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-black">
        <img
          src="https://images.pexels.com/photos/17924381/pexels-photo-17924381.jpeg"
          alt=""
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <div className="absolute top-12 left-12">
          <Link to="/"><GymSwordLogo variant="light" /></Link>
        </div>
        <div className="absolute bottom-16 left-12 right-12 text-white">
          <div className="text-overline text-white/60 mb-3">Forge Your Strength</div>
          <h2 className="font-display uppercase font-black text-4xl lg:text-5xl leading-tight">Sign in.<br />Step into the arena.</h2>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="lg:hidden mb-10"><Link to="/"><GymSwordLogo /></Link></div>
          <div className="text-overline text-black/50 mb-3">Account</div>
          <h1 className="font-display uppercase font-black text-4xl sm:text-5xl mb-8">Sign In</h1>
          <div className="space-y-4">
            <Field id={AUTH.emailInput} label="Email" type="email" value={email} onChange={setEmail} />
            <Field id={AUTH.passwordInput} label="Password" type="password" value={password} onChange={setPassword} />
          </div>
          {error && <div data-testid={AUTH.error} className="mt-4 text-sm text-black bg-black/5 p-3 border border-black/10">{error}</div>}
          <button data-testid={AUTH.submit} disabled={loading} className="btn-luxury-primary w-full mt-8">
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <div className="mt-6 flex justify-between text-xs text-black/60">
            <Link to="/forgot-password" data-testid={AUTH.forgotLink} className="luxury-link">Forgot password?</Link>
            <Link to="/register" data-testid={AUTH.switch} className="luxury-link">Create account →</Link>
          </div>
          <div className="mt-12 text-overline text-black/40 text-center">
            Admin? <Link to="/admin/login" className="luxury-link">Sign in here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange }) {
  return (
    <label className="block">
      <div className="text-overline text-black/60 mb-2">{label}</div>
      <input
        data-testid={id}
        type={type}
        required
        className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
