
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Search } from "lucide-react";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/urls";
import InquiryModal from "@/components/InquiryModal";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";

interface PropertyImage {
  id: string;
  url: string;
  caption?: string | null;
  is_primary?: boolean;
}

interface Property {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price: number;
  price_period: string;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string;
  state: string;
  images: PropertyImage[];
}

function PropertyCarousel({ property }: { property: Property }) {
  const gallery = property.images || [];
  const [index, setIndex] = useState(0);
  const image = gallery[index];

  const move = (delta: number) => {
    if (gallery.length <= 1) return;
    setIndex((current) => (current + delta + gallery.length) % gallery.length);
  };

  return (
    <div className="relative h-48 bg-gray-200">
      <Link href={`/properties/${property.id}`} className="block h-full">
        {image ? (
          <img src={mediaUrl(image.url)} alt={image.caption || property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </Link>
      <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded text-xs font-bold text-gray-800 shadow">{property.listing_type.toUpperCase()}</div>
      {image?.caption ? <div className="absolute bottom-3 left-3 bg-black/65 text-white text-xs px-2 py-1 rounded">{String(image.caption)}</div> : null}
      {gallery.length > 1 ? (
        <>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(-1); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow" title="Previous image">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); move(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 rounded-full shadow" title="Next image">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 right-3 bg-white/90 text-gray-800 text-xs px-2 py-1 rounded">{index + 1}/{gallery.length}</div>
        </>
      ) : null}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    city: "",
    property_type: "",
    min_price: "",
    max_price: "",
    state: "",
    bedrooms: "",
    listing_type: "",
    sort: "newest",
  });
  const [metadata, setMetadata] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/properties/${query ? `?${query}` : ""}`);
      const data = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setProperties(data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/properties/meta/context").then(res => setMetadata(res.data?.data || res.data)).catch(() => {});
    api.get("/properties/stats").then(res => setStats(res.data?.data || res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [query, filters.sort]);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (!isAuthenticated || !token) {
      setSavedIds([]);
      return;
    }
    api.get("/saved-properties/ids")
      .then((res) => setSavedIds(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        setSavedIds([]);
      });
  }, [isAuthenticated]);

  const updateFilter = (name: string, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", city: "", property_type: "", min_price: "", max_price: "", bedrooms: "", state: "", listing_type: "", sort: "newest" });
  };

  const toggleSaved = async (propertyId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/auth/login";
      return;
    }
    const saved = savedIds.includes(propertyId);
    if (saved) {
      await api.delete(`/saved-properties/${propertyId}`);
      setSavedIds((ids) => ids.filter((id) => id !== propertyId));
    } else {
      await api.post(`/saved-properties/${propertyId}`);
      setSavedIds((ids) => [...ids, propertyId]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Find Property in Nigeria</h1>
          <p className="text-xl max-w-2xl mb-8 text-blue-100">Browse labeled photo tours, amenities, and verified property details before you make an inquiry.</p>
          <div className="bg-white rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 text-gray-900">
            <div className="md:col-span-2 flex items-center gap-2 border rounded-md px-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} placeholder="Search title, city, area" className="w-full py-2 outline-none" />
            </div>
            <select value={filters.state} onChange={(e) => updateFilter("state", e.target.value)} className="border rounded-md px-3 py-2 bg-white">
              <option value="">State</option>
              {metadata?.states?.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} className="border rounded-md px-3 py-2 bg-white">
              <option value="">City</option>
              {metadata?.popular_cities?.[filters.state] ?
                metadata.popular_cities[filters.state].map((c: string) => <option key={c} value={c}>{String(c)}</option>) :
                <option disabled value="">Please select a state first</option>
              }
            </select>
            <select value={filters.property_type} onChange={(e) => updateFilter("property_type", e.target.value)} className="border rounded-md px-3 py-2 bg-white">
              <option value="">Property type</option>
              {metadata?.property_types ? 
                Object.entries(metadata.property_types).map(([k, v]: [string, any]) => <option key={k} value={k}>{String(v)}</option>) : 
                null
              }
            </select>
            <input value={filters.min_price} onChange={(e) => updateFilter("min_price", e.target.value)} placeholder="Min price" type="number" className="border rounded-md px-3 py-2" title="Minimum Price" />
            <input value={filters.max_price} onChange={(e) => updateFilter("max_price", e.target.value)} placeholder="Max price" type="number" className="border rounded-md px-3 py-2" title="Maximum Price" />
            <select value={filters.bedrooms} onChange={(e) => updateFilter("bedrooms", e.target.value)} className="border rounded-md px-3 py-2 bg-white">
              <option value="">Beds</option>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}+ Beds</option>)}
            </select>
            <select value={filters.listing_type} onChange={(e) => updateFilter("listing_type", e.target.value)} className="border rounded-md px-3 py-2 bg-white">
              <option value="">Any Type</option>
              {metadata?.listing_types ? 
                Object.entries(metadata.listing_types).map(([k, v]: [string, any]) => <option key={k} value={k}>{String(v)}</option>) : 
                <>
                  <option value="rent">Rent</option>
                  <option value="sale">Sale</option>
                  <option value="lease">Lease</option>
                  <option value="shortlet">Shortlet</option>
                </>
              }
            </select>
            <select value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)} className="border rounded-md px-3 py-2 bg-white font-medium">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <button type="button" onClick={clearFilters} className="border rounded-md px-3 py-2 font-medium hover:bg-gray-50 bg-gray-50">Clear</button>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div className="text-gray-500 text-sm font-medium mb-1">Total Listings</div>
            <div className="text-3xl font-black text-gray-900">{stats?.total_listings || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div className="text-gray-500 text-sm font-medium mb-1">Verified Users</div>
            <div className="text-3xl font-black text-gray-900">{stats?.total_users || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div className="text-gray-500 text-sm font-medium mb-1">Total Views</div>
            <div className="text-3xl font-black text-gray-900">{stats?.total_views?.toLocaleString() || 0}</div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Listings</h2>
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-lg shadow-sm"><p className="text-lg">No properties found.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((prop) => {
              const saved = savedIds.includes(prop.id);
              return (
                <div key={prop.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <PropertyCarousel property={prop} />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between gap-3 mb-2">
                      <Link href={`/properties/${prop.id}`} className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-blue-600">{prop.title}</Link>
                      <button onClick={() => toggleSaved(prop.id)} className={`shrink-0 p-2 rounded-full border ${saved ? "text-red-600 bg-red-50 border-red-200" : "text-gray-500 hover:text-red-600"}`} title={saved ? "Remove saved" : "Save property"}>
                        <Heart className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">{prop.city}, {prop.state}</p>
                    <div className="text-blue-600 font-extrabold text-xl mb-4">₦{Number(prop.price).toLocaleString()} {prop.listing_type === "rent" ? <span className="text-sm font-normal text-gray-500">/{prop.price_period}</span> : null}</div>
                    <div className="flex text-gray-500 text-sm space-x-4 mb-6">
                      {prop.bedrooms ? <span>{prop.bedrooms} Beds</span> : null}
                      {prop.bathrooms ? <span>{prop.bathrooms} Baths</span> : null}
                    </div>
                    <button onClick={() => setSelectedPropertyId(prop.id)} className="mt-auto w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors duration-200 py-2 rounded-lg font-medium">Inquire Now</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-300 py-8 text-center mt-auto"><p>© 2026 NaijaProperty. All rights reserved.</p></footer>
      {selectedPropertyId && <InquiryModal propertyId={selectedPropertyId} onClose={() => setSelectedPropertyId(null)} />}
    </div>
  );
}
