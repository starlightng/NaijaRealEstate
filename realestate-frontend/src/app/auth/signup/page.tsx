/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, Mail, Lock, User, Briefcase, ArrowRight, ChevronDown } from 'lucide-react';
import api from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must include an uppercase letter').regex(/\d/, 'Password must include a number'),
  full_name: z.string().min(2, 'Full name is required'),
  role: z.enum(['landlord', 'agent']),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'landlord' }
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await api.post('/auth/register', data);
      router.push('/auth/login');
    } catch (error) {
      alert('Signup failed. Email might already exist.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px]">

        {/* Visual Side */}
        <div className="hidden md:flex md:w-1/2 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1560518883-ce090516a52c?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-transparent to-indigo-600/30" />
          <div className="relative z-10 p-12 flex flex-col justify-end h-full">
            <div className="p-4 bg-indigo-600/20 backdrop-blur-md border border-white/10 rounded-2xl w-fit mb-6">
              <UserPlus className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-4 leading-tight">
              Join the <span className="text-indigo-400">Elite</span> <br /> Network
            </h2>
            <p className="text-slate-300 font-medium max-w-sm leading-relaxed">
              Whether you're a landlord looking for quality tenants or an agent expanding your portfolio, NaijaProperty is your premium gateway to the market.
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
              <p className="text-slate-500 font-medium mt-2">Start your premium real estate journey today</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('full_name')}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                {errors.full_name && <p className="text-xs text-red-500 font-bold">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('email')}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 font-bold">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">I am a...</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    {...register('role')}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-900 appearance-none cursor-pointer"
                  >
                    <option value="landlord">Landlord</option>
                    <option value="agent">Real Estate Agent</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
              >
                Create Account
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 font-medium">
                Already have an account? <Link href="/auth/login" className="text-indigo-600 font-bold hover:underline">Sign in now</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
