/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Mail, ArrowRight } from "lucide-react";

import api from "@/lib/api/client";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AUTH_ROUTES } from "@/constants/apiRoutes";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await api.post(AUTH_ROUTES.LOGIN, {
        email: data.email,
        password: data.password,
      });

      const { access_token } = response.data;
      setToken(access_token);

      const me = await api.get("/auth/me");
      setUser(me.data);

      switch (me.data.role) {
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "agent":
          router.push("/dashboard/agent");
          break;
        default:
          router.push("/dashboard/landlord");
      }
    } catch (error) {
      alert("Authentication failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* Visual Side */}
        <div className="hidden md:flex md:w-1/2 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-transparent to-indigo-600/30" />
          <div className="relative z-10 p-12 flex flex-col justify-end h-full">
            <h2 className="text-4xl font-black text-white tracking-tight mb-4 leading-tight">
              Welcome to <br /> <span className="text-indigo-400">NaijaProperty</span>
            </h2>
            <p className="text-slate-300 font-medium max-w-sm leading-relaxed">
              The most trusted platform for premium real estate in Nigeria. Manage your listings and leads with professional precision.
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
              <p className="text-slate-500 font-medium mt-2">Please enter your details to sign in</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register("email")}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-xs font-bold text-indigo-600 hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    {...register("password")}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 font-bold">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
              >
                Sign In
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 font-medium">
                Don't have an account? <Link href="/auth/signup" className="text-indigo-600 font-bold hover:underline">Create one today</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
