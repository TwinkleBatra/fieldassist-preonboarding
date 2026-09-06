import React, { useState } from 'react';
import { X, Send, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { Candidate } from '../../types';
import { PRIMARY_HR_CONTACT } from '../../utils/hrbp';

interface ContactHRModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuery: (subject: string, message: string, recipientName?: string, recipientEmail?: string) => void;
}

export const ContactHRModal: React.FC<ContactHRModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onSubmitQuery
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const activeContact = PRIMARY_HR_CONTACT;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    
    onSubmitQuery(subject, message, activeContact.name, activeContact.email);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSubject('');
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
              Contact HR
            </span>
            <h3 className="text-base font-bold text-white">Ask {activeContact.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HR Card Summary */}
        <div className="bg-purple-50/70 p-4 border-b border-purple-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={activeContact.avatarUrl || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80'}
              alt={activeContact.name}
              className="w-10 h-10 rounded-full object-cover border border-purple-200"
            />
            <div>
              <p className="font-bold text-slate-900">{activeContact.name}</p>
              <p className="text-purple-700 font-medium">{activeContact.role}</p>
            </div>
          </div>

          <div className="text-right space-y-0.5">
            <a href={`mailto:${activeContact.email}`} className="text-purple-700 hover:underline flex items-center gap-1 font-semibold text-[11px]">
              <Mail className="w-3 h-3" /> Email HR
            </a>
            <a href={`tel:${activeContact.phone}`} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[11px]">
              <Phone className="w-3 h-3 text-slate-400" /> {activeContact.phone}
            </a>
          </div>
        </div>

        {/* Form Body or Success message */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Message Sent to {activeContact.name}!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your query has been logged. {activeContact.name} will respond to your email ({candidate.email}) shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject / Topic *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question regarding Laptop preference / Relieving letter deadline"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Detail *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe your question or request..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
