'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  notes: string;
  adminNotes: string;
  createdAt: string;
  user: { id: string; username: string; email: string };
  service: { id: string; name: string };
  fieldValues: { value: string; serviceField: { label: string } }[];
  messages: { id: string; message: string; createdAt: string; sender: { username: string; role: string } }[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const response = await apiClient.get('/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await apiClient.patch(`/admin/orders/${selectedOrder.id}`, { status, adminNotes });
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to update order:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !message.trim()) return;
    setUpdating(true);
    try {
      await apiClient.post(`/admin/orders/${selectedOrder.id}/messages`, { message });
      setMessage('');
      const response = await apiClient.get(`/admin/orders/${selectedOrder.id}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage and process all orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>All Orders ({orders.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : orders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Service</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedOrder?.id === order.id ? 'bg-blue-50' : ''}`}
                          onClick={() => { setSelectedOrder(order); setStatus(order.status); setAdminNotes(order.adminNotes || ''); }}
                        >
                          <td className="py-3 px-4 text-sm">{order.user.username}</td>
                          <td className="py-3 px-4 text-sm">{order.service.name}</td>
                          <td className="py-3 px-4 text-sm">{formatCurrency(order.totalAmount)}</td>
                          <td className="py-3 px-4"><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>{order.status}</span></td>
                          <td className="py-3 px-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
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
          {selectedOrder ? (
            <Card className="sticky top-8">
              <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Client: {selectedOrder.user.username} ({selectedOrder.user.email})</p>
                  <p className="text-sm text-gray-600">Service: {selectedOrder.service.name}</p>
                  <p className="text-sm text-gray-600">Amount: {formatCurrency(selectedOrder.totalAmount)}</p>
                </div>

                {selectedOrder.fieldValues.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Field Values</p>
                    {selectedOrder.fieldValues.map((fv, i) => (
                      <p key={i} className="text-sm text-gray-600">{fv.serviceField.label}: {fv.value}</p>
                    ))}
                  </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-3">
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={[
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'PROCESSING', label: 'Processing' },
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'REJECTED', label: 'Rejected' },
                      { value: 'CANCELLED', label: 'Cancelled' },
                    ]}
                  />
                  <Textarea label="Admin Notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
                  <Button type="submit" loading={updating} className="w-full" size="sm">Update Order</Button>
                </form>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Conversation</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOrder.messages.map((msg) => (
                      <div key={msg.id} className={`p-2 rounded text-sm ${msg.sender.role === 'ADMIN' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <span className="font-medium">{msg.sender.username}:</span> {msg.message}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleReply} className="mt-2 flex gap-2">
                    <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Reply..." className="flex-1" />
                    <Button type="submit" size="sm" loading={updating}>Send</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent><p className="text-center text-gray-500 py-8">Select an order to view details</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
