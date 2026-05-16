/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from "react";
import { Shield, CheckCircle, XCircle, Users, Home, LogOut, BarChart3, TrendingUp, Plus, Eye, LayoutGrid, Search } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/urls";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import ImageGalleryModal from "@/components/ImageGalleryModal";

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "analytics" | "audit">("pending");
  const [viewingImages, setViewingImages] = useState<any | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes, statsRes, auditRes] = await Promise.all([
        api.get("/admin/properties/pending"),
        api.get("/admin/properties"),
        api.get("/admin/analytics"),
        api.get("/admin/audit-logs")
      ]);
      setPendingListings(
        Array.isArray(pendingRes.data) ? pendingRes.data : (pendingRes.data.data || pendingRes.data.items || [])
      );
      setAllListings(
        Array.isArray(allRes.data) ? allRes.data : (allRes.data.data || allRes.data.items || [])
      );
      setStats(statsRes.data?.data || statsRes.data);
      setAuditLogs(Array.isArray(auditRes.data) ? auditRes.data : (auditRes.data.data || auditRes.data.items || []));
    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject" | "toggle_feature", currentFeatured?: boolean) => {
    try {
      if (action === "approve") {
        await api.put(`/admin/properties/${id}/approve`);
      } else if (action === "reject") {
        const note = window.prompt("Reason for rejection") || "Please update the listing details and photos.";
        await api.put(`/admin/properties/${id}/reject`, null, { params: { note } });
      } else if (action === "toggle_feature") {
        await api.put(`/admin/properties/${id}/feature`, null, { params: { featured: !currentFeatured } });
      }
      fetchData();
    } catch (e) {
      alert("Action failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Modern Sidebar */}
      <aside className="w-72 bg-slate-950 text-slate-300 flex flex-col sticky top-0 h-screen">
        <div className="p-8 text-2xl font-black text-white flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          Naija<span className="text-indigo-500">Admin</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Main Menu</div>
          <button
            onClick={() => setActiveTab("pending")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === "pending" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            <Shield className="mr-3 w-5 h-5" /> Moderation
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === "all" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            <Home className="mr-3 w-5 h-5" /> All Listings
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === "analytics" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            <BarChart3 className="mr-3 w-5 h-5" /> Analytics
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === "audit" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            <Users className="mr-3 w-5 h-5" /> User Audit
          </button>
        </nav>

        <div className="p-6 border-t border-slate-900 space-y-3">
          <button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center w-full p-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
          >
            <Plus className="mr-3 w-5 h-5" /> Create User
          </button>
          <button
            onClick={() => { logout(); router.push("/auth/login"); }}
            className="flex items-center w-full p-3 text-slate-500 hover:text-white transition-colors font-medium"
          >
            <LogOut className="mr-3 w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === "pending" ? "Property Moderation" :
               activeTab === "all" ? "All Listings" :
               activeTab === "analytics" ? "System Analytics" :
               "Audit Logs"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">Manage your real estate ecosystem and system health.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
              <Shield className="w-3 h-3" /> Super Admin
            </div>
          </div>
        </header>

        <div className="flex gap-3 mb-10 p-1 bg-slate-200/50 rounded-2xl w-fit">
          <button onClick={() => setActiveTab("pending")} className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === "pending" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Moderation ({pendingListings.length})</button>
          <button onClick={() => setActiveTab("all")} className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Listings ({allListings.length})</button>
          <button onClick={() => setActiveTab("analytics")} className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === "analytics" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Analytics</button>
          <button onClick={() => setActiveTab("audit")} className={`px-4 py-2 font-bold text-sm rounded-xl transition-all ${activeTab === "audit" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Audit</button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            <p className="mt-4 text-slate-500 font-medium">Loading administrative data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {viewingImages && (
              <ImageGalleryModal
                images={viewingImages.images || []}
                onClose={() => setViewingImages(null)}
              />
            )}

            {activeTab === "pending" && (
              pendingListings.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-medium shadow-sm">
                  Everything is up to date! No properties pending review.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pendingListings.map((listing: any) => (
                    <div key={listing.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden cursor-pointer hover:ring-2 ring-indigo-500 transition-all" onClick={() => setViewingImages(listing)}>
                          {listing.images?.[0] && <img src={mediaUrl(listing.images[0].url)} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(listing.id, "approve")} className="p-3 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all" title="Approve"><CheckCircle className="w-6 h-6" /></button>
                          <button onClick={() => handleAction(listing.id, "reject")} className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all" title="Reject"><XCircle className="w-6 h-6" /></button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-black text-lg text-slate-900 truncate">{listing.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">{listing.city}, {listing.state} • ₦{Number(listing.price).toLocaleString()}</p>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: {listing.id.slice(0,8)}</span>
                        <button onClick={() => setViewingImages(listing)} className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View Gallery
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === "analytics" && (
                stats ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Properties</div>
                        <div className="text-4xl font-black text-slate-900">{stats?.properties?.total ?? 0}</div>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="text-amber-600 text-xs font-black uppercase tracking-widest mb-2">Pending Review</div>
                        <div className="text-4xl font-black text-amber-700">{stats?.properties?.pending_review ?? 0}</div>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Users</div>
                        <div className="text-4xl font-black text-slate-900">{stats?.users?.total ?? 0}</div>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Staff Accounts</div>
                        <div className="text-4xl font-black text-slate-900">{(stats?.users?.agents ?? 0) + (stats?.users?.landlords ?? 0)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-6 h-6 text-indigo-600" />
                          <h2 className="font-black text-slate-900">Property Performance</h2>
                        </div >
                        <div className="space-y-3">
                          {[
                            { label: "Avg. Listing Price", value: `₦${Math.round(stats?.properties?.avg_price || 0).toLocaleString()}` },
                            { label: "Revenue / Sq Ft", value: `₦${Math.round(stats?.properties?.avg_revenue_per_sqft || 0).toLocaleString()}` },
                            { label: "Sale Ratio", value: `${Math.round(stats?.properties?.sale_ratio || 0)}%` },
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-sm font-medium text-slate-500">{item.label}</span>
                              <span className="font-bold text-slate-900">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-6 h-6 text-indigo-600" />
                          <h2 className="font-black text-slate-900">Growth & Ops</h2>
                        </div >
                        <div className="space-y-3">
                          {[
                            { label: "Conversion Rate", value: `${Math.round(stats?.marketing?.conversion_rate || 0)}%` },
                            { label: "Avg. Days on Market", value: `${Math.round(stats?.operations?.avg_days_on_market || 0)} days` },
                            { label: "Total Visits", value: (stats?.marketing?.total_visits ?? 0).toLocaleString() },
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <span className="text-sm font-medium text-slate-500">{item.label}</span>
                              <span className="font-bold text-slate-900">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-500/30 text-white space-y-6">
                        <div className="flex items-center gap-3">
                          <Shield className="w-6 h-6 text-indigo-200" />
                          <h2 className="font-black">Financial Benchmarks</h2>
                        </div >
                        <div className="space-y-3">
                          {[
                            { label: "Estimated ROI", value: stats?.financial_benchmarks?.est_roi ?? "N/A" },
                            { label: "Estimated NOI", value: stats?.financial_benchmarks?.est_noi ?? "N/A" },
                            { label: "GRM Average", value: stats?.financial_benchmarks?.grm_avg ?? "N/A" },
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                              <span className="text-sm font-medium text-indigo-100">{item.label}</span>
                              <span className="font-bold text-white">{item.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 bg-black/20 rounded-2xl text-[10px] text-indigo-200 italic leading-relaxed font-medium">
                          {stats?.financial_benchmarks?.note ?? "No benchmark data available for the current period."}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 font-medium">
                    Failed to load analytics data. Please refresh the page.
                  </div>
                )
            )}

            {activeTab === "audit" && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Actor</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Action</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Target</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {auditLogs.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">No audit logs found.</td></tr>
                      ) : (
                        auditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{log.actor_id}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">{log.action}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">{log.target_type}: {log.target_id}</td>
                            <td className="px-6 py-4 text-sm text-slate-400 font-medium">{new Date(log.created_at).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
            )}
                        {activeTab === "all" && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr >
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Property</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Price</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Featured</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allListings.map(listing => (
                      <tr key={listing.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{listing.title}</div>
                          <div className="text-xs text-slate-400 font-medium">{listing.city}, {listing.state}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 text-sm">₦{Number(listing.price).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            listing.status === "approved" ? "bg-green-100 text-green-700" :
                            listing.status === "pending_review" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>{listing.status.replace("_", " ")}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleAction(listing.id, "toggle_feature", listing.featured)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${listing.featured ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          >
                            {listing.featured ? "Featured" : "Regular"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <Link href={`/properties/${listing.id}`} className="bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showCreateUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create User Account</h2>
                <button onClick={() => setShowCreateUser(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-3xl">&times;</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const data = {
                  full_name: target.full_name.value,
                  email: target.email.value,
                  password: target.password.value,
                  role: target.role.value,
                  phone: target.phone.value,
                };
                try {
                  await api.post("/admin/users", data);
                  alert("User created successfully");
                  setShowCreateUser(false);
                  fetchData();
                } catch (err: any) {
                  const msg = err.response?.data?.detail || "Creation failed";
                  alert(msg);
                }
              }} className="space-y-5">
                <div >
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input name="full_name" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all" />
                </div>
                <div >
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input name="email" type="email" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all" />
                </div>
                <div >
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
                  <input name="password" type="password" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all" />
                </div>
                <div >
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input name="phone" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 ring-indigo-500 outline-none transition-all" />
                </div>
                <div >
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">System Role</label>
                  <select name="role" required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 ring-indigo-500 outline-none transition-all">
                    <option value="landlord">Landlord</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-6">
                  Complete Account Creation
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
