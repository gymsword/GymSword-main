import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const find = async (e) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    try {
      const { data } = await api.get(`/orders/track/${orderNumber.trim()}`);
      setOrder(data);
    } catch (e) {
      setError("Order not found");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="font-display uppercase font-black text-4xl mb-6">Track Order</h1>
        <p className="text-black/60 mb-8 text-sm">Enter your order number (e.g. GS-XXXXXX) to view status.</p>
        <form onSubmit={find} className="flex gap-2">
          <input
            data-testid="track-input"
            className="flex-1 border border-black/20 px-4 py-3 text-sm focus:outline-none focus:border-black"
            placeholder="GS-ABCDE123"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          />
          <button data-testid="track-submit" className="btn-luxury-primary">Track</button>
        </form>
        {error && <div className="mt-6 text-sm text-black/70">{error}</div>}
        {order && (
          <div className="mt-12 border border-black/10 p-6">
            <div className="text-overline">{order.order_number}</div>
            <div className="mt-2 text-2xl font-display uppercase">{order.status}</div>
            <div className="mt-1 text-sm text-black/60">Placed {new Date(order.created_at).toLocaleDateString()}</div>
            <div className="mt-4 space-y-1 text-sm">
              {order.history?.map((h, i) => (
                <div key={i} className="flex justify-between text-black/70">
                  <span>{h.status}</span>
                  <span>{new Date(h.at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
