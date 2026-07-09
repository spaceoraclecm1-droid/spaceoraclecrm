// Simple store to share inquiry data between components
import { create } from 'zustand';
import { Enquiry } from '../types';

interface InquiryStore {
  todayInquiries: Enquiry[];
  setTodayInquiries: (inquiries: Enquiry[]) => void;
}

export const useInquiryStore = create<InquiryStore>((set) => ({
  todayInquiries: [],
  setTodayInquiries: (inquiries) => set({ todayInquiries: inquiries }),
}));
