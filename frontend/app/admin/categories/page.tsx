'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Category { id: string; name: string; description: string; sortOrder: number; isActive: boolean; }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', sortOrder: '0' });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/admin/categories');
      setCategories(response.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/categories', { ...formData, sortOrder: parseInt(formData.sortOrder) || 0 });
      setShowCreate(false);
      setFormData({ name: '', description: '', sortOrder: '0' });
      loadCategories();
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this category?')) return;
    try { await apiClient.delete(`/admin/categories/${id}`); loadCategories(); } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Categories</h1><p className="text-gray-600">Manage service categories</p></div>
        <Button onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : 'Create Category'}</Button>
      </div>

      {showCreate && (
        <Card><CardHeader><CardTitle>Create Category</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <Input label="Sort Order" type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })} />
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>All Categories ({categories.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">Loading...</div> : categories.length === 0 ? <p className="text-center text-gray-500 py-8">No categories</p> : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><p className="font-medium text-gray-900">{cat.name}</p><p className="text-sm text-gray-500">{cat.description || 'No description'}</p></div>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(cat.id)}>Deactivate</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
