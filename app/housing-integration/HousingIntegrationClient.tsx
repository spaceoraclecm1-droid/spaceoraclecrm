'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SyncResult {
  success: boolean;
  message: string;
  stats?: {
    fetched: number;
    inserted: number;
    skipped: number;
    errors: number;
  };
}

interface HousingIntegrationClientProps {
  profileConfigured: boolean;
}

export default function HousingIntegrationClient({ profileConfigured }: HousingIntegrationClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [hoursBack, setHoursBack] = useState(24);
  const [autoSync, setAutoSync] = useState(false);
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Check if auto-sync is enabled (you might want to store this in localStorage or database)
    const stored = localStorage.getItem('housing_auto_sync');
    if (stored === 'true') {
      setAutoSync(true);
      startAutoSync();
    }
  }, []);

  const startAutoSync = () => {
    // Set next sync time
    const next = new Date();
    next.setMinutes(next.getMinutes() + 30);
    setNextSyncTime(next);
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/housing/test');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
        error: String(error)
      });
    } finally {
      setIsTesting(false);
    }
  };

  const syncNow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/housing/sync');
      const data = await response.json();
      setLastSyncResult(data);

      if (data.success && data.stats) {
        alert(`Sync completed!
Fetched: ${data.stats.fetched} leads
Inserted: ${data.stats.inserted} new leads
Skipped: ${data.stats.skipped} existing leads
Errors: ${data.stats.errors}`);
      }
    } catch (error) {
      setLastSyncResult({
        success: false,
        message: 'Failed to sync leads'
      });
      alert('Failed to sync leads: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const manualFetch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/housing/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hoursBack })
      });
      const data = await response.json();
      setLastSyncResult(data);

      if (data.success && data.stats) {
        alert(`Manual fetch completed!
Fetched: ${data.stats.fetched} leads
Inserted: ${data.stats.inserted} new leads
Skipped: ${data.stats.skipped} existing leads
Errors: ${data.stats.errors}`);
      }
    } catch (error) {
      setLastSyncResult({
        success: false,
        message: 'Failed to fetch leads'
      });
      alert('Failed to fetch leads: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('housing_auto_sync', String(newValue));

    if (newValue) {
      startAutoSync();
      alert('Auto-sync enabled! The system will fetch new leads every 30 minutes.');
    } else {
      setNextSyncTime(null);
      alert('Auto-sync disabled.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Housing.com Integration</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Profile ID</p>
              <p className="font-mono">{profileConfigured ? '✓ Configured' : '⚠️ Not configured'}</p>
            </div>
            <div>
              <p className="text-sm text-black">API Endpoint</p>
              <p className="text-sm">leads.housing.com/api/v0/get-builder-leads</p>
            </div>
            <div>
              <p className="text-sm text-black">Auto-Sync Status</p>
              <p className="font-semibold text-black">
                {autoSync ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            {nextSyncTime && (
              <div>
                <p className="text-sm text-black">Next Sync</p>
                <p className="text-sm text-black">{nextSyncTime.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Test Connection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Connection</h2>
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test API Connection'}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded ${testResult.success ? 'bg-green-50' : 'bg-red-50'} text-black`}>
              <p className="font-semibold">{testResult.message}</p>
              {testResult.data && (
                <p className="text-sm mt-2">Found {testResult.data.length} leads in test</p>
              )}
            </div>
          )}
        </div>

        {/* Sync Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sync Controls</h2>

          <div className="space-y-4">
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <p className="font-semibold">Automatic Sync</p>
                <p className="text-sm text-black">Fetch new leads every 30 minutes</p>
              </div>
              <button
                onClick={toggleAutoSync}
                className={`px-4 py-2 rounded-lg ${
                  autoSync
                    ? 'bg-gray-800 text-white hover:bg-gray-900'
                    : 'bg-gray-700 text-white hover:bg-gray-800'
                }`}
              >
                {autoSync ? 'Disable' : 'Enable'}
              </button>
            </div>

            {/* Manual Sync */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <p className="font-semibold">Manual Sync</p>
                <p className="text-sm text-black">Fetch all new leads since last sync</p>
              </div>
              <button
                onClick={syncNow}
                disabled={isLoading || !profileConfigured}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
              >
                {isLoading ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {/* Custom Time Range */}
            <div className="p-4 bg-gray-50 rounded">
              <p className="font-semibold mb-2">Fetch by Time Range</p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={hoursBack}
                  onChange={(e) => setHoursBack(Number(e.target.value))}
                  min="1"
                  max="720"
                  className="px-3 py-2 border rounded"
                />
                <span className="text-sm text-black">hours back</span>
                <button
                  onClick={manualFetch}
                  disabled={isLoading || !profileConfigured}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                >
                  Fetch
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Last Sync Result</h2>
            <div className={`p-4 rounded ${lastSyncResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="font-semibold text-black">
                {lastSyncResult.message}
              </p>
              {lastSyncResult.stats && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-black">{lastSyncResult.stats.fetched}</p>
                    <p className="text-sm text-black">Fetched</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-black">{lastSyncResult.stats.inserted}</p>
                    <p className="text-sm text-black">Inserted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-black">{lastSyncResult.stats.skipped}</p>
                    <p className="text-sm text-black">Skipped</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-black">{lastSyncResult.stats.errors}</p>
                    <p className="text-sm text-black">Errors</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configuration Warning */}
        {!profileConfigured && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-black">
                  <strong>Housing.com credentials not configured.</strong> Please set HOUSING_PROFILE_ID and HOUSING_ENCRYPTION_KEY environment variables to enable the integration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-black mb-2">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-black">
            <li>Configure Housing.com credentials in environment variables</li>
            <li>Test the API connection to ensure credentials are working</li>
            <li>Use manual sync to fetch initial leads</li>
            <li>Enable automatic sync for continuous lead fetching every 30 minutes</li>
            <li>For production deployment, set up a cron job service (Vercel Cron, GitHub Actions, etc.) to call /api/housing/cron</li>
          </ol>
        </div>
      </div>
    </div>
  );
}