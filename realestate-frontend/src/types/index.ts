export type UserRole = 'landlord' | 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  price_period: string;
  property_type: string;
  listing_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  city: string;
  state: string;
  address?: string;
  lga: string;
  landmark: string;
  featured: boolean;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  amenities?: string[];
  view_count: number;
  inquiry_count: number;
  images: PropertyImage[];
  owner_id: string;
  agent_id: string | null;
  created_at: string;
  published_at: string | null;
}

export interface PropertyListItem extends Omit<Property, 'description' | 'images'> {
  images: PropertyImage[];
  currency: string;
}

export interface Lead {
  id: string;
  property_id: string;
  full_name: string;
  sender_name?: string;
  property_title?: string;
  email: string;
  phone: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  priority: string;
  follow_up_at?: string;
  timeline_events?: any[];
  created_at: string;
}
