'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  processingTime: string;
  isActive: boolean;
  sortOrder: number;
  category: { id: string; name: string };
  fields: { id: string; label: string; type: string; required: boolean; placeholder: string; sortOrder: number }[];
  groupAccess: { group: { id: string; name: string } }[];
}

interface Category {
  id: string;
  name: string;
}

interface ClientGroup {
  id: string;
  name: string;
}

const emptyService = {
  name: '',
  description: '',
  price: '',
  processingTime: '',
  categoryId: '',
  sortOrder: '0',
  groupIds: [] as string[],
  fields: [] as { label: string; type: string; required: boolean; placeholder: string; sortOrder: number }[],
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState(emptyService);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesRes, categoriesRes, groupsRes] = await Promise.all([
        apiClient.get('/admin/services'),
        apiClient.get('/admin/categories'),
        apiClient.get('/admin/client-groups'),
      ]);
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/services', {
        ...formData,
        price: parseFloat(formData.price as string),
        sortOrder: parseInt(formData.sortOrder as string) || 0,
      });
      setShowCreate(false);
      setFormData(emptyService);
      loadData();
    } catch (error) {
      console.error('Failed to create service:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await apiClient.patch(`/admin/services/${editing}`, {
        ...formData,
        price: parseFloat(formData.price as string),
        sortOrder: parseInt(formData.sortOrder as string) || 0,
      });
      setEditing(null);
      setFormData(emptyService);
      loadData();
    } catch (error) {
      console.error('Failed to update service:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await apiClient.delete(`/admin/services/${id}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const startEdit = (service: Service) => {
    setEditing(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      processingTime: service.processingTime || '',
      categoryId: service.category.id,
      sortOrder: service.sortOrder.toString(),
      groupIds: service.groupAccess.map((ga) => ga.group.id),
      fields: service.fields.map((f) => ({
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder || '',
        sortOrder: f.sortOrder,
      })),
    });
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { label: '', type: 'TEXT', required: false, placeholder: '', sortOrder: formData.fields.length }],
    });
  };

  const updateField = (index: number, field: Partial<typeof formData.fields[0]>) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], ...field };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index: number) => {
    setFormData({ ...formData, fields: formData.fields.filter((_, i) => i !== index) });
  };

  const toggleGroup = (groupId: string) => {
    const newGroupIds = formData.groupIds.includes(groupId)
      ? formData.groupIds.filter((id) => id !== groupId)
      : [...formData.groupIds, groupId];
    setFormData({ ...formData, groupIds: newGroupIds });
  };

  const ServiceForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <Input label="Price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required min="0" step="0.01" />
      </div>

      <Textarea label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          options={[{ value: '', label: 'Select category...' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <Input label="Processing Time" value={formData.processingTime} onChange={(e) => setFormData({ ...formData, processingTime: e.target.value })} placeholder="e.g., 24-48 hours" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Client Groups</label>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={`px-3 py-1 rounded-full text-sm ${formData.groupIds.includes(group.id) ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Dynamic Fields</label>
          <Button type="button" size="sm" variant="outline" onClick={addField}>Add Field</Button>
        </div>
        <div className="space-y-3">
          {formData.fields.map((field, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Input placeholder="Label" value={field.label} onChange={(e) => updateField(i, { label: e.target.value })} className="flex-1" />
              <Select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value })}
                options={[
                  { value: 'TEXT', label: 'Text' },
                  { value: 'TEXTAREA', label: 'Textarea' },
                  { value: 'NUMBER', label: 'Number' },
                  { value: 'SELECT', label: 'Select' },
                  { value: 'DATE', label: 'Date' },
                  { value: 'CHECKBOX', label: 'Checkbox' },
                  { value: 'FILE', label: 'File' },
                ]}
              />
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={field.required} onChange={(e) => updateField(i, { required: e.target.checked })} className="rounded" />
                Required
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeField(i)}>Remove</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={() => { setEditing(null); setShowCreate(false); setFormData(emptyService); }}>Cancel</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600">Manage services and dynamic fields</p>
        </div>
        <Button onClick={() => { setShowCreate(!showCreate); setEditing(null); setFormData(emptyService); }}>
          {showCreate ? 'Cancel' : 'Create Service'}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create Service</CardTitle></CardHeader>
          <CardContent><ServiceForm onSubmit={handleCreate} submitLabel="Create Service" /></CardContent>
        </Card>
      )}

      {editing && (
        <Card>
          <CardHeader><CardTitle>Edit Service</CardTitle></CardHeader>
          <CardContent><ServiceForm onSubmit={handleUpdate} submitLabel="Update Service" /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : services.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No services yet</p>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.category.name} | {formatCurrency(service.price)} | {service.fields.length} fields</p>
                      <div className="flex gap-1 mt-1">
                        {service.groupAccess.map((ga) => (
                          <span key={ga.group.id} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{ga.group.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => startEdit(service)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(service.id)}>Deactivate</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
