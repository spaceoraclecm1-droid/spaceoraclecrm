export type InquiryStatus = 'new' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'deal_succeeded' | 'deal_lost';

export type InquiryProgressType = 
  | 'phone_call'
  | 'site_visit'
  | 'discussion'
  | 'deal_success'
  | 'deal_loss'
  | 'follow_up'
  | 'negotiation'
  | 'document_collection'
  | 'payment_discussion'
  | 'deal_closure';

export type InquiryProgress = {
  id: string;
  inquiryId: string;
  progressType: InquiryProgressType;
  status: InquiryStatus;
  remarks: string;
  leadSource: string;
  nextFollowUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  outcome?: string;
};

export type InquiryRemark = {
  id: string;
  inquiryId: string;
  remark: string;
  createdAt: Date;
  createdBy: string;
};

export type EmployeeReport = {
  employeeId: string;
  employeeName: string;
  area?: 'bhopal' | 'sindhupan';
  metrics: {
    newInquiries: number;
    phoneCalls: number;
    siteVisits: number;
    multipleVisits: number;
    dealsSucceeded: number;
    dealsLost: number;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
};

export type SiteVisitStatus = {
  id: string;
  inquiryId: string;
  clientName: string;
  status: 'scheduled' | 'done' | 'cancelled';
  scheduledDate: Date | string;
  actualDate?: Date | string;
  remarks?: string;
  assignedTo: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}; 