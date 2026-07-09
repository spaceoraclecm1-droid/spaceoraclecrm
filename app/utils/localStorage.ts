import { Enquiry, SiteVisit, Deal } from '../types';

// Helper to check if window is available (for SSR)
const isClient = typeof window !== 'undefined';

// Local Storage Keys
const KEYS = {
  ENQUIRIES: 'spaceoraclecrm-enquiries',
  SITE_VISITS: 'spaceoraclecrm-site-visits',
  DEALS: 'spaceoraclecrm-deals',
};

// Get enquiries from localStorage
export const getEnquiries = (): Enquiry[] => {
  if (!isClient) return [];
  
  const storedData = localStorage.getItem(KEYS.ENQUIRIES);
  return storedData ? JSON.parse(storedData) : [];
};

// Save enquiries to localStorage
export const saveEnquiries = (enquiries: Enquiry[]): void => {
  if (!isClient) return;
  
  localStorage.setItem(KEYS.ENQUIRIES, JSON.stringify(enquiries));
};

// Add a new enquiry
export const addEnquiry = (enquiry: Enquiry): void => {
  const enquiries = getEnquiries();
  enquiries.push(enquiry);
  saveEnquiries(enquiries);
};

// Update an enquiry
export const updateEnquiry = (updatedEnquiry: Enquiry): void => {
  const enquiries = getEnquiries();
  const index = enquiries.findIndex(e => e.id === updatedEnquiry.id);
  
  if (index !== -1) {
    enquiries[index] = updatedEnquiry;
    saveEnquiries(enquiries);
  }
};

// Delete an enquiry
export const deleteEnquiry = (id: string): void => {
  const enquiries = getEnquiries();
  const filteredEnquiries = enquiries.filter(e => e.id !== id);
  saveEnquiries(filteredEnquiries);
};

// Get site visits from localStorage
export const getSiteVisits = (): SiteVisit[] => {
  if (!isClient) return [];
  
  const storedData = localStorage.getItem(KEYS.SITE_VISITS);
  return storedData ? JSON.parse(storedData) : [];
};

// Save site visits to localStorage
export const saveSiteVisits = (visits: SiteVisit[]): void => {
  if (!isClient) return;
  
  localStorage.setItem(KEYS.SITE_VISITS, JSON.stringify(visits));
};

// Add a new site visit
export const addSiteVisit = (visit: SiteVisit): void => {
  const visits = getSiteVisits();
  visits.push(visit);
  saveSiteVisits(visits);
};

// Get deals from localStorage
export const getDeals = (): Deal[] => {
  if (!isClient) return [];
  
  const storedData = localStorage.getItem(KEYS.DEALS);
  return storedData ? JSON.parse(storedData) : [];
};

// Save deals to localStorage
export const saveDeals = (deals: Deal[]): void => {
  if (!isClient) return;
  
  localStorage.setItem(KEYS.DEALS, JSON.stringify(deals));
};

// Add a new deal
export const addDeal = (deal: Deal): void => {
  const deals = getDeals();
  deals.push(deal);
  saveDeals(deals);
}; 