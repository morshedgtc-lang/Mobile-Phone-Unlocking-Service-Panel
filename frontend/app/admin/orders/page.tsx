"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search, Filter, CheckCircle, XCircle, FileText, MessageSquare,
  Clock, AlertTriangle, Eye, ChevronDown, ChevronUp, Send,
  CirclePlay, CirclePause, Ban, Copy, ArrowDownToLine
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

interface Order {
  id: string;
  user_id: string;
  service_id: string;
  service: { id: string; name: string } | null;
  status: string;
  price_paid: number;
  order_data: string;
  customer_notes: string | null;
  admin_notes: string | null;
  admin_result: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [completingOrder, setCompletingOrder] = useState<string | null>(null);
  const [unlockInstructions, setUnlockInstructions] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiClient.get("/orders/all");
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, status: string, result?: string, notes?: string) => {
    setSaving(true);
    try {
      const payload: any = { status };
      if (result !== undefined) payload.admin_result = result;
      if (notes !== undefined) payload.admin_notes = notes;
      await apiClient.patch(`/orders/${orderId}`, payload);
      await fetchOrders();
      setCompletingOrder(null);
      setUnlockInstructions("");
      setAdminNotes("");
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to update order"));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (orderId: string) => {
    if (!unlockInstructions.trim()) {
      alert("Please provide unlock instructions or the unlock key.");
      return;
    }
    const result = JSON.stringify({
      unlock_key: unlockInstructions.trim(),
      instructions: adminNotes.trim() || null,
    });
    await handleStatusUpdate(orderId, "completed", result);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "badge-glass-pending",
      waiting: "badge-glass-waiting",
      processing: "badge-glass-processing",
      completed: "badge-glass-completed",
      rejected: "badge-glass-rejected",
      cancelled: "badge-glass-cancelled",
      refunded: "badge-glass-refund",
      hold: "badge-glass-waiting",
    };
    const labels: Record<string, string> = {
      pending: "WAITING ACCEPT",
      waiting: "WAITING",
      processing: "PROCESSING",
      completed: "COMPLETED",
      rejected: "REJECTED",
    };
    return (
      <span className={map[status] || "badge-glass bg-white/[0.04] text-white/40"}>
        <span className={`status-dot ${status === "completed" ? "online" : status === "rejected" ? "offline" : "online"}`} />
        {labels[status] || status.toUpperCase()}
      </span>
    );
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      String(o.id).toLowerCase().includes(search.toLowerCase()) ||
      (o.order_data && String(o.order_data).toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const parseOrderData = (data: string) => {
    try { return JSON.parse(data); } catch { return {}; }
  };

  const statusCounts = {
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Order Management</h1>
          <p className="text-sm text-white/35 mt-1.5">Accept, process, and fulfill customer unlocking requests.</p>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Waiting Accept", count: statusCounts.pending, color: "text-amber-400", bg: "from-amber-500/10 to-amber-500/5" },
          { label: "Processing", count: statusCounts.processing, color: "text-blue-400", bg: "from-blue-500/10 to-blue-500/5" },
          { label: "Completed", count: statusCounts.completed, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5" },
          { label: "Rejected", count: statusCounts.rejected, color: "text-red-400", bg: "from-red-500/10 to-red-500/5" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(filterStatus === s.label.toLowerCase().replace(" ", "") ? "all" : s.label.toLowerCase().replace(" ", ""))}
            className={`p-3 rounded-xl border text-left transition-all ${
              filterStatus === s.label.toLowerCase().replace(" ", "")
                ? "border-white/[0.12] bg-white/[0.04]"
                : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03]"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.count}</p>
          </button>
        ))}
      </div>

      <Card title="All Orders" subtitle="Manage the full order lifecycle">
        <div className="mb-6 flex flex-col sm:flex-row gap-3 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/20" />
            <input
              className="glass-input pl-10 w-full"
              placeholder="Search by Order ID or IMEI..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
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
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            >
              <option value="all" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>All Status</option>
              <option value="pending" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>Waiting Accept</option>
              <option value="processing" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>Processing</option>
              <option value="completed" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>Completed</option>
              <option value="rejected" style={{ background: "#0f1729", color: "rgba(255,255,255,0.85)" }}>Rejected</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3.5 text-white/20 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-white/30">Loading orders...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-white/30">No orders found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((order) => {
              const orderData = parseOrderData(order.order_data);
              const isExpanded = expandedOrder === order.id;
              const isCompleting = completingOrder === order.id;

              return (
                <div key={order.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
                  {/* Main row */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/[0.04] flex items-center justify-center">
                        <FileText size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/80 font-mono">#{String(order.id).substring(0, 8)}</p>
                        <p className="text-xs text-white/35 mt-0.5">{order.service?.name || "Service"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-white/30 hidden sm:block">
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm font-bold text-white">${Number(order.price_paid).toFixed(2)}</p>
                      {getStatusBadge(order.status)}
                      {isExpanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-white/[0.04] space-y-4">
                          {/* Order data */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-2">Submitted Data</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(orderData).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                  <span className="text-xs text-white/35 capitalize">{key.replace(/_/g, " ")}:</span>
                                  <span className="text-xs text-white/70 font-medium">{String(val)}</span>
                                </div>
                              ))}
                              {Object.keys(orderData).length === 0 && (
                                <p className="text-xs text-white/25">No data submitted</p>
                              )}
                            </div>
                          </div>

                          {/* Customer notes */}
                          {order.customer_notes && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-1">Customer Notes</p>
                              <p className="text-sm text-white/60 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">{order.customer_notes}</p>
                            </div>
                          )}

                          {/* Admin result (if completed) */}
                          {order.admin_result && (() => {
                            try {
                              const result = JSON.parse(order.admin_result);
                              return (
                                <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-400 mb-2 flex items-center gap-1">
                                    <CheckCircle size={12} /> Unlock Instructions
                                  </p>
                                  <div className="space-y-1">
                                    {result.unlock_key && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-emerald-300/60">Unlock Key:</span>
                                        <code className="text-sm text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">{result.unlock_key}</code>
                                      </div>
                                    )}
                                    {result.instructions && (
                                      <p className="text-sm text-emerald-300/70 mt-1">{result.instructions}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            } catch {
                              return (
                                <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-400 mb-1 flex items-center gap-1">
                                    <CheckCircle size={12} /> Admin Result
                                  </p>
                                  <p className="text-sm text-emerald-300/70">{order.admin_result}</p>
                                </div>
                              );
                            }
                          })()}

                          {/* Admin notes */}
                          {order.admin_notes && !order.admin_result && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-1">Admin Notes</p>
                              <p className="text-sm text-white/60 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">{order.admin_notes}</p>
                            </div>
                          )}

                          {/* Action buttons */}
                          {order.status === "pending" && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, "processing")}
                                isLoading={saving}
                              >
                                <CirclePlay size={14} className="mr-1" /> Accept Order
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, "rejected")}
                                isLoading={saving}
                              >
                                <Ban size={14} className="mr-1" /> Reject
                              </Button>
                            </div>
                          )}

                          {order.status === "processing" && (
                            <div className="space-y-3 pt-2">
                              <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10">
                                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-blue-400 mb-2 flex items-center gap-1">
                                  <Send size={12} /> Complete Order — Provide Unlock Key / Instructions
                                </p>
                                <div className="space-y-3">
                                  <div className="w-full space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 leading-none">
                                      Unlock Key / Code *
                                    </label>
                                    <input
                                      className="flex w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-4 py-3 text-sm text-white/85 placeholder-white/20 outline-none transition-all duration-300 focus:border-blue-500/30 focus:bg-blue-500/[0.04] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.06),0_0_24px_rgba(99,102,241,0.06)]"
                                      placeholder="e.g. 12345678 or unlock code"
                                      value={unlockInstructions}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnlockInstructions(e.target.value)}
                                    />
                                  </div>
                                  <div className="w-full space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 leading-none">
                                      Additional Instructions (optional)
                                    </label>
                                    <textarea
                                      className="flex w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-4 py-3 text-sm text-white/85 placeholder-white/20 outline-none transition-all duration-300 focus:border-blue-500/30 min-h-[80px] resize-y"
                                      placeholder="e.g. Insert non-accepted SIM, enter code when prompted, restart device..."
                                      value={adminNotes}
                                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNotes(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleComplete(order.id)}
                                  isLoading={saving}
                                >
                                  <CheckCircle size={14} className="mr-1" /> Complete & Send Unlock Info
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(order.id, "rejected")}
                                  isLoading={saving}
                                >
                                  <Ban size={14} className="mr-1" /> Reject
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
