import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { FlaskConical, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Trash2, Play } from 'lucide-react';
import { api } from '../../lib/api.js';
import { storage } from '../../lib/storage.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatTile } from '../../components/ui/StatTile.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

const PREVIEW_COLS = [
  'fullName',
  'email',
  'registrationNo',
  'institutionName',
  'primaryDomainName',
  'gender',
  'plainPassword',
];

export const AdminTestingPage = () => {
  const toast = useToast();
  const fileInput = useRef(null);
  const [rows, setRows] = useState([]);
  const [filename, setFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const downloadTemplate = async () => {
    const token = storage.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/testing/template.xlsx`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Template download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vortex-testing-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded.');
    } catch (err) {
      toast.error(err.message ?? 'Failed to download template.');
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames.includes('Users') ? 'Users' : wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      if (!sheet) throw new Error('No sheet found in workbook');
      const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (parsed.length === 0) throw new Error('Sheet has no data rows');
      setRows(parsed);
      setFilename(file.name);
      setResults(null);
      toast.success(`Parsed ${parsed.length} row(s) from ${sheetName}.`);
    } catch (err) {
      toast.error(err.message ?? 'Failed to parse file.');
    }
  };

  const clearAll = () => {
    setRows([]);
    setFilename('');
    setResults(null);
  };

  const runImport = async () => {
    if (rows.length === 0) {
      toast.error('Upload an XLSX file first.');
      return;
    }
    setUploading(true);
    setResults(null);
    try {
      const summary = await api.post('/api/admin/testing/import', { rows });
      setResults(summary);
      if (summary.failed === 0) {
        toast.success(`Created ${summary.created} test users.`);
      } else {
        toast.error(`Created ${summary.created}, failed ${summary.failed}. See results below.`);
      }
    } catch (err) {
      toast.error(err.message ?? 'Import failed.');
    } finally {
      setUploading(false);
    }
  };

  const exportResults = async () => {
    if (!results?.results?.length) return;
    const token = storage.getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/testing/results.xlsx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ results: results.results }),
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `testing-import-results-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Results exported.');
    } catch (err) {
      toast.error(err.message ?? 'Export failed.');
    }
  };

  return (
    <>
      <PageHeader
        kicker="QA"
        title="Testing — Bulk User Import"
        description="Upload an Excel file to register up to 500 verified test users at once. Skips email verification and password issuance — every user is created VERIFIED with a known password for end-to-end testing."
        actions={(
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <button className="ghost-button inline-flex items-center justify-center gap-2" onClick={downloadTemplate}>
              <Download size={14} /> Template
            </button>
            <button
              className="glow-button inline-flex items-center justify-center gap-2"
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={14} /> Upload XLSX
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={FileSpreadsheet} label="Parsed Rows" value={rows.length} hint={filename || 'No file loaded'} />
        <StatTile icon={CheckCircle2} label="Created" value={results?.created ?? 0} hint="From last run" />
        <StatTile icon={AlertTriangle} label="Failed" value={results?.failed ?? 0} hint="From last run" />
        <StatTile icon={FlaskConical} label="Mode" value="VERIFIED" hint="No verification step" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          className="glow-button inline-flex items-center gap-2 disabled:opacity-40"
          onClick={runImport}
          disabled={uploading || rows.length === 0}
        >
          {uploading ? <Spinner size={14} /> : <Play size={14} />}
          {uploading ? 'Importing…' : `Run import (${rows.length})`}
        </button>
        <button
          className="ghost-button inline-flex items-center gap-2 disabled:opacity-40"
          onClick={clearAll}
          disabled={uploading || (rows.length === 0 && !results)}
        >
          <Trash2 size={14} /> Clear
        </button>
        {results && (
          <button className="ghost-button inline-flex items-center gap-2" onClick={exportResults}>
            <Download size={14} /> Export results .xlsx
          </button>
        )}
      </div>

      {rows.length === 0 && !results && (
        <Empty
          icon={FileSpreadsheet}
          title="No rows loaded yet"
          description="Download the template, fill it with up to 500 users, then upload it back here. Institution and domain names must match exactly the values listed in the template's reference sheets."
        />
      )}

      {rows.length > 0 && !results && (
        <div className="overflow-hidden rounded-none border border-white/5 bg-black">
          <div className="border-b border-white/5 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
            Preview · first 20 rows
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>#</Th>
                  {PREVIEW_COLS.map((c) => <Th key={c}>{c}</Th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-[11px] text-white/40">{i + 1}</td>
                    {PREVIEW_COLS.map((c) => (
                      <td key={c} className="px-4 py-3 font-mono text-[11px] text-text-primary">
                        {String(r[c] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && (
        <div className="overflow-hidden rounded-none border border-white/5 bg-black">
          <div className="border-b border-white/5 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
            Import results · {results.total} rows · {results.created} created · {results.failed} failed
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>#</Th>
                  <Th>Status</Th>
                  <Th>Email</Th>
                  <Th>Full name</Th>
                  <Th>Reg No</Th>
                  <Th>Password</Th>
                  <Th>Error</Th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((r) => (
                  <tr key={r.row} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] align-top">
                    <td className="px-4 py-3 font-mono text-[11px] text-white/40">{r.row}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === 'created' ? 'live' : 'crit'}>
                        {r.status === 'created' ? 'CREATED' : 'FAILED'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-primary">{r.email ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-primary">{r.fullName ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-primary">{r.registrationNo ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-primary">{r.plainPassword ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-rose-300">{r.error ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

const Th = ({ children }) => (
  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">{children}</th>
);
