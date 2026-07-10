"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, UserCheck, UserX, ShieldCheck, KeyRound, Activity, Users } from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [apiKeyModal, setApiKeyModal] = useState<{ key: string; username: string } | null>(null);

  const fetchResellers = async () => {
    try {
      const res = await apiClient.get("/admin/resellers");
      setResellers(res.data);
    } catch (err) {
      console.error("Failed to load resellers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResellers(); }, []);

  const handleApprove = async (userId: string, username: string) => {
    setApprovingId(userId);
    try {
      const res = await apiClient.post(`/admin/resellers/${userId}/approve`);
      setApiKeyModal({ key: res.data.api_key, username });
      fetchResellers();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to approve reseller"));
    } finally {
      setApprovingId(null);
    }
  };

  const handleRevokeKey = async (userId: string) => {
    setRevokingId(userId);
    try {
      await apiClient.post(`/admin/resellers/${userId}/revoke-key`);
      fetchResellers();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to revoke API key"));
    } finally {
      setRevokingId(null);
    }
  };

  const handleToggleActive = async (userId: string, current: boolean) => {
    setTogglingId(userId);
    try {
      await apiClient.patch(`/admin/users/${userId}`, { is_active: !current });
      fetchResellers();
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to toggle status"));
    } finally {
      setTogglingId(null);
    }
  };

  const maskApiKey = (key: string | null) => {
    if (!key) return "—";
    if (key.length <= 8) return key;
    return key.substring(0, 8) + "...";
  };

  const filtered = resellers.filter((r: any) =>
    !search ||
    r.username?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalResellers = resellers.length;
  const approvedCount = resellers.filter((r: any) => r.api_key).length;
  const pendingCount = resellers.filter((r: any) => !r.api_key).length;

  const statCards = [
    { label: "Total Resellers", value: String(totalResellers), icon: Users, color: "text-blue-400", bgGlow: "from-blue-500/10 to-blue-500/5", trend: "All registered" },
    { label: "Approved", value: String(approvedCount), icon: ShieldCheck, color: "text-emerald-400", bgGlow: "from-emerald-500/10 to-emerald-500/5", trend: "With active API key" },
    { label: "Pending", value: String(pendingCount), icon: Activity, color: "text-amber-400", bgGlow: "from-amber-500/10 to-amber-500/5", trend: "Awaiting approval" },
  ];

  const badge = (approved: boolean) => {
    return approved
      ? <span className="badge-glass-completed">APPROVED</span>
      : <span className="badge-glass-pending">PENDING</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Reseller Management</h1>
        <p className="text-sm text-white/35 mt-1.5">Approve resellers, manage API keys, and monitor activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
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

      <Card title="All Resellers" subtitle="Manage reseller accounts and API access">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-white/20" />
          <input
            className="glass-input pl-10"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-white/30">Loading resellers...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-white/30">No resellers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-4 pb-4 font-semibold">Username</th>
                  <th className="px-4 pb-4 font-semibold">Email</th>
                  <th className="px-4 pb-4 font-semibold">Group</th>
                  <th className="px-4 pb-4 font-semibold">Balance</th>
                  <th className="px-4 pb-4 font-semibold">API Key</th>
                  <th className="px-4 pb-4 font-semibold">Status</th>
                  <th className="px-4 pb-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="group">
                    <td className="px-4 py-4 text-sm font-medium text-white/80">{r.username}</td>
                    <td className="px-4 py-4 text-sm text-white/45">{r.email}</td>
                    <td className="px-4 py-4 text-sm text-white/55 capitalize">{r.group || "—"}</td>
                    <td className="px-4 py-4 text-sm font-bold text-white/80">${Number(r.balance || 0).toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <code className="text-xs text-white/40 font-mono bg-white/[0.03] px-2 py-1 rounded border border-white/[0.04]">
                        {maskApiKey(r.api_key)}
                      </code>
                    </td>
                    <td className="px-4 py-4">{badge(!!r.api_key)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        {!r.api_key && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 hover:text-emerald-300"
                            onClick={() => handleApprove(r.id, r.username)}
                            disabled={approvingId === r.id}
                          >
                            {approvingId === r.id ? (
                              <div className="w-4 h-4 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                            ) : (
                              <><ShieldCheck size={16} /> Approve</>
                            )}
                          </Button>
                        )}
                        {r.api_key && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-400 hover:text-amber-300"
                            onClick={() => handleRevokeKey(r.id)}
                            disabled={revokingId === r.id}
                          >
                            {revokingId === r.id ? (
                              <div className="w-4 h-4 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
                            ) : (
                              <><KeyRound size={16} /> Revoke Key</>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={r.is_active !== false ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"}
                          onClick={() => handleToggleActive(r.id, r.is_active !== false)}
                          disabled={togglingId === r.id}
                        >
                          {togglingId === r.id ? (
                            <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                          ) : r.is_active !== false ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {apiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setApiKeyModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-2xl p-6 max-w-md w-full mx-4 border border-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
                <KeyRound size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white/80">Reseller Approved</h3>
                <p className="text-xs text-white/35">{apiKeyModal.username} now has API access</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35 mb-1.5">Generated API Key</p>
              <code className="text-sm text-emerald-300 font-mono break-all">{apiKeyModal.key}</code>
            </div>
            <p className="text-xs text-amber-400/70 mb-4">Save this key securely. It will not be shown again.</p>
            <Button variant="primary" className="w-full" onClick={() => setApiKeyModal(null)}>Done</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
