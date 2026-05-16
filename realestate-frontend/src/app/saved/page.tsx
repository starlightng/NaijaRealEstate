/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Home, Loader2, Trash2, ArrowRight, MapPin, BedDouble, Bath, Maximize } from "lucide-react";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/urls";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Property } from "@/types";

export default function SavedPropertiesPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/saved");
      return;
    }
    fetchSaved();
  }, [isAuthenticated]);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await api.get("/saved-properties/");
      setSavedProperties(res.data);
    } catch (err) {
      console.error("Failed to fetch saved properties", err);
    } finally {
      setLoading(false);
    }
  };

  const removeSaved = async (propertyId: string) => {
    try {
      await api.delete(`/saved-properties/${propertyId}`);
      setSavedProperties(prev => prev.filter(p => p.property.id !== propertyId));
    } catch (err) {
      alert("Failed to remove from saved");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
        {/* Page Header */}
        <div className="relative bg-slate-900 rounded-3xl p-8 md:p-12 mb-12 overflow-hidden shadow-2xl shadow-slate-900/20">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                <span className="text-indigo-400 text-sm font-black uppercase tracking-widest">My Collection</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Saved <span className="text-indigo-400">Properties</span>
              </h1>
              <p className="text-slate-400 max-w-md font-medium">
                Your curated selection of dream spaces. Keep track of the properties you love and inquire when you're ready.
              </p>
            </div>
            <Link
              href="/"
              className="group bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg shadow-white/10"
            >
              Browse More
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <Heart className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-slate-500 font-bold tracking-tight animate-pulse">Retrieving your favorites...</p>
          </div>
        ) : savedProperties.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center flex flex-col items-center justify-center">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mb-8 ring-8 ring-slate-50">
              <Home className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Your collection is empty</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed font-medium">
              You haven't saved any properties yet. Explore Nigeria's most premium listings and build your dream home shortlist.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {savedProperties.map((item) => {
              const prop = item.property as Property;
              const primary = prop.images?.find((i: any) => i.is_primary) || prop.images?.[0];

              return (
                <div key={prop.id} className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                  <div className="relative h-56 bg-slate-200 overflow-hidden">
                    {primary ? (
                      <img
                        src={mediaUrl(primary.url)}
                        alt={prop.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">No image</div>
                    )}

                    <button
                      onClick={() => removeSaved(prop.id)}
                      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      {prop.listing_type}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <Link href={`/properties/${prop.id}`} className="text-xl font-black text-slate-900 line-clamp-1 hover:text-indigo-600 transition-colors">
                        {prop.title}
                      </Link>
                      <div className="flex items-center gap-1 text-slate-500 text-sm mt-1 font-medium">
                        <MapPin className="w-3 h-3" /> {prop.city}, {prop.state}
                      </div>
                    </div>

                    <div className="text-indigo-600 font-black text-2xl mb-6 tracking-tight">
                      ₦{Number(prop.price).toLocaleString()}
                      {prop.listing_type === "rent" && <span className="text-sm font-bold text-slate-400 ml-1">/{prop.price_period}</span>}
                    </div>

                    <div className="flex items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-wider mb-6 border-t border-slate-50 pt-4">
                      {prop.bedrooms && <div className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {prop.bedrooms} Bed</div>}
                      {prop.bathrooms && <div className="flex items-center gap-1"><Bath className="w-3 h-3" /> {prop.bathrooms} Bath</div>}
                      {prop.area_sqm && <div className="flex items-center gap-1"><Maximize className="w-3 h-3" /> {prop.area_sqm} m²</div>}
                    </div>

                    <Link
                      href={`/properties/${prop.id}`}
                      className="mt-auto w-full text-center py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-md flex items-center justify-center gap-2 group"
                    >
                      View Property
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-2xl font-black text-white mb-4">Naija<span className="text-indigo-500">Property</span></div>
          <p className="text-sm font-medium opacity-60 mb-8">Connecting Nigerians to their dream spaces since 2026.</p>
          <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/saved" className="hover:text-white transition-colors">Saved</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
          </div>
          <p className="text-[10px] opacity-40 font-medium">© 2026 NaijaProperty Platform. All rights reserved.</p>
        </div>
      </footer >
    </div>
  );
}
