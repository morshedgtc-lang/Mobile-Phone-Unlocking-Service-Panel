'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  user: { username: string; email: string };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const response = await apiClient.get('/admin/audit-logs');
      setLogs(response.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1><p className="text-gray-600">Track all system actions</p></div>

      <Card>
        <CardHeader><CardTitle>Recent Activity ({logs.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">Loading...</div> : logs.length === 0 ? <p className="text-center text-gray-500 py-8">No audit logs</p> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Resource</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-500">{formatDate(log.createdAt)}</td>
                      <td className="py-3 px-4 text-sm">{log.user.username}</td>
                      <td className="py-3 px-4 text-sm font-medium">{log.action}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.resource}</td>
                      <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
