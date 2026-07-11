'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  processingTime: string;
  category: { name: string };
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await apiClient.get('/services/client');
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <p className="text-gray-600">Browse available services</p>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-gray-500 py-8">No services available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{service.description || 'No description'}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{service.category.name}</span>
                  {service.processingTime && <span>{service.processingTime}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(service.price)}</span>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/dashboard/orders/new?service=${service.id}`)}
                  >
                    Order Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
