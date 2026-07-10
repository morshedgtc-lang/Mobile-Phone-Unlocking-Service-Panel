"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrendingUp, ShoppingBag, Users, DollarSign, AlertCircle, CheckCircle, Activity, UserCheck } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalUsers: 0,
    totalResellers: 0, approvedResellers: 0, pendingApprovals: 0,
    pendingDeposits: 0, todaysOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ordersRes = await apiClient.get("/orders/all");
        const orders = ordersRes.data;
        const today = new Date().toDateString();
        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: any) => o.status === "pending").length,
          completedOrders: orders.filter((o: any) => o.status === "completed").length,
          totalUsers: new Set(orders.map((o: any) => o.user_id)).size,
          totalResellers: 0,
          approvedResellers: 0,
          pendingApprovals: 0,
          pendingDeposits: 0,
          todaysOrders: orders.filter((o: any) => new Date(o.created_at).toDateString() === today).length,
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      }

      try {
        const resellersRes = await apiClient.get("/admin/resellers");
        const resellers = resellersRes.data;
        setStats(prev => ({
          ...prev,
          totalResellers: resellers.length,
          approvedResellers: resellers.filter((r: any) => r.api_key).length,
          pendingApprovals: resellers.filter((r: any) => !r.api_key).length,
        }));
      } catch (err) {
        console.error("Failed to load reseller stats", err);
      }

      try {
        const depositsRes = await apiClient.get("/admin/deposits");
        const deposits = depositsRes.data;
        setStats(prev => ({
          ...prev,
          pendingDeposits: deposits.filter((d: any) => d.status === "pending").length,
        }));
      } catch (err) {
        console.error("Failed to load deposit stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Orders", value: String(stats.totalOrders), icon: ShoppingBag, color: "text-blue-400", bgGlow: "from-blue-500/10 to-blue-500/5", trend: "All time" },
    { label: "Pending", value: String(stats.pendingOrders), icon: AlertCircle, color: "text-amber-400", bgGlow: "from-amber-500/10 to-amber-500/5", trend: "Awaiting processing" },
    { label: "Completed", value: String(stats.completedOrders), icon: CheckCircle, color: "text-emerald-400", bgGlow: "from-emerald-500/10 to-emerald-500/5", trend: "Successfully fulfilled" },
    { label: "Active Users", value: String(stats.totalUsers), icon: Users, color: "text-purple-400", bgGlow: "from-purple-500/10 to-purple-500/5", trend: "Unique customers" },
  ];

  const resellerCards = [
    { label: "Total Resellers", value: String(stats.totalResellers), icon: Users, color: "text-blue-400", bgGlow: "from-blue-500/10 to-blue-500/5" },
    { label: "Approved Resellers", value: String(stats.approvedResellers), icon: UserCheck, color: "text-emerald-400", bgGlow: "from-emerald-500/10 to-emerald-500/5" },
    { label: "Pending Approvals", value: String(stats.pendingApprovals), icon: AlertCircle, color: "text-amber-400", bgGlow: "from-amber-500/10 to-amber-500/5" },
    { label: "Pending Deposits", value: String(stats.pendingDeposits), icon: DollarSign, color: "text-amber-400", bgGlow: "from-amber-500/10 to-amber-500/5" },
    { label: "Today's Orders", value: String(stats.todaysOrders), icon: ShoppingBag, color: "text-purple-400", bgGlow: "from-purple-500/10 to-purple-500/5" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-white/35 mt-1.5">Overview of your unlocking business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <Card className="group cursor-default">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">{card.label}</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">{loading ? "..." : card.value}</h3>
                  <p className={`text-[11px] mt-1.5 ${card.color} flex items-center gap-1 font-medium`}>
                    <Activity size={10} />
                    {card.trend}
                  </p>
                </div>
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.bgGlow} border border-white/[0.04] group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon size={22} className={card.color} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {resellerCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <Card className="group cursor-default">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">{card.label}</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">{loading ? "..." : card.value}</h3>
                </div>
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.bgGlow} border border-white/[0.04] group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon size={22} className={card.color} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card title="Quick Actions" subtitle="Manage your platform efficiently">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
          <Button variant="secondary" className="h-20 text-base flex items-center justify-center gap-3" onClick={() => window.location.href = "/admin/orders"}>
            <ShoppingBag size={20} className="text-blue-400" /> Manage Orders
          </Button>
          <Button variant="secondary" className="h-20 text-base flex items-center justify-center gap-3" onClick={() => window.location.href = "/admin/services"}>
            <TrendingUp size={20} className="text-purple-400" /> Edit Services
          </Button>
          <Button variant="secondary" className="h-20 text-base flex items-center justify-center gap-3" onClick={() => window.location.href = "/admin/resellers"}>
            <UserCheck size={20} className="text-emerald-400" /> Reseller Management
          </Button>
          <Button variant="secondary" className="h-20 text-base flex items-center justify-center gap-3" onClick={() => window.location.href = "/admin/wallet"}>
            <DollarSign size={20} className="text-emerald-400" /> Wallet Requests
          </Button>
        </div>
      </Card>
    </div>
  );
}
