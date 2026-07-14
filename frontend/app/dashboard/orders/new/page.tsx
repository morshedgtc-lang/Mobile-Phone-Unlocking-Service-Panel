'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  processingTime?: string;
  fields: {
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder: string;
    options: string;
  }[];
}

function OrderFormInner({ serviceId }: { serviceId: string | null }) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        const initial: Record<string, string> = {};
        service.fields.forEach((f) => {
          initial[f.id] = '';
        });
        setFieldValues(initial);
      }
    }
  }, [serviceId, services]);

  const loadServices = async () => {
    try {
      const response = await apiClient.get('/services/client');
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setError('');
    setSubmitting(true);

    try {
      await apiClient.post('/orders', {
        serviceId: selectedService.id,
        notes,
        fieldValues: Object.entries(fieldValues).map(([serviceFieldId, value]) => ({
          serviceFieldId,
          value,
        })),
      });
      router.push('/dashboard/orders');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Failed to create order';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: Service['fields'][0]) => {
    switch (field.type) {
      case 'TEXTAREA':
        return (
          <Textarea
            key={field.id}
            label={field.label + (field.required ? ' *' : '')}
            value={fieldValues[field.id] || ''}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case 'SELECT': {
        const options = field.options ? JSON.parse(field.options) : [];
        return (
          <Select
            key={field.id}
            label={field.label + (field.required ? ' *' : '')}
            value={fieldValues[field.id] || ''}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
            options={[{ value: '', label: 'Select...' }, ...options]}
            required={field.required}
          />
        );
      }
      case 'NUMBER':
        return (
          <Input
            key={field.id}
            label={field.label + (field.required ? ' *' : '')}
            type="number"
            value={fieldValues[field.id] || ''}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      case 'DATE':
        return (
          <Input
            key={field.id}
            label={field.label + (field.required ? ' *' : '')}
            type="date"
            value={fieldValues[field.id] || ''}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
            required={field.required}
          />
        );
      case 'CHECKBOX':
        return (
          <div key={field.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={field.id}
              checked={fieldValues[field.id] === 'true'}
              onChange={(e) =>
                setFieldValues({
                  ...fieldValues,
                  [field.id]: e.target.checked ? 'true' : 'false',
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={field.id} className="text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );
      default:
        return (
          <Input
            key={field.id}
            label={field.label + (field.required ? ' *' : '')}
            type="text"
            value={fieldValues[field.id] || ''}
            onChange={(e) => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
        <p className="text-gray-600">Select a service and fill in the details</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Service</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                label="Service"
                value={selectedService?.id || ''}
                onChange={(e) => {
                  const service = services.find((s) => s.id === e.target.value);
                  setSelectedService(service || null);
                  if (service) {
                    const initial: Record<string, string> = {};
                    service.fields.forEach((f) => {
                      initial[f.id] = '';
                    });
                    setFieldValues(initial);
                  }
                }}
                options={[
                  { value: '', label: 'Choose a service...' },
                  ...services.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </CardContent>
          </Card>

          {selectedService && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {selectedService.fields.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Required Information</h3>
                      {selectedService.fields
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map(renderField)}
                    </div>
                  )}

                  <Textarea
                    label="Additional Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information..."
                  />

                  <Button type="submit" loading={submitting} className="w-full">
                    Place Order — {formatCurrency(selectedService.price)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedService ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-medium text-gray-900">{selectedService.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedService.price)}
                    </p>
                  </div>
                  {selectedService.processingTime && (
                    <div>
                      <p className="text-sm text-gray-600">Processing Time</p>
                      <p className="text-gray-900">{selectedService.processingTime}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Select a service to see details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-8 text-gray-500">Loading order form…</div>
      }
    >
      <OrderFormInnerWrapper />
    </Suspense>
  );
}

function OrderFormInnerWrapper() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service');
  return <OrderFormInner serviceId={serviceId} />;
}
