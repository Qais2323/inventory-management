import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  Package,
  PackageX,
} from "lucide-react";
import api from "../services/api";

const EMPTY_FORM = { name: "", sku: "", price: "", quantity: "" };

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notification, setNotification] = useState(null); // { type: "success"|"error", message }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch {
      showNotification("error", "Couldn't load products. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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
    setEditingId(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Product name is required";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!form.sku.trim()) {
      errors.sku = "SKU is required";
    } else if (!/^[a-zA-Z0-9-_]+$/.test(form.sku.trim())) {
      errors.sku = "SKU can only contain letters, numbers, - and _";
    }

    if (form.price === "") {
      errors.price = "Price is required";
    } else if (Number(form.price) <= 0) {
      errors.price = "Price must be greater than 0";
    }

    if (form.quantity === "") {
      errors.quantity = "Quantity is required";
    } else if (Number(form.quantity) < 0) {
      errors.quantity = "Quantity cannot be negative";
    } else if (!Number.isInteger(Number(form.quantity))) {
      errors.quantity = "Quantity must be a whole number";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addOrUpdateProduct = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        showNotification("success", "Product updated successfully");
      } else {
        await api.post("/products", payload);
        showNotification("success", "Product added successfully");
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      if (status === 409) {
        setFieldErrors((prev) => ({ ...prev, sku: detail || "This SKU already exists" }));
        showNotification("error", detail || "A product with this SKU already exists");
      } else if (status === 422 || status === 400) {
        showNotification("error", detail || "Please check the form and try again");
      } else {
        showNotification("error", "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setFieldErrors({});
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const res = await api.delete(`/products/${id}`);
      showNotification("success", res.data?.message || "Product deleted successfully");
      fetchProducts();
    } catch (error) {
      const detail = error.response?.data?.detail;
      showNotification("error", detail || "Error deleting product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = products.filter((p) => p.quantity <= 5).length;

  const inputClasses = (field) =>
    `w-full rounded-lg border p-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-200 ${
      fieldErrors[field]
        ? "border-red-300 focus:border-red-400"
        : "border-slate-300 focus:border-blue-400"
    }`;

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your product inventory</p>
        </div>
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

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-l-4 border-l-blue-500 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Total Products</h3>
            <span className="rounded-lg bg-blue-100 p-2.5">
              <Package className="h-5 w-5 text-blue-600" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{products.length}</p>
        </div>

        <div className="rounded-xl border-l-4 border-l-red-500 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500">Low Stock Products</h3>
            <span className="rounded-lg bg-red-100 p-2.5">
              <PackageX className="h-5 w-5 text-red-600" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{lowStockCount}</p>
        </div>
      </div>

      {/* Add/Edit form */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          {editingId ? "Edit Product" : "Add New Product"}
        </h2>

        <form onSubmit={addOrUpdateProduct} className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Product name"
                value={form.name}
                onChange={handleChange}
                className={inputClasses("name")}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                name="sku"
                placeholder="SKU"
                value={form.sku}
                onChange={handleChange}
                className={inputClasses("sku")}
              />
              {fieldErrors.sku && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.sku}</p>
              )}
            </div>

            <div>
              <input
                type="number"
                name="price"
                placeholder="Price (₹)"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputClasses("price")}
              />
              {fieldErrors.price && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>
              )}
            </div>

            <div>
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0"
                step="1"
                className={inputClasses("quantity")}
              />
              {fieldErrors.quantity && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                editingId
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {!submitting && <Plus className="h-4 w-4" />}
              {submitting
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                ? "Update Product"
                : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or SKU..."
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
      {!loading && filteredProducts.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-sm">
          <Package className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            {search ? "No products match your search" : "No products yet"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {search ? "Try a different name or SKU" : "Add your first product using the form above"}
          </p>
        </div>
      )}

      {/* Desktop table */}
      {!loading && filteredProducts.length > 0 && (
        <div className="mt-6 hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    product.quantity <= 5 ? "bg-red-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                  <td className="px-4 py-3 text-slate-500">{product.sku}</td>
                  <td className="px-4 py-3 text-slate-700">₹{product.price}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        product.quantity <= 5
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {product.quantity <= 5 && <AlertTriangle className="h-3 w-3" />}
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editProduct(product)}
                        className="rounded-md p-2 text-amber-600 hover:bg-amber-50"
                        aria-label="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        disabled={deletingId === product.id}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && filteredProducts.length > 0 && (
        <div className="mt-6 space-y-3 md:hidden">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                product.quantity <= 5 ? "border-red-200" : "border-slate-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.sku}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    product.quantity <= 5
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {product.quantity <= 5 && <AlertTriangle className="h-3 w-3" />}
                  {product.quantity} in stock
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-bold text-slate-900">₹{product.price}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => editProduct(product)}
                    className="flex items-center gap-1 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    disabled={deletingId === product.id}
                    className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;