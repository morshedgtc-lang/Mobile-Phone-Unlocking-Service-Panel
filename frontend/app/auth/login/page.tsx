"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { LockKeyhole, Mail, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

function Particles() {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; size: number; duration: number; delay: number; depth: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 10,
        depth: Math.random() * 3 + 1,
      }))
    );
  }, []);

  if (particles.length === 0) return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "1000px" }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            translateZ: `${p.depth * 50}px`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, p.depth * 0.5 + 0.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function FloatingShapes() {
  const shapes = [
    { type: "cube", x: 15, y: 20, size: 60, color: "from-blue-500/20 to-cyan-500/20", duration: 25 },
    { type: "sphere", x: 85, y: 30, size: 80, color: "from-purple-500/20 to-pink-500/20", duration: 30 },
    { type: "cube", x: 75, y: 70, size: 50, color: "from-amber-500/20 to-orange-500/20", duration: 20 },
    { type: "sphere", x: 20, y: 75, size: 70, color: "from-green-500/20 to-emerald-500/20", duration: 28 },
    { type: "cube", x: 50, y: 50, size: 90, color: "from-indigo-500/20 to-violet-500/20", duration: 35 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "1200px" }}>
      {shapes.map((s, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-${s.type === "sphere" ? "full" : "2xl"} bg-gradient-to-br ${s.color} backdrop-blur-xl border border-white/10`}
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            transformStyle: "preserve-3d",
            boxShadow: "0 0 80px rgba(255,255,255,0.05)",
          }}
          animate={{
            y: [0, -40, 0],
            rotateX: [0, 15, 0],
            rotateY: [0, 25, 0],
            rotateZ: s.type === "cube" ? [0, 45, 0] : [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "perspective(800px) rotateX(60deg)",
          transformOrigin: "center center",
        }}
      >
        <motion.div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
          animate={{
            backgroundPosition: ["0 0", "0 60px"],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formDataObj = new FormData();
      formDataObj.append("username", formData.email);
      formDataObj.append("password", formData.password);

      const res = await apiClient.post("/auth/login", formDataObj);
      const { access_token, user } = res.data;
      login(access_token, user);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0e1a]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f1729] to-[#1a1040]" />
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent" />

      <FloatingShapes />
      <Particles />
      <AnimatedGrid />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
        style={{ perspective: "1200px" }}
      >
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative"
        >
          <div
            className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl opacity-30 blur-xl"
            style={{ transform: "translateZ(-20px)" }}
          />

          <Card
            className="relative border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden rounded-2xl"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none"
              style={{ transform: "translateZ(10px)" }}
            />

            <div className="relative p-8" style={{ transformStyle: "preserve-3d" }}>
              <motion.div
                className="flex justify-center mb-6"
                style={{ transform: "translateZ(30px)" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <motion.div
                    className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500/40 to-purple-500/40 blur-md"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transform: "translateZ(-5px)" }}
                  />
                </div>
              </motion.div>

              <motion.div
                className="text-center mb-8"
                style={{ transform: "translateZ(25px)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-blue-200/60 mt-2 text-sm">
                  Sign in to your admin panel
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, rotateX: -10 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-xl bg-red-500/10 text-red-300 text-sm border border-red-500/20 backdrop-blur-sm"
                      style={{ transform: "translateZ(20px)" }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  className="space-y-4"
                  style={{ transform: "translateZ(20px)" }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-300/50 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-blue-200/30 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="space-y-4"
                  style={{ transform: "translateZ(20px)" }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="relative group">
                    <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-blue-300/50 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-blue-200/30 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                      value={formData.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-blue-300/50 hover:text-blue-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center justify-between text-sm"
                  style={{ transform: "translateZ(15px)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500" />
                    <span className="text-blue-200/50 group-hover:text-blue-200/70 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-blue-400/70 hover:text-blue-400 transition-colors">Forgot password?</a>
                </motion.div>

                <motion.div
                  style={{ transform: "translateZ(25px)" }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    type="submit"
                    className="w-full py-6 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group"
                    isLoading={isLoading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Sign In to Panel
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.div>
              </form>

              <motion.div
                className="mt-6 pt-6 border-t border-white/5 text-center"
                style={{ transform: "translateZ(10px)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-sm text-blue-200/40">
                  Don't have an account?{" "}
                  <a href="#" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
                    Contact Admin
                  </a>
                </p>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.p
          className="text-center text-xs text-blue-200/20 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Phone Unlock Pro v2.0 &mdash; Enterprise GSM Service Panel
        </motion.p>
      </motion.div>
    </div>
  );
}
