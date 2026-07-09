import React from 'react';
import EmployeeReportsDashboard from '../../components/EmployeeReportsDashboard';

const ReportsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Employee Reports</h1>
        
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filter Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select className="w-full border rounded-md p-2">
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <select className="w-full border rounded-md p-2">
                <option value="all">All Employees</option>
                <option value="active">Active Employees</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select className="w-full border rounded-md p-2">
                <option value="summary">Summary Report</option>
                <option value="detailed">Detailed Report</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Generate Report
            </button>
          </div>
        </div>
        
        <EmployeeReportsDashboard
          reports={[
            {
              employeeId: '1',
              employeeName: 'Maulik Jadav',
              metrics: {
                newInquiries: 0,
                phoneCalls: 2,
                siteVisits: 0,
                multipleVisits: 0,
                discussions: 0,
                dealsSucceeded: 0,
                dealsLost: 0,
              },
              period: {
                startDate: new Date(),
                endDate: new Date(),
              },
            },
            {
              employeeId: '2',
              employeeName: 'Rushirajsinh Zala',
              metrics: {
                newInquiries: 0,
                phoneCalls: 13,
                siteVisits: 0,
                multipleVisits: 0,
                discussions: 0,
                dealsSucceeded: 0,
                dealsLost: 0,
              },
              period: {
                startDate: new Date(),
                endDate: new Date(),
              },
            },
          ]}
          period={{
            startDate: new Date(),
            endDate: new Date(),
          }}
        />
      </div>
    </div>
  );
};

export default ReportsPage; 