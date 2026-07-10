"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  FilePlus,
  Wallet,
  BookOpen,
  Activity,
  Copy,
  CheckCircle,
  Key
} from "lucide-react";
import apiClient from "@/lib/api-client";

export default function ResellerOverviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, ordersRes] = await Promise.all([
          apiClient.get("/users/me"),
          apiClient.get("/orders/my-orders"),
        ]);
        setUser(userRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Failed to load reseller data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "processing" || o.status === "waiting").length;

  const stats = [
    { label: "Current Balance", value: user ? `$${Number(user.balance).toFixed(2)}` : "$0.00", icon: TrendingUp, color: "text-emerald-400", glow: "shadow-emerald-500/20", bgGlow: "from-emerald-500/10 to-emerald-500/5", trend: "Available for orders" },
    { label: "Total Orders", value: String(orders.length), icon: ShoppingBag, color: "text-blue-400", glow: "shadow-blue-500/20", bgGlow: "from-blue-500/10 to-blue-500/5", trend: "Lifetime orders" },
    { label: "Pending Orders", value: String(pendingOrders), icon: Clock, color: "text-amber-400", glow: "shadow-amber-500/20", bgGlow: "from-amber-500/10 to-amber-500/5", trend: "Awaiting completion" },
  ];

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
    return (
      <span className={map[status] || "badge-glass bg-white/[0.04] text-white/40"}>
        <span className={`status-dot ${status === "completed" ? "online" : status === "rejected" || status === "cancelled" ? "offline" : "online"}`} />
        {status.toUpperCase()}
      </span>
    );
  };

  const maskApiKey = (key: string | null) => {
    if (!key) return null;
    if (key.length <= 8) return key;
    return key.substring(0, 7) + "..." + key.substring(key.length - 4);
  };

  const copyApiKey = () => {
    if (user?.api_key) {
      navigator.clipboard.writeText(user.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-purple-500/10 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-sm text-white/30 font-medium">Loading reseller panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">
            Welcome, {user?.username || "Reseller"}
          </h1>
          <p className="text-sm text-white/35 mt-1.5">Manage your orders, deposits, and API access.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="group cursor-default">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">{stat.label}</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">{stat.value}</h3>
                  <p className={`text-[11px] mt-1.5 ${stat.color} flex items-center gap-1 font-medium`}>
                    <Activity size={10} />
                    {stat.trend}
                  </p>
                </div>
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.bgGlow} border border-white/[0.04] group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon size={22} className={stat.color} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2">
          <Card title="Recent Orders" subtitle="Your latest orders (last 5)">
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="table-glass">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-6 pb-4 font-semibold">Order ID</th>
                    <th className="px-6 pb-4 font-semibold">Service</th>
                    <th className="px-6 pb-4 font-semibold">Status</th>
                    <th className="px-6 pb-4 font-semibold">Price</th>
                    <th className="px-6 pb-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-white/30">
                        No orders yet. Create your first manual order!
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="group">
                        <td className="px-6 py-4 text-sm font-semibold text-white/70 font-mono">#{String(order.id).substring(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-white/55">{order.service?.name || "Service"}</td>
                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-white">${Number(order.price_paid).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-white/35">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card title="Your API Key" subtitle="Use this key for API integration">
            <div className="space-y-4 relative z-10">
              {user?.api_key ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Key size={14} className="text-blue-400 shrink-0" />
                    <code className="text-sm text-white/60 font-mono truncate flex-1">
                      {maskApiKey(user.api_key)}
                    </code>
                    <button
                      onClick={copyApiKey}
                      className="text-white/30 hover:text-white/60 transition-colors shrink-0"
                    >
                      {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/25">API key is active and ready for use.</p>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                    <Clock size={20} className="text-amber-400" />
                  </div>
                  <p className="text-sm text-white/50 font-medium">Awaiting approval</p>
                  <p className="text-xs text-white/30 mt-1">Your API key will appear here once your reseller account is approved.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-2 relative z-10">
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/reseller/manual-order")}>
                <FilePlus size={16} className="mr-2" /> Create Manual Order
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/reseller/deposit")}>
                <Wallet size={16} className="mr-2" /> Request Deposit
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/reseller/api-docs")}>
                <BookOpen size={16} className="mr-2" /> View API Docs
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
