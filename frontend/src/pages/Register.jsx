import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { GymSwordLogo } from "@/components/GymSwordLogo";
import { AUTH } from "@/constants/testIds";
import { useSearchParams } from "react-router-dom";
export default function Register() {
  const { register, formatErr } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
const [searchParams] = useSearchParams();

const [referralCode, setReferralCode] = useState(
  searchParams.get("ref") || ""
);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password,referralCode );
      toast.success("Welcome to GymSword");
      navigate("/account");
    } catch (e) {
      setError(formatErr(e.response?.data?.detail) || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-12 order-2 lg:order-1">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="lg:hidden mb-10"><Link to="/"><GymSwordLogo /></Link></div>
          <div className="text-overline text-black/50 mb-3">Join the inner circle</div>
          <h1 className="font-display uppercase font-black text-4xl sm:text-5xl mb-8">Create Account</h1>
          <div className="space-y-4">
            <Field id={AUTH.nameInput} label="Full Name" value={name} onChange={setName} />
            <Field id={AUTH.emailInput} label="Email" type="email" value={email} onChange={setEmail} />
            <Field id={AUTH.passwordInput} label="Password" type="password" value={password} onChange={setPassword} />
         <Field
  label="Referral Code (Optional)"
  value={referralCode}
  onChange={setReferralCode}
  required={false}
/>
          </div>
          {error && <div data-testid={AUTH.error} className="mt-4 text-sm text-black bg-black/5 p-3 border border-black/10">{error}</div>}
          <button data-testid={AUTH.submit} disabled={loading} className="btn-luxury-primary w-full mt-8">
            {loading ? "Creating…" : "Create Account"}
          </button>
          <div className="mt-6 text-xs text-black/60 text-right">
            <Link to="/login" data-testid={AUTH.switch} className="luxury-link">Already a member? Sign in →</Link>
          </div>
        </form>
      </div>
      <div className="hidden lg:block relative bg-black order-1 lg:order-2">
        <img
          src="https://images.unsplash.com/photo-1548690312-e3b507d8c110?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt=""
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <div className="absolute top-12 left-12">
          <Link to="/"><GymSwordLogo variant="light" /></Link>
        </div>
        <div className="absolute bottom-16 left-12 right-12 text-white">
          <div className="text-overline text-white/60 mb-3">Membership</div>
          <h2 className="font-display uppercase font-black text-4xl lg:text-5xl leading-tight">The relentless<br />belong together.</h2>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = true,
}) {
  return (
    <label className="block">
      <div className="text-overline text-black/60 mb-2">
        {label}
      </div>

      <input
        data-testid={id}
        type={type}
        required={required}
        className="w-full bg-white border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
