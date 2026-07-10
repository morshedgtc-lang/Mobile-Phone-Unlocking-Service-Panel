"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Activity, CheckCircle, Clock, ChevronDown, ChevronUp, Copy } from "lucide-react";
import apiClient from "@/lib/api-client";

interface Order {
  id: string;
  service: { id: string; name: string } | null;
  status: string;
  price_paid: number;
  order_data: string;
  customer_notes: string | null;
  admin_notes: string | null;
  admin_result: string | null;
  created_at: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await apiClient.get("/orders/my-orders");
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

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

  const filtered = orders.filter(o =>
    !search || String(o.id).toLowerCase().includes(search.toLowerCase())
  );

  const parseOrderData = (data: string) => {
    try { return JSON.parse(data); } catch { return {}; }
  };

  const parseAdminResult = (result: string | null) => {
    if (!result) return null;
    try { return JSON.parse(result); } catch { return { unlock_key: result }; }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Order History</h1>
          <p>Track all your unlocking service requests.</p>
        </div>
      </div>

      <Card title="All Orders" subtitle="View and manage your service orders">
        <div className="mb-6 relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/20" />
          <input
            className="glass-input pl-10"
            placeholder="Search by Order ID..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
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
              const isExpanded = expandedOrder === order.id;
              const adminResult = parseAdminResult(order.admin_result);
              const orderData = parseOrderData(order.order_data);

              return (
                <div key={order.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
                  {/* Main row */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/[0.04] flex items-center justify-center">
                        <Activity size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/80 font-mono">#{String(order.id).substring(0, 8)}</p>
                        <p className="text-xs text-white/35 mt-0.5">{order.service?.name || "Service Order"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">${Number(order.price_paid).toFixed(2)}</p>
                        <div className="mt-1">{getStatusBadge(order.status)}</div>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/[0.04] space-y-3">
                      {/* Submitted data */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-1.5">Your Submitted Data</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {Object.entries(orderData).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                              <span className="text-white/35 capitalize">{key.replace(/_/g, " ")}:</span>
                              <span className="text-white/70 font-medium">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Unlock instructions (if completed) */}
                      {order.status === "completed" && adminResult && (
                        <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
                          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-400 mb-2 flex items-center gap-1">
                            <CheckCircle size={12} /> Unlock Instructions
                          </p>
                          {adminResult.unlock_key && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-emerald-300/60">Unlock Key:</span>
                              <code className="text-sm text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">{adminResult.unlock_key}</code>
                              <button
                                className="text-emerald-400/50 hover:text-emerald-400 transition-colors"
                                onClick={() => navigator.clipboard.writeText(adminResult.unlock_key)}
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          )}
                          {adminResult.instructions && (
                            <p className="text-sm text-emerald-300/70">{adminResult.instructions}</p>
                          )}
                        </div>
                      )}

                      {/* Waiting status message */}
                      {order.status === "pending" && (
                        <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-amber-400" />
                            <p className="text-sm text-amber-300/70">Waiting for admin to accept your order...</p>
                          </div>
                        </div>
                      )}

                      {order.status === "processing" && (
                        <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10">
                          <div className="flex items-center gap-2">
                            <Activity size={14} className="text-blue-400" />
                            <p className="text-sm text-blue-300/70">Your order is being processed. Unlock info will appear here when complete.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
