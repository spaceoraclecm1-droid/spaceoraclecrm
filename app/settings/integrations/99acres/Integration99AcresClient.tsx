'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  SAMPLE_99ACRES_PAYLOAD,
  SAMPLE_PAYLOAD_KEYS,
  SAMPLE_PAYLOAD_LABELS,
} from '@/lib/ninety-nine-acres/sample-payload';

interface ServerConfig {
  username: string;
  profileId: string;
  authConfigured: boolean;
  bearerTokenMasked: string;
  webhookPath: string;
}

interface Props {
  config: ServerConfig;
}

interface LogRow {
  id: string | number;
  status_code: number;
  lead_name: string | null;
  phone: string | null;
  project: string | null;
  source: string | null;
  ip_address: string | null;
  response_time_ms: number | null;
  error_message: string | null;
  method: string;
  endpoint: string;
  created_at: string;
}

interface LogDetail extends LogRow {
  request_headers: Record<string, string> | null;
  request_body: string | null;
  response_body: string | null;
}

interface TestSendResult {
  success: boolean;
  status: number;
  request: { url: string; headers: Record<string, string>; body: unknown };
  response: unknown;
  elapsedMs: number;
}

function copyText(text: string, onCopied: () => void) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    onCopied();
    return;
  }
  navigator.clipboard.writeText(text).then(onCopied, onCopied);
}

function buildWebhookUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

function buildCurl(webhookUrl: string, payload: Record<string, unknown>): string {
  const data = JSON.stringify(payload, null, 2);
  return [
    `curl --location '${webhookUrl}' \\`,
    `--request POST \\`,
    `--header 'Content-Type: application/json' \\`,
    `--header 'Authorization: Bearer YOUR_SECRET_TOKEN' \\`,
    `--data '${data}'`,
  ].join('\n');
}

const STATUS_BADGE_CLASSES: Record<'ok' | 'warn' | 'bad' | 'pending', string> = {
  ok: 'bg-emerald-100 text-emerald-700',
  warn: 'bg-amber-100 text-amber-700',
  bad: 'bg-rose-100 text-rose-700',
  pending: 'bg-slate-100 text-slate-600',
};

const STATUS_DOT_CLASSES: Record<'ok' | 'warn' | 'bad' | 'pending', string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  bad: 'bg-rose-500',
  pending: 'bg-slate-400',
};

function statusTone(code: number): 'ok' | 'warn' | 'bad' {
  if (code >= 200 && code < 300) return 'ok';
  if (code >= 400 && code < 500) return 'warn';
  return 'bad';
}

const STATUS_LABEL: Record<'ok' | 'warn' | 'bad' | 'pending', string> = {
  ok: 'Webhook reachable',
  warn: 'Webhook reachable',
  bad: 'Auth failed',
  pending: 'Checking…',
};

const TEST_FIELDS = SAMPLE_PAYLOAD_KEYS.map((key) => ({
  key,
  label: SAMPLE_PAYLOAD_LABELS[key],
}));

export default function Integration99AcresClient({ config }: Props) {
  const webhookUrl = buildWebhookUrl(config.webhookPath);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashCopied = useCallback((key: string) => {
    setCopiedKey(key);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => {
      setCopiedKey(null);
      copiedTimer.current = null;
    }, 1500);
  }, []);
  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const [username, setUsername] = useState(config.username);
  const [profileId, setProfileId] = useState(config.profileId);
  const [settingsSavedAt, setSettingsSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('99acres_settings_overrides');
      if (stored) {
        const parsed = JSON.parse(stored) as { username?: string; profileId?: string };
        if (parsed.username) setUsername(parsed.username);
        if (parsed.profileId) setProfileId(parsed.profileId);
      }
    } catch {
      // ignore parse failures; defaults stay
    }
  }, []);

  const saveSettings = () => {
    const payload = { username, profileId };
    localStorage.setItem('99acres_settings_overrides', JSON.stringify(payload));
    setSettingsSavedAt(new Date().toLocaleTimeString());
  };

  const [testPayload, setTestPayload] = useState<Record<string, string>>(
    () => ({ ...SAMPLE_99ACRES_PAYLOAD })
  );

  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<TestSendResult | null>(null);

  const sampleCurl = useMemo(
    () => buildCurl(webhookUrl, testPayload),
    [webhookUrl, testPayload]
  );

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | number | null>(null);
  const [logDetail, setLogDetail] = useState<LogDetail | null>(null);
  const [logDetailLoading, setLogDetailLoading] = useState(false);
  const [reachable, setReachable] = useState<'ok' | 'bad' | 'pending'>('pending');

  const logsRef = useRef<LogRow[]>([]);
  logsRef.current = logs;

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const resp = await fetch('/api/integrations/99acres/logs', { cache: 'no-store' });
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        if (logsRef.current.length === 0) setLogsError(json.message ?? 'Failed to load logs');
        setReachable((prev) => (prev === 'bad' ? prev : 'bad'));
      } else {
        const rows: LogRow[] = json.data ?? [];
        const prev = logsRef.current;
        const unchanged =
          prev.length === rows.length &&
          prev.length > 0 &&
          prev[0].id === rows[0].id &&
          prev[prev.length - 1].id === rows[rows.length - 1].id;
        if (!unchanged) setLogs(rows);
        if (logsError) setLogsError(null);
        setReachable('ok');
      }
    } catch (err) {
      if (logsRef.current.length === 0) setLogsError(String(err));
      setReachable('bad');
    } finally {
      setLogsLoading(false);
    }
  }, [logsError]);

  useEffect(() => {
    refreshLogs();
    const handle = setInterval(refreshLogs, 15_000);
    return () => clearInterval(handle);
  }, [refreshLogs]);

  const successCount = useMemo(
    () => logs.filter((r) => r.status_code >= 200 && r.status_code < 300).length,
    [logs]
  );
  const lastReceivedAt = logs[0]?.created_at ?? null;

  const handleSendTest = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const resp = await fetch('/api/integrations/99acres/test-send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(testPayload),
        cache: 'no-store',
      });
      const json: TestSendResult = await resp.json();
      setTestResult(json);
    } catch (err) {
      setTestResult({
        success: false,
        status: 0,
        request: { url: webhookUrl, headers: {}, body: testPayload },
        response: String(err),
        elapsedMs: 0,
      });
    } finally {
      setTestSending(false);
      // Server-side insert + log row may race the next 15s poll.
      setTimeout(refreshLogs, 600);
    }
  };

  const expandLog = async (id: string | number) => {
    if (expandedLogId === id) {
      setExpandedLogId(null);
      setLogDetail(null);
      return;
    }
    setExpandedLogId(id);
    setLogDetailLoading(true);
    try {
      const resp = await fetch(`/api/integrations/99acres/logs?id=${id}`, { cache: 'no-store' });
      const json = await resp.json();
      setLogDetail(json.data ?? null);
    } catch {
      setLogDetail(null);
    } finally {
      setLogDetailLoading(false);
    }
  };

  const handleDownloadPostman = () => {
    if (typeof window === 'undefined') return;
    window.open('/api/integrations/99acres/postman?download=1', '_blank');
  };

  const samplePayloadString = useMemo(
    () => JSON.stringify(testPayload, null, 2),
    [testPayload]
  );
  const sampleResponseString = useMemo(
    () => '{ "success": true, "message": "Lead received successfully" }',
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 sm:p-10 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link href="/" className="text-sm text-emerald-700 hover:underline">← Back to Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">99acres Integration</h1>
            <p className="text-slate-600 mt-1 max-w-2xl">
              Receive leads directly from 99acres via an HTTP webhook. Use the controls
              below to test the integration end-to-end.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <span
              data-testid="status-badge"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${STATUS_BADGE_CLASSES[reachable]}`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT_CLASSES[reachable]}`} />
              {STATUS_LABEL[reachable]}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium">
              Leads received: <strong>{successCount}</strong>
            </span>
            {lastReceivedAt && (
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                Last: {new Date(lastReceivedAt).toLocaleString()}
              </span>
            )}
          </div>
        </header>

        <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Integration Settings</h2>
            <div className="flex items-center gap-3">
              {settingsSavedAt && (
                <span className="text-xs text-slate-500">Saved at {settingsSavedAt}</span>
              )}
              <button
                onClick={saveSettings}
                className="px-3 py-1.5 text-sm rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Save
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Username" hint="Sent in payload, used for partner identification.">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="username-input"
                className="w-full font-mono text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </Field>
            <Field label="Profile ID" hint="Your 99acres builder profile id.">
              <input
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                data-testid="profile-id-input"
                className="w-full font-mono text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </Field>
            <Field label="Authentication Token" hint="Set NINETY_NINE_ACRES_BEARER_TOKEN to require this.">
              <div className="flex items-center gap-3">
                <code className="font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 truncate">
                  {config.authConfigured
                    ? `Bearer ${config.bearerTokenMasked}`
                    : 'Not configured (webhook is open)'}
                </code>
              </div>
            </Field>
            <Field
              label="Webhook Endpoint URL"
              hint="POST this URL with a JSON body containing the lead fields below."
            >
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={webhookUrl}
                  className="font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 truncate focus:outline-none"
                  data-testid="webhook-url"
                />
                <button
                  onClick={() => copyText(webhookUrl, () => flashCopied('webhook'))}
                  className="px-3 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-700"
                  data-testid="copy-webhook"
                >
                  {copiedKey === 'webhook' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </Field>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Send Test Lead</h2>
            <button
              onClick={handleSendTest}
              disabled={testSending}
              data-testid="test-lead-btn"
              className="px-4 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {testSending ? 'Sending…' : 'Send Test Lead'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEST_FIELDS.map(({ key, label }) => (
              <label key={key} className="block">
                <span className="text-sm text-slate-600">{label}</span>
                <input
                  value={testPayload[key] ?? ''}
                  onChange={(e) =>
                    setTestPayload((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </label>
            ))}
          </div>

          {testResult && <TestResultPanel result={testResult} />}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Generate cURL</h2>
              <button
                onClick={() => copyText(sampleCurl, () => flashCopied('curl'))}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-700"
              >
                {copiedKey === 'curl' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-200 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
              {sampleCurl}
            </pre>
          </div>

          <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Postman Collection</h2>
            <p className="text-sm text-slate-600 flex-1">
              Download a ready-to-import Postman v2.1 collection with a working
              sample webhook request. Set the <code>token</code> variable to your
              bearer secret before sending.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDownloadPostman}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
              >
                Download .json
              </button>
              <a
                href="/api/integrations/99acres/postman"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Preview
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Partner Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <DocRow
              label="Webhook URL"
              value={webhookUrl}
              onCopy={() => copyText(webhookUrl, () => flashCopied('doc-url'))}
            />
            <DocRow
              label="Authentication"
              value={config.authConfigured ? 'Bearer Token (recommended)' : 'None (open during setup)'}
            />
            <DocRow label="Username" value={username} />
            <DocRow label="Profile ID" value={profileId} />
            <DocRow label="Method" value="POST application/json" />
            <DocRow label="Content-Type" value="application/json" />
            <DocRow label="Sample payload" value={samplePayloadString} block />
            <DocRow label="Sample response" value={sampleResponseString} block />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Integration Logs</h2>
            <button
              onClick={refreshLogs}
              disabled={logsLoading}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              {logsLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {logsError && (
            <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">
              {logsError}
            </div>
          )}

          {logs.length === 0 && !logsLoading && !logsError && (
            <div className="text-sm text-slate-500 py-6 text-center">
              No webhook calls yet. Click <strong>Send Test Lead</strong> to
              generate one.
            </div>
          )}

          {logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Lead Name</th>
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Project</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3">IP</th>
                    <th className="py-2 pr-3">Response</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <LogRowComponent
                      key={String(row.id)}
                      row={row}
                      expanded={expandedLogId === row.id}
                      detailLoading={logDetailLoading && expandedLogId === row.id}
                      detail={expandedLogId === row.id ? logDetail : null}
                      onExpand={() => expandLog(row.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TestResultPanel({ result }: { result: TestSendResult }) {
  const json = useMemo(() => JSON.stringify(result, null, 2), [result]);
  const tone = result.success ? 'good' : 'bad';
  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Stat label="Status" value={String(result.status)} />
        <Stat label="Time" value={`${result.elapsedMs} ms`} />
        <Stat label="Result" value={result.success ? 'Success' : 'Failed'} tone={tone} />
      </div>
      <pre className="bg-slate-900 text-emerald-200 text-xs rounded-lg p-4 overflow-x-auto">
        {json}
      </pre>
    </div>
  );
}

function Field(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{props.label}</span>
      {props.hint && <span className="block text-xs text-slate-500 mb-1">{props.hint}</span>}
      {props.children}
    </label>
  );
}

function Stat(props: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const tone =
    props.tone === 'good'
      ? 'text-emerald-700 bg-emerald-50'
      : props.tone === 'bad'
        ? 'text-rose-700 bg-rose-50'
        : 'text-slate-700 bg-slate-50';
  return (
    <div className={`rounded-lg px-3 py-2 ${tone}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{props.label}</div>
      <div className="text-lg font-semibold">{props.value}</div>
    </div>
  );
}

function DocRow(props: {
  label: string;
  value: string;
  block?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
        {props.label}
        {props.onCopy && (
          <button
            onClick={props.onCopy}
            className="ml-2 text-slate-400 hover:text-slate-700 text-xs"
          >
            (copy)
          </button>
        )}
      </div>
      <pre
        className={
          (props.block
            ? 'whitespace-pre-wrap break-all'
            : 'truncate') +
          ' bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono'
        }
      >
        {props.value}
      </pre>
    </div>
  );
}

function LogRowComponent(props: {
  row: LogRow;
  expanded: boolean;
  detailLoading: boolean;
  detail: LogDetail | null;
  onExpand: () => void;
}) {
  const { row, expanded, detailLoading, detail, onExpand } = props;
  const tone = statusTone(row.status_code);
  const createdAt = useMemo(
    () => new Date(row.created_at).toLocaleString(),
    [row.created_at]
  );
  return (
    <>
      <tr onClick={onExpand} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
        <td className="py-2 pr-3 whitespace-nowrap text-slate-600">{createdAt}</td>
        <td className="py-2 pr-3">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE_CLASSES[tone]}`}>
            {row.status_code}
          </span>
        </td>
        <td className="py-2 pr-3">{row.lead_name ?? '—'}</td>
        <td className="py-2 pr-3 font-mono">{row.phone ?? '—'}</td>
        <td className="py-2 pr-3">{row.project ?? '—'}</td>
        <td className="py-2 pr-3">{row.source ?? '—'}</td>
        <td className="py-2 pr-3 text-slate-500 font-mono">{row.ip_address ?? '—'}</td>
        <td className="py-2 pr-3 text-slate-500">
          {row.response_time_ms ? `${row.response_time_ms} ms` : '—'}
        </td>
        <td className="py-2 pr-3 text-emerald-700">{expanded ? 'Hide' : 'View'}</td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={9} className="py-3 px-4">
            {detailLoading && <div className="text-sm text-slate-500">Loading…</div>}
            {detail && <LogDetailPanel detail={detail} />}
            {!detailLoading && !detail && (
              <div className="text-sm text-slate-500">No details available.</div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function LogDetailPanel({ detail }: { detail: LogDetail }) {
  const parsed = useMemo(
    () =>
      JSON.stringify(
        {
          lead_name: detail.lead_name,
          phone: detail.phone,
          project: detail.project,
          ip: detail.ip_address,
          ms: detail.response_time_ms,
        },
        null,
        2
      ),
    [detail]
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
      <Block label="Request Headers">
        <code>{JSON.stringify(detail.request_headers ?? {}, null, 2)}</code>
      </Block>
      <Block label="Raw Body">
        <code className="break-all">{detail.request_body ?? ''}</code>
      </Block>
      <Block label="Parsed Fields" wide>
        <code>{parsed}</code>
      </Block>
      <Block label="Response Sent" wide>
        <code className="break-all">{detail.response_body ?? ''}</code>
      </Block>
      {detail.error_message && (
        <Block label="Error" wide>
          <code className="text-rose-700">{detail.error_message}</code>
        </Block>
      )}
    </div>
  );
}

function Block(props: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={props.wide ? 'md:col-span-2' : ''}>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
        {props.label}
      </div>
      <pre className="bg-slate-900 text-emerald-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
        {props.children}
      </pre>
    </div>
  );
}