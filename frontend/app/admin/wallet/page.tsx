"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

export default function AdminWalletPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get("/wallet/admin/reload-requests");
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to load reload requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      await apiClient.post(`/wallet/admin/reload-request/${requestId}`, { 
        action,
        admin_notes: action === "approve" ? "Approved by admin" : "Rejected by admin"
      });
      fetchRequests();
    } catch (err: any) {
      alert(getErrorMessage(err, `Failed to ${action} request`));
    }
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending: "badge-glass-pending",
      approved: "badge-glass-approved",
      rejected: "badge-glass-rejected",
    };
    return <span className={map[status] || "badge-glass"}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Wallet Management</h1>
          <p className="text-sm text-white/35 mt-1.5">Approve or reject customer reload requests.</p>
        </div>
        <Button variant="outline" onClick={fetchRequests} className="flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <Card title="Pending Reload Requests" subtitle="Review and process customer top-up requests">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-white/30">Loading requests...</span>
            </div>
          </div>
        ) : requests.filter(r => r.status === "pending").length === 0 ? (
          <div className="text-center py-12 text-sm text-white/30">No pending reload requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-4 pb-4 font-semibold">User</th>
                  <th className="px-4 pb-4 font-semibold">Amount</th>
                  <th className="px-4 pb-4 font-semibold">Date</th>
                  <th className="px-4 pb-4 font-semibold">Status</th>
                  <th className="px-4 pb-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.filter(r => r.status === "pending").map((req) => (
                  <tr key={req.id} className="group">
                    <td className="px-4 py-4 text-sm text-white/70">{req.user_email}</td>
                    <td className="px-4 py-4 text-sm font-bold text-white/80">${Number(req.amount).toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-white/35">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300" onClick={() => handleAction(req.id, "approve")}>
                          <CheckCircle size={18} /> Approve
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleAction(req.id, "reject")}>
                          <XCircle size={18} /> Reject
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

      <Card title="All Requests History" subtitle="Complete log of reload requests">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-4 pb-4 font-semibold">User</th>
                <th className="px-4 pb-4 font-semibold">Amount</th>
                <th className="px-4 pb-4 font-semibold">Date</th>
                <th className="px-4 pb-4 font-semibold">Status</th>
                <th className="px-4 pb-4 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-white/30">No requests yet.</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="group">
                    <td className="px-4 py-4 text-sm text-white/70">{req.user_email}</td>
                    <td className="px-4 py-4 text-sm font-medium text-white/80">${Number(req.amount).toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-white/35">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-4 py-4 text-sm text-white/35">{req.admin_notes || "—"}</td>
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
