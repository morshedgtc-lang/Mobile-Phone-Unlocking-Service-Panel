'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

interface Deposit {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  notes: string;
  status: string;
  adminNotes: string;
  createdAt: string;
  user: { id: string; username: string; email: string };
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Deposit | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadDeposits(); }, []);

  const loadDeposits = async () => {
    try {
      const response = await apiClient.get('/admin/deposits');
      setDeposits(response.data);
    } catch (error) {
      console.error('Failed to load deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await apiClient.post(`/admin/deposits/${selected.id}/approve`, { adminNotes });
      setSelected(null);
      setAdminNotes('');
      loadDeposits();
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await apiClient.post(`/admin/deposits/${selected.id}/reject`, { adminNotes });
      setSelected(null);
      setAdminNotes('');
      loadDeposits();
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deposits</h1>
        <p className="text-gray-600">Review and process deposit requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>All Deposits ({deposits.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : deposits.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No deposits</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Method</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((d) => (
                        <tr
                          key={d.id}
                          className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selected?.id === d.id ? 'bg-blue-50' : ''}`}
                          onClick={() => { setSelected(d); setAdminNotes(''); }}
                        >
                          <td className="py-3 px-4 text-sm">{d.user.username}</td>
                          <td className="py-3 px-4 text-sm">{formatCurrency(d.amount)}</td>
                          <td className="py-3 px-4 text-sm">{d.paymentMethod}</td>
                          <td className="py-3 px-4"><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(d.status)}`}>{d.status}</span></td>
                          <td className="py-3 px-4 text-sm text-gray-500">{formatDate(d.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selected ? (
            <Card className="sticky top-8">
              <CardHeader><CardTitle>Deposit Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Client: {selected.user.username} ({selected.user.email})</p>
                  <p className="text-sm text-gray-600">Amount: {formatCurrency(selected.amount)}</p>
                  <p className="text-sm text-gray-600">Method: {selected.paymentMethod}</p>
                  {selected.transactionId && <p className="text-sm text-gray-600">Transaction ID: {selected.transactionId}</p>}
                  {selected.notes && <p className="text-sm text-gray-600">Notes: {selected.notes}</p>}
                </div>

                {selected.status === 'PENDING' && (
                  <>
                    <Textarea label="Admin Notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
                    <div className="flex gap-2">
                      <Button onClick={handleApprove} loading={processing} className="flex-1" size="sm">Approve</Button>
                      <Button onClick={handleReject} loading={processing} variant="danger" className="flex-1" size="sm">Reject</Button>
                    </div>
                  </>
                )}

                {selected.adminNotes && (
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">Admin Notes: {selected.adminNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent><p className="text-center text-gray-500 py-8">Select a deposit to review</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
