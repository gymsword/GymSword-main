import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ADMIN } from "@/constants/testIds";

const EMPTY = { code: "", discount_type: "percent", discount_value: 10, min_subtotal: 0, is_active: true, max_uses: null };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/admin/coupons").then(({ data }) => setCoupons(data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/coupons", form);
      toast.success("Coupon created");
      setForm(EMPTY);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-overline text-white/50">Promotions</div>
        <h1 className="font-display uppercase font-black text-4xl mt-2">Coupons</h1>
      </div>
      <form onSubmit={create} className="bg-white/5 border border-white/10 p-6 grid sm:grid-cols-5 gap-4 items-end">
        <F label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v.toUpperCase() })} />
        <SelectF label="Type" value={form.discount_type} onChange={(v) => setForm({ ...form, discount_type: v })} options={[{v:"percent",l:"%"},{v:"fixed",l:"$"}]} />
        <F label="Value" type="number" value={form.discount_value} onChange={(v) => setForm({ ...form, discount_value: parseFloat(v) })} />
        <F label="Min Subtotal" type="number" value={form.min_subtotal} onChange={(v) => setForm({ ...form, min_subtotal: parseFloat(v) })} />
        <button data-testid={ADMIN.couponCreate} className="btn-luxury-light"><Plus size={14} className="mr-2" />Create</button>
      </form>
      <div className="bg-white/5 border border-white/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="text-overline text-white/40 border-b border-white/10">
            <tr><th className="text-left p-4">Code</th><th className="text-left">Type</th><th className="text-left">Value</th><th className="text-left">Min</th><th className="text-left">Uses</th><th className="text-left">Active</th><th></th></tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="p-4 font-mono-display">{c.code}</td>
                <td>{c.discount_type}</td>
                <td>{c.discount_value}{c.discount_type === "percent" ? "%" : "₹"}</td>
                <td>₹{c.min_subtotal}</td>
                <td>{c.uses}</td>
                <td>{c.is_active ? "Yes" : "No"}</td>
                <td className="text-right pr-4">
                  <button onClick={async () => { await api.delete(`/admin/coupons/${c.id}`); load(); }} className="p-2 hover:bg-white/10"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <div className="text-overline text-white/50 mb-2">{label}</div>
      <input type={type} required value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-white text-white" />
    </label>
  );
}
function SelectF({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="text-overline text-white/50 mb-2">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#111] border border-white/20 px-4 py-3 text-sm focus:outline-none focus:border-white text-white">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
