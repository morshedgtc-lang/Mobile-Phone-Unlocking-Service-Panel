'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, ShoppingCart, CreditCard, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalDeposits: number;
  pendingDeposits: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await apiClient.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">Failed to load dashboard</div>;
  }

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, sub: `${stats.activeUsers} active, ${stats.pendingUsers} pending`, icon: Users, color: 'text-blue-600' },
    { name: 'Total Orders', value: stats.totalOrders, sub: `${stats.pendingOrders} pending, ${stats.completedOrders} completed`, icon: ShoppingCart, color: 'text-green-600' },
    { name: 'Total Revenue', value: formatCurrency(stats.totalRevenue), sub: 'From completed orders', icon: DollarSign, color: 'text-purple-600' },
    { name: 'Pending Deposits', value: stats.pendingDeposits, sub: `${stats.totalDeposits} total requests`, icon: CreditCard, color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card key={card.name}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                </div>
                <card.icon className={`w-8 h-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a href="/admin/users" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-500">Create, edit, approve clients</p>
              </a>
              <a href="/admin/services" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <p className="font-medium text-gray-900">Manage Services</p>
                <p className="text-sm text-gray-500">Add services with dynamic fields</p>
              </a>
              <a href="/admin/orders" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <p className="font-medium text-gray-900">View Orders</p>
                <p className="text-sm text-gray-500">Process and manage orders</p>
              </a>
              <a href="/admin/deposits" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <p className="font-medium text-gray-900">Review Deposits</p>
                <p className="text-sm text-gray-500">Approve or reject deposit requests</p>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Users</span>
                <span className="font-medium">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Orders</span>
                <span className="font-medium">{stats.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="font-medium">{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Actions</span>
                <span className="font-medium text-yellow-600">{stats.pendingUsers + stats.pendingDeposits}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
