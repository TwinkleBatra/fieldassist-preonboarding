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
  const [unconfiguredModalStage, setUnconfiguredModalStage] = useState<EmailStageKey | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<{
    hasApiKey: boolean;
    provider: string;
    apiKeyName?: string;
    fromEmail?: string;
    note?: string;
  } | null>(null);

  // Test Mode State
  const [testStage, setTestStage] = useState<EmailStageKey>('account_ready');
  const [testEmail, setTestEmail] = useState(candidate.email || 'twinkle.verma@flick2know.com');
  const [testLoading, setTestLoading] = useState(false);

  const fetchProviderStatus = async () => {
    try {
      const res = await fetch('/api/emails/status');
      const data = await res.json();
      if (data?.providerConfig) {
        setProviderStatus({
          hasApiKey: data.providerConfig.hasApiKey,
          provider: data.providerConfig.provider,
          apiKeyName: data.providerConfig.apiKeyName,
          fromEmail: data.providerConfig.fromEmail,
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
          toEmail: 'twinkle.verma@flick2know.com',
          stageKey,
          recipientName: 'Twinkle Verma'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Real test email (${data.stageKey}) sent successfully to twinkle.verma@flick2know.com! Check your inbox.`);
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
    // If SMTP / Resend credentials are not configured in Settings, open the dispatch assistance modal
    if (!providerStatus?.hasApiKey) {
      setUnconfiguredModalStage(stageKey);
      return;
    }

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
        if (res.message?.includes('No email provider credentials configured') || res.message?.includes('None Configured')) {
          setUnconfiguredModalStage(stageKey);
        } else {
          showToast('error', res.message);
        }
      }
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
        providerStatus?.hasApiKey
          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
          : 'bg-amber-50/80 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
            providerStatus?.hasApiKey ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {providerStatus?.hasApiKey ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">
                {providerStatus?.hasApiKey
                  ? 'Live Email Service Active'
                  : 'Live SMTP Email Delivery Ready for Setup'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                providerStatus?.hasApiKey
                  ? 'bg-emerald-200/80 border-emerald-400 text-emerald-800'
                  : 'bg-amber-200/80 border-amber-400 text-amber-800'
              }`}>
                {providerStatus?.hasApiKey ? 'Connected' : 'Credentials Needed'}
              </span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5">
              {providerStatus?.hasApiKey
                ? `Sending real emails via ${providerStatus.provider}. Sender: ${providerStatus.fromEmail}`
                : 'Provide your Gmail / Google Workspace email + 16-character App Password (SMTP_USER & SMTP_PASS) in Settings to deliver directly to candidate inboxes.'}
            </p>
          </div>
        </div>

        {/* Live Test Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSendTestToTwinkle('account_ready')}
            disabled={testSendingTwinkle}
            className="px-3 py-1.5 bg-purple-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            title="Send an actual test email to twinkle.verma@flick2know.com"
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
              placeholder="e.g. hr.test@flick2know.com"
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

      {/* Unconfigured Email Provider Dispatch Assistance Modal */}
      {unconfiguredModalStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Mail className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Send Email to {toTitleCase(candidate.name)}</h3>
                  <p className="text-xs text-purple-200">
                    Stage: <strong className="text-white">{EMAIL_TEMPLATES[unconfiguredModalStage]?.stageName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnconfiguredModalStage(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              
              {/* Why Did This Pop Up Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Why didn't the email send automatically in the background?</span>
                  <p className="opacity-90 leading-relaxed">
                    Background automated delivery requires mail server credentials (<strong>SMTP_USER</strong> &amp; <strong>SMTP_PASS</strong>) in the project <strong>Settings</strong>.
                    However, you can still deliver this onboarding email to <strong>{candidate.email}</strong> right now in 1 click!
                  </p>
                </div>
              </div>

              {/* Instant 1-Click Option: Gmail Web Compose */}
              {(() => {
                const tpl = EMAIL_TEMPLATES[unconfiguredModalStage];
                const fName = extractFirstName(candidate.name);
                const bodyText = tpl?.getBodyText(fName, candidate) || '';
                const subject = tpl?.subject || '';
                const gmailUrl = buildGmailComposeUrl({
                  toEmail: candidate.email,
                  subject,
                  bodyText
                });

                return (
                  <div className="space-y-4">
                    <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                          Option 1: Instant 1-Click Send via Google Workspace
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          Ready Now
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Opens Gmail with recipient (<strong>{candidate.email}</strong>), subject, and personalized onboarding body pre-filled from your Workspace account.
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <a
                          href={gmailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            markStageAsSentManually(candidate.id, unconfiguredModalStage, 'Gmail Compose (Google Workspace)');
                            showToast('info', 'Opened pre-filled email in Gmail. Hit Send in Gmail to deliver!');
                            onCandidateUpdated();
                            setUnconfiguredModalStage(null);
                          }}
                          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs text-center"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open in Gmail &amp; Mark as Sent</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            markStageAsSentManually(candidate.id, unconfiguredModalStage, 'External Email Client');
                            showToast('success', `Marked ${tpl.stageName} as sent`);
                            onCandidateUpdated();
                            setUnconfiguredModalStage(null);
                          }}
                          className="px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Mark as Sent
                        </button>
                      </div>
                    </div>

                    {/* Option 2: Copy Content */}
                    <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Option 2: Copy Subject &amp; Body
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(subject);
                              setCopiedItem('subject');
                              setTimeout(() => setCopiedItem(null), 2500);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedItem === 'subject' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedItem === 'subject' ? 'Copied' : 'Copy Subject'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(bodyText);
                              setCopiedItem('body');
                              setTimeout(() => setCopiedItem(null), 2500);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedItem === 'body' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedItem === 'body' ? 'Copied' : 'Copy Body'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto text-xs font-sans text-slate-700 whitespace-pre-line leading-relaxed">
                        {bodyText}
                      </div>
                    </div>

                    {/* How to enable full background sending */}
                    <details className="border border-slate-200 rounded-xl p-3.5 text-xs group">
                      <summary className="font-bold text-slate-800 cursor-pointer flex items-center justify-between">
                        <span>How to enable Background Sending (2-Min Setup)</span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="pt-3 space-y-2 text-slate-600 leading-relaxed">
                        <p>To have the <strong>"Send Now"</strong> button dispatch real emails directly in the background without opening Gmail:</p>
                        <ol className="list-decimal pl-5 space-y-1 font-medium">
                          <li>Open your Google Account: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-purple-700 underline font-bold">Google App Passwords</a>.</li>
                          <li>Generate a 16-character App Password for <strong>FieldAssist</strong>.</li>
                          <li>In AI Studio top menu, click <strong>Settings</strong> and add:
                            <div className="mt-1 space-y-0.5 font-mono text-[11px] bg-slate-100 p-2 rounded border border-slate-200">
                              <div><strong>SMTP_USER</strong> = twinkle.verma@flick2know.com</div>
                              <div><strong>SMTP_PASS</strong> = your-16-letter-app-password</div>
                            </div>
                          </li>
                        </ol>
                      </div>
                    </details>
                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setUnconfiguredModalStage(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
