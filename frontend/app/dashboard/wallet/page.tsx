"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reloadRequests, setReloadRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReload, setShowReload] = useState(false);
  const [reloadAmount, setReloadAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, txnRes, reloadRes] = await Promise.all([
          apiClient.get("/users/me"),
          apiClient.get("/wallet/transactions"),
          apiClient.get("/wallet/reload-requests"),
        ]);
        setUser(userRes.data);
        setTransactions(txnRes.data);
        setReloadRequests(reloadRes.data);
      } catch (err) {
        console.error("Failed to load wallet data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReloadRequest = async () => {
    const amount = parseFloat(reloadAmount);
    if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount");
    setSubmitting(true);
    try {
      await apiClient.post("/wallet/reload-request", { amount, description: "User requested top-up" });
      alert("Reload request submitted for admin approval");
      setShowReload(false);
      setReloadAmount("");
      const reloadRes = await apiClient.get("/wallet/reload-requests");
      setReloadRequests(reloadRes.data);
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to submit request"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: "badge-glass-pending",
      approved: "badge-glass-approved",
      rejected: "badge-glass-rejected",
      credit: "badge-glass-credit",
      debit: "badge-glass-debit",
      refund: "badge-glass-refund",
    };
    return <span className={map[status] || "badge-glass bg-white/[0.04] text-white/40"}>{status.toUpperCase()}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-white/30 font-medium">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Wallet & Funds</h1>
          <p>Manage your balance and view transaction history.</p>
        </div>
        <Button onClick={() => setShowReload(!showReload)} className="flex items-center gap-2">
          <Plus size={16} /> Request Top-Up
        </Button>
      </div>

      {showReload && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <Card title="Request Balance Top-Up" subtitle="Your request will be reviewed by an administrator">
            <div className="flex flex-col sm:flex-row items-end gap-4 relative z-10">
              <div className="flex-1 w-full">
                <Input 
                  label="Amount (USD)" 
                  type="number" 
                  step="0.01" 
                  min="1"
                  placeholder="e.g. 100.00"
                  value={reloadAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReloadAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button onClick={handleReloadRequest} isLoading={submitting}>
                  Submit Request
                </Button>
                <Button variant="outline" onClick={() => setShowReload(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Transaction History" subtitle="All credits and debits on your account">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-sm text-white/30">No transactions yet.</div>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn: any) => (
                  <div key={txn.id} className="glass-row flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border border-white/[0.04] ${
                        txn.transaction_type === "credit" || txn.transaction_type === "refund" 
                          ? "bg-emerald-500/10" : "bg-red-500/10"
                      }`}>
                        {txn.transaction_type === "credit" || txn.transaction_type === "refund" ? (
                          <ArrowDownLeft size={16} className="text-emerald-400" />
                        ) : (
                          <ArrowUpRight size={16} className="text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{txn.description || "Transaction"}</p>
                        <p className="text-xs text-white/35 mt-0.5">{new Date(txn.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        txn.transaction_type === "credit" || txn.transaction_type === "refund" 
                          ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {txn.transaction_type === "credit" || txn.transaction_type === "refund" ? "+" : "-"}${Number(txn.amount).toFixed(2)}
                      </p>
                      <div className="mt-1">{getStatusBadge(txn.transaction_type)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Current Balance" subtitle="Available funds for orders">
            <div className="text-center py-6 relative z-10">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/[0.04] mb-4 shadow-lg shadow-blue-500/10">
                <Wallet size={28} className="text-gradient-primary" />
              </div>
              <h2 className="text-4xl font-extrabold text-gradient tracking-tight">${Number(user?.balance || 0).toFixed(2)}</h2>
              <p className="text-sm text-white/35 mt-2 font-medium">USD Balance</p>
            </div>
          </Card>

          <Card title="Recent Reload Requests" subtitle="Status of your top-up requests">
            {reloadRequests.length === 0 ? (
              <div className="text-center py-4 text-sm text-white/30">No reload requests yet.</div>
            ) : (
              <div className="space-y-2 relative z-10">
                {reloadRequests.slice(0, 5).map((req: any) => (
                  <div key={req.id} className="glass-row flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white/70">${Number(req.amount).toFixed(2)}</p>
                      <p className="text-xs text-white/35 mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
