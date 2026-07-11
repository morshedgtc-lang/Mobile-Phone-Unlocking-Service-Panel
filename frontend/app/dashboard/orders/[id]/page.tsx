'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: number;
  notes: string;
  adminNotes: string;
  createdAt: string;
  completedAt: string;
  service: { name: string; description: string };
  fieldValues: { value: string; serviceField: { label: string } }[];
  messages: {
    id: string;
    message: string;
    createdAt: string;
    sender: { username: string; role: string };
  }[];
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await apiClient.post(`/orders/${id}/messages`, { message });
      setMessage('');
      loadOrder();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600">{order.service.name}</p>
        </div>
        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Order ID</dt>
                  <dd className="text-sm font-medium text-gray-900">{order.id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Amount</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Created</dt>
                  <dd className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</dd>
                </div>
                {order.completedAt && (
                  <div>
                    <dt className="text-sm text-gray-600">Completed</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatDate(order.completedAt)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {order.fieldValues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  {order.fieldValues.map((fv, i) => (
                    <div key={i}>
                      <dt className="text-sm text-gray-600">{fv.serviceField.label}</dt>
                      <dd className="text-sm font-medium text-gray-900">{fv.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Your Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {order.adminNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{order.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {order.messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                ) : (
                  order.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender.role === 'ADMIN'
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {msg.sender.username}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={3}
                />
                <Button type="submit" loading={sending} className="w-full" size="sm">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
