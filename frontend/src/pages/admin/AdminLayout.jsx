import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Ticket, BarChart3, Mail,
  Settings as Cog, LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GymSwordLogo } from "@/components/GymSwordLogo";
import { ADMIN } from "@/constants/testIds";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Cog },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <aside data-testid={ADMIN.sidebar} className="w-64 border-r border-white/10 flex flex-col sticky top-0 self-start h-screen">
        <div className="p-6 border-b border-white/10">
          <Link to="/admin"><GymSwordLogo variant="light" /></Link>
          <div className="text-overline text-white/40 mt-3">Owner Console</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={`admin-nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition ${
                  isActive ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <n.icon size={16} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="px-4 py-2 text-xs text-white/50">{user?.email}</div>
          <Link to="/" className="block px-4 py-2 text-xs text-white/60 hover:text-white luxury-link">View Storefront →</Link>
          <button onClick={async () => { await logout(); navigate("/admin/login"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 md:p-12 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
