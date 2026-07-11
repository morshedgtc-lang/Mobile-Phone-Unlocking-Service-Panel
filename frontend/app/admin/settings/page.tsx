'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-bold text-gray-900">Settings</h1><p className="text-gray-600">System settings</p></div>

      <Card>
        <CardHeader><CardTitle>Platform Settings</CardTitle></CardHeader>
        <CardContent>
          <p className="text-gray-500">Settings management coming soon. Configure site name, SMTP, payment methods, and more.</p>
        </CardContent>
      </Card>
    </div>
  );
}
