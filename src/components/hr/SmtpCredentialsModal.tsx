import React, { useState } from 'react';
import { X, Key, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, ExternalLink, Mail, Info, Eye, EyeOff, Server, Globe } from 'lucide-react';

interface SmtpCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAuthEmail?: string;
  currentFromEmail?: string;
  domainMismatch?: boolean;
  onCredentialsUpdated: () => void;
}

type ProviderPreset = 'outlook' | 'gmail' | 'custom';

export const SmtpCredentialsModal: React.FC<SmtpCredentialsModalProps> = ({
  isOpen,
  onClose,
  currentAuthEmail = 'twinkle.verma@flick2know.com',
  currentFromEmail = '"Twinkle Verma - FieldAssist HR" <twinkle.verma@fieldassist.com>',
  domainMismatch = true,
  onCredentialsUpdated,
}) => {
  // Determine initial preset based on current configuration
  const [providerPreset, setProviderPreset] = useState<ProviderPreset>('outlook');
  const [smtpUser, setSmtpUser] = useState('twinkle.verma@fieldassist.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFrom, setEmailFrom] = useState('"Twinkle Verma - FieldAssist HR" <twinkle.verma@fieldassist.com>');
  const [smtpHost, setSmtpHost] = useState('smtp.office365.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ProviderPreset) => {
    setProviderPreset(preset);
    setTestResult(null);

    if (preset === 'outlook') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort(587);
      setSmtpUser('twinkle.verma@fieldassist.com');
      setEmailFrom('"Twinkle Verma - FieldAssist HR" <twinkle.verma@fieldassist.com>');
    } else if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(465);
      setSmtpUser('twinkle.verma@flick2know.com');
      setEmailFrom('"Twinkle Verma - FieldAssist HR" <twinkle.verma@fieldassist.com>');
    }
  };

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

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => '');
        if (res.status === 404 || text.includes('The page could not be found')) {
          throw new Error('Endpoint /api/emails/update-smtp was not found. Please redeploy the latest code on Vercel.');
        } else {
          throw new Error(`Server returned HTTP ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || `Connected successfully to ${smtpHost}! Emails will now be sent directly from ${smtpUser}.`
        });
        onCredentialsUpdated();
      } else {
        setTestResult({
          success: false,
          message: data.message || `Failed to authenticate with ${smtpHost}. Please verify your credentials or App Password.`
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
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Mail className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">FieldAssist Email &amp; SMTP Settings</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Connect your Microsoft 365 Outlook account to send natively from <strong>twinkle.verma@fieldassist.com</strong>
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
          {/* Outlook Notice */}
          <div className="p-4 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 space-y-2">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-blue-950 text-xs block">
                  Microsoft 365 Outlook Configuration Detected:
                </span>
                <p className="text-[11px] leading-relaxed text-blue-900/90">
                  Because <code>fieldassist.com</code> is hosted on <strong>Microsoft 365 Outlook</strong> (not Google Workspace), using Google&apos;s SMTP caused emails to be delivered from <code>flick2know.com</code>. Connecting to Microsoft 365 SMTP below ensures all candidate emails originate directly from <strong>twinkle.verma@fieldassist.com</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Provider Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Email Service Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('outlook')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  providerPreset === 'outlook'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Microsoft 365
                  </span>
                  {providerPreset === 'outlook' && (
                    <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Outlook (fieldassist.com)
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('gmail')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  providerPreset === 'gmail'
                    ? 'border-purple-600 bg-purple-50/80 text-purple-950 ring-2 ring-purple-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-purple-600" />
                    Google Workspace
                  </span>
                  {providerPreset === 'gmail' && (
                    <span className="text-[9px] bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  Gmail (flick2know.com)
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('custom')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  providerPreset === 'custom'
                    ? 'border-slate-800 bg-slate-100 text-slate-900 ring-2 ring-slate-400'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-600" />
                    Custom SMTP
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Manual Host &amp; Port
                </p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {providerPreset === 'outlook' ? 'Microsoft 365 Account Email' : 'Account Email (SMTP User)'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    required
                    placeholder="twinkle.verma@fieldassist.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Your official FieldAssist email address.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {providerPreset === 'outlook' ? 'Microsoft Password / App Password' : 'App Password'}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    required
                    placeholder={providerPreset === 'outlook' ? 'Your Microsoft 365 password or App Password' : 'xxxx xxxx xxxx xxxx'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
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
                  {providerPreset === 'outlook' ? (
                    <span>
                      If 2FA is active on your Microsoft account, create an App Password at{' '}
                      <a
                        href="https://mysignins.microsoft.com/security-info"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline font-bold inline-flex items-center gap-0.5"
                      >
                        Microsoft Security Info <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </span>
                  ) : (
                    'Generated at Google Account > Security > App Passwords.'
                  )}
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  SMTP Host &amp; Port
                </label>
                {providerPreset === 'custom' ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.example.com"
                      className="w-2/3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-mono"
                    />
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="587"
                      className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-mono"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={`${smtpHost}:${smtpPort}`}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 cursor-not-allowed"
                  />
                )}
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
                className="px-5 py-2 bg-blue-900 hover:bg-black text-white rounded-xl font-bold transition text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
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
