/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  LogOut,
  Search,
  ChevronDown,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Home,
  PlusCircle,
  Send,
  TrendingUp,
  Upload,
  User,
  Edit3,
  Plus,
  BarChart3,
  BedDouble,
  Bath,
  Maximize,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/urls";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Property, Lead } from "@/types";
import AddPropertyForm from "@/components/dashboard/AddPropertyForm";
import PhotoManager from "@/components/dashboard/PhotoManager";
import ImageGalleryModal from "@/components/ImageGalleryModal";

/* ── Types ── */
interface TimelineEvent {
  id: string;
  inquiry_id: string;
  event_type: string;
  note: string | null;
  created_by_id: string | null;
  created_at: string;
}

/* ── Status badge component ── */
const statusStyles: Record<string, string> = {
  new: "bg-indigo-100 text-indigo-700",
  contacted: "bg-amber-100 text-amber-700",
  closed: "bg-emerald-100 text-emerald-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: any = { low: "bg-slate-100 text-slate-600", normal: "bg-blue-100 text-blue-600", high: "bg-red-100 text-red-600" };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[priority] || styles.normal}`}>
      {priority}
    </span>
  );
}

/* ── Timeline component ── */
function TimelinePanel({ events }: { events: TimelineEvent[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    status_change: <ChevronDown className="w-4 h-4" />,
    note: <MessageSquare className="w-4 h-4" />,
    follow_up: <Clock className="w-4 h-4" />,
  };

  if (events.length === 0) {
    return <p className="text-sm text-slate-400 italic">No activity recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
      {events.map((event) => (
        <div key={event.id} className="relative">
          <div className="absolute -left-[25px] bg-white p-1 rounded-full border border-slate-200 shadow-sm">
            {iconMap[event.event_type] || <Clock className="w-4 h-4 text-slate-400" />}
          </div>
          <div className="text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold capitalize text-slate-900">
                {event.event_type.replace("_", " ")}
              </span>
              <span className="text-slate-400 text-xs font-medium">
                {new Date(event.created_at).toLocaleString()}
              </span>
            </div>
            {event.note && <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{event.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Lead detail drawer ── */
function LeadDrawer({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => void;
}) {
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState<"note" | "follow_up">("note");
  const [followUpDate, setFollowUpDate] = useState(lead.follow_up_at?.split("T")[0] || "");

  const addTimelineEvent = async () => {
    if (!note.trim()) return;
    try {
      await api.post(`/inquiries/${lead.id}/timeline`, {
        event_type: noteType,
        note,
      });
      setNote("");
      onUpdate(lead.id, {});
    } catch (e) {
      console.error("Failed to add timeline event", e);
    }
  };

  const updateLead = async (updates: any) => {
    try {
      await api.patch(`/inquiries/${lead.id}/status`, updates);
      onUpdate(lead.id, updates);
    } catch (e) {
      alert("Failed to update lead");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="bg-slate-900/40 backdrop-blur-sm flex-1" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto p-8 animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900">Lead Intelligence</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-3xl">&times;</button>
        </div>

        <div className="space-y-6 mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Client</span>
              <p className="font-bold text-slate-900">{lead.sender_name || "Anonymous"}</p>
            </div>
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Property</span>
              <p className="font-bold text-slate-900">{lead.property_title || "—"}</p>
            </div>
          </div>
          <div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Initial Inquiry</span>
            <p className="text-slate-600 font-medium leading-relaxed italic">"{lead.message}"</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1 font-bold uppercase tracking-tighter">Status</span>
              <StatusBadge status={lead.status} />
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1 font-bold uppercase tracking-tighter">Priority</span>
              <PriorityBadge priority={lead.priority} />
            </div>
          </div>
          {lead.follow_up_at && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 flex items-center gap-3 font-bold text-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              Follow-up scheduled: {new Date(lead.follow_up_at).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Pipeline Stage</label>
            <div className="flex gap-2">
              {["new", "contacted", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateLead({ status: s })}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold capitalize transition-all ${
                    lead.status === s
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
               >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Lead Priority</label>
            <div className="flex gap-2">
              {["low", "normal", "high"].map((p) => (
                <button
                  key={p}
                  onClick={() => updateLead({ priority: p })}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold capitalize transition-all ${
                    lead.priority === p
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
               >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Next Touchpoint</label>
            <div className="flex gap-3">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-indigo-500"
              />
              <button
                onClick={() => updateLead({ follow_up_at: followUpDate })}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
             >
                Set Date
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Activity Log</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setNoteType("note")}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                  noteType === "note" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
             >
                Note
              </button>
              <button
                onClick={() => setNoteType("follow_up")}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                  noteType === "follow_up" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
             >
                Follow-up
              </button>
            </div>
            <div className="flex gap-3">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add an update or interaction note..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-indigo-500"
              />
              <button
                onClick={addTimelineEvent}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
             >
                Add
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Engagement Timeline</h3>
            <TimelinePanel events={lead.timeline_events || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<"leads" | "listings" | "add-property">("leads");
  const [editing, setEditing] = useState<Partial<Property> | null>(null);
  const [managingPhotos, setManagingPhotos] = useState<Property | null>(null);
  const [viewingImages, setViewingImages] = useState<Property | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [leadRes, listingRes] = await Promise.all([
        api.get("/inquiries/"),
        api.get("/properties/me/listings"),
      ]);
      setLeads(Array.isArray(leadRes.data) ? leadRes.data : leadRes.data.items ?? []);
      setListings(Array.isArray(listingRes.data) ? listingRes.data : listingRes.data.items ?? []);
    } catch (e) {
      console.error("Error fetching agent data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openLeadDetail = async (lead: Lead) => {
    try {
      const res = await api.get(`/inquiries/${lead.id}`);
      setSelectedLead(res.data);
    } catch (e) {
      console.error("Error fetching lead detail", e);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      await api.patch(`/inquiries/${id}/status`, updates);
      if (selectedLead?.id === id) {
        const res = await api.get(`/inquiries/${id}`);
        setSelectedLead(res.data);
      }
      fetchAll();
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const submitForReview = async (id: string) => {
    try {
      await api.post(`/properties/${id}/submit`);
      fetchAll();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Could not submit listing.");
    }
  };

  const archiveProperty = async (id: string) => {
    if (!confirm("Are you sure you want to archive this listing?")) return;
    try {
      await api.post(`/properties/${id}/archive`);
      fetchAll();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Archive failed.");
    }
  };

  const unarchiveProperty = async (id: string) => {
    try {
      await api.post(`/properties/${id}/unarchive`);
      fetchAll();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Unarchive failed.");
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Permanently delete this listing?")) return;
    try {
      await api.delete(`/properties/${id}`);
      fetchAll();
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
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          Agent<span className="text-indigo-500">Pro</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Management</div>
          <button
            onClick={() => { setEditing(null); setActiveTab("listings"); }}
            className={`flex items-center w-full p-3 rounded-xl transition-all ${activeTab === "listings" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
         >
            <Briefcase className="mr-3 w-5 h-5" /> Managed Listings
          </button>
          <button
            onClick={() => { setEditing(null); setActiveTab("leads"); }}
            className={`flex items-center w-full p-3 rounded-xl transition-all ${activeTab === "leads" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
         >
            <Users className="mr-3 w-5 h-5" /> Lead Pipeline
          </button>
          <button
            onClick={() => { setEditing(null); setActiveTab("add-property"); }}
            className={`flex items-center w-full p-3 rounded-xl transition-all ${activeTab === "add-property" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "hover:bg-slate-900 text-slate-400 hover:text-white"}`}
         >
            <PlusCircle className="mr-3 w-5 h-5" /> Add Property
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
            onClick={() => { logout(); router.push("/auth/login"); }}
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
              {activeTab === "leads" ? "Lead Pipeline" : activeTab === "listings" ? "Managed Properties" : "Add New Property"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">Optimize your sales funnel and property portfolio.</p>
          </div>
          {activeTab !== "add-property" && (
            <button
              onClick={() => setEditing({})}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
           >
              <Plus className="w-5 h-5" /> New Listing
            </button>
          )}
        </header>

        {loading ? (
          <div className="text-center py-32 text-slate-400 font-medium">Loading agent intelligence...</div>
        ) : (
          <div className="space-y-8">
            {activeTab === "leads" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Pipeline Overview</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-slate-900">{leads.length}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Leads</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-indigo-600">{leads.filter((l) => l.status === "new").length}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">New</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-amber-600">{leads.filter((l) => l.status === "contacted").length}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Contacted</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-black text-emerald-600">{leads.filter((l) => l.status === "closed").length}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Closed</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">KPI Performance</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <div className="text-lg font-black text-slate-900">₦2.4M</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Comm.</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-black text-slate-900">₦12.5k</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rev/SqFt</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-black text-indigo-600">1:12</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lead Ratio</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-black text-slate-900">42 Days</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg DOM</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Client</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Property</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Initial Message</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Priority</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {leads.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">No active leads found in your pipeline.</td></tr>
                      ) : (
                        leads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => openLeadDetail(lead)}>
                            <td className="px-6 py-4 text-sm text-slate-900 font-bold">{lead.sender_name || "Anonymous"}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 font-medium truncate max-w-xs">{lead.property_title || "—"}</td>
                            <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs italic opacity-70">{lead.message}</td>
                            <td className="px-6 py-4"><PriorityBadge priority={lead.priority} /></td>
                            <td className="px-6 py-4"><StatusBadge status={lead.status} /></td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-800 transition-colors">Details</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "listings" && !editing && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {listings.length === 0 ? (
                  <div className="col-span-full text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-500 font-medium">
                    No managed properties found in your portfolio.
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
            )}

            {(activeTab === "add-property" || editing) && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <AddPropertyForm initialData={editing} propertyId={editing?.id} onSuccess={() => { setEditing(null); setActiveTab("listings"); fetchAll(); }} />
              </div>
            )}
          </div>
        )}

        {selectedLead && (
          <LeadDrawer
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={handleUpdate}
          />
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
              fetchAll();
              const updated = listings.find(p => p.id === managingPhotos.id);
              if (updated) setManagingPhotos(updated);
            }}
          />
        )}
      </main>
    </div>
  );
}
