"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Wallet,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

export default function ResellerDepositPage() {
  const [user, setUser] = useState<any>(null);
  const [reloadRequests, setReloadRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, reloadRes] = await Promise.all([
          apiClient.get("/users/me"),
          apiClient.get("/wallet/reload-requests"),
        ]);
        setUser(userRes.data);
        setReloadRequests(reloadRes.data);
      } catch (err) {
        console.error("Failed to load deposit data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) return alert("Enter a valid amount");

    setSubmitting(true);
    try {
      await apiClient.post("/wallet/reload-request", {
        amount: depositAmount,
        description: `Deposit via ${paymentMethod.replace(/_/g, " ")}. Ref: ${referenceNumber || "N/A"}`,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        payment_proof: paymentProofUrl || null,
      });
      alert("Deposit request submitted for approval");
      setShowForm(false);
      setAmount("");
      setReferenceNumber("");
      setPaymentMethod("bank_transfer");
      setPaymentProofUrl(null);
      const reloadRes = await apiClient.get("/wallet/reload-requests");
      setReloadRequests(reloadRes.data);
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to submit deposit request"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "badge-glass-pending",
      approved: "badge-glass-completed",
      rejected: "badge-glass-rejected",
    };
    return <span className={map[status] || "badge-glass bg-white/[0.04] text-white/40"}>{status.toUpperCase()}</span>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle size={14} className="text-emerald-400" />;
      case "rejected": return <XCircle size={14} className="text-red-400" />;
      default: return <Clock size={14} className="text-amber-400" />;
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
          <p className="text-sm text-white/30 font-medium">Loading deposit page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Deposit Request</h1>
          <p>Request a deposit to your reseller balance.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <CreditCard size={16} /> New Deposit
          </Button>
        )}
      </div>

      {/* Balance Display */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="!border-emerald-500/10 !bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-white/[0.04]">
                <Wallet size={22} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">Current Balance</p>
                <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">${Number(user?.balance || 0).toFixed(2)}</h3>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Deposit Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card title="New Deposit Request" subtitle="Fill in the details below to request a deposit">
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <Input
                label="Amount (USD)"
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 100.00"
                required
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              />

              <div className="w-full space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 leading-none">
                  Payment Method
                </label>
                <select
                  className="flex w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-4 py-3 text-sm text-white/85 outline-none transition-all duration-300 focus:border-blue-500/30"
                  value={paymentMethod}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value)}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="crypto">Crypto</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <Input
                label="Reference Number"
                placeholder="Transaction reference or receipt number"
                value={referenceNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferenceNumber(e.target.value)}
              />

              <FileUpload
                label="Payment Proof (optional)"
                value={paymentProofUrl}
                onChange={setPaymentProofUrl}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={submitting}>
                  Submit Deposit Request
                </Button>
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Request History */}
      <Card title="Deposit History" subtitle="Your past deposit requests and their status">
        {reloadRequests.length === 0 ? (
          <div className="text-center py-8 text-sm text-white/30">No deposit requests yet.</div>
        ) : (
          <div className="space-y-2">
            {reloadRequests.map((req: any) => (
              <div key={req.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border border-white/[0.04] ${
                    req.status === "approved" ? "bg-emerald-500/10" : req.status === "rejected" ? "bg-red-500/10" : "bg-amber-500/10"
                  }`}>
                    {getStatusIcon(req.status)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/80">${Number(req.amount).toFixed(2)}</p>
                    <p className="text-xs text-white/35 mt-0.5">{new Date(req.created_at).toLocaleString()}</p>
                    {req.description && (
                      <p className="text-xs text-white/25 mt-0.5">{req.description}</p>
                    )}
                  </div>
                </div>
                <div>
                  {getStatusBadge(req.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
