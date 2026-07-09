"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Plus, Trash2, Edit3, Search, Filter, X, Save,
  Tag, Clock, DollarSign, AlertTriangle, ToggleLeft, ToggleRight,
  ChevronDown, Package, GripVertical, SquareCheck, Square, Upload
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface Service {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  retail_price: number;
  wholesale_price: number;
  vip_price: number;
  reseller_price: number;
  distributor_price: number;
  wholesale_cost: number;
  processing_time: string;
  requirements: string;
  is_active: boolean;
  maintenance_mode: boolean;
  sort_order: number;
  created_at: string;
}

interface ServiceReq {
  label: string;
  type: "text" | "file" | "select";
  required: boolean;
  options?: string[];
}

const defaultServiceForm = {
  name: "", category_id: "", processing_time: "",
  retail_price: "", wholesale_price: "", vip_price: "",
  reseller_price: "", distributor_price: "", wholesale_cost: "",
};

const defaultCategoryForm = { name: "", description: "", sort_order: "0" };

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [error, setError] = useState("");

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState(defaultServiceForm);
  const [serviceReqs, setServiceReqs] = useState<ServiceReq[]>([]);
  const [saving, setSaving] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [savingCategory, setSavingCategory] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes] = await Promise.all([
        apiClient.get("/services/all"),
        apiClient.get("/services/categories/all"),
      ]);
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.processing_time.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || s.category_id === filterCategory;
    return matchSearch && matchCat;
  });

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || "—";

  // ─── Service CRUD ──────────────────────────────────────────

  const openAddService = () => {
    setEditingService(null);
    setServiceForm(defaultServiceForm);
    setServiceReqs([]);
    setShowServiceForm(true);
    setError("");
  };

  const openEditService = (s: Service) => {
    setEditingService(s);
    setServiceForm({
      name: s.name, category_id: s.category_id, processing_time: s.processing_time,
      retail_price: String(s.retail_price), wholesale_price: String(s.wholesale_price),
      vip_price: String(s.vip_price), reseller_price: String(s.reseller_price),
      distributor_price: String(s.distributor_price), wholesale_cost: String(s.wholesale_cost),
    });
    try {
      const parsed = JSON.parse(s.requirements);
      setServiceReqs(Array.isArray(parsed) ? parsed : []);
    } catch {
      setServiceReqs([]);
    }
    setShowServiceForm(true);
    setError("");
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: serviceForm.name,
        category_id: serviceForm.category_id,
        processing_time: serviceForm.processing_time,
        requirements: JSON.stringify(serviceReqs),
        retail_price: parseFloat(serviceForm.retail_price) || 0,
        wholesale_price: parseFloat(serviceForm.wholesale_price) || 0,
        vip_price: parseFloat(serviceForm.vip_price) || 0,
        reseller_price: parseFloat(serviceForm.reseller_price) || 0,
        distributor_price: parseFloat(serviceForm.distributor_price) || 0,
        wholesale_cost: parseFloat(serviceForm.wholesale_cost) || 0,
      };
      if (editingService) {
        await apiClient.patch(`/services/${editingService.id}`, payload);
      } else {
        await apiClient.post("/services", payload);
      }
      setShowServiceForm(false);
      setEditingService(null);
      setServiceForm(defaultServiceForm);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    setDeleting(id);
    try {
      await apiClient.delete(`/services/${id}`);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  // ─── Category CRUD ─────────────────────────────────────────

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm(defaultCategoryForm);
    setShowCategoryForm(true);
    setError("");
  };

  const openEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCategoryForm({ name: c.name, description: c.description || "", sort_order: String(c.sort_order) });
    setShowCategoryForm(true);
    setError("");
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCategory(true);
    setError("");
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description || null,
        sort_order: parseInt(categoryForm.sort_order) || 0,
      };
      if (editingCategory) {
        await apiClient.patch(`/services/categories/${editingCategory.id}`, payload);
      } else {
        await apiClient.post("/services/categories", payload);
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm(defaultCategoryForm);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeleting(id);
    try {
      await apiClient.delete(`/services/categories/${id}`);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  // ─── Form input helper ─────────────────────────────────────

  const svc = (field: string) => ({
    value: (serviceForm as any)[field] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setServiceForm({ ...serviceForm, [field]: e.target.value }),
  });

  const cat = (field: string) => ({
    value: (categoryForm as any)[field] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setCategoryForm({ ...categoryForm, [field]: e.target.value }),
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Service Management</h1>
          <p className="text-sm text-white/35 mt-1.5">Configure services, categories, and group pricing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openAddCategory} className="flex items-center gap-2">
            <Tag size={16} /> Add Category
          </Button>
          <Button onClick={openAddService} className="flex items-center gap-2">
            <Plus size={18} /> Add Service
          </Button>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 text-red-300 text-sm border border-red-500/20 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* ─── Category Form ───────────────────────────────── */}
      <AnimatePresence>
        {showCategoryForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card title={editingCategory ? "Edit Category" : "Add New Category"} subtitle="Organize your services">
              <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <Input label="Category Name" placeholder="e.g. Apple" required {...cat("name")} />
                <Input label="Description" placeholder="Optional description" {...cat("description")} />
                <Input label="Sort Order" type="number" placeholder="0" {...cat("sort_order")} />
                <div className="md:col-span-3 flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}>Cancel</Button>
                  <Button type="submit" isLoading={savingCategory}>
                    {editingCategory ? "Update Category" : "Save Category"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Service Form ────────────────────────────────── */}
      <AnimatePresence>
        {showServiceForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card
              title={editingService ? "Edit Service" : "Add New Service"}
              subtitle="Define pricing for all user groups"
            >
              <form onSubmit={handleServiceSubmit} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Service Name" placeholder="e.g. iPhone 13 Official Unlock" required {...svc("name")} />
                  <div className="w-full space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 leading-none">Category</label>
                    <select
                      className="flex w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-4 py-3 text-sm text-white/85 outline-none transition-all duration-300 focus:border-blue-500/30 focus:bg-blue-500/[0.04] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.06),0_0_24px_rgba(99,102,241,0.06)] hover:border-white/[0.10] hover:bg-white/[0.04]"
                      style={{
                        WebkitAppearance: "none",
                        appearance: "none" as any,
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.75rem center",
                        paddingRight: "2.5rem",
                      }}
                      value={serviceForm.category_id}
                      onChange={(e) => setServiceForm({ ...serviceForm, category_id: e.target.value })}
                      required
                    >
                      <option value="" disabled style={{ background: "#0f1729", color: "rgba(255,255,255,0.4)" }}>Select category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id} style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input label="Processing Time" placeholder="e.g. 2-5 Days" required {...svc("processing_time")} />
                </div>

                {/* Pricing grid */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 mb-4 flex items-center gap-1.5">
                    <DollarSign size={12} /> Pricing by User Group
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Input label="Retail ($)" type="number" step="0.01" placeholder="0.00" required {...svc("retail_price")} />
                    <Input label="Wholesale ($)" type="number" step="0.01" placeholder="0.00" required {...svc("wholesale_price")} />
                    <Input label="VIP ($)" type="number" step="0.01" placeholder="0.00" required {...svc("vip_price")} />
                    <Input label="Reseller ($)" type="number" step="0.01" placeholder="0.00" required {...svc("reseller_price")} />
                    <Input label="Distributor ($)" type="number" step="0.01" placeholder="0.00" required {...svc("distributor_price")} />
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Admin Cost ($)" type="number" step="0.01" placeholder="What you pay" required {...svc("wholesale_cost")} />
                  </div>
                </div>

                {/* Requirements Editor */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 flex items-center gap-1.5">
                      <SquareCheck size={12} /> Customer Requirements
                    </p>
                    <Button variant="outline" size="sm" type="button" onClick={() => setServiceReqs([...serviceReqs, { label: "", type: "text", required: true }])}>
                      <Plus size={14} className="mr-1" /> Add Field
                    </Button>
                  </div>
                  {serviceReqs.length === 0 && (
                    <p className="text-xs text-white/25 text-center py-3">No requirements defined. Click "Add Field" to add IMEI, photos, etc.</p>
                  )}
                  <div className="space-y-2">
                    {serviceReqs.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <input
                          className="flex-1 bg-transparent border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-blue-500/30"
                          placeholder="Field label (e.g. IMEI Number)"
                          value={req.label}
                          onChange={(e) => {
                            const next = [...serviceReqs];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setServiceReqs(next);
                          }}
                        />
                        <select
                          className="flex-shrink-0 rounded-lg px-3 py-2 text-sm text-white/80 outline-none min-w-[110px]"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 0.5rem center",
                            paddingRight: "2rem",
                            WebkitAppearance: "none",
                            appearance: "none" as any,
                          }}
                          value={req.type}
                          onChange={(e) => {
                            const next = [...serviceReqs];
                            next[idx] = { ...next[idx], type: e.target.value as any };
                            setServiceReqs(next);
                          }}
                        >
                          <option value="text" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>Text</option>
                          <option value="file" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>File Upload</option>
                          <option value="select" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>Select</option>
                        </select>
                        <button
                          type="button"
                          className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded transition-colors whitespace-nowrap"
                          onClick={() => {
                            const next = [...serviceReqs];
                            next[idx] = { ...next[idx], required: !next[idx].required };
                            setServiceReqs(next);
                          }}
                        >
                          {req.required ? (
                            <span className="text-emerald-400 flex items-center gap-1"><SquareCheck size={12} /> Required</span>
                          ) : (
                            <span className="text-white/30 flex items-center gap-1"><Square size={12} /> Optional</span>
                          )}
                        </button>
                        <button
                          type="button"
                          className="text-red-400/50 hover:text-red-400 p-1 rounded transition-colors"
                          onClick={() => setServiceReqs(serviceReqs.filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => { setShowServiceForm(false); setEditingService(null); }}>Cancel</Button>
                  <Button type="submit" isLoading={saving}>
                    <Save size={16} className="mr-1" />
                    {editingService ? "Update Service" : "Save Service"}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Categories List ─────────────────────────────── */}
      <Card title="Categories" subtitle={`${categories.length} active categories`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.10] transition-all group">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/10">
                  <Tag size={14} className="text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{c.name}</p>
                  {c.description && <p className="text-xs text-white/30 truncate">{c.description}</p>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 h-7 w-7" onClick={() => openEditCategory(c)}>
                  <Edit3 size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 h-7 w-7" onClick={() => handleDeleteCategory(c.id)} isLoading={deleting === c.id}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <p className="text-sm text-white/30 col-span-full text-center py-4">No categories yet. Create one to get started.</p>
          )}
        </div>
      </Card>

      {/* ─── Services List ───────────────────────────────── */}
      <Card title="Active Services" subtitle={`${filtered.length} of ${services.length} services`}>
        <div className="mb-6 flex flex-col sm:flex-row gap-3 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/20" />
            <input
              className="glass-input pl-10 w-full"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="glass-input pr-8 min-w-[160px]"
              style={{
                WebkitAppearance: "none",
                appearance: "none" as any,
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                paddingRight: "2.5rem",
              }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3.5 text-white/20 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-4 pb-4 font-semibold">Service Name</th>
                <th className="px-4 pb-4 font-semibold">Category</th>
                <th className="px-4 pb-4 font-semibold">Retail</th>
                <th className="px-4 pb-4 font-semibold hidden lg:table-cell">Wholesale</th>
                <th className="px-4 pb-4 font-semibold hidden lg:table-cell">VIP</th>
                <th className="px-4 pb-4 font-semibold hidden xl:table-cell">Admin Cost</th>
                <th className="px-4 pb-4 font-semibold">Time</th>
                <th className="px-4 pb-4 font-semibold text-center">Status</th>
                <th className="px-4 pb-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-white/30 text-sm">Loading services...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-white/30 text-sm">
                  {search || filterCategory !== "all" ? "No services match your filters." : "No services yet. Add one above."}
                </td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="group hover:bg-white/[0.01]">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-white/80">{s.name}</p>
                      {s.maintenance_mode && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">Maintenance</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-white/45">{getCategoryName(s.category_id)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-white/80">${s.retail_price}</td>
                    <td className="px-4 py-4 text-sm text-white/45 hidden lg:table-cell">${s.wholesale_price}</td>
                    <td className="px-4 py-4 text-sm text-white/45 hidden lg:table-cell">${s.vip_price}</td>
                    <td className="px-4 py-4 text-sm text-white/45 hidden xl:table-cell">${s.wholesale_cost}</td>
                    <td className="px-4 py-4 text-sm text-white/55 whitespace-nowrap">{s.processing_time}</td>
                    <td className="px-4 py-4 text-center">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <ToggleRight size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          <ToggleLeft size={10} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300" onClick={() => openEditService(s)}>
                          <Edit3 size={15} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteService(s.id)} isLoading={deleting === s.id}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
