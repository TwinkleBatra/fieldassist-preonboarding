import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, ExternalLink, Mail, Info, Eye, EyeOff } from 'lucide-react';

interface SmtpCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAuthEmail?: string;
  currentFromEmail?: string;
  domainMismatch?: boolean;
  onCredentialsUpdated: () => void;
}

export const SmtpCredentialsModal: React.FC<SmtpCredentialsModalProps> = ({
  isOpen,
  onClose,
  currentAuthEmail = 'twinkle.verma@flick2know.com',
  currentFromEmail = '"Twinkle Verma - FieldAssist HR" <twinkle.verma@fieldassist.com>',
  domainMismatch = true,
  onCredentialsUpdated,
}) => {
  const [smtpUser, setSmtpUser] = useState(
    currentAuthEmail.includes('fieldassist.com') ? currentAuthEmail : 'twinkle.verma@fieldassist.com'
  );
  const [smtpPass, setSmtpPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFrom, setEmailFrom] = useState(currentFromEmail);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/emails/update-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim().replace(/\s+/g, ''),
          smtpHost: smtpHost.trim(),
          smtpPort: Number(smtpPort),
          emailFrom: emailFrom.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: 'Connection verified and saved successfully! Emails will now send using this account.'
        });
        onCredentialsUpdated();
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Failed to authenticate with Google SMTP. Please verify the 16-character App Password.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while testing connection.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Key className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Email Sender &amp; SMTP Credentials</h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Configure direct Google Workspace delivery for FieldAssist onboarding emails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Important Explanatory Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-900 text-xs block">
                  Why Google shows the sender as <code>flick2know.com</code>:
                </span>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  Google&apos;s SMTP servers (<code>smtp.gmail.com</code>) enforce anti-spoofing security. If you authenticate using your <strong>flick2know.com</strong> credentials, Google automatically rewrites the <code>From:</code> header on delivered emails to <code>flick2know.com</code> unless one of the two steps below is completed:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-[11px]">
              <div className="bg-white/90 p-3 rounded-lg border border-amber-200 shadow-xs">
                <span className="font-bold text-purple-900 block mb-1">
                  Option 1: Connect fieldassist.com (Direct)
                </span>
                <p className="text-slate-600 leading-normal mb-2">
                  Generate a 16-character Google App Password for <strong>twinkle.verma@fieldassist.com</strong> and enter it below.
                </p>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-900 underline"
                >
                  Generate Google App Password <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-white/90 p-3 rounded-lg border border-amber-200 shadow-xs">
                <span className="font-bold text-purple-900 block mb-1">
                  Option 2: Add Alias in Gmail (30 seconds)
                </span>
                <p className="text-slate-600 leading-normal">
                  In your <code>twinkle.verma@flick2know.com</code> Gmail &rarr; <strong>Settings &rarr; Accounts &rarr; &quot;Send mail as&quot;</strong> &rarr; Click <strong>&quot;Add another email address&quot;</strong>, add <code>twinkle.verma@fieldassist.com</code> and verify.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Google Workspace Account (SMTP User)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    required
                    placeholder="twinkle.verma@fieldassist.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Must be your Google email address with 2-Step Verification enabled.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  16-Character Google App Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    required
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Created at Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App passwords.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  From Header (Display Name &amp; Address)
                </label>
                <input
                  type="text"
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                  required
                  placeholder='"Twinkle Verma - FieldAssist HR" <twinkle.verma@fieldassist.com>'
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  SMTP Host &amp; Port
                </label>
                <input
                  type="text"
                  value={`${smtpHost}:${smtpPort}`}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">
                  <span className="font-bold block">
                    {testResult.success ? 'Authentication Verified' : 'Authentication Error'}
                  </span>
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isTesting || !smtpPass.trim()}
                className="px-5 py-2 bg-purple-900 hover:bg-black text-white rounded-xl font-bold transition text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isTesting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>Verify &amp; Save Credentials</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
