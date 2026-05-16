/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, MapPin, BedDouble, Bath, Maximize, Info, LayoutGrid, ShieldCheck } from "lucide-react";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/urls";
import InquiryModal from "@/components/InquiryModal";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import { Property, PropertyImage } from "@/types";

export default function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated } = useAuthStore();
  const [id, setId] = useState("");
  const [property, setProperty] = useState<Property | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);

  useEffect(() => {
    params.then((value) => setId(value.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    api.get(`/properties/${id}`).then((res) => {
      setProperty(res.data);
      // Fetch similar properties
      const minPrice = res.data.price * 0.7;
      const maxPrice = res.data.price * 1.3;
      api.get(`/properties/?city=${res.data.city}&min_price=${minPrice}&max_price=${maxPrice}&limit=3`)
        .then(simRes => {
          const items = simRes.data?.data || simRes.data?.items || (Array.isArray(simRes.data) ? simRes.data : []);
          setSimilarProperties(items.filter((p: any) => p.id !== id));
        })
        .catch(() => {});
    });
    if (isAuthenticated) {
      api.get("/saved-properties/ids").then((res) => setSaved(res.data.includes(id))).catch(() => {});
    }
  }, [id, isAuthenticated]);

  const toggleSaved = async () => {
    if (!id) return;
    if (!isAuthenticated) {
      window.location.href = "/auth/login";
      return;
    }
    if (saved) {
      await api.delete(`/saved-properties/${id}`);
      setSaved(false);
    } else {
      await api.post(`/saved-properties/${id}`);
      setSaved(true);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="text-slate-500 font-medium animate-pulse">Loading luxury property...</p>
        </div>
      </div>
    );
  }

  const gallery = property.images || [];
  const image = gallery[activeImage];
  const move = (delta: number) => setActiveImage((current) => (current + delta + gallery.length) % gallery.length);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left Column: Gallery & Info */}
          <section className="lg:col-span-2 space-y-10">

            {/* Premium Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[16/10] bg-slate-200 rounded-3xl overflow-hidden group shadow-xl shadow-slate-200/50">
                {image ? (
                  <img
                    src={mediaUrl(image.url)}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium">No images available</div>
                )}

                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={() => move(-1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                      <ChevronLeft className="w-6 h-6 text-slate-800" />
                    </button>
                    <button
                      onClick={() => move(1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                      <ChevronRight className="w-6 h-6 text-slate-800" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wider">
                      {activeImage + 1} / {gallery.length}
                    </div>
                  </>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {gallery.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden transition-all ${idx === activeImage ? "ring-4 ring-indigo-500 scale-95 shadow-inner" : "opacity-70 hover:opacity-100"}`}
                    >
                      <img src={mediaUrl(img.url)} alt={property.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Property Info */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">
                      {property.listing_type}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest">
                      {property.property_type}
                    </span>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    {property.title}
                  </h1>
                  <p className="flex items-center gap-2 text-slate-500 mt-3 font-medium">
                    <MapPin className="w-5 h-5 text-indigo-500" />
                    {property.address}, {property.city}, {property.state}
                  </p>
                </div>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-50">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><BedDouble className="w-5 h-5" /></div>
                  <div >
                    <div className="text-sm font-bold text-slate-900">{property.bedrooms ?? "-"} Beds</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Bedrooms</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><Bath className="w-5 h-5" /></div>
                  <div >
                    <div className="text-sm font-bold text-slate-900">{property.bathrooms ?? "-"} Baths</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Bathrooms</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><Maximize className="w-5 h-5" /></div>
                  <div >
                    <div className="text-sm font-bold text-slate-900">{property.area_sqm ?? "-"} sqm</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Total Area</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><ShieldCheck className="w-5 h-5" /></div>
                  <div >
                    <div className="text-sm font-bold text-slate-900">Verified</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Status</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" /> Description
                </h2>
                <div className="text-slate-600 leading-relaxed text-lg">
                  {property.description || "No detailed description provided for this luxury property."}
                </div>
              </div>

              {/* Amenities */}
              {property.amenities?.length ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Premium Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((item) => (
                      <span key={item} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Location Placeholder */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Strategic Location</h2>
                <div className="bg-slate-100 rounded-3xl h-80 relative overflow-hidden group">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <MapPin className="w-12 h-12 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    <div className="text-center">
                      <p className="font-bold text-slate-600">{property.address}</p>
                      <p className="text-sm">{property.city}, {property.state}</p>
                    </div>
                    <div className="mt-4 bg-white px-4 py-2 rounded-full shadow-sm text-indigo-600 text-xs font-black uppercase tracking-widest border border-indigo-100">
                      Interactive Map Coming Soon
                    </div>
                  </div>
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                </div>
              </div>
            </div>

            {/* Similar Listings */}
            {similarProperties.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <LayoutGrid className="w-7 h-7 text-indigo-600" /> Similar Luxury Listings
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {similarProperties.map(sim => (
                    <Link key={sim.id} href={`/properties/${sim.id}`} className="group bg-white rounded-3xl shadow-sm border border-slate-100 p-4 flex gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="w-32 h-32 bg-slate-200 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                        {sim.images?.[0] ? (
                          <img src={mediaUrl(sim.images[0].url)} alt={sim.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Image</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <h4 className="font-bold text-slate-900 truncate text-lg group-hover:text-indigo-600 transition-colors">{sim.title}</h4>
                        <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {sim.city}, {sim.state}
                        </p>
                        <div className="text-indigo-600 font-black text-xl tracking-tight">
                          ₦{Number(sim.price).toLocaleString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Sidebar Actions */}
          <aside className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl shadow-slate-200/50 sticky top-24 space-y-6">
              <div className="text-center space-y-2">
                <div className="text-4xl font-black text-indigo-600 tracking-tight">
                  ₦{Number(property.price).toLocaleString()}
                </div>
                <p className="text-slate-500 capitalize font-medium">
                  {property.listing_type} {property.price_period ? `per ${property.price_period}` : ""}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                <button
                  onClick={() => setShowInquiry(true)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
                >
                  Inquire Now
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={toggleSaved}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${
                    saved
                    ? "bg-red-50 border-red-100 text-red-600"
                    : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
                  {saved ? "Saved to Collection" : "Save Property"}
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Verified Listing. Our agents have confirmed the ownership and details of this property to ensure a secure transaction.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium italic">
                  Looking for something else? <Link href="/" className="text-indigo-600 hover:underline font-bold">Browse all listings</Link>
                </p>
              </div>
            </div>
          </aside>

        </div>
      </main>

      {showInquiry && <InquiryModal propertyId={property.id} onClose={() => setShowInquiry(false)} />}
    </div>
  );
}
