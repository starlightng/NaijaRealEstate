
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Trash2, Star, Plus, X, Upload } from "lucide-react";
import api from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/urls";

interface PhotoManagerProps {
  property: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function PhotoManager({ property, onClose, onUpdate }: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{file: File, caption: string}[]>([]);

  const handleSetPrimary = async (imageId: string) => {
    try {
      await api.put(`/uploads/properties/${property.id}/images/${imageId}/primary`);
      onUpdate();
    } catch (err) {
      alert("Failed to set primary image");
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      await api.delete(`/uploads/properties/${property.id}/images/${imageId}`);
      onUpdate();
    } catch (err) {
      alert("Failed to delete image");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        caption: ""
      }));
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...selectedFiles];
    updated[index].caption = caption;
    setSelectedFiles(updated);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(item => {
      formData.append("files", item.file);
      formData.append("captions", item.caption);
    });

    try {
      await api.post(`/uploads/properties/${property.id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSelectedFiles([]);
      onUpdate();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Manage Photos: {property.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {property.images?.map((img: any) => (
              <div key={img.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img src={mediaUrl(img.url)} alt={img.caption || "Property"} className="w-full h-full object-cover" />
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!img.is_primary && (
                    <button 
                      onClick={() => handleSetPrimary(img.id)}
                      className="p-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 shadow-lg"
                      title="Set as Primary"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(img.id)}
                    className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 shadow-lg"
                    title="Delete Image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {img.is_primary && (
                  <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                    Primary
                  </div>
                )}
                
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 truncate">
                    {img.caption}
                  </div>
                )}
              </div>
            ))}

            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Plus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-500">Add More</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Upload New Photos
              </h3>
              <div className="space-y-4">
                {selectedFiles.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 bg-white p-3 rounded-lg border shadow-sm">
                    <img src={URL.createObjectURL(item.file)} alt="Preview" className="w-16 h-16 object-cover rounded shadow-sm" />
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Caption (e.g., Front View, Bedroom)" 
                        className="w-full text-sm px-3 py-2 border rounded-md"
                        value={item.caption}
                        onChange={(e) => updateCaption(index, e.target.value)}
                      />
                    </div>
                    <button onClick={() => removeSelectedFile(index)} className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : `Upload ${selectedFiles.length} Photos`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
