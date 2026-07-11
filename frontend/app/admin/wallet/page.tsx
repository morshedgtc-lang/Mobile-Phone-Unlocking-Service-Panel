'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

export default function AdminWalletPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data.filter((u: any) => u.role === 'CLIENT'));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount) return;
    setProcessing(true);
    try {
      await apiClient.post('/admin/wallet/credit', {
        userId: selectedUser.id,
        amount: parseFloat(amount),
        description: description || 'Admin credit',
      });
      setSelectedUser(null);
      setAmount('');
      setDescription('');
      loadUsers();
    } catch (error) { console.error(error); } finally { setProcessing(false); }
  };

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1><p className="text-gray-600">Credit client wallets</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Clients</CardTitle></CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8">Loading...</div> : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => setSelectedUser(user)}>
                      <div><p className="font-medium text-gray-900">{user.username}</p><p className="text-sm text-gray-500">{user.email}</p></div>
                      <p className="font-medium">{user.balance.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedUser ? (
            <Card className="sticky top-8">
              <CardHeader><CardTitle>Credit Wallet</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Credits: {selectedUser.username} ({selectedUser.email})</p>
                <form onSubmit={handleCredit} className="space-y-4">
                  <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" />
                  <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Reason for credit..." />
                  <Button type="submit" loading={processing} className="w-full">Credit Wallet</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent><p className="text-center text-gray-500 py-8">Select a client to credit</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
