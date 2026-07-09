// Enquiry Types
export interface Enquiry {
  id: string;
  clientName: string;
  mobile: string;
  configuration: string; // BHK
  description: string;
  source: 'REF' | 'FACEBOOK' | 'SB-VAISHNO' | 'PORTAL';
  status: 'active' | 'inactive' | 'new' | 'due';
  assignedEmployee: string; // Rajdeep | Rushiraj | Mantik
  dateCreated: string;
  category: 'new' | 'today' | 'yesterday' | 'due' | 'weekend';
  followUpDate?: string;
}

// Site Visit Types
export interface SiteVisit {
  id: string;
  enquiryId: string;
  clientName: string;
  visitDate: string;
  time: string;
  property: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  assignedEmployee: string;
}

// Deal Types
export interface Deal {
  id: string;
  enquiryId: string;
  clientName: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  date: string;
  assignedEmployee: string;
}

// Report Types
export interface EnquiryReport {
  period: string;
  newEnquiries: number;
  phoneCall: number;
  siteVisit: number;
  dealSuccess: number;
}

// Dashboard Stats
export interface DashboardStats {
  newEnquiries: number;
  totalEnquiries: number;
  pendingSiteVisits: number;
  successfulDeals: number;
} 