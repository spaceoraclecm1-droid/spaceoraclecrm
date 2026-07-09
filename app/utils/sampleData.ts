import { Enquiry, SiteVisit, Deal, EnquiryReport } from '../types';

// Generate a random ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Sample enquiries data
export const sampleEnquiries: Enquiry[] = [
  {
    id: generateId(),
    clientName: 'Raj Sharma',
    mobile: '9876543210',
    configuration: '2BHK',
    description: 'Looking for 2BHK in downtown area',
    source: 'FACEBOOK',
    status: 'active',
    assignedEmployee: 'Rajdeep',
    dateCreated: new Date().toISOString(),
    category: 'new'
  },
  {
    id: generateId(),
    clientName: 'Priya Patel',
    mobile: '8765432109',
    configuration: '3BHK',
    description: 'Interested in 3BHK with garden',
    source: 'REF',
    status: 'active',
    assignedEmployee: 'Rushiraj',
    dateCreated: new Date().toISOString(),
    category: 'today'
  },
  {
    id: generateId(),
    clientName: 'Amit Singh',
    mobile: '7654321098',
    configuration: '1BHK',
    description: 'Budget friendly 1BHK for bachelor',
    source: 'SB-VAISHNO',
    status: 'inactive',
    assignedEmployee: 'Mantik',
    dateCreated: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    category: 'yesterday'
  },
  {
    id: generateId(),
    clientName: 'Suresh Kumar',
    mobile: '6543210987',
    configuration: '4BHK',
    description: 'Luxury 4BHK for joint family',
    source: 'PORTAL',
    status: 'due',
    assignedEmployee: 'Rajdeep',
    dateCreated: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    category: 'due',
    followUpDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
  },
  {
    id: generateId(),
    clientName: 'Neha Gupta',
    mobile: '5432109876',
    configuration: '2BHK',
    description: 'Looking for rental property',
    source: 'FACEBOOK',
    status: 'new',
    assignedEmployee: 'Mantik',
    dateCreated: new Date().toISOString(),
    category: 'weekend',
    followUpDate: new Date(Date.now() + 259200000).toISOString() // 3 days later (weekend)
  }
];

// Sample site visits
export const sampleSiteVisits: SiteVisit[] = [
  {
    id: generateId(),
    enquiryId: sampleEnquiries[0].id,
    clientName: sampleEnquiries[0].clientName,
    visitDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    time: '10:00 AM',
    property: 'Green Valley Apartments - 2BHK',
    status: 'pending',
    assignedEmployee: sampleEnquiries[0].assignedEmployee
  },
  {
    id: generateId(),
    enquiryId: sampleEnquiries[1].id,
    clientName: sampleEnquiries[1].clientName,
    visitDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    time: '3:30 PM',
    property: 'Riverside Heights - 3BHK with Garden',
    status: 'pending',
    assignedEmployee: sampleEnquiries[1].assignedEmployee
  },
  {
    id: generateId(),
    enquiryId: sampleEnquiries[2].id,
    clientName: sampleEnquiries[2].clientName,
    visitDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    time: '11:00 AM',
    property: 'Urban Studio Apartments - 1BHK',
    status: 'completed',
    assignedEmployee: sampleEnquiries[2].assignedEmployee,
    notes: 'Client liked the property but wants to check other options'
  }
];

// Sample deals
export const sampleDeals: Deal[] = [
  {
    id: generateId(),
    enquiryId: sampleEnquiries[2].id,
    clientName: sampleEnquiries[2].clientName,
    amount: 2500000,
    status: 'success',
    date: new Date().toISOString(),
    assignedEmployee: sampleEnquiries[2].assignedEmployee
  }
];

// Sample reports
export const sampleReport: EnquiryReport = {
  period: 'Last 30 Days',
  newEnquiries: 15,
  phoneCall: 32,
  siteVisit: 8,
  dealSuccess: 3
}; 