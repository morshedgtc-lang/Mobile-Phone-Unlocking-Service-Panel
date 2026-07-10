"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageSquare, ChevronRight, ArrowLeft } from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    apiClient.get("/support/admin/tickets").then(r => { setTickets(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openTicket = async (id: string) => {
    try { const r = await apiClient.get(`/support/tickets/${id}`); setSelected(r.data); }
    catch (e) { console.error(e); }
  };

  const sendReply = async () => {
    if (!reply) return;
    try {
      await apiClient.post(`/support/tickets/${selected.id}/reply`, { message: reply });
      setReply("");
      openTicket(selected.id);
    } catch (e: any) { alert(getErrorMessage(e)); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.post(`/support/admin/tickets/${id}/status?status_str=${status}`);
      setSelected(null);
      const r = await apiClient.get("/support/admin/tickets");
      setTickets(r.data);
    } catch (e: any) { alert(getErrorMessage(e)); }
  };

  const badge = (s: string) => {
    const m: any = {
      open: "badge-glass-open",
      in_progress: "badge-glass-in_progress",
      waiting: "badge-glass-pending",
      resolved: "badge-glass-resolved",
      closed: "badge-glass-closed",
    };
    return <span className={m[s] || "badge-glass bg-white/[0.04] text-white/40"}>{s.replace("_", " ").toUpperCase()}</span>;
  };

  if (selected) return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setSelected(null)} className="flex items-center gap-2 text-white/40 hover:text-white/70">
          <ArrowLeft size={16} /> Back
        </Button>
        <div className="flex gap-2">
          {selected.status !== "closed" && <Button size="sm" onClick={() => updateStatus(selected.id, "closed")}>Close</Button>}
          {selected.status === "open" && <Button size="sm" onClick={() => updateStatus(selected.id, "in_progress")}>Accept</Button>}
        </div>
      </div>
      <Card title={selected.subject} subtitle={`Status: ${selected.status} · Priority: ${selected.priority}`}>
        <div className="space-y-4 relative z-10">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-sm text-white/70">{selected.message}</p>
          </div>
          {(selected.replies || []).map((r: any) => (
            <div key={r.id} className={`p-4 rounded-xl ${r.is_staff ? "bg-blue-500/[0.04] border border-blue-500/10 ml-8" : "bg-white/[0.02] border border-white/[0.04] mr-8"}`}>
              <p className="text-xs text-white/30 mb-1.5 font-medium">{r.is_staff ? "Staff" : "Customer"} · {new Date(r.created_at).toLocaleString()}</p>
              <p className="text-sm text-white/70">{r.message}</p>
            </div>
          ))}
          {selected.status !== "closed" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <Input placeholder="Type reply..." value={reply} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReply(e.target.value)} />
              </div>
              <Button onClick={sendReply}>Reply</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Support Tickets</h1>
        <p className="text-sm text-white/35 mt-1.5">Manage customer support requests.</p>
      </div>
      <Card title="All Tickets">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-sm text-white/30">No tickets.</div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t: any) => (
              <div key={t.id} className="glass-row flex items-center justify-between cursor-pointer" onClick={() => openTicket(t.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/[0.04] flex items-center justify-center">
                    <MessageSquare size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{t.subject}</p>
                    <p className="text-xs text-white/35 mt-0.5">{t.user_email} · {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {badge(t.status)}
                  <ChevronRight size={16} className="text-white/15" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
