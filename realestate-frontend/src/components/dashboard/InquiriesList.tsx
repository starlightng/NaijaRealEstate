/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, react-hooks/immutability, react-hooks/exhaustive-deps, @next/next/no-img-element, react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api/client";

export default function InquiriesList() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInquiries() {
      try {
        const res = await api.get("/inquiries/");
        setInquiries(Array.isArray(res.data) ? res.data : (res.data.data || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInquiries();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading inquiries...</div>;
  }

  if (inquiries.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">No Inquiries Yet</h3>
        <p className="text-gray-500">When prospective tenants or buyers contact you about a property, their messages will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Client</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Property</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Message</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {inquiries.map((inq: any) => (
            <tr key={inq.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                {inq.sender_name || "Anonymous"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {inq.property_title || "Unknown Property"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">
                {inq.message}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  inq.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {inq.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(inq.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
