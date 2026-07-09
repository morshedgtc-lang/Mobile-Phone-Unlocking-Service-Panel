"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, Shield, Moon } from "lucide-react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-gradient tracking-tight">Settings</h1>
        <p className="text-sm text-white/35 mt-1.5">Customize your experience.</p>
      </div>
      <Card title="Preferences">
        <div className="space-y-3 relative z-10">
          <div className="glass-row flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={20} className="text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white/80">Dark Mode</p>
                <p className="text-xs text-white/35">Always enabled for the glass UI</p>
              </div>
            </div>
            <div className="glass-toggle active" />
          </div>
          <div className="glass-row flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-purple-400" />
              <div>
                <p className="text-sm font-medium text-white/80">Email Notifications</p>
                <p className="text-xs text-white/35">Receive order updates via email</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`glass-toggle ${notifications ? "active" : ""}`}
            >
              <span className="sr-only">Toggle notifications</span>
            </button>
          </div>
        </div>
      </Card>
      <Card title="Account Security">
        <div className="space-y-3 relative z-10">
          <div className="glass-row flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white/80">Two-Factor Auth</p>
                <p className="text-xs text-white/35">Add extra security to your account</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
