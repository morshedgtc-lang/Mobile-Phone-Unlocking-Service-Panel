"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Activity
} from "lucide-react";
import apiClient from "@/lib/api-client";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "processing" || o.status === "waiting").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const rejectedOrders = orders.filter(o => o.status === "rejected").length;

  const stats = [
    { label: "Total Balance", value: user ? `$${Number(user.balance).toFixed(2)}` : "$0.00", icon: TrendingUp, color: "text-blue-400", glow: "shadow-blue-500/20", bgGlow: "from-blue-500/10 to-blue-500/5", trend: "Available for orders" },
    { label: "Active Orders", value: String(activeOrders), icon: Clock, color: "text-amber-400", glow: "shadow-amber-500/20", bgGlow: "from-amber-500/10 to-amber-500/5", trend: `${orders.filter(o => o.status === "pending").length} pending approval` },
    { label: "Completed", value: String(completedOrders), icon: CheckCircle, color: "text-emerald-400", glow: "shadow-emerald-500/20", bgGlow: "from-emerald-500/10 to-emerald-500/5", trend: "Total fulfilled" },
    { label: "Rejected", value: String(rejectedOrders), icon: AlertCircle, color: "text-red-400", glow: "shadow-red-500/20", bgGlow: "from-red-500/10 to-red-500/5", trend: "Requires attention" },
  ];

  const getStatusBadge = (status: string) => {
    const map: any = {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-10 h-10 border-2 border-purple-500/10 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-sm text-white/30 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">
            Welcome back, {user?.username || "User"}
          </h1>
          <p className="text-sm text-white/35 mt-1.5">Here&apos;s what&apos;s happening with your services today.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => router.push("/dashboard/orders/new")}>
          <ShoppingBag size={16} />
          New Order
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Card title="Recent Orders" subtitle="Track your latest unlocking requests">
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
                        No orders yet. Create your first order!
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
          <Card title="Quick Wallet" subtitle="Manage your account funds">
            <div className="text-center py-4 relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">Current Balance</p>
              <h2 className="text-4xl font-extrabold text-gradient mt-2 tracking-tight">${Number(user?.balance || 0).toFixed(2)}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
              <Button variant="outline" className="w-full">Add Funds</Button>
              <Button variant="primary" className="w-full">Withdraw</Button>
            </div>
          </Card>

          <Card title="System Status" subtitle="Real-time API connectivity">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-sm font-medium text-white/55">Global API</span>
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="status-dot online" /> Online
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-sm font-medium text-white/55">Payment Gateway</span>
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="status-dot online" /> Online
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
