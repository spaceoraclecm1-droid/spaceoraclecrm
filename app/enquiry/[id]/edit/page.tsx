'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../utils/supabase';

export default function EditEnquiry() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    "Client Name": '',
    "Mobile": '',
    "Email": '',
    "Enquiry For": '',
    "Property Type": '',
    "Assigned To": '',
    "Enquiry Progress": '',
    "Remarks": '',
    "Enquiry Source": '',
    "Area": '',
    "Configuration": '',
    "Created Date": ''
  });

  const fetchEnquiry = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error) {
      console.error('Error fetching enquiry:', error);
      alert('Error fetching enquiry details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEnquiry();
    }
  }, [fetchEnquiry, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('enquiries')
        .update(formData)
        .eq('id', id);

      if (error) throw error;
      router.push('/enquiry/list');
    } catch (error) {
      console.error('Error updating enquiry:', error);
      alert('Error updating enquiry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c69c6d]"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="relative mb-8 sm:mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-8 sm:py-12 px-4 sm:px-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Edit Enquiry</h1>
              <p className="text-[#e5d0b1] text-sm sm:text-base max-w-2xl">
                Update client enquiry details
              </p>
            </div>
            <Link 
              href="/enquiry/list" 
              className="mt-4 md:mt-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-white/20 transition-all self-start text-sm sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Enquiries
            </Link>
          </div>
        </div>
      </div>
      
      {/* Form Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        <div className="premium-card overflow-hidden scale-in">
          <div className="p-4 sm:p-6 pb-0">
            <div className="mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg sm:text-xl font-bold flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Enquiry Details
              </h2>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 pt-2 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Client Name */}
              <div>
                <label htmlFor="Client Name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  id="Client Name"
                  name="Client Name"
                  value={formData["Client Name"]}
                  onChange={handleChange}
                  required
                  className="premium-input w-full text-sm sm:text-base"
                  placeholder="Enter client's full name"
                />
              </div>
              
              {/* Mobile Number */}
              <div>
                <label htmlFor="Mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="Mobile"
                  name="Mobile"
                  value={formData["Mobile"]}
                  onChange={handleChange}
                  required
                  className="premium-input w-full text-sm sm:text-base"
                  placeholder="Enter client's mobile number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Configuration */}
              <div>
                <label htmlFor="Configuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Configuration (BHK)
                </label>
                <input
                  type="text"
                  id="Configuration"
                  name="Configuration"
                  value={formData["Configuration"]}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 2BHK, 3BHK"
                  className="premium-input w-full text-sm sm:text-base"
                />
              </div>
              
              {/* Source */}
              <div>
                <label htmlFor="Enquiry Source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Source
                </label>
                <select
                  id="Enquiry Source"
                  name="Enquiry Source"
                  value={formData["Enquiry Source"]}
                  onChange={handleChange}
                  className="premium-input w-full text-sm sm:text-base"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Reference">Reference</option>
                  <option value="Housing">Housing</option>
                </select>
              </div>
            </div>

            {/* Area */}
            <div>
              <label htmlFor="Area" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Area
              </label>
              <select
                id="Area"
                name="Area"
                value={formData["Area"]}
                onChange={handleChange}
                className="premium-input w-full text-sm sm:text-base"
              >
                <option value="bhopal">Bhopal</option>
                <option value="sindhupan">Sindhupan</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="Remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Description
              </label>
              <textarea
                id="Remarks"
                name="Remarks"
                value={formData["Remarks"]}
                onChange={handleChange}
                rows={3}
                className="premium-input w-full text-sm sm:text-base"
                placeholder="Enter client's requirements and preferences"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Assigned Employee */}
              <div>
                <label htmlFor="Assigned To" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Assigned Employee
                </label>
                <select
                  id="Assigned To"
                  name="Assigned To"
                  value={formData["Assigned To"]}
                  onChange={handleChange}
                  className="premium-input w-full text-sm sm:text-base"
                >
                  <option value="Rushirajsinh, Zala">Rushirajsinh, Zala</option>
                  <option value="Maulik, Jadav">Maulik, Jadav</option>
                  <option value="Rajdeepsinh, Jadeja">Rajdeepsinh, Jadeja</option>
                </select>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                href="/enquiry/list"
                className="px-5 py-3 sm:py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium w-full text-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="premium-button w-full py-3 sm:py-2.5 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 