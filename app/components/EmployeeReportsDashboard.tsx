import React from 'react';
import { EmployeeReport } from '../types/inquiry';

interface EmployeeReportsDashboardProps {
  reports: EmployeeReport[];
  period: {
    startDate: Date;
    endDate: Date;
  };
}

const MetricCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <h3 className="text-sm text-gray-500 mb-1">{label}</h3>
    <p className="text-2xl font-semibold">{value}</p>
  </div>
);

const EmployeeReportsDashboard: React.FC<EmployeeReportsDashboardProps> = ({
  reports,
  period,
}) => {
  const totalMetrics = reports.reduce(
    (acc, report) => ({
      newInquiries: acc.newInquiries + report.metrics.newInquiries,
      phoneCalls: acc.phoneCalls + report.metrics.phoneCalls,
      siteVisits: acc.siteVisits + report.metrics.siteVisits,
      multipleVisits: acc.multipleVisits + report.metrics.multipleVisits,
      discussions: acc.discussions + report.metrics.discussions,
      dealsSucceeded: acc.dealsSucceeded + report.metrics.dealsSucceeded,
      dealsLost: acc.dealsLost + report.metrics.dealsLost,
    }),
    {
      newInquiries: 0,
      phoneCalls: 0,
      siteVisits: 0,
      multipleVisits: 0,
      discussions: 0,
      dealsSucceeded: 0,
      dealsLost: 0,
    }
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Employee Performance Report</h2>
          <div className="text-sm text-gray-500">
            {period.startDate.toLocaleDateString()} - {period.endDate.toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total New Inquiries" value={totalMetrics.newInquiries} />
          <MetricCard label="Total Phone Calls" value={totalMetrics.phoneCalls} />
          <MetricCard label="Total Site Visits" value={totalMetrics.siteVisits} />
          <MetricCard label="Deals Succeeded" value={totalMetrics.dealsSucceeded} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New Inquiries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Calls
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Multiple Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discussions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deals Succeeded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deals Lost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.employeeId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{report.employeeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{report.metrics.newInquiries}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{report.metrics.phoneCalls}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{report.metrics.siteVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{report.metrics.multipleVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{report.metrics.discussions}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-600">{report.metrics.dealsSucceeded}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-red-600">{report.metrics.dealsLost}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReportsDashboard; 