"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { User, Mail, Shield, DollarSign, Calendar } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/users/me").then(r => { setUser(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-white/30 font-medium">Loading profile...</p>
      </div>
    </div>
  );
  if (!user) return <div className="text-center py-12 text-white/40">Not logged in</div>;

  const fields = [
    { icon: Mail, color: "text-blue-400/60", label: "Email", value: user.email },
    { icon: User, color: "text-purple-400/60", label: "Username", value: user.username },
    { icon: Shield, color: "text-emerald-400/60", label: "Group", value: user.group, capitalize: true },
    { icon: DollarSign, color: "text-amber-400/60", label: "Balance", value: `$${Number(user.balance).toFixed(2)}` },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-gradient tracking-tight">My Profile</h1>
        <p className="text-sm text-white/35 mt-1.5">Manage your account information.</p>
      </div>
      <Card title="Account Details">
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-4 pb-6 glass-divider">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.06] text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/10">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.username}</h2>
              <p className="text-white/35 capitalize text-sm">{user.role?.replace("_", " ")}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.label} className="glass-row flex items-center gap-3">
                <f.icon size={18} className={f.color} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">{f.label}</p>
                  <p className="text-sm font-medium text-white/80 capitalize">{f.capitalize ? String(f.value).replace("_", " ") : f.value}</p>
                </div>
              </div>
            ))}
            <div className="glass-row flex items-center gap-3 md:col-span-2">
              <Calendar size={18} className="text-cyan-400/60" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">Member Since</p>
                <p className="text-sm font-medium text-white/80">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
