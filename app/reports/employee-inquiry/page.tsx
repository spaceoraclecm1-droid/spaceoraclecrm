'use client';

import React, { useEffect, useState } from 'react';
import { EmployeeReport } from '../../types/inquiry';
import { supabase } from '../../utils/supabase';

// Define interfaces for the data we'll be working with
interface ProgressEntry {
  id: string;
  eid: string;
  progress_type: string;
  remark?: string;
  date?: string;
  created_at: string;
}

interface InquiryEntry {
  id: string;
  "Client Name"?: string;
  "Mobile"?: string;
  "Assigned To"?: string;
  "Enquiry Progress"?: string;
  "Area"?: string;
  "Created Date"?: string;
  "Enquiry Source"?: string;
}

export default function EmployeeInquiryReportPage() {
  const [dateRange, setDateRange] = React.useState('this_month');
  const [selectedEmployee, setSelectedEmployee] = React.useState('all');
  const [selectedArea, setSelectedArea] = React.useState('all');
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeOptions, setEmployeeOptions] = useState<{id: string, name: string}[]>([]);
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [dateRangeValues, setDateRangeValues] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });

  // Fetch the list of employees and areas when the component mounts
  useEffect(() => {
    fetchEmployeesAndAreas();
  }, []);

  // Fetch reports when filters change
  useEffect(() => {
    updateDateRange();
    fetchReports();
  }, [dateRange, selectedEmployee, selectedArea]);

  // Update the date range based on the selected option
  const updateDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
        break;
      case 'this_week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday as first day
        startDate = new Date(now);
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = now;
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'custom':
        // Keep the existing custom range
        break;
    }

    setDateRangeValues({ startDate, endDate });
  };

  // Fetch unique employees and areas from the inquiries table
  const fetchEmployeesAndAreas = async () => {
    try {
      // Fetch all inquiries to get unique assigned employees
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from('enquiries')
        .select('id, "Assigned To", "Area"');
      
      if (inquiriesError) throw inquiriesError;

      // Extract unique employee names
      const uniqueEmployees = new Map();
      const uniqueAreas = new Set<string>();

      inquiriesData.forEach(inquiry => {
        if (inquiry["Assigned To"]) {
          uniqueEmployees.set(inquiry["Assigned To"], { 
            id: inquiry["Assigned To"], 
            name: inquiry["Assigned To"] 
          });
        }
        
        if (inquiry["Area"] && typeof inquiry["Area"] === 'string' && inquiry["Area"].trim() !== '') {
          uniqueAreas.add(inquiry["Area"]);
        }
      });

      setEmployeeOptions(Array.from(uniqueEmployees.values()));
      setAreaOptions(Array.from(uniqueAreas));
    } catch (error) {
      console.error('Error fetching employees and areas:', error);
    }
  };

  // Fetch reports based on selected filters
  const fetchReports = async () => {
    try {
      setIsLoading(true);
      
      // Format dates for Supabase query
      const startDateStr = formatDateForDB(dateRangeValues.startDate);
      const endDateStr = formatDateForDB(dateRangeValues.endDate);
      
      console.log(`Fetching inquiries from ${startDateStr} to ${endDateStr}`);
      
      // Step 1: Fetch all inquiries within the date range
      let inquiriesQuery = supabase
        .from('enquiries')
        .select('*');
        
      // Add date filter - inquiries created within the date range
      inquiriesQuery = inquiriesQuery
        .gte('created_at', dateRangeValues.startDate.toISOString())
        .lte('created_at', dateRangeValues.endDate.toISOString());
      
      // Add employee filter if specific employee is selected
      if (selectedEmployee !== 'all') {
        inquiriesQuery = inquiriesQuery.eq('Assigned To', selectedEmployee);
      }
      
      // Add area filter if specific area is selected
      if (selectedArea !== 'all') {
        inquiriesQuery = inquiriesQuery.eq('Area', selectedArea);
      }
      
      const { data: inquiriesData, error: inquiriesError } = await inquiriesQuery;
      
      if (inquiriesError) throw inquiriesError;
      
      // Step 2: Fetch all progress entries for these inquiries
      const inquiryIds = inquiriesData.map(inquiry => inquiry.id);
      
      let progressQuery = supabase
        .from('Inquiry_Progress')
        .select('*');
      
      // Only include progress entries for the inquiries we fetched
      if (inquiryIds.length > 0) {
        progressQuery = progressQuery.in('eid', inquiryIds);
      }
      
      // Add date filter for progress entries
      progressQuery = progressQuery
        .gte('created_at', dateRangeValues.startDate.toISOString())
        .lte('created_at', dateRangeValues.endDate.toISOString());
      
      const { data: progressData, error: progressError } = await progressQuery;
      
      if (progressError) throw progressError;
      
      // Step 3: Group inquiries by employee
      const employeeInquiries = new Map<string, InquiryEntry[]>();
      
      inquiriesData.forEach(inquiry => {
        const employee = inquiry["Assigned To"] || "Unassigned";
        
        if (!employeeInquiries.has(employee)) {
          employeeInquiries.set(employee, []);
        }
        
        employeeInquiries.get(employee)?.push(inquiry);
      });
      
      // Step 4: Process the data to generate reports for each employee
      const generatedReports: EmployeeReport[] = [];
      
      employeeInquiries.forEach((inquiries, employee) => {
        // Get all progress entries for this employee's inquiries
        const employeeInquiryIds = inquiries.map(inq => inq.id);
        const employeeProgress = progressData.filter(progress => 
          employeeInquiryIds.includes(progress.eid)
        );
        
        // Count the different types of progress
        const phoneCalls = employeeProgress.filter(p => p.progress_type === 'phone_call').length;
        const siteVisits = employeeProgress.filter(p => p.progress_type === 'site_visit' || p.progress_type === 'site_visit_schedule').length;
        
        // Count inquiries with multiple site visits
        const inquiriesWithSiteVisits = new Map<string, number>();
        employeeProgress.forEach(progress => {
          if (progress.progress_type === 'site_visit' || progress.progress_type === 'site_visit_schedule') {
            inquiriesWithSiteVisits.set(progress.eid, (inquiriesWithSiteVisits.get(progress.eid) || 0) + 1);
          }
        });
        
        const multipleVisits = Array.from(inquiriesWithSiteVisits.values()).filter(count => count > 1).length;
        
        // Count deals succeeded and lost
        const dealsSucceeded = employeeProgress.filter(p => p.progress_type === 'deal_done').length;
        const dealsLost = employeeProgress.filter(p => p.progress_type === 'deal_lost').length;
        
        // Get the first inquiry's area if available for this employee
        let area = undefined;
        for (const inquiry of inquiries) {
          if (inquiry.Area) {
            area = inquiry.Area;
            break;
          }
        }
        
        // Create the report
        generatedReports.push({
          employeeId: employee,
          employeeName: employee,
          area: area as any,
          metrics: {
            newInquiries: inquiries.filter(inq => inq["Enquiry Progress"] === 'New').length,
            phoneCalls,
            siteVisits,
            multipleVisits,
            dealsSucceeded,
            dealsLost
          },
          period: {
            startDate: dateRangeValues.startDate,
            endDate: dateRangeValues.endDate
          }
        });
      });
      
      setReports(generatedReports);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setIsLoading(false);
    }
  };

  // Helper function to format date for Supabase
  const formatDateForDB = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Calculate totals for summary
  const totals = reports.reduce((acc, report) => ({
    newInquiries: acc.newInquiries + report.metrics.newInquiries,
    phoneCalls: acc.phoneCalls + report.metrics.phoneCalls,
    siteVisits: acc.siteVisits + report.metrics.siteVisits,
    multipleVisits: acc.multipleVisits + report.metrics.multipleVisits,
    dealsSucceeded: acc.dealsSucceeded + report.metrics.dealsSucceeded,
    dealsLost: acc.dealsLost + report.metrics.dealsLost
  }), {
    newInquiries: 0,
    phoneCalls: 0,
    siteVisits: 0,
    multipleVisits: 0,
    dealsSucceeded: 0,
    dealsLost: 0
  });

  // Calculate success rate, handling division by zero
  const calculateSuccessRate = (succeeded: number, lost: number) => {
    const total = succeeded + lost;
    if (total === 0) return "0.0";
    return ((succeeded / total) * 100).toFixed(1);
  };

  return (
    <div className="fade-in container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Employee Inquiry Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Track and analyze employee performance metrics</p>
      </div>

      {/* Filters Section */}
      <div className="premium-card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="premium-input w-full"
            >
              <option value="all">All Employees</option>
              {employeeOptions.map(employee => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="premium-input w-full"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Area
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="premium-input w-full"
            >
              <option value="all">All Areas</option>
              {areaOptions.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c69c6d]"></div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="premium-card p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total New Inquiries</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totals.newInquiries}</div>
            </div>
            <div className="premium-card p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Phone Calls</div>
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{totals.phoneCalls}</div>
            </div>
            <div className="premium-card p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Site Visits</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totals.siteVisits}</div>
            </div>
            <div className="premium-card p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Multiple Visits</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totals.multipleVisits}</div>
            </div>
            <div className="premium-card p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Deals Succeeded</div>
              <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">{totals.dealsSucceeded}</div>
            </div>
            <div className="premium-card p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {calculateSuccessRate(totals.dealsSucceeded, totals.dealsLost)}%
              </div>
            </div>
          </div>

          {/* Detailed Report Table */}
          <div className="premium-card overflow-hidden mb-8">
            <div className="p-6 pb-0">
              <h2 className="text-xl font-bold flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Employee Performance Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {dateRangeValues.startDate.toLocaleDateString()} - {dateRangeValues.endDate.toLocaleDateString()}
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="md:hidden text-sm text-gray-500 dark:text-gray-400 mb-2 ml-6">Scroll horizontally to see all data →</div>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th className="text-center">New Inquiries</th>
                    <th className="text-center">Phone Calls</th>
                    <th className="text-center">Site Visits</th>
                    <th className="text-center">Multiple Visits</th>
                    <th className="text-center">Deals Succeeded</th>
                    <th className="text-center">Deals Lost</th>
                    <th className="text-center">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length > 0 ? (
                    reports.map((report) => (
                      <tr key={report.employeeId}>
                        <td data-label="Employee">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 rounded-full bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 items-center justify-center text-[#1a2e29] dark:text-[#c69c6d]">
                              {report.employeeName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{report.employeeName}</div>
                              {report.area && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Area: {report.area}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center font-medium" data-label="New Inquiries">{report.metrics.newInquiries}</td>
                        <td className="text-center font-medium" data-label="Phone Calls">{report.metrics.phoneCalls}</td>
                        <td className="text-center font-medium" data-label="Site Visits">{report.metrics.siteVisits}</td>
                        <td className="text-center font-medium" data-label="Multiple Visits">{report.metrics.multipleVisits}</td>
                        <td className="text-center font-medium text-green-600 dark:text-green-400" data-label="Deals Succeeded">{report.metrics.dealsSucceeded}</td>
                        <td className="text-center font-medium text-red-600 dark:text-red-400" data-label="Deals Lost">{report.metrics.dealsLost}</td>
                        <td className="text-center font-medium text-purple-600 dark:text-purple-400" data-label="Success Rate">
                          {calculateSuccessRate(report.metrics.dealsSucceeded, report.metrics.dealsLost)}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        No data found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 