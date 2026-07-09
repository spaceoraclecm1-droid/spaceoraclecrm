import { sampleEnquiries, sampleSiteVisits, sampleDeals } from './sampleData';
import { saveEnquiries, saveSiteVisits, saveDeals, getEnquiries } from './localStorage';

// Initialize data in localStorage if it doesn't exist
export const initializeData = () => {
  // Browser only
  if (typeof window === 'undefined') return;
  
  // Check if data already exists
  const existingEnquiries = getEnquiries();
  
  // Only initialize if no data exists
  if (existingEnquiries.length === 0) {
    saveEnquiries(sampleEnquiries);
    saveSiteVisits(sampleSiteVisits);
    saveDeals(sampleDeals);
    console.log('Initialized sample data in localStorage');
  }
};

// For use in client components
export const useInitializeData = () => {
  // Client side only
  if (typeof window !== 'undefined') {
    initializeData();
  }
}; 