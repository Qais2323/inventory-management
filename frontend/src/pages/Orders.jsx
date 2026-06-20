import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Package,
} from "lucide-react";
import api from "../services/api";

const EMPTY_FORM = { customer_id: "", product_id: "", quantity: "" };

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        api.get("/orders/"),
        api.get("/customers/"),
        api.get("/products/"),
      ]);

      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch {
      showNotification("error", "Couldn't load orders. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === Number(form.product_id)) || null,
    [products, form.product_id]
  );

  const requestedQty = Number(form.quantity) || 0;
  const insufficientStock =
    selectedProduct && requestedQty > 0 && requestedQty > selectedProduct.quantity;
  const estimatedTotal =
    selectedProduct && requestedQty > 0 ? (selectedProduct.price * requestedQty).toFixed(2) : null;

  const validateForm = () => {
    const errors = {};

    if (!form.customer_id) errors.customer_id = "Please select a customer";
    if (!form.product_id) errors.product_id = "Please select a product";

    if (!form.quantity) {
      errors.quantity = "Quantity is required";
    } else if (Number(form.quantity) <= 0 || !Number.isInteger(Number(form.quantity))) {
      errors.quantity = "Enter a valid whole number greater than 0";
    } else if (selectedProduct && Number(form.quantity) > selectedProduct.quantity) {
      errors.quantity = `Only ${selectedProduct.quantity} unit(s) in stock`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await api.post("/orders/", {
        customer_id: Number(form.customer_id),
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
      });

      showNotification("success", "Order created successfully");
      resetForm();
      fetchData();
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 400) {
        setFieldErrors((prev) => ({ ...prev, quantity: detail || "Insufficient stock" }));
        showNotification("error", detail || "Insufficient stock for this order");
      } else if (status === 422) {
        showNotification("error", detail || "Please check the form and try again");
      } else {
        showNotification("error", detail || "Failed to create order");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = async (id) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order? Stock will be restored."
    );
    if (!confirmCancel) return;

    setCancellingId(id);
    try {
      await api.delete(`/orders/${id}`);
      showNotification("success", "Order cancelled and stock restored");
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      showNotification("error", detail || "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  const selectClasses = (field) =>
    `w-full rounded-lg border p-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
      fieldErrors[field] ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-blue-400"
    }`;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Create and manage customer orders</p>
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
        <div className="rounded-xl border-l-4 border-l-violet-500 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total Orders</h3>
            <span className="rounded-lg bg-violet-100 p-2.5">
              <ClipboardList className="h-5 w-5 text-violet-600" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{orders.length}</p>
        </div>
      </div>

      {/* Create order form */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Create Order</h2>

        <form onSubmit={createOrder} className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <select
                value={form.customer_id}
                onChange={(e) => handleChange("customer_id", e.target.value)}
                className={selectClasses("customer_id")}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </option>
                ))}
              </select>
              {fieldErrors.customer_id && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.customer_id}</p>
              )}
            </div>

            <div>
              <select
                value={form.product_id}
                onChange={(e) => handleChange("product_id", e.target.value)}
                className={selectClasses("product_id")}
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id} disabled={product.quantity === 0}>
                    {product.name} (Stock: {product.quantity}) {product.quantity === 0 ? "— Out of stock" : ""}
                  </option>
                ))}
              </select>
              {fieldErrors.product_id && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.product_id}</p>
              )}
            </div>

            <div>
              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className={selectClasses("quantity")}
              />
              {fieldErrors.quantity && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || insufficientStock}
              className="flex h-fit items-center justify-center gap-2 self-start rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!submitting && <Plus className="h-4 w-4" />}
              {submitting ? "Creating..." : "Create Order"}
            </button>
          </div>

          {/* Live stock / total preview */}
          {selectedProduct && requestedQty > 0 && (
            <div
              className={`mt-4 flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                insufficientStock
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {insufficientStock ? (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                ) : (
                  <Package className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {insufficientStock
                    ? `Only ${selectedProduct.quantity} unit(s) available — reduce quantity`
                    : `${selectedProduct.quantity} unit(s) available in stock`}
                </span>
              </div>
              {!insufficientStock && estimatedTotal && (
                <span className="font-semibold">Estimated total: ₹{estimatedTotal}</span>
              )}
            </div>
          )}
        </form>
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
      {!loading && orders.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm">
          <ClipboardList className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No orders yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first order using the form above</p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && orders.length > 0 && (
        <div className="mt-6 hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Total Amount</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{order.customer_name}</td>
                  <td className="px-4 py-3 text-slate-500">{order.product_name}</td>
                  <td className="px-4 py-3 text-slate-700">{order.quantity}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">₹{order.total_amount}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => cancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && orders.length > 0 && (
        <div className="mt-6 space-y-3 md:hidden">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{order.customer_name}</p>
                  <p className="text-xs text-slate-500">{order.product_name}</p>
                </div>
                <p className="text-lg font-bold text-slate-900">₹{order.total_amount}</p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">Qty: {order.quantity}</span>
                <button
                  onClick={() => cancelOrder(order.id)}
                  disabled={cancellingId === order.id}
                  className="flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
