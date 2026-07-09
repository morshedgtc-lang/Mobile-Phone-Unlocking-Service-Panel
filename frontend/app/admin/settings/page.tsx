"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-gradient tracking-tight">System Settings</h1>
        <p className="text-sm text-white/35 mt-1.5">Configure your unlocking service platform.</p>
      </div>
      <Card title="General Settings">
        <div className="space-y-4 relative z-10">
          <Input label="Site Name" defaultValue="Phone Unlock Pro" />
          <Input label="Support Email" defaultValue="support@example.com" />
          <Input label="Default Currency" defaultValue="USD" />
          <Button>Save Settings</Button>
        </div>
      </Card>
      <Card title="Service Configuration">
        <div className="space-y-3 relative z-10">
          <div className="glass-row flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Auto-approve orders</p>
              <p className="text-xs text-white/35">Skip admin approval for new orders</p>
            </div>
            <div className="glass-toggle" />
          </div>
          <div className="glass-row flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Maintenance Mode</p>
              <p className="text-xs text-white/35">Disable all services temporarily</p>
            </div>
            <div className="glass-toggle" />
          </div>
        </div>
      </Card>
      <Card title="Security">
        <div className="glass-row flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white/80">Force 2FA for all admins</p>
              <p className="text-xs text-white/35">Require two-factor authentication</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
      </Card>
    </div>
  );
}
