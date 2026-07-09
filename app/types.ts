export type DashboardStats = {
  newEnquiries: number;
  totalEnquiries: number;
  pendingSiteVisits: number;
  totalSales: number;
  monthlySales: number;
  weeklySales: number;
  dailySales: number;
};

export type InquirySource = 'REF' | 'FACEBOOK' | 'SB-VAISHNO' | 'PORTAL';

export type Enquiry = {
  id: string;
  clientName: string;
  configuration: string;
  status: string;
  category: 'new' | 'today' | 'yesterday' | 'due' | 'weekend';
  mobile: string;
  description: string;
  source: InquirySource;
  assignedEmployee: string;
  dateCreated: string;
  lastRemark?: string;
  lastRemarkDate?: string;
  area?: 'bhopal' | 'sindhupan';
}; 