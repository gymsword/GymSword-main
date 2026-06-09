import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingBag, Heart, User, Menu, X, Search, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { GymSwordLogo } from "@/components/GymSwordLogo";
import { NAV } from "@/constants/testIds";

const navLinks = [
  { to: "/shop/men", label: "Men", tid: NAV.men },
  { to: "/shop/women", label: "Women", tid: NAV.women },
  { to: "/shop/accessories", label: "Accessories", tid: NAV.accessories },
  { to: "/shop/new", label: "New", tid: "nav-new" },
  { to: "/shop/sale", label: "Sale", tid: "nav-sale" },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { items: wlItems } = useWishlist();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      <div className="bg-black text-white py-2 text-center text-overline overflow-hidden">
        <div className="whitespace-nowrap">
          <span className="px-6">Free shipping on orders over ₹5,000</span>
          <span className="px-6">·</span>
          <span className="px-6">New Arrivals — Forge Collection</span>
          <span className="px-6">·</span>
          <span className="px-6">Use code WELCOME10 for 10% off</span>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-5 flex items-center justify-between gap-4">
       <Link
  to="/"
  data-testid={NAV.logo}
  className="flex items-center shrink-0"
>
  <img
    src="/images/logo.jpeg"
    alt=""
    className="h-8 sm:h-10 md:h-12 w-auto object-contain"
  />
<span className="hidden sm:block text-lg md:text-2xl font-black tracking-[1px] text-black">
  GymSword
</span>
</Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={l.tid}
                className={({ isActive }) =>
                  `luxury-link text-overline text-black/90 hover:text-black ${
                    isActive ? "after:!w-full" : ""
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="/track"
              className="hidden md:inline-flex luxury-link text-overline"
              data-testid="nav-track-order"
            >
              Track Order
            </Link>
            <button className="p-2 hover:opacity-60 transition" aria-label="Search" data-testid={NAV.search}>
              <Search size={18} />
            </button>
            <Link to="/wishlist" className="p-2 hover:opacity-60 transition relative" data-testid={NAV.wishlist}>
              <Heart size={18} />
              {wlItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center">
                  {wlItems.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="p-2 hover:opacity-60 transition relative" data-testid={NAV.cart}>
              <ShoppingBag size={18} />
              {cart.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center">
                  {cart.count}
                </span>
              )}
            </Link>
            {user && user !== false ? (
              <div className="flex items-center gap-2">
                {user.role === "admin" ? (
                  <Link to="/admin" className="p-2 hover:opacity-60 transition" data-testid="nav-admin">
                    <Shield size={18} />
                  </Link>
                ) : (
                  <Link to="/account" className="p-2 hover:opacity-60 transition" data-testid={NAV.account}>
                    <User size={18} />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 hover:opacity-60 transition hidden md:inline-flex"
                  data-testid={NAV.logout}
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex luxury-link text-overline"
                data-testid={NAV.login}
              >
                Sign In
              </Link>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden p-2"
              data-testid={NAV.mobileToggle}
              aria-label="Menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      {open && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998] lg:hidden"
      onClick={() => setOpen(false)}
    />

    {/* Mobile Menu */}
    <div className="fixed top-0 right-0 h-screen w-[85%] max-w-[380px] bg-white shadow-2xl z-[999] lg:hidden overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <GymSwordLogo />

        <button
          onClick={() => setOpen(false)}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* Links */}
      <nav className="flex flex-col px-6 py-6">

        {navLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={() => setOpen(false)}
            data-testid={`${l.tid}-mobile`}
            className="py-4 border-b border-gray-100 text-lg font-semibold uppercase tracking-wider"
          >
            {l.label}
          </NavLink>
        ))}

        <NavLink
          to="/track"
          onClick={() => setOpen(false)}
          className="py-4 border-b border-gray-100 text-lg font-semibold uppercase tracking-wider"
        >
          Track Order
        </NavLink>

        <NavLink
          to="/wishlist"
          onClick={() => setOpen(false)}
          className="py-4 border-b border-gray-100 text-lg font-semibold uppercase tracking-wider"
        >
          Wishlist
        </NavLink>

        <NavLink
          to="/cart"
          onClick={() => setOpen(false)}
          className="py-4 border-b border-gray-100 text-lg font-semibold uppercase tracking-wider"
        >
          Cart ({cart.count})
        </NavLink>

        {!user || user === false ? (
          <NavLink
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-6 bg-black text-white text-center py-4 rounded-full font-semibold"
          >
            Sign In
          </NavLink>
        ) : (
          <>
            {user.role === "admin" ? (
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                className="py-4 border-b border-gray-100 text-lg font-semibold uppercase tracking-wider"
              >
                Admin Dashboard
              </NavLink>
            ) : (
              <NavLink
                to="/account"
                onClick={() => setOpen(false)}
                className="py-4 border-b border-gray-100 text-lg font-semibold uppercase tracking-wider"
              >
                My Account
              </NavLink>
            )}

            <button
              onClick={handleLogout}
              className="mt-6 bg-red-500 text-white py-4 rounded-full font-semibold"
            >
              Sign Out
            </button>
          </>
        )}
      </nav>
    </div>
  </>
)}
      </header>
    </>
  );
}
