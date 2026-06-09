import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";

const STATUSES = ["confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [active, setActive] = useState(null);

  const load = () => api.get("/admin/orders").then(({ data }) => setOrders(data));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      toast.success("Order updated");
      load();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="text-overline text-white/50">Fulfillment</div>
        <h1 className="font-display uppercase font-black text-4xl mt-2">Orders</h1>
      </div>
      <div className="bg-white/5 border border-white/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="text-overline text-white/40 border-b border-white/10">
            <tr>
              <th className="text-left p-4">Order</th><th className="text-left">Customer</th>
              <th className="text-left">Items</th><th className="text-left">Total</th>
              <th className="text-left">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 font-mono-display">{o.order_number}</td>
                <td className="text-white/70">{o.user_email}</td>
                <td>{o.items.length}</td>
                <td className="font-medium">{formatPrice(o.total)}</td>
                <td>
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="bg-[#111] border border-white/20 px-3 py-1 text-overline text-white">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="text-right pr-4">
                  <button onClick={() => setActive(o)} className="text-overline luxury-link text-white/70">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {active && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-[#111] border border-white/10 w-full max-w-2xl p-8 my-12">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-overline text-white/50">{active.order_number}</div>
                <div className="font-display text-2xl uppercase">{active.user_email}</div>
                <div className="text-xs text-white/40 mt-1">{new Date(active.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => setActive(null)} className="text-overline luxury-link">Close</button>
            </div>
            <div className="space-y-3">
              {active.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span>{it.name} × {it.qty}</span>
                  <span>{formatPrice(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-2 text-sm">
              <div className="text-white/60">Subtotal</div><div className="text-right">{formatPrice(active.subtotal)}</div>
              <div className="text-white/60">Discount</div><div className="text-right">-{formatPrice(active.discount)}</div>
              <div className="text-white/60">Shipping</div><div className="text-right">{formatPrice(active.shipping)}</div>
              <div className="text-white/60">GST</div><div className="text-right">{formatPrice(active.tax)}</div>
              <div className="font-display text-lg uppercase">Total</div><div className="text-right font-display text-lg">{formatPrice(active.total)}</div>
            </div>
            <div className="mt-6 text-sm text-white/70">
              <div className="text-overline text-white/50 mb-2">Shipping To</div>
              {active.address.full_name}<br />
              {active.address.line1}, {active.address.city}, {active.address.state} {active.address.postal_code}, {active.address.country}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
