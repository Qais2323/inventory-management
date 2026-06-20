import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Users, ClipboardList, AlertTriangle } from "lucide-react";
import api from "../services/api";

const STAT_CONFIG = [
  {
    key: "total_products",
    label: "Total Products",
    icon: Package,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    border: "border-l-blue-500",
  },
  {
    key: "total_customers",
    label: "Total Customers",
    icon: Users,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    border: "border-l-emerald-500",
  },
  {
    key: "total_orders",
    label: "Total Orders",
    icon: ClipboardList,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    border: "border-l-violet-500",
  },
  {
    key: "low_stock_products",
    label: "Low Stock Items",
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    border: "border-l-red-500",
  },
];

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border-l-4 border-l-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
      </div>
      <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/dashboard/")
      .then((res) => {
        if (isMounted) setData(res.data);
      })
      .catch(() => {
        if (isMounted) setError("Couldn't load dashboard data. Please try again.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      {/* Header banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-medium text-slate-300">{today}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Welcome 👋</h1>
        <p className="mt-2 max-w-md text-sm text-slate-300">
          Here's what's happening with your inventory today.
        </p>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : !error &&
            STAT_CONFIG.map(({ key, label, icon: Icon, iconBg, iconColor, border }) => (
              <div
                key={key}
                className={`rounded-xl border-l-4 ${border} bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-500">{label}</h3>
                  <span className={`rounded-lg p-2.5 ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {data?.[key] ?? 0}
                </p>
              </div>
            ))}
      </div>

      {/* Low stock alert banner */}
      {!loading && !error && data?.low_stock_products > 0 && (
        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-amber-100 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {data.low_stock_products} product{data.low_stock_products > 1 ? "s" : ""} running low on stock
              </p>
              <p className="text-xs text-amber-700">Review inventory to avoid stockouts</p>
            </div>
          </div>
          <Link
            to="/products"
            className="self-start rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 sm:self-auto"
          >
            View Products
          </Link>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
