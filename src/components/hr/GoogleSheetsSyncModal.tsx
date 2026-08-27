import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Table,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Copy,
  Code2,
  HelpCircle,
  ShieldCheck,
  Database,
  Terminal
} from 'lucide-react';
import { Candidate } from '../../types';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  initializeGoogleSpreadsheet,
  syncAllCandidatesToGoogleSheets,
  GoogleSheetsConfig,
} from '../../services/googleSheetsSync';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../services/appsScriptCode';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  candidates,
}) => {
  const [config, setConfig] = useState<GoogleSheetsConfig>(getGoogleSheetsConfig());
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [spreadsheetUrlInput, setSpreadsheetUrlInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getGoogleSheetsConfig();
      setConfig(currentConfig);
      setWebhookUrlInput(currentConfig.webhookUrl || '');
      setSpreadsheetUrlInput(currentConfig.spreadsheetUrl || '');
      setStatusMessage(null);
      if (!currentConfig.webhookUrl) {
        setShowScriptGuide(true);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleConnectWebhook = async () => {
    if (!webhookUrlInput.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please paste your Google Apps Script Web app URL (starts with https://script.google.com/macros/s/...)',
      });
      return;
    }

    setIsInitializing(true);
    setStatusMessage(null);

    const res = await initializeGoogleSpreadsheet(webhookUrlInput.trim());
    setIsInitializing(false);

    if (res.success) {
      const updatedConfig = saveGoogleSheetsConfig({
        webhookUrl: webhookUrlInput.trim(),
        spreadsheetUrl: spreadsheetUrlInput.trim() || undefined,
        syncMode: 'webhook',
      });
      setConfig(updatedConfig);
      setStatusMessage({
        type: 'success',
        text: 'Connected to your Google Sheet! Initializing all 3 tabs now...',
      });
      // Automatically trigger sync for existing candidates
      handleSyncAll();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.errorMessage || 'Failed to connect to Apps Script webhook. Check permissions.',
      });
    }
  };

  const handleSyncAll = async () => {
    if (!config.webhookUrl) {
      setStatusMessage({
        type: 'error',
        text: 'Please connect your Google Apps Script Webhook URL first.',
      });
      return;
    }

    setIsSyncingAll(true);
    setStatusMessage(null);

    const res = await syncAllCandidatesToGoogleSheets(candidates);
    setIsSyncingAll(false);

    if (res.success) {
      const updatedConfig = getGoogleSheetsConfig();
      setConfig(updatedConfig);
      setStatusMessage({
        type: 'success',
        text: `Successfully pushed ${res.candidateCount || candidates.length} candidates across Candidate Master, Details & Documents, and Personal & Interests!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.errorMessage || 'Failed to sync candidates to Google Sheets.',
      });
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    const updated = saveGoogleSheetsConfig({ autoSyncEnabled: enabled });
    setConfig(updated);
  };

  const tabsInfo = [
    {
      name: '1. Candidate Master',
      desc: 'Candidate ID, Email, Full Name, Contact Number, DOJ, Role, Dept, Reporting Manager, HRBP / SPOC, Form Status, CTC & Experience, Remarks',
      cols: '22 Columns',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      name: '2. Details & Documents',
      desc: 'Candidate ID, Full Name, Email, Emergency Contact, DOB, Marital Status, Family Details, Address, PF/UAN, Aadhaar, PAN, Photos, Marksheets, Relieving & Experience Letters, Salary Slips, Tax & Bank Details',
      cols: '32 Columns',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      name: '3. Personal & Interests',
      desc: 'Candidate ID, Full Name, Email, Tshirt Size, Passion & Interests, Hobbies & Community Activity, LinkedIn Profile',
      cols: '7 Columns',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white relative">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 mb-1">
                  <Database className="w-3 h-3 text-emerald-300" />
                  Live Google Sheets Integration (3 Tabs)
                </span>
                <h3 className="text-xl font-bold text-white">
                  Google Sheets Real-Time Sync
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Direct read/write synchronization across Candidate Master, Details &amp; Documents, and Personal &amp; Interests tabs.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Status Message Banner */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 text-sm font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{statusMessage.text}</div>
            </div>
          )}

          {/* Webhook Connection Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-600" />
                  <span>Google Apps Script Webhook URL</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste the Web App URL generated from your Google Sheet&apos;s Apps Script.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowScriptGuide(!showScriptGuide)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                  <span>{showScriptGuide ? 'Hide Setup Guide' : '1-Min Setup Guide'}</span>
                </button>
                {config.spreadsheetUrl && (
                  <a
                    href={config.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Sheet</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick 1-Min Setup Instructions */}
            {showScriptGuide && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 text-xs text-blue-950">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Terminal className="w-4 h-4 text-blue-700" />
                    Quick 1-Minute Setup in your Google Sheet:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-300" />
                        <span>Code Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Apps Script Code</span>
                      </>
                    )}
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-blue-900/90 leading-relaxed">
                  <li>In your Google Sheet (e.g. <em>&quot;New Pre Onboarding&quot;</em>), click <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Delete any text in the editor, click <strong>&quot;Copy Apps Script Code&quot;</strong> above, and paste it.</li>
                  <li>Click <strong>Save (Disk icon)</strong>.</li>
                  <li>Click <strong>Deploy</strong> &gt; <strong>New deployment</strong> &gt; Select type: <strong>Web app</strong>.</li>
                  <li>Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>.</li>
                  <li>Click <strong>Deploy</strong>, authorize permissions, copy the <strong>Web app URL</strong>, and paste it below!</li>
                </ol>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Optional: Google Sheet URL (e.g. https://docs.google.com/spreadsheets/d/.../edit)"
                  value={spreadsheetUrlInput}
                  onChange={(e) => setSpreadsheetUrlInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                <button
                  type="button"
                  disabled={isInitializing || !webhookUrlInput.trim()}
                  onClick={handleConnectWebhook}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                >
                  {isInitializing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Connect &amp; Initialize 3 Tabs</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {config.lastSyncedAt && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Last full synchronization: <strong className="text-slate-700">{new Date(config.lastSyncedAt).toLocaleString()}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Sync Controls & Auto-Sync Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Manual Batch Synchronization</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Push all {candidates.length} candidate records, statutory data, and document URLs across all 3 sheets.
                </p>
              </div>
              <button
                type="button"
                disabled={isSyncingAll || !config.webhookUrl}
                onClick={handleSyncAll}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSyncingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Pushing to 3 Sheets...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync All {candidates.length} Candidates Now</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Live Event Auto-Sync</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically update Google Sheet rows whenever a candidate submits their pre-onboarding form.
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-700">
                  {config.autoSyncEnabled ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" /> Auto-Sync Active
                    </span>
                  ) : (
                    <span className="text-slate-400">Auto-Sync Paused</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleAutoSync(!config.autoSyncEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    config.autoSyncEnabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {config.autoSyncEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>

          {/* 3 Synchronized Sheet Tabs Specification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>The 3 Synchronized Sheet Tabs</span>
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                Strict Non-Duplicate Key Mapping
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {tabsInfo.map((tab, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition flex flex-col justify-between gap-1.5 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{tab.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tab.color}`}>
                      {tab.cols}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{tab.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Sync Details */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Zero-Cloud-Setup Webhook Architecture</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                By executing through your personal Google Apps Script Webhook, live writes directly modify your spreadsheet without requiring Google Cloud project API enablement, billing, or OAuth approval quotas.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {candidates.length} active candidates in FieldAssist database
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
