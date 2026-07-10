"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { BookOpen, Copy, CheckCircle, ChevronDown, ChevronRight, Shield, Code, Terminal, Globe } from "lucide-react";

const CodeBlock = ({ title, language, code }: { title: string; language: string; code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.06]">
        <span className="text-xs font-semibold text-white/50">{title}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-[#0a0e1a]">
        <code className="text-sm text-white/70 font-mono leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
};

const EndpointBlock = ({ method, path, description, requestBody, responseBody }: {
  method: string;
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/20",
    PUT: "bg-amber-500/20 text-amber-400 border-amber-500/20",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/20",
  };

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${methodColors[method]}`}>
            {method}
          </span>
          <code className="text-sm font-mono text-white/70">{path}</code>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/35 hidden sm:block">{description}</span>
          {expanded ? <ChevronDown size={14} className="text-white/30" /> : <ChevronRight size={14} className="text-white/30" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.04] space-y-3">
          <p className="text-sm text-white/50">{description}</p>
          {requestBody && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-2">Request Body</p>
              <pre className="p-3 rounded-lg bg-[#0a0e1a] overflow-x-auto">
                <code className="text-xs text-white/60 font-mono leading-relaxed whitespace-pre">{requestBody}</code>
              </pre>
            </div>
          )}
          {responseBody && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-2">Response</p>
              <pre className="p-3 rounded-lg bg-[#0a0e1a] overflow-x-auto">
                <code className="text-xs text-white/60 font-mono leading-relaxed whitespace-pre">{responseBody}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function ApiDocsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/[0.06] flex items-center justify-center">
          <BookOpen size={24} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gradient tracking-tight">API Documentation</h1>
          <p className="text-sm text-white/35 mt-1">Integrate with Phone Unlock Pro using our REST API.</p>
        </div>
      </div>

      {/* Authentication */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card title="Authentication" subtitle="Secure your API requests with your API key">
          <div className="space-y-4 relative z-10">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Shield size={18} className="text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white/70">
                  All API requests must include your API key in the <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-blue-400 font-mono text-xs">X-API-Key</code> header.
                </p>
                <p className="text-sm text-white/40 mt-2">
                  Your API key starts with <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-amber-400 font-mono text-xs">rsl_</code> and can be found in your Reseller Panel overview.
                </p>
                <p className="text-sm text-white/40 mt-2">
                  Never expose your API key in client-side code. Always make API calls from your server.
                </p>
              </div>
            </div>
            <CodeBlock
              title="Header Format"
              language="http"
              code={`X-API-Key: rsl_xxxxxxxxxxxxxxxxxxxxxxxx`}
            />
          </div>
        </Card>
      </motion.div>

      {/* Base URL */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card title="Base URL" subtitle="All endpoints are relative to this base URL">
          <div className="relative z-10">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <Globe size={18} className="text-emerald-400 shrink-0" />
              <code className="text-sm font-mono text-white/70">https://phoneunlockpro.com/api/v1</code>
            </div>
            <p className="text-xs text-white/30 mt-3 ml-1">All requests must be made over HTTPS. Calls over plain HTTP will be rejected.</p>
          </div>
        </Card>
      </motion.div>

      {/* Endpoints */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card title="Endpoints" subtitle="Available API endpoints">
          <div className="space-y-3 relative z-10">
            <EndpointBlock
              method="POST"
              path="/orders"
              description="Create a new unlock order"
              requestBody={`{
  "service_id": "uuid-of-service",
  "order_data": {
    "IMEI": "123456789012345",
    "Model": "iPhone 14 Pro",
    "Carrier": "AT&T"
  },
  "customer_notes": "Optional notes"
}`}
              responseBody={`{
  "id": "order-uuid",
  "status": "waiting",
  "price_paid": 25.00,
  "service": { "id": "...", "name": "AT&T Unlock" },
  "created_at": "2026-01-15T10:30:00Z"
}`}
            />

            <EndpointBlock
              method="GET"
              path="/orders"
              description="List all your orders"
              responseBody={`[
  {
    "id": "order-uuid",
    "status": "completed",
    "price_paid": 25.00,
    "service": { "id": "...", "name": "AT&T Unlock" },
    "admin_result": "{ \\"unlock_key\\": \\"123456\\" }",
    "created_at": "2026-01-15T10:30:00Z"
  }
]`}
            />

            <EndpointBlock
              method="GET"
              path="/orders/{order_id}"
              description="Get a specific order by ID"
              responseBody={`{
  "id": "order-uuid",
  "status": "completed",
  "price_paid": 25.00,
  "service": { "id": "...", "name": "AT&T Unlock" },
  "order_data": { "IMEI": "123456789012345" },
  "admin_result": "{ \\"unlock_key\\": \\"123456\\", \\"instructions\\": \\"..." }",
  "created_at": "2026-01-15T10:30:00Z"
}`}
            />

            <EndpointBlock
              method="GET"
              path="/services"
              description="List all available services"
              responseBody={`[
  {
    "id": "service-uuid",
    "name": "AT&T iPhone Unlock",
    "retail_price": 25.00,
    "processing_time": "1-3 days",
    "requirements": "[{\\"label\\": \\"IMEI\\", \\"type\\": \\"text\\", \\"required\\": true}]"
  }
]`}
            />

            <EndpointBlock
              method="GET"
              path="/balance"
              description="Get your current reseller balance"
              responseBody={`{
  "balance": 1250.00,
  "currency": "USD"
}`}
            />
          </div>
        </Card>
      </motion.div>

      {/* Code Examples */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card title="Code Examples" subtitle="Ready-to-use code snippets in multiple languages">
          <div className="space-y-6 relative z-10">
            <CodeBlock
              title="cURL"
              language="bash"
              code={`curl -X POST https://phoneunlockpro.com/api/v1/orders \\
  -H "X-API-Key: rsl_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service_id": "your-service-uuid",
    "order_data": {
      "IMEI": "123456789012345",
      "Model": "iPhone 14 Pro"
    }
  }'`}
            />

            <CodeBlock
              title="PHP (cURL)"
              language="php"
              code={`<?php
$ch = curl_init('https://phoneunlockpro.com/api/v1/orders');

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: rsl_your_api_key_here',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'service_id' => 'your-service-uuid',
        'order_data' => [
            'IMEI' => '123456789012345',
            'Model' => 'iPhone 14 Pro',
        ],
    ]),
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
echo "Status Code: " . $httpCode . "\\n";
print_r($data);
?>`}
            />

            <CodeBlock
              title="Node.js (fetch)"
              language="javascript"
              code={`const response = await fetch('https://phoneunlockpro.com/api/v1/orders', {
  method: 'POST',
  headers: {
    'X-API-Key': 'rsl_your_api_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    service_id: 'your-service-uuid',
    order_data: {
      IMEI: '123456789012345',
      Model: 'iPhone 14 Pro',
    },
  }),
});

const data = await response.json();
console.log('Order created:', data);`}
            />

            <CodeBlock
              title="Python (requests)"
              language="python"
              code={`import requests

url = "https://phoneunlockpro.com/api/v1/orders"
headers = {
    "X-API-Key": "rsl_your_api_key_here",
    "Content-Type": "application/json",
}
payload = {
    "service_id": "your-service-uuid",
    "order_data": {
        "IMEI": "123456789012345",
        "Model": "iPhone 14 Pro",
    },
}

response = requests.post(url, json=payload, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")`}
            />
          </div>
        </Card>
      </motion.div>

      {/* Error Codes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card title="Error Codes" subtitle="HTTP status codes and their meanings">
          <div className="overflow-x-auto -mx-6 -mb-6 relative z-10">
            <table className="table-glass">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-6 pb-4 font-semibold">Code</th>
                  <th className="px-6 pb-4 font-semibold">Meaning</th>
                  <th className="px-6 pb-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: "200", meaning: "OK", description: "Request succeeded" },
                  { code: "201", meaning: "Created", description: "Resource created successfully" },
                  { code: "400", meaning: "Bad Request", description: "Invalid request body or missing required fields" },
                  { code: "401", meaning: "Unauthorized", description: "Invalid or missing API key" },
                  { code: "403", meaning: "Forbidden", description: "API key does not have permission for this resource" },
                  { code: "404", meaning: "Not Found", description: "The requested resource does not exist" },
                  { code: "422", meaning: "Unprocessable Entity", description: "Validation error in request data" },
                  { code: "429", meaning: "Too Many Requests", description: "Rate limit exceeded. Try again later" },
                  { code: "500", meaning: "Server Error", description: "Internal server error. Contact support" },
                ].map((err) => (
                  <tr key={err.code} className="group">
                    <td className="px-6 py-3">
                      <span className="font-mono text-sm font-bold text-white/70">{err.code}</span>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-white/55">{err.meaning}</td>
                    <td className="px-6 py-3 text-sm text-white/35">{err.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
