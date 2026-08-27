import React, { useState, useEffect } from 'react';
import { X, Link2, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import { EmailSettings, getEmailSettings, saveEmailSettings, DEFAULT_EMAIL_SETTINGS } from '../../services/emailSettings';

interface EmailSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailSettingsModal: React.FC<EmailSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<EmailSettings>(getEmailSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getEmailSettings());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof EmailSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_EMAIL_SETTINGS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Link2 className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Email Automation Link Settings</h3>
              <p className="text-xs text-purple-200">Configure public resource & social URLs for automated emails</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Link Settings Saved!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              All future emails will use these updated resource URLs automatically.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">AMMO Pre-Read URL</label>
              <input
                type="url"
                value={settings.ammoPrereadUrl}
                onChange={(e) => handleChange('ammoPrereadUrl', e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                placeholder="https://www.fieldassist.com/ammo-preread"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">FA Newsletter URL</label>
              <input
                type="url"
                value={settings.newsletterUrl}
                onChange={(e) => handleChange('newsletterUrl', e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                placeholder="https://www.fieldassist.com/newsletter"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Page URL</label>
              <input
                type="url"
                value={settings.linkedinUrl}
                onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                placeholder="https://www.linkedin.com/company/fieldassist"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Instagram Page URL</label>
              <input
                type="url"
                value={settings.instagramUrl}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                placeholder="https://www.instagram.com/fieldassist/"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pathfinder's Video URL</label>
              <input
                type="url"
                value={settings.pathfinderVideoUrl}
                onChange={(e) => handleChange('pathfinderVideoUrl', e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                placeholder="https://www.youtube.com/@FieldAssist"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">AmbitionBox Rating URL</label>
              <input
                type="url"
                value={settings.ambitionBoxUrl}
                onChange={(e) => handleChange('ambitionBoxUrl', e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                placeholder="https://www.ambitionbox.com/reviews/fieldassist-reviews"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Glassdoor Rating URL</label>
              <input
                type="url"
                value={settings.glassdoorUrl}
                onChange={(e) => handleChange('glassdoorUrl', e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                placeholder="https://www.glassdoor.co.in/Reviews/FieldAssist-Reviews-E1204893.htm"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
