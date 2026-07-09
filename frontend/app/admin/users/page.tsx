"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, UserCheck, UserX } from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try { const r = await apiClient.get("/admin/users"); setUsers(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (userId: string, current: boolean) => {
    try { await apiClient.patch(`/admin/users/${userId}`, { is_active: !current }); fetchUsers(); }
    catch (e: any) { alert(getErrorMessage(e)); }
  };

  const filtered = users.filter((u: any) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const badge = (role: string) => {
    const m: any = {
      super_admin: "badge-glass-rejected",
      admin: "badge-glass-pending",
      user: "badge-glass-completed",
    };
    return <span className={m[role] || "badge-glass"}>{role.replace("_", " ").toUpperCase()}</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-gradient tracking-tight">User Management</h1>
        <p className="text-sm text-white/35 mt-1.5">Manage all registered users.</p>
      </div>
      <Card title="All Users">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-white/20" />
          <input
            className="glass-input pl-10"
            placeholder="Search by email or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-4 pb-4 font-semibold">User</th>
                  <th className="px-4 pb-4 font-semibold">Email</th>
                  <th className="px-4 pb-4 font-semibold">Role</th>
                  <th className="px-4 pb-4 font-semibold">Group</th>
                  <th className="px-4 pb-4 font-semibold">Balance</th>
                  <th className="px-4 pb-4 font-semibold">Status</th>
                  <th className="px-4 pb-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.id} className="group">
                    <td className="px-4 py-4 text-sm font-medium text-white/80">{u.username}</td>
                    <td className="px-4 py-4 text-sm text-white/45">{u.email}</td>
                    <td className="px-4 py-4">{badge(u.role)}</td>
                    <td className="px-4 py-4 text-sm text-white/55 capitalize">{u.group}</td>
                    <td className="px-4 py-4 text-sm font-bold text-white/80">${Number(u.balance).toFixed(2)}</td>
                    <td className="px-4 py-4">
                      {u.is_active ? (
                        <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
                      ) : (
                        <span className="text-xs font-bold text-red-400">SUSPENDED</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.is_active ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"}
                          onClick={() => toggleActive(u.id, u.is_active)}
                        >
                          {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
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
    </div>
  );
}
