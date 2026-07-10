"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { Search, Info, AlertCircle, Clock, ArrowRight, ArrowLeft, CheckCircle, Wallet } from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

interface ServiceReq {
  label: string;
  type: "text" | "file" | "select";
  required: boolean;
  options?: string[];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  retail_price: number;
  processing_time: string;
  requirements: string;
  category_id: string;
}

export default function ResellerManualOrderPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceReqs, setServiceReqs] = useState<ServiceReq[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceSearch, setServiceSearch] = useState("");
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, userRes] = await Promise.all([
          apiClient.get("/services"),
          apiClient.get("/users/me"),
        ]);
        setServices(servicesRes.data);
        setUserBalance(Number(userRes.data.balance) || 0);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setServicesLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setDynamicFields({});
    setPhotoUrls({});
    setNotes("");
    try {
      const parsed = JSON.parse(service.requirements);
      setServiceReqs(Array.isArray(parsed) ? parsed : []);
    } catch {
      setServiceReqs([]);
    }
    setStep(2);
  };

  const handleFieldChange = (label: string, value: string) => {
    setDynamicFields(prev => ({ ...prev, [label]: value }));
  };

  const handlePhotoChange = (label: string, url: string | null) => {
    setPhotoUrls(prev => {
      const next = { ...prev };
      if (url) {
        next[label] = url;
      } else {
        delete next[label];
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    for (const req of serviceReqs) {
      if (req.required && req.type === "file" && !photoUrls[req.label]) {
        alert(`Please upload: ${req.label}`);
        return;
      }
      if (req.required && req.type !== "file" && !dynamicFields[req.label]?.trim()) {
        alert(`Please fill in: ${req.label}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const orderData: Record<string, string> = {};

      for (const req of serviceReqs) {
        if (req.type === "file") {
          if (photoUrls[req.label]) {
            orderData[req.label] = photoUrls[req.label];
          }
        } else {
          orderData[req.label] = dynamicFields[req.label] || "";
        }
      }

      const res = await apiClient.post("/orders", {
        service_id: selectedService.id,
        order_data: orderData,
        customer_notes: notes || null,
      });

      const price = selectedService.retail_price;
      const newBalance = userBalance - price;
      setRemainingBalance(newBalance);
      setUserBalance(newBalance);
      setLastOrderId(res.data?.id || null);
      setOrderSuccess(true);
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to create order"));
    } finally {
      setIsLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="space-y-8 animate-fade-in">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Card className="text-center py-12">
            <div className="relative z-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Order Submitted!</h2>
              <p className="text-sm text-white/40 max-w-md mx-auto">
                Your manual order has been placed successfully.
              </p>
              {lastOrderId && (
                <p className="text-xs text-white/30 font-mono">
                  Order ID: <span className="text-white/50">#{String(lastOrderId).substring(0, 8)}</span>
                </p>
              )}
              {remainingBalance !== null && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <Wallet size={14} className="text-blue-400" />
                  <span className="text-sm text-white/50">Remaining Balance:</span>
                  <span className="text-sm font-bold text-white">${remainingBalance.toFixed(2)}</span>
                </div>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={() => { setOrderSuccess(false); setStep(1); setSelectedService(null); setDynamicFields({}); setPhotoUrls({}); setRemainingBalance(null); setLastOrderId(null); }}>
                  Create Another Order
                </Button>
                <Button onClick={() => window.location.href = "/reseller/orders"}>
                  View My Orders
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Manual Order</h1>
          <p>Select a service and provide the required device details.</p>
        </div>
        <div className="step-indicator">
          <span className={step >= 1 ? "step-active" : "step-inactive"}>1. Select Service</span>
          <span className="step-arrow">{'\u2192'}</span>
          <span className={step >= 2 ? "step-active" : "step-inactive"}>2. Order Details</span>
        </div>
      </div>

      {step === 1 ? (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-4 h-4 w-4 text-white/20" />
            <input
              className="glass-input h-12 text-base pl-11"
              placeholder="Search for your phone model or service..."
              value={serviceSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceSearch(e.target.value)}
            />
          </div>

          {servicesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm text-white/30">Loading services...</span>
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 text-sm text-white/30">No services available at this time.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services
                .filter(s => !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || (s.description && s.description.toLowerCase().includes(serviceSearch.toLowerCase())))
                .map((service) => {
                  let reqs: ServiceReq[] = [];
                  try { reqs = JSON.parse(service.requirements); } catch {}
                  return (
                    <Card
                      key={service.id}
                      className="cursor-pointer group"
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-white group-hover:text-blue-400 transition-colors">{service.name}</h3>
                          <div className="flex items-center gap-4 mt-3 text-xs text-white/35">
                            <span className="flex items-center gap-1.5"><Clock size={12}/> {service.processing_time}</span>
                            <span className="flex items-center gap-1.5"><Info size={12}/> {reqs.length} field{reqs.length !== 1 ? "s" : ""} required</span>
                          </div>
                          {reqs.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {reqs.map((r, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 border border-white/[0.04]">
                                  {r.label} {r.required && "*"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-xl font-extrabold text-gradient">${service.retail_price.toFixed(2)}</p>
                          <Button variant="outline" size="sm" className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            Select <ArrowRight size={14} className="ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2">
            <Card title="Order Details" subtitle="Fill in the required information for this service">
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {serviceReqs.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-4">No specific requirements for this service. Add notes if needed.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {serviceReqs.map((req, idx) => {
                      if (req.type === "file") {
                        return (
                          <div key={idx} className="md:col-span-2">
                            <FileUpload
                              label={req.label}
                              required={req.required}
                              value={photoUrls[req.label]}
                              onChange={(url) => handlePhotoChange(req.label, url)}
                            />
                          </div>
                        );
                      }
                      if (req.type === "select") {
                        return (
                          <div key={idx} className="w-full space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 leading-none">
                              {req.label} {req.required && <span className="text-red-400">*</span>}
                            </label>
                            <select
                              className="flex w-full rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-4 py-3 text-sm text-white/85 outline-none transition-all duration-300 focus:border-blue-500/30"
                              value={dynamicFields[req.label] || ""}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(req.label, e.target.value)}
                              required={req.required}
                            >
                              <option value="" disabled>Select...</option>
                              {req.options?.map((opt, oi) => (
                                <option key={oi} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="w-full space-y-1.5">
                          <Input
                            label={`${req.label} ${req.required ? "*" : ""}`}
                            placeholder={`Enter ${req.label.toLowerCase()}`}
                            required={req.required}
                            value={dynamicFields[req.label] || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(req.label, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <Input
                  label="Additional Notes"
                  placeholder="Any specific instructions for the technician..."
                  as="textarea"
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                />

                <div className="flex gap-4 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1" type="button">
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={isLoading}>
                    Confirm & Pay ${Number(selectedService?.retail_price).toFixed(2)}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Order Summary">
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-sm">
                  <span className="text-white/35">Service:</span>
                  <span className="font-medium text-white/70">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/35">Delivery Time:</span>
                  <span className="font-medium text-white/70">{selectedService?.processing_time}</span>
                </div>
                <div className="glass-divider my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white/55">Total Cost:</span>
                  <span className="text-xl font-extrabold text-gradient">${Number(selectedService?.retail_price).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Card title="Balance">
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-sm">
                  <span className="text-white/35">Current Balance:</span>
                  <span className="font-medium text-white/70">${userBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/35">Order Cost:</span>
                  <span className="font-medium text-red-400">-${Number(selectedService?.retail_price).toFixed(2)}</span>
                </div>
                <div className="glass-divider my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white/55">After Payment:</span>
                  <span className={`text-lg font-extrabold ${(userBalance - Number(selectedService?.retail_price)) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ${(userBalance - Number(selectedService?.retail_price)).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="!border-blue-500/10 !bg-blue-500/[0.02]">
              <div className="flex gap-3 relative z-10">
                <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-blue-300/60">
                  <p className="font-semibold text-blue-300">Balance Deduction</p>
                  <p className="mt-0.5">Your reseller balance will be deducted immediately upon confirmation.</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
