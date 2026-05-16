"use client";

import React from "react";
import {
  Shield, CheckCircle, XCircle, Users, Home,
  LogOut, BarChart3, TrendingUp, PlusCircle,
  MessageSquare, User, Briefcase, Search
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardShellProps {
  role: "admin" | "landlord" | "agent";
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  title?: string;
}

const ROLE_CONFIG = {
  admin: {
    sidebarColor: "bg-red-950",
    borderColor: "border-red-900",
    accentColor: "bg-red-900",
    hoverColor: "hover:bg-red-900/50",
    brand: "AdminPanel",
    nav: [
      { id: "pending", label: "Moderation", icon: Shield },
      { id: "all", label: "All Listings", icon: Home },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "users", label: "User Audit", icon: Users },
    ]
  },
  landlord: {
    sidebarColor: "bg-indigo-900",
    borderColor: "border-indigo-800",
    accentColor: "bg-indigo-800",
    hoverColor: "hover:bg-indigo-800",
    brand: "NaijaProperty",
    nav: [
      { id: "listings", label: "My Listings", icon: Home },
      { id: "add-property", label: "Add Property", icon: PlusCircle },
      { id: "inquiries", label: "Inquiries", icon: MessageSquare },
      { id: "profile", label: "My Profile", icon: User },
    ]
  },
  agent: {
    sidebarColor: "bg-slate-900",
    borderColor: "border-slate-800",
    accentColor: "bg-slate-800",
    hoverColor: "hover:bg-slate-800",
    brand: "AgentPro",
    nav: [
      { id: "listings", label: "Managed Listings", icon: Briefcase },
      { id: "leads", label: "Lead Pipeline", icon: Users },
      { id: "search", label: "Search Properties", icon: Search },
      { id: "profile", label: "My Profile", icon: User },
    ]
  }
};

export default function DashboardShell({
  role,
  activeTab,
  setActiveTab,
  children,
  title
}: DashboardShellProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const config = ROLE_CONFIG[role];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`w-64 ${config.sidebarColor} text-white flex flex-col`}>
        <div className={`p-6 text-2xl font-bold border-b ${config.borderColor}`}>{config.brand}</div>
        <nav className="flex-1 p-4 space-y-2">
          {config.nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                activeTab === item.id ? config.accentColor : config.hoverColor
              }`}
            >
              <item.icon className="mr-3 w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        <div className={`p-4 border-t ${config.borderColor}`}>
          <button
            onClick={() => { logout(); router.push("/auth/login"); }}
            className="flex items-center w-full p-3 text-gray-300 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{title || "Dashboard"}</h1>
          <div className="flex items-center gap-3">
             <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
               role === 'admin' ? 'bg-red-100 text-red-700' :
               role === 'landlord' ? 'bg-indigo-100 text-indigo-700' :
               'bg-slate-100 text-slate-700'
             }`}>
               {role}
             </span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
