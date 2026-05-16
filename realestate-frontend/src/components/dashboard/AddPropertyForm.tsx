
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import api from "@/lib/api/client";

const PHOTO_PERSPECTIVES = ["Front View", "Living Room", "Kitchen", "Bedroom"];

const AMENITIES_BY_TYPE: Record<string, string[]> = {
  house: [
    "Constant Power Supply",
    "Backup Power Supply",
    "Swimming Pool",
    "Security",
    "Parking Space",
    "Water Treatment",
    "CCTV",
    "Boys Quarter",
    "Fitted Kitchen",
    "Garden",
  ],
  apartment: [
    "Constant Power Supply",
    "Backup Power Supply",
    "Elevator",
    "Security",
    "Parking Space",
    "Water Treatment",
    "Gym",
    "Swimming Pool",
    "Balcony",
    "Serviced Apartment",
  ],
  commercial: [
    "Constant Power Supply",
    "Backup Power Supply",
    "Security",
    "Parking Space",
    "CCTV",
    "Loading Bay",
    "Open Floor Plan",
    "Reception Area",
    "Conference Room",
    "High Foot Traffic",
  ],
};

export default function AddPropertyForm({ onSuccess, initialData, propertyId }: { onSuccess: () => void; initialData?: any; propertyId?: string }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    property_type: initialData?.property_type || "house",
    listing_type: initialData?.listing_type || "rent",
    price: initialData?.price ? String(initialData.price) : "",
    price_period: initialData?.price_period || "monthly",
    bedrooms: initialData?.bedrooms ? String(initialData.bedrooms) : "",
    bathrooms: initialData?.bathrooms ? String(initialData.bathrooms) : "",
    area_sqm: initialData?.area_sqm ? String(initialData.area_sqm) : "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "Lagos",
  });
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities || []);
  const [photos, setPhotos] = useState<Record<string, File | null>>(
    Object.fromEntries(PHOTO_PERSPECTIVES.map((label) => [label, null]))
  );
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ states: string[], popular_cities: Record<string, string[]>, loading: boolean }>({
    states: [],
    popular_cities: {},
    loading: true
  });

  useEffect(() => {
    api.get("/properties/meta/context").then(res => {
      // Axios res.data is the body. Body should be {status: "success", data: {...}}
      // but we handle cases where it might be raw data too.
      const responseBody = res.data;
      const contextData = responseBody?.data || responseBody;
      
      if (contextData && typeof contextData === 'object') {
        setMeta({
          states: contextData.states || [],
          popular_cities: contextData.popular_cities || {},
          loading: false
        });
      }
    }).catch(err => {
      console.error("Failed to fetch meta context", err);
      setMeta(prev => ({ ...prev, loading: false }));
    });
  }, []);

  const amenityOptions = useMemo(() => AMENITIES_BY_TYPE[formData.property_type] || [], [formData.property_type]);
  const selectedPhotoCount = Object.values(photos).filter(Boolean).length;
  const requiresPerspectivePhotos = !propertyId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "property_type") {
      const allowed = AMENITIES_BY_TYPE[value] || [];
      setAmenities((current) => current.filter((item) => allowed.includes(item)));
    }

    if (name === "state") {
      // Reset city if state changes to avoid invalid state-city combinations
      setFormData(prev => ({ ...prev, state: value, city: "" }));
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((current) =>
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]
    );
  };

  const setPerspectivePhoto = (label: string, file: File | null) => {
    setPhotos((current) => ({ ...current, [label]: file }));
  };

  const uploadPerspectivePhotos = async (targetPropertyId: string) => {
    const data = new FormData();
    PHOTO_PERSPECTIVES.forEach((label) => {
      const file = photos[label];
      if (file) {
        data.append("files", file);
        data.append("captions", label);
      }
    });

    if (Array.from(data.keys()).length === 0) return;

    await api.post(`/uploads/properties/${targetPropertyId}/images`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresPerspectivePhotos && selectedPhotoCount < PHOTO_PERSPECTIVES.length) {
      alert("Please upload all four labeled property photos before saving.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms, 10) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms, 10) : null,
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
        amenities,
      };

      let targetPropertyId = propertyId;
      if (propertyId) {
        await api.put(`/properties/${propertyId}`, payload);
      } else {
        const created = await api.post("/properties/", payload);
        targetPropertyId = created.data.id;
      }

      if (targetPropertyId) {
        await uploadPerspectivePhotos(targetPropertyId);
      }

      alert(propertyId ? "Property updated successfully!" : "Property added with photos as draft!");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to save property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-6 text-gray-800">{propertyId ? "Edit Property" : "Add New Property"}</h2>
      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
          <input required name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg text-black" placeholder="E.g., 4 Bedroom Duplex in Lekki" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
            <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white text-black">
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
              <option value="room">Room</option>
              <option value="shortlet">Shortlet</option>
              <option value="warehouse">Warehouse</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Listing Type</label>
            <select name="listing_type" value={formData.listing_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white text-black">
              <option value="rent">Rent</option>
              <option value="sale">Sale</option>
              <option value="lease">Lease</option>
              <option value="shortlet">Shortlet</option>
            </select>
          </div>
        </div>

        {amenityOptions.length > 0 && (
          <section className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {amenityOptions.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 rounded-md bg-white border px-3 py-2 text-sm text-black">
                  <input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="h-4 w-4 accent-indigo-600" />
                  {amenity}
                </label>
              ))}
            </div>
          </section>
        )}

        <section className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Labeled Listing Photos</h3>
            <span className="text-xs text-gray-500">{selectedPhotoCount}/{PHOTO_PERSPECTIVES.length} selected</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PHOTO_PERSPECTIVES.map((label) => (
              <label key={label} className="border border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="font-semibold text-black">{label}</div>
                      <div className="text-xs text-gray-500">{photos[label]?.name || "JPEG, PNG, or WebP"}</div>
                    </div>
                  </div>
                  {photos[label] ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : null}
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setPerspectivePhoto(label, e.target.files?.[0] || null)} />
              </label>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₦)</label>
            <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg text-black" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Price Period</label>
            <select name="price_period" value={formData.price_period} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white text-black">
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="once">Once</option>
              <option value="per_night">Per Night</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
            <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg text-black" placeholder="3" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bathrooms</label>
            <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg text-black" placeholder="2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Area (sqm)</label>
            <input type="number" name="area_sqm" value={formData.area_sqm} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg text-black" placeholder="240" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
            <select required name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white text-black">
              <option value="">{meta.loading ? "Loading States..." : "Select State"}</option>
              {meta.states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">City / Area</label>
            <select required name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white text-black">
              <option value="">{meta.loading ? "Loading Cities..." : "Select City"}</option>
              {meta.popular_cities[formData.state]?.map(c => <option key={c} value={c}>{c}</option>) ||
               <option disabled value="">Please select a state first</option>}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Address</label>
            <input required name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg text-black" placeholder="Street, House No, etc." />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea required name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-4 py-2 border rounded-lg text-black" placeholder="Describe the property, access roads, neighborhood, payment terms, and standout features."></textarea>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? "Saving..." : propertyId ? "Save Changes" : "Save Draft With Photos"}
          </button>
        </div>
      </form>
    </div>
  );
}
