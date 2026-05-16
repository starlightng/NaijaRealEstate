
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Heart, LogOut, User, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api/client";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (isAuthenticated && token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
    } catch (err: any) {
      if (err.response?.status === 401) logout();
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black tracking-tight text-slate-900 hover:text-indigo-600 transition-colors">
              Naija<span className="text-indigo-600">Property</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`text-sm font-semibold transition-colors ${pathname === "/" ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"}`}>Browse</Link>

            {isAuthenticated ? (
              <>
                <Link href="/saved" className={`text-sm font-semibold flex items-center gap-1.5 transition-colors ${pathname === "/saved" ? "text-indigo-600" : "text-slate-600 hover:text-indigo-600"}`}>
                  <Heart className="w-4 h-4" />
                  Saved
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-500 hover:text-indigo-600 relative transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-indigo-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50/50">
                        <span className="font-bold text-slate-900 text-sm">Notifications</span>
                        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">Mark all as read</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-10 text-center text-slate-400 text-sm italic">No notifications yet</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => !n.is_read && markAsRead(n.id)}
                              className={`px-4 py-4 hover:bg-slate-50 cursor-pointer border-b last:border-0 transition-colors ${!n.is_read ? "bg-indigo-50/30" : ""}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-sm font-bold ${!n.is_read ? "text-indigo-900" : "text-slate-900"}`}>{n.title}</span>
                                {!n.is_read && <span className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.body}</p>
                              <span className="text-[10px] text-slate-400 mt-2 block font-medium">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                  <Link href={`/dashboard/${user?.role}`} className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors bg-slate-100 px-4 py-2 rounded-full">
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-5">
                <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">Login</Link>
                <Link href="/auth/signup" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t px-4 pt-4 pb-8 space-y-3 shadow-xl animate-in slide-in-from-top-2">
          <Link href="/" className="block p-3 font-semibold text-slate-700 border-b border-slate-50 hover:text-indigo-600 transition-colors">Browse Listings</Link>
          {isAuthenticated ? (
            <>
              <Link href="/saved" className="block p-3 font-semibold text-slate-700 border-b border-slate-50 hover:text-indigo-600 transition-colors">Saved Properties</Link>
              <Link href={`/dashboard/${user?.role}`} className="block p-3 font-bold text-indigo-600 border-b border-slate-50">Dashboard</Link>
              <button onClick={handleLogout} className="w-full text-left p-3 font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block p-3 font-semibold text-slate-700 border-b border-slate-50 hover:text-indigo-600 transition-colors">Login</Link>
              <Link href="/auth/signup" className="block p-3 font-bold text-indigo-600">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
