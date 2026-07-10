"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, DollarSign, Clock, TrendingUp, Activity } from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDeposits = async () => {
    try {
      const res = await apiClient.get("/admin/deposits");
      setDeposits(res.data);
    } catch (err) {
      console.error("Failed to load deposits", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeposits(); }, []);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await apiClient.post(`/admin/deposits/${requestId}/approve`);
      fetchDeposits();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to approve deposit"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await apiClient.post(`/admin/deposits/${requestId}/reject`, { admin_notes: rejectNote || "Rejected by admin" });
      setRejectModal(null);
      setRejectNote("");
      fetchDeposits();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to reject deposit"));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: "badge-glass-pending",
      approved: "badge-glass-completed",
      rejected: "badge-glass-rejected",
    };
    return <span className={map[status] || "badge-glass"}>{status.toUpperCase()}</span>;
  };

  const filtered = deposits.filter((d: any) => filterStatus === "all" || d.status === filterStatus);

  const pendingCount = deposits.filter((d: any) => d.status === "pending").length;
  const approvedToday = deposits.filter((d: any) => {
    if (d.status !== "approved") return false;
    const created = new Date(d.created_at);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;
  const totalVolume = deposits
    .filter((d: any) => d.status === "approved")
    .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

  const statCards = [
    { label: "Pending", value: String(pendingCount), icon: Clock, color: "text-amber-400", bgGlow: "from-amber-500/10 to-amber-500/5", trend: "Awaiting review" },
    { label: "Approved Today", value: String(approvedToday), icon: CheckCircle, color: "text-emerald-400", bgGlow: "from-emerald-500/10 to-emerald-500/5", trend: "Processed today" },
    { label: "Total Volume", value: `$${totalVolume.toFixed(2)}`, icon: DollarSign, color: "text-blue-400", bgGlow: "from-blue-500/10 to-blue-500/5", trend: "All approved deposits" },
  ];

  const tabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Deposit Requests</h1>
          <p className="text-sm text-white/35 mt-1.5">Review and process customer deposit requests.</p>
        </div>
        <Button variant="outline" onClick={fetchDeposits} className="flex items-center gap-2">
          <Activity size={16} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <Card key={card.label} className="group cursor-default">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">{card.label}</p>
                <h3 className="text-2xl font-extrabold text-white mt-1.5 tracking-tight">{loading ? "..." : card.value}</h3>
                <p className={`text-[11px] mt-1.5 ${card.color} flex items-center gap-1 font-medium`}>
                  <TrendingUp size={10} />
                  {card.trend}
                </p>
              </div>
              <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.bgGlow} border border-white/[0.04] group-hover:scale-110 transition-transform duration-300`}>
                <card.icon size={22} className={card.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="All Deposit Requests" subtitle="Filter and process customer deposits">
        <div className="mb-6 flex gap-1 relative z-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === tab.key
                  ? "bg-white/[0.08] text-white border border-white/[0.08]"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-white/30">Loading deposits...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-white/30">No deposit requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-4 pb-4 font-semibold">User</th>
                  <th className="px-4 pb-4 font-semibold">Amount</th>
                  <th className="px-4 pb-4 font-semibold">Payment Method</th>
                  <th className="px-4 pb-4 font-semibold">Reference</th>
                  <th className="px-4 pb-4 font-semibold">Status</th>
                  <th className="px-4 pb-4 font-semibold">Created</th>
                  <th className="px-4 pb-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d: any) => (
                  <tr key={d.id} className="group">
                    <td className="px-4 py-4 text-sm text-white/70">{d.user_email}</td>
                    <td className="px-4 py-4 text-sm font-bold text-white/80">${Number(d.amount).toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-white/55 capitalize">{d.payment_method || "—"}</td>
                    <td className="px-4 py-4 text-sm text-white/40 font-mono">{d.reference_number || "—"}</td>
                    <td className="px-4 py-4">{getStatusBadge(d.status)}</td>
                    <td className="px-4 py-4 text-sm text-white/35">
                      {new Date(d.created_at).toLocaleDateString()} {new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {d.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-400 hover:text-emerald-300"
                              onClick={() => handleApprove(d.id)}
                              disabled={processingId === d.id}
                            >
                              {processingId === d.id ? (
                                <div className="w-4 h-4 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                              ) : (
                                <><CheckCircle size={16} /> Approve</>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => setRejectModal(d.id)}
                              disabled={processingId === d.id}
                            >
                              <XCircle size={16} /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setRejectModal(null); setRejectNote(""); }}>
          <div
            className="glass-card rounded-2xl p-6 max-w-md w-full mx-4 border border-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white/80 mb-1">Reject Deposit</h3>
            <p className="text-xs text-white/35 mb-4">Optionally provide a reason for rejection.</p>
            <textarea
              className="flex w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-4 py-3 text-sm text-white/85 placeholder-white/20 outline-none transition-all duration-300 focus:border-red-500/30 min-h-[80px] resize-y mb-4"
              placeholder="Reason for rejection (optional)..."
              value={rejectNote}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectNote(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => handleReject(rejectModal)} isLoading={processingId === rejectModal}>
                Reject
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setRejectModal(null); setRejectNote(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
