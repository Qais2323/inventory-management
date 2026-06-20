import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Users,
  Mail,
  Phone,
} from "lucide-react";
import api from "../services/api";

const EMPTY_FORM = { full_name: "", email: "", phone: "" };

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers/");
      setCustomers(res.data);
    } catch {
      showNotification("error", "Couldn't load customers. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;

    if (!form.full_name.trim()) {
      errors.full_name = "Full name is required";
    } else if (form.full_name.trim().length < 2) {
      errors.full_name = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!phoneRegex.test(form.phone.trim())) {
      errors.phone = "Enter a valid phone number";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addCustomer = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      };

      await api.post("/customers/", payload);
      showNotification("success", "Customer added successfully");
      resetForm();
      fetchCustomers();
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 409) {
        setFieldErrors((prev) => ({ ...prev, email: detail || "This email is already registered" }));
        showNotification("error", detail || "A customer with this email already exists");
      } else if (status === 422 || status === 400) {
        showNotification("error", detail || "Please check the form and try again");
      } else {
        showNotification("error", "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCustomer = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this customer?");
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      await api.delete(`/customers/${id}`);
      showNotification("success", "Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      const detail = error.response?.data?.detail;
      showNotification("error", detail || "Error deleting customer");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase())
  );

  const inputClasses = (field) =>
    `w-full rounded-lg border p-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
      fieldErrors[field]
        ? "border-red-300 focus:border-red-400"
        : "border-slate-300 focus:border-blue-400"
    }`;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your customer records</p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {notification.message}
        </div>
      )}

      {/* Stat card */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total Customers</h3>
            <span className="rounded-lg bg-emerald-100 p-2.5">
              <Users className="h-5 w-5 text-emerald-600" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{customers.length}</p>
        </div>
      </div>

      {/* Add Customer form */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Add New Customer</h2>

        <form onSubmit={addCustomer} className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <input
                type="text"
                name="full_name"
                placeholder="Full name"
                value={form.full_name}
                onChange={handleChange}
                className={inputClasses("full_name")}
              />
              {fieldErrors.full_name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                className={inputClasses("email")}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                name="phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={handleChange}
                className={inputClasses("phone")}
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!submitting && <Plus className="h-4 w-4" />}
            {submitting ? "Adding..." : "Add Customer"}
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 p-3 pl-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white shadow-sm" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredCustomers.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm">
          <Users className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            {search ? "No customers match your search" : "No customers yet"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {search ? "Try a different name or email" : "Add your first customer using the form above"}
          </p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && filteredCustomers.length > 0 && (
        <div className="mt-6 hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Full Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{customer.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{customer.email}</td>
                  <td className="px-4 py-3 text-slate-500">{customer.phone}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteCustomer(customer.id)}
                      disabled={deletingId === customer.id}
                      className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Delete customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && filteredCustomers.length > 0 && (
        <div className="mt-6 space-y-3 md:hidden">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900">{customer.full_name}</p>
                <button
                  onClick={() => deleteCustomer(customer.id)}
                  disabled={deletingId === customer.id}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  aria-label="Delete customer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 space-y-1 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {customer.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {customer.phone}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Customers;
