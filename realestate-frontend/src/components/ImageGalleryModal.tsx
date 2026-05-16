"use client";

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { mediaUrl } from '@/lib/api/urls';

interface GalleryImage {
  url: string;
  caption?: string | null;
}

interface ImageGalleryModalProps {
  images: GalleryImage[];
  onClose: () => void;
}

export default function ImageGalleryModal({ images, onClose }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const prev = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const next = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 bg-white/10 rounded-full"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative max-w-5xl w-full flex flex-col items-center">
        <div className="relative w-full aspect-video md:aspect-square max-h-[80vh] flex items-center justify-center">
          <img
            src={mediaUrl(images[currentIndex].url)}
            alt={images[currentIndex].caption || "Property image"}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-[-20px] md:left-[-60px] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={next}
                className="absolute right-[-20px] md:right-[-60px] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-white font-medium text-lg">{images[currentIndex].caption}</p>
          <p className="text-white/50 text-sm">Image {currentIndex + 1} of {images.length}</p>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto max-w-full p-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer transition-all ${currentIndex === idx ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-50 hover:opacity-100'}`}
            >
              <img src={mediaUrl(img.url)} className="w-full h-full object-cover" alt="thumbnail" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
