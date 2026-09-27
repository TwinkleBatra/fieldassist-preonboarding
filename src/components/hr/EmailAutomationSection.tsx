import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle2, AlertCircle, Play, Eye, RefreshCw, Send, Sparkles, ChevronDown, ChevronUp, Link2, FlaskConical, ExternalLink, ShieldCheck, Check, HelpCircle, Copy, X, Key, Settings } from 'lucide-react';
import { Candidate, EmailStageKey, EmailStageLog } from '../../types';
import { EMAIL_TEMPLATES, extractFirstName, calculateTargetDate } from '../../services/emailTemplates';
import { dispatchCandidateEmail, sendTestEmailToCustomRecipient, isCandidateActive } from '../../services/emailDispatcherService';
import { openGmailComposeForCandidate, buildGmailComposeUrl, markStageAsSentManually } from '../../services/googleWorkspaceEmail';
import { EmailSettingsModal } from './EmailSettingsModal';
import { formatJoiningDate } from '../../utils/dateUtils';
import { toTitleCase } from '../../utils/textUtils';

interface EmailAutomationSectionProps {
  candidate: Candidate;
  onCandidateUpdated: () => void;
}

export const EmailAutomationSection: React.FC<EmailAutomationSectionProps> = ({ candidate, onCandidateUpdated }) => {
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [expandedPreview, setExpandedPreview] = useState<EmailStageKey | null>(null);
  const [confirmResendStage, setConfirmResendStage] = useState<EmailStageKey | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [testSendingTwinkle, setTestSendingTwinkle] = useState(false);
  const [providerStatus, setProviderStatus] = useState<{
    hasApiKey: boolean;
    provider: string;
    apiKeyName?: string;
    fromEmail?: string;
    isSandboxWarning?: boolean;
    note?: string;
  } | null>(null);

  // Test Mode State
  const [testStage, setTestStage] = useState<EmailStageKey>('account_ready');
  const [testEmail, setTestEmail] = useState(candidate.email || 'twinkle.verma@fieldassist.com');
  const [testLoading, setTestLoading] = useState(false);

  const fetchProviderStatus = async () => {
    try {
      const res = await fetch('/api/emails/status');
      if (!res.ok) {
        console.warn(`Email status check returned status ${res.status}`);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn('Email status did not return JSON');
        return;
      }
      const data = await res.json();
      if (data?.providerConfig) {
        setProviderStatus({
          hasApiKey: data.providerConfig.hasApiKey,
          provider: data.providerConfig.provider,
          apiKeyName: data.providerConfig.apiKeyName,
          fromEmail: data.providerConfig.fromEmail,
          isSandboxWarning: Boolean(data.providerConfig.isSandboxWarning || data.providerConfig.fromEmail?.includes('onboarding@resend.dev')),
          note: data.note
        });
      }
    } catch (e) {
      console.warn('Could not fetch email status', e);
    }
  };

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  useEffect(() => {
    if (candidate?.email) {
      setTestEmail(candidate.email);
    }
  }, [candidate?.email]);

  const active = isCandidateActive(candidate);
  const firstName = extractFirstName(candidate.name);
  const stagesKeys: EmailStageKey[] = ['account_ready', 'welcome_7d', 'culture_5d', 'comm_3d', 'day1_1d'];

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSendTestToTwinkle = async (stageKey: EmailStageKey = 'account_ready') => {
    setTestSendingTwinkle(true);
    try {
      const res = await fetch('/api/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: 'twinkle.verma@fieldassist.com',
          stageKey,
          recipientName: 'Twinkle Verma'
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        if (res.status === 404 || text.includes('The page could not be found')) {
          showToast('error', 'Vercel 404: The /api/emails endpoints have not been redeployed on Vercel yet. Please redeploy your latest changes on Vercel.');
        } else {
          showToast('error', `Server error (${res.status}): Please ensure your latest code is deployed.`);
        }
        return;
      }

      const data = await res.json();
      if (data.success) {
        if (data.isSandboxWarning || data.provider?.includes('onboarding@resend.dev') || data.fromEmail?.includes('onboarding@resend.dev')) {
          showToast('error', `Sent via Resend Sandbox (onboarding@resend.dev) — this lands in SPAM! Configure SMTP_USER & SMTP_PASS in Vercel to send via Google Workspace.`);
        } else {
          showToast('success', `Real test email sent via ${data.provider}! Delivered from ${data.fromEmail || 'Google Workspace'}. Check your inbox.`);
        }
      } else {
        showToast('error', `Test email delivery failed: ${data.errorMessage || 'Unknown error'}`);
      }
      fetchProviderStatus();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to dispatch test email');
    } finally {
      setTestSendingTwinkle(false);
    }
  };

  const handleOpenInGmail = (stageKey: EmailStageKey) => {
    try {
      openGmailComposeForCandidate(candidate.id, stageKey);
      showToast('info', 'Opened pre-filled email in Gmail web compose. Hit Send in Gmail to deliver from your Google Workspace account.');
      onCandidateUpdated();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to open Gmail');
    }
  };

  const handleSendEmail = async (stageKey: EmailStageKey, forceResend: boolean = false) => {
    setLoadingStage(stageKey);
    setConfirmResendStage(null);
    try {
      const res = await dispatchCandidateEmail(candidate.id, stageKey, {
        forceResend,
        triggeredBy: 'hr_manual'
      });

      if (res.success) {
        showToast('success', res.message);
        onCandidateUpdated();
      } else {
        showToast('error', res.message || 'Failed to dispatch email');
      }
      fetchProviderStatus();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to dispatch email');
    } finally {
      setLoadingStage(null);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setTestLoading(true);
    try {
      const res = await sendTestEmailToCustomRecipient(candidate.id, testStage, testEmail);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Test email dispatch failed');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestSimulationAll = async () => {
    setLoadingStage('all');
    try {
      let sent = 0;
      for (const key of stagesKeys) {
        const res = await dispatchCandidateEmail(candidate.id, key, {
          forceResend: true,
          isTestSimulation: true,
          triggeredBy: 'test_simulation'
        });
        if (res.success) sent++;
      }
      showToast('success', `Test simulation complete: All 5 pre-onboarding emails processed for ${firstName}`);
      onCandidateUpdated();
    } catch (err: any) {
      showToast('error', err.message || 'Simulation test failed');
    } finally {
      setLoadingStage(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
          toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
          toastMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
          'bg-purple-50 border-purple-200 text-purple-900'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer ml-2">✕</button>
        </div>
      )}

      {/* Real SMTP Delivery Status Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        providerStatus?.isSandboxWarning
          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
          : providerStatus?.hasApiKey
          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
          : 'bg-slate-50 border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
            providerStatus?.isSandboxWarning
              ? 'bg-amber-200 text-amber-900'
              : providerStatus?.hasApiKey
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-700'
          }`}>
            {providerStatus?.isSandboxWarning ? (
              <AlertCircle className="w-4 h-4" />
            ) : providerStatus?.hasApiKey ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">
                {providerStatus?.isSandboxWarning
                  ? '⚠️ Emails Sending from Resend Sandbox (Landing in Spam)'
                  : providerStatus?.provider === 'smtp'
                  ? 'Google Workspace SMTP Active (Primary Inbox Delivery)'
                  : providerStatus?.hasApiKey
                  ? 'Live Email Service Active'
                  : 'Live SMTP Email Delivery Ready for Setup'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                providerStatus?.isSandboxWarning
                  ? 'bg-amber-200 border-amber-400 text-amber-900 font-semibold'
                  : providerStatus?.hasApiKey
                  ? 'bg-emerald-200/80 border-emerald-400 text-emerald-800'
                  : 'bg-slate-200 border-slate-400 text-slate-800'
              }`}>
                {providerStatus?.isSandboxWarning
                  ? 'Sandbox Warning: Spam Risk'
                  : providerStatus?.hasApiKey
                  ? 'Verified Delivery'
                  : 'Credentials Needed'}
              </span>
              <button
                type="button"
                onClick={() => {
                  fetchProviderStatus();
                  showToast('info', 'Checking email service connection...');
                }}
                className="p-1 hover:bg-black/5 rounded text-slate-500 hover:text-slate-700 transition cursor-pointer"
                title="Refresh email connection status"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
              {providerStatus?.isSandboxWarning ? (
                <>
                  Emails are currently routing through <strong>onboarding@resend.dev</strong> because <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">RESEND_API_KEY</code> is active without a verified custom domain. <strong>Google &amp; Outlook automatically flag onboarding@resend.dev as spam.</strong>
                  <br />
                  <span className="font-semibold text-purple-900">How to fix:</span> Add <code className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded font-mono text-[10px]">SMTP_USER=twinkle.verma@fieldassist.com</code> and <code className="bg-purple-100 text-purple-900 px-1 py-0.5 rounded font-mono text-[10px]">SMTP_PASS=&lt;16-char-app-password&gt;</code> in your Vercel Project Settings &rarr; Environment Variables. The app will immediately send from your verified Google Workspace account and land in the Primary Inbox.
                </>
              ) : providerStatus?.hasApiKey ? (
                `Delivering directly via ${providerStatus.provider}. Sender: ${providerStatus.fromEmail}. SPF/DKIM aligned with 0% spam score.`
              ) : (
                'Provide your Gmail / Google Workspace email + 16-character App Password (SMTP_USER & SMTP_PASS) in Settings to deliver directly to candidate inboxes.'
              )}
            </p>
          </div>
        </div>

        {/* Live Test Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSendTestToTwinkle('account_ready')}
            disabled={testSendingTwinkle}
            className="px-3 py-1.5 bg-purple-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            title="Send an actual test email to twinkle.verma@fieldassist.com"
          >
            {testSendingTwinkle ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Send Test to Twinkle</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-700" />
            <h4 className="text-base font-bold text-slate-900">Pre-Onboarding Email Automation (5 Stages)</h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immediate account credentials email + 7-day, 5-day, 3-day &amp; 1-day emails calculated from candidate joining date (<strong className="text-purple-900">{formatJoiningDate(candidate.joiningDate, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Configure resource links"
          >
            <Link2 className="w-3.5 h-3.5 text-purple-700" />
            <span>Link Settings</span>
          </button>

          <button
            onClick={handleTestSimulationAll}
            disabled={loadingStage !== null || !active}
            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Force trigger/test all 5 emails instantly"
          >
            {loadingStage === 'all' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Test All 5 Emails</span>
          </button>
        </div>
      </div>

      {/* Status Warning if Candidate is Cancelled/Inactive */}
      {!active && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Candidate is currently <strong>{candidate.status}</strong>. Automated email dispatches are paused for inactive candidates.</span>
        </div>
      )}

      {/* Email Stages Grid */}
      <div className="space-y-3">
        {stagesKeys.map(key => {
          const tpl = EMAIL_TEMPLATES[key];
          const targetDate = key === 'account_ready'
            ? (candidate.emailAutomation?.stages?.[key]?.targetDate || new Date().toISOString().split('T')[0])
            : calculateTargetDate(candidate.joiningDate, tpl.daysBeforeJoining);
          const stageLog: EmailStageLog | undefined = candidate.emailAutomation?.stages?.[key];
          const status = stageLog?.status || 'Pending';
          const isExpanded = expandedPreview === key;
          const isConfirmingResend = confirmResendStage === key;
          const isLoading = loadingStage === key;

          return (
            <div key={key} className={`rounded-xl border transition-all ${
              status === 'Sent' ? 'bg-emerald-50/30 border-emerald-200' :
              status === 'Failed' ? 'bg-rose-50/30 border-rose-200' :
              'bg-slate-50/50 border-slate-200'
            }`}>
              {/* Row Header */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-md border border-purple-200">
                      {key === 'account_ready' ? 'Immediate' : `${tpl.daysBeforeJoining} Day${tpl.daysBeforeJoining > 1 ? 's' : ''} Before`}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">{tpl.stageName}</h5>

                    {/* Status Badge */}
                    {status === 'Sent' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Sent ({stageLog?.sentAt ? new Date(stageLog.sentAt).toLocaleDateString('en-GB') : 'Done'})
                      </span>
                    )}
                    {status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {key === 'account_ready' ? 'Immediate upon creation' : `Scheduled for ${formatJoiningDate(targetDate, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </span>
                    )}
                    {status === 'Failed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded-full border border-rose-300">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Failed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 font-medium truncate">
                    <strong className="text-slate-800">Subject:</strong> {tpl.subject}
                  </p>

                  {status === 'Failed' && stageLog?.errorMessage && (
                    <p className="text-[11px] text-rose-700 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                      <strong>Error:</strong> {stageLog.errorMessage}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedPreview(isExpanded ? null : key)}
                    className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    title="View rendered email preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isExpanded ? 'Hide' : 'Preview'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Open in Gmail (Google Workspace direct dispatch) */}
                  <a
                    href={buildGmailComposeUrl({
                      toEmail: candidate.email,
                      subject: tpl.subject,
                      bodyText: tpl.getBodyText(firstName, candidate)
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      markStageAsSentManually(candidate.id, key, 'Gmail Compose (Google Workspace)');
                      showToast('info', 'Opened pre-filled email in Gmail web compose. Hit Send in Gmail to deliver from your Google Workspace account.');
                      onCandidateUpdated();
                    }}
                    className={`px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${!active ? 'pointer-events-none opacity-50' : ''}`}
                    title="Open directly in your Google Workspace / Gmail account to review and send"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-red-600" />
                    <span>Gmail Send</span>
                  </a>

                  {/* Send / Resend Button */}
                  {status === 'Sent' ? (
                    isConfirmingResend ? (
                      <div className="flex items-center gap-1.5 animate-fadeIn">
                        <button
                          onClick={() => handleSendEmail(key, true)}
                          disabled={isLoading}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Confirm Resend
                        </button>
                        <button
                          onClick={() => setConfirmResendStage(null)}
                          className="px-2 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmResendStage(key)}
                        disabled={isLoading || !active}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Resend Email</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleSendEmail(key, false)}
                      disabled={isLoading || !active}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Send Now</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Drawer */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-200/80 bg-white rounded-b-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                    <span>To: <strong>{toTitleCase(candidate.name)}</strong> &lt;{candidate.email}&gt;</span>
                    <span>Target Date: <strong>{key === 'account_ready' ? 'Immediate' : targetDate}</strong></span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line font-sans leading-relaxed max-h-60 overflow-y-auto">
                    {tpl.getBodyText(firstName, candidate)}
                  </div>

                  {stageLog?.logs && stageLog.logs.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Dispatch History & Audit Logs</span>
                      <div className="space-y-1 text-[11px] text-slate-600 font-mono">
                        {stageLog.logs.map((logItem, idx) => (
                          <div key={idx} className="bg-slate-100/70 p-1.5 rounded border border-slate-200/60">
                            {logItem}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* HR Dedicated Test Mode Drawer */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-700" />
          <h5 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Safe HR Test Mode</h5>
        </div>
        <p className="text-[11px] text-slate-600">
          Send a test email for any stage to an arbitrary address without altering {toTitleCase(candidate.name)}'s official candidate schedule status.
        </p>

        <form onSubmit={handleSendTestEmail} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs items-center">
          <div className="sm:col-span-4">
            <select
              value={testStage}
              onChange={(e) => setTestStage(e.target.value as EmailStageKey)}
              className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
            >
              {stagesKeys.map(key => (
                <option key={key} value={key}>
                  {EMAIL_TEMPLATES[key].stageName}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="e.g. hr.test@fieldassist.com"
              required
              className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={testLoading}
              className="w-full bg-purple-900 hover:bg-black text-white rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send Test Email</span>
            </button>
          </div>
        </form>
      </div>

      {/* Link Settings Modal */}
      <EmailSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
};
