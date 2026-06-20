import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Users, ClipboardList, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/orders", label: "Orders", icon: ClipboardList },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-slate-800 text-white"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2 text-white">
          <Package className="h-6 w-6 text-emerald-400" />
          <span className="text-lg font-semibold tracking-tight">StockFlow</span>
        </NavLink>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClasses}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-200 md:hidden ${
          isOpen ? "max-h-64" : "max-h-0"
        }`}
      >
        <div className="space-y-1 px-4 pb-3">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setIsOpen(false)}
              className={linkClasses}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;