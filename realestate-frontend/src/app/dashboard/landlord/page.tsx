/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Eye, Home, LogOut, MessageSquare, PlusCircle, Send, TrendingUp, Upload, User, Edit3, Plus, BedDouble, Bath, Maximize, ShieldCheck } from "lucide-react";
import { Property, Lead } from "@/types";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/urls";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import AddPropertyForm from "@/components/dashboard/AddPropertyForm";
import InquiriesList from "@/components/dashboard/InquiriesList";
import PhotoManager from "@/components/dashboard/PhotoManager";
import ImageGalleryModal from "@/components/ImageGalleryModal";

export default function LandlordDashboard() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"listings" | "add-property" | "inquiries">("listings");
  const [listings, setListings] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [editing, setEditing] = useState<Partial<Property> | null>(null);
  const [managingPhotos, setManagingPhotos] = useState<Property | null>(null);
  const [viewingImages, setViewingImages] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const [listingRes, leadRes] = await Promise.all([
        api.get("/properties/me/listings"),
        api.get("/inquiries/"),
      ]);
      setListings(Array.isArray(listingRes.data) ? listingRes.data : listingRes.data.items ?? []);
      setLeads(Array.isArray(leadRes.data) ? leadRes.data : []);
    } catch (e) {
      console.error("Error fetching dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "listings") fetchListings();
  }, [activeTab]);

  const stats = useMemo(() => {
    const totalViews = listings.reduce((sum, item) => sum + Number(item.view_count || 0), 0);
    const totalInquiries = listings.reduce((sum, item) => sum + Number(item.inquiry_count || 0), 0);
    const approved = listings.filter((item) => item.status === "approved").length;
    const pending = listings.filter((item) => item.status === "pending_review").length;
    const avgPrice = listings.length ? listings.reduce((sum, item) => sum + Number(item.price || 0), 0) / listings.length : 0;
    const conversion = totalViews ? ((totalInquiries / totalViews) * 100).toFixed(1) : "0.0";

    const totalArea = listings.reduce((sum, item) => sum + Number(item.area_sqm || 0), 0);
    const revPerSqFt = totalArea ? listings.reduce((sum, item) => sum + Number(item.price || 0), 0) / totalArea : 0;

    const now = new Date();
    const avgDaysOnMarket = listings.length
      ? listings.reduce((sum, item) => {
          const created = new Date(item.created_at);
          const diff = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
          return sum + diff;
        }, 0) / listings.length
      : 0;

    return { totalViews, totalInquiries, approved, pending, avgPrice, conversion, revPerSqFt, avgDaysOnMarket };
  }, [listings]);

  const submitForReview = async (id: string) => {
    try {
      await api.post(`/properties/${id}/submit`);
      await fetchListings();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Could not submit listing.");
    }
  };

  const uploadImages = async (id: string, files: FileList | null) => {
    if (!files?.length) return;
    const data = new FormData();
    Array.from(files).forEach((file) => data.append("files", file));
    try {
      await api.post(`/uploads/properties/${id}/images`, data, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchListings();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Upload failed.");
    }
  };

  const archiveProperty = async (id: string) => {
    if (!confirm("Are you sure you want to archive this listing? It will no longer be visible to the public.")) return;
    try {
      await api.post(`/properties/${id}/archive`);
      await fetchListings();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Archive failed.");
    }
  };

  const unarchiveProperty = async (id: string) => {
    try {
      await api.post(`/properties/${id}/unarchive`);
      await fetchListings();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Unarchive failed.");
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this listing? This action cannot be undone.")) return;
    try {
      await api.delete(`/properties/${id}`);
      await fetchListings();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Delete failed.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 text-slate-300 flex flex-col sticky top-0 h-screen">
        <div className="p-8 text-2xl font-black text-white flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          Naija<span className="text-indigo-500">Property</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Dashboard</div>
          <button
            onClick={() => { setEditing(null); setActiveTab("listings"); }}
            className={`flex items-center w-full p-3 rounded-xl transition-all ${activeTab === "listings" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            <Home className="mr-3 w-5 h-5" /> My Listings
          </button>
          <button
            onClick={() => { setEditing(null); setActiveTab("add-property"); }}
            className={`flex items-center w-full p-3 rounded-xl transition-all ${activeTab === "add-property" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            <PlusCircle className="mr-3 w-5 h-5" /> Add Property
          </button>
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`flex items-center w-full p-3 rounded-xl transition-all ${activeTab === "inquiries" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            <MessageSquare className="mr-3 w-5 h-5" /> Inquiries
          </button>
          <button
            onClick={() => router.push("/dashboard/profile")}
            className={`flex items-center w-full p-3 rounded-xl transition-all hover:bg-slate-900 text-slate-400 hover:text-white`}
          >
            <User className="mr-3 w-5 h-5" /> My Profile
          </button>
        </nav>

        <div className="p-6 border-t border-slate-900">
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center w-full p-3 text-slate-500 hover:text-white transition-colors font-medium"
          >
            <LogOut className="mr-3 w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "listings" ? "My Properties" : activeTab === "inquiries" ? "Leads & Inquiries" : "Add New Property"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">Welcome back! Here is what's happening with your portfolio.</p>
          </div>
          <button
            onClick={() => setEditing({})}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus className="w-5 h-5" /> Add Property
          </button>
        </header>

        {activeTab === "listings" && !editing && (
          <div className="space-y-12">
            {/* Premium Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Home className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Listings</div>
                </div>
                <div className="text-3xl font-black text-slate-900">{listings.length}</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Eye className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Views</div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats.totalViews.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-50 rounded-lg text-green-600"><MessageSquare className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Leads</div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats.totalInquiries}</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><TrendingUp className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conv. Rate</div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats.conversion}%</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><BarChart3 className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg Price</div>
                </div>
                <div className="text-xl font-black text-slate-900 truncate">₦{Math.round(stats.avgPrice).toLocaleString()}</div>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Send className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</div>
                </div>
                <div className="text-3xl font-black text-slate-900">{stats.pending}</div>
              </div>
            </div>

            {/* Pipeline Summary */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Lead Pipeline</h2>
                  <p className="text-sm text-slate-500 font-medium">Track your conversion journey</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                {["new", "contacted", "closed"].map((status) => {
                  const count = leads.filter((lead) => lead.status === status).length;
                  return (
                    <div key={status} className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-center min-w-[120px]">
                      <div className="text-2xl font-black text-slate-900">{count}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{status}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-32 text-slate-400 font-medium">Loading your luxury portfolio...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {listings.length === 0 ? (
                  <div className="col-span-full text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">
                    You haven't listed any properties yet.
                  </div>
                ) : (
                  listings.map((property) => {
                    const primary = property.images?.find((img) => img.is_primary) || property.images?.[0];
                    return (
                      <div key={property.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col">
                        <div className="relative h-48 bg-slate-200 overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity" onClick={() => setViewingImages(property)}>
                          {primary ? <img src={mediaUrl(primary.url)} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">No image</div>}
                          <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                            {property.status.replace("_", " ")}
                          </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <h3 className="font-black text-xl text-slate-900 mb-2 truncate">{property.title}</h3>
                          <p className="text-indigo-600 font-black text-2xl mb-4 tracking-tight">₦{Number(property.price ?? 0).toLocaleString()}</p>

                          <div className="flex gap-3 mb-6 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            {property.bedrooms && <div className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {property.bedrooms} Bed</div>}
                            {property.bathrooms && <div className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.bathrooms} Bath</div>}
                            {property.area_sqm && <div className="flex items-center gap-1"><Maximize className="w-3 h-3" /> {property.area_sqm} m²</div>}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-auto">
                            <button onClick={() => setEditing(property)} className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold"><Edit3 className="w-3 h-3" /> Edit</button>
                            <button onClick={() => setManagingPhotos(property)} className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold"><Upload className="w-3 h-3" /> Photos</button>
                            {property.status === "draft" && (
                              <button onClick={() => submitForReview(property.id)} className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-xs font-bold"><Send className="w-3 h-3" /> Submit</button>
                            )}
                            {property.status === "approved" && (
                              <button onClick={() => archiveProperty(property.id)} className="inline-flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors text-xs font-bold">Archive</button>
                            )}
                            {property.status === "archived" && (
                              <button onClick={() => unarchiveProperty(property.id)} className="inline-flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 border border-green-100 rounded-xl hover:bg-green-100 transition-colors text-xs font-bold">Unarchive</button>
                            )}
                            <button onClick={() => deleteProperty(property.id)} className="inline-flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-xs font-bold">Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              )
            }
          </div>
        )}

        {(activeTab === "add-property" || editing) && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <AddPropertyForm initialData={editing} propertyId={editing?.id} onSuccess={() => { setEditing(null); setActiveTab("listings"); fetchListings(); }} />
          </div>
        )}

        {activeTab === "inquiries" && !editing && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <InquiriesList />
          </div>
        )}

        {viewingImages && (
          <ImageGalleryModal
            images={viewingImages.images || []}
            onClose={() => setViewingImages(null)}
          />
        )}

        {managingPhotos && (
          <PhotoManager
            property={managingPhotos}
            onClose={() => setManagingPhotos(null)}
            onUpdate={() => {
              fetchListings();
              const updated = listings.find(p => p.id === managingPhotos.id);
              if (updated) setManagingPhotos(updated);
            }}
          />
        )}
      </main>
    </div>
  );
}
