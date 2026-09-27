import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, X, AlertCircle, CheckCircle2, Loader2, User, Crown } from 'lucide-react';
import { User as FirebaseUser } from '../../lib/firebase';
import { 
  HRAdminDoc, 
  OWNER_EMAIL, 
  fetchHRAdmins, 
  addHRAdmin, 
  removeHRAdmin,
  seedOwnerHRAdmin
} from '../../services/hrAdminService';

interface ManageHRAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: FirebaseUser | null;
}

export const ManageHRAccessModal: React.FC<ManageHRAccessModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [admins, setAdmins] = useState<HRAdminDoc[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentUserEmail = currentUser?.email?.trim().toLowerCase() || '';

  const loadAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await seedOwnerHRAdmin();
      const list = await fetchHRAdmins();
      setAdmins(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load HR administrators.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setEmailInput('');
      setError(null);
      setSuccessMsg(null);
      loadAdmins();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter an email address.');
      return;
    }

    // Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    // Duplicate check
    const isDuplicate = admins.some(a => a.email.toLowerCase() === cleanEmail);
    if (isDuplicate || cleanEmail === OWNER_EMAIL.toLowerCase()) {
      setError(`${cleanEmail} already has HR access.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newAdmin = await addHRAdmin(cleanEmail, currentUserEmail || 'HR Admin');
      setAdmins(prev => [...prev, newAdmin]);
      setEmailInput('');
      setSuccessMsg(`Successfully granted HR access to ${cleanEmail}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to add HR admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    const cleanEmail = emailToRemove.trim().toLowerCase();

    // Safety checks
    if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
      setError('The system owner email cannot be removed.');
      return;
    }

    if (cleanEmail === currentUserEmail) {
      setError('You cannot remove your own HR access.');
      return;
    }

    setRemovingEmail(cleanEmail);
    setError(null);
    setSuccessMsg(null);

    try {
      await removeHRAdmin(cleanEmail);
      setAdmins(prev => prev.filter(a => a.email.toLowerCase() !== cleanEmail));
      setSuccessMsg(`Removed HR access for ${cleanEmail}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove HR admin.');
    } finally {
      setRemovingEmail(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manage HR Access</h3>
              <p className="text-xs text-purple-200">Database-driven HR administrator allow-list</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-purple-300 hover:text-white transition p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Add Email Form */}
          <form onSubmit={handleAddEmail} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Grant New HR Access
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. hr.colleague@fieldassist.com"
                  disabled={isSubmitting}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !emailInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:cursor-not-allowed shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add email</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Alert Messages */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Current HR Emails List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Current HR Administrators ({admins.length})
              </h4>
              {isLoading && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </span>
              )}
            </div>

            <div className="space-y-2">
              {admins.map((admin) => {
                const isOwner = admin.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
                const isSelf = admin.email.toLowerCase() === currentUserEmail;
                const isRemoving = removingEmail === admin.email.toLowerCase();

                return (
                  <div
                    key={admin.email}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isOwner ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {isOwner ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {admin.email}
                          </span>
                          {isOwner && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                              Owner
                            </span>
                          )}
                          {!isOwner && isSelf && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {isOwner ? 'Permanent Primary Administrator' : `Added by ${admin.addedBy}`}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons: Owner has no Remove button. User's own email has no Remove button. */}
                    {!isOwner && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(admin.email)}
                        disabled={isRemoving}
                        className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                        title={`Remove HR access for ${admin.email}`}
                      >
                        {isRemoving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
