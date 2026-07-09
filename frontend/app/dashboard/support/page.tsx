"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageSquare, Plus, ChevronRight, ArrowLeft } from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState("");

  const fetchTickets = async () => {
    try { const r = await apiClient.get("/support/tickets"); setTickets(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const createTicket = async () => {
    if (!subject || !message) return alert("Fill in all fields");
    setSubmitting(true);
    try { await apiClient.post("/support/tickets", { subject, message }); setShowNew(false); setSubject(""); setMessage(""); fetchTickets(); }
    catch (e: any) { alert(getErrorMessage(e)); }
    finally { setSubmitting(false); }
  };

  const openTicket = async (id: string) => {
    try { const r = await apiClient.get(`/support/tickets/${id}`); setSelectedTicket(r.data); }
    catch (e) { console.error(e); }
  };

  const sendReply = async () => {
    if (!reply) return;
    try { await apiClient.post(`/support/tickets/${selectedTicket.id}/reply`, { message: reply }); setReply(""); openTicket(selectedTicket.id); }
    catch (e: any) { alert(getErrorMessage(e)); }
  };

  const closeTicket = async (id: string) => {
    try { await apiClient.post(`/support/tickets/${id}/close`); setSelectedTicket(null); fetchTickets(); }
    catch (e) { console.error(e); }
  };

  const badge = (s: string) => {
    const map: any = {
      open: "badge-glass-open",
      in_progress: "badge-glass-in_progress",
      waiting: "badge-glass-pending",
      resolved: "badge-glass-resolved",
      closed: "badge-glass-closed",
    };
    return <span className={map[s] || "badge-glass bg-white/[0.04] text-white/40"}>{s.replace("_", " ").toUpperCase()}</span>;
  };

  if (selectedTicket) return (
    <div className="page-container max-w-3xl">
      <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-white/40 hover:text-white/70 mb-6">
        <ArrowLeft size={16} /> Back to Tickets
      </Button>
      <Card title={selectedTicket.subject} subtitle={`Status: ${selectedTicket.status} · Priority: ${selectedTicket.priority}`}>
        <div className="space-y-4 relative z-10">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-sm text-white/70">{selectedTicket.message}</p>
          </div>
          <div className="space-y-3">
            {(selectedTicket.replies || []).map((r: any) => (
              <div key={r.id} className={`p-4 rounded-xl ${r.is_staff ? "bg-blue-500/[0.04] border border-blue-500/10 ml-8" : "bg-white/[0.02] border border-white/[0.04] mr-8"}`}>
                <p className="text-xs text-white/30 mb-1.5 font-medium">{r.is_staff ? "Staff" : "You"} · {new Date(r.created_at).toLocaleString()}</p>
                <p className="text-sm text-white/70">{r.message}</p>
              </div>
            ))}
          </div>
          {selectedTicket.status !== "closed" && (
            <div className="flex gap-3">
              <div className="flex-1">
                <Input placeholder="Type your reply..." value={reply} onChange={e => setReply(e.target.value)} />
              </div>
              <Button onClick={sendReply}>Send</Button>
              <Button variant="outline" onClick={() => closeTicket(selectedTicket.id)}>Close</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Support Tickets</h1>
          <p>Get help from our support team.</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2">
          <Plus size={16} /> New Ticket
        </Button>
      </div>

      {showNew && (
        <Card title="Create New Ticket">
          <div className="space-y-4 relative z-10">
            <Input label="Subject" placeholder="e.g. Payment issue" value={subject} onChange={e => setSubject(e.target.value)} />
            <Input label="Message" placeholder="Describe your issue in detail..." value={message} onChange={e => setMessage(e.target.value)} className="!min-h-[120px]" />
            <div className="flex gap-3">
              <Button onClick={createTicket} isLoading={submitting}>Submit Ticket</Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card title="My Tickets">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-white/30">Loading...</span>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-sm text-white/30">No tickets yet.</div>
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
                    <p className="text-xs text-white/35 mt-0.5">{new Date(t.created_at).toLocaleDateString()}</p>
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
