'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ClientGroup { id: string; name: string; description: string; }

export default function AdminClientGroupsPage() {
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    try {
      const response = await apiClient.get('/admin/client-groups');
      setGroups(response.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/client-groups', formData);
      setShowCreate(false);
      setFormData({ name: '', description: '' });
      loadGroups();
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    try { await apiClient.delete(`/admin/client-groups/${id}`); loadGroups(); } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Client Groups</h1><p className="text-gray-600">Manage client groups for service visibility</p></div>
        <Button onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : 'Create Group'}</Button>
      </div>

      {showCreate && (
        <Card><CardHeader><CardTitle>Create Client Group</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g., VIP, DEFAULT" />
              <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>All Groups ({groups.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">Loading...</div> : groups.length === 0 ? <p className="text-center text-gray-500 py-8">No groups</p> : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><p className="font-medium text-gray-900">{group.name}</p><p className="text-sm text-gray-500">{group.description || 'No description'}</p></div>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(group.id)}>Delete</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
