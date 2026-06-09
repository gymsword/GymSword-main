import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/currency";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { api.get("/admin/customers").then(({ data }) => setCustomers(data)); }, []);
  return (
    <div className="space-y-8">
      <div>
        <div className="text-overline text-white/50">Community</div>
        <h1 className="font-display uppercase font-black text-4xl mt-2">Customers</h1>
      </div>
      <div className="bg-white/5 border border-white/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="text-overline text-white/40 border-b border-white/10">
            <tr><th className="text-left p-4">Name</th><th className="text-left">Email</th><th className="text-left">Orders</th><th className="text-left">Spent</th><th className="text-left">Joined</th></tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4">{c.name || "—"}</td>
                <td className="text-white/70">{c.email}</td>
                <td>{c.order_count}</td>
                <td>{formatPrice(c.total_spent)}</td>
                <td className="text-white/60">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
