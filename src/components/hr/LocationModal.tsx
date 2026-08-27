import React, { useState, useEffect } from 'react';
import { X, MapPin, Globe, Clock, Compass, Shirt, Utensils, User, ShieldCheck, Link2, Plus, Save, Trash2 } from 'lucide-react';
import { JoiningLocation, DressCodeType } from '../../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLocation: (location: JoiningLocation) => void;
  onDeleteLocation?: (locationId: string) => void;
  initialLocation?: JoiningLocation | null;
}

const TIMEZONE_PRESETS = [
  'IST (UTC+5:30)',
  'BST (UTC+1:00)',
  'SGT (UTC+8:00)',
  'EST (UTC-5:00)',
  'PST (UTC-8:00)',
  'CET (UTC+1:00)',
  'GST (UTC+4:00)',
  'AEST (UTC+10:00)',
  'JST (UTC+9:00)'
];

const COMMON_COUNTRIES = [
  'India',
  'United Kingdom',
  'Singapore',
  'United States',
  'United Arab Emirates',
  'Australia',
  'Germany',
  'Canada',
  'Japan',
  'Indonesia',
  'Malaysia',
  'Philippines',
  'Vietnam',
  'Kenya',
  'South Africa',
  'Brazil'
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onSaveLocation,
  onDeleteLocation,
  initialLocation
}) => {
  const [formData, setFormData] = useState<Partial<JoiningLocation>>({
    name: '',
    city: '',
    country: 'India',
    officeAddress: '',
    reportingTime: '10:30 AM',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: '',
    dressCode: 'Smart Casuals' as DressCodeType,
    lunchInfo: 'Complimentary lunch buffet provided in office cafeteria',
    firstDayInstructions: 'Report to main reception desk on arrival.',
    isInternational: false,
    hrContact: {
      name: 'Megha Rastogi',
      role: 'Senior HR Business Partner',
      email: 'megha.r@fieldassist.in',
      phone: '+91 99112 33445',
      whatsapp: '+91 99112 33445',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    }
  });

  useEffect(() => {
    if (initialLocation) {
      setFormData(initialLocation);
    } else {
      setFormData({
        name: '',
        city: '',
        country: 'India',
        officeAddress: '',
        reportingTime: '10:30 AM',
        timeZone: 'IST (UTC+5:30)',
        googleMapsUrl: '',
        dressCode: 'Smart Casuals' as DressCodeType,
        lunchInfo: 'Complimentary lunch provided in office cafeteria',
        firstDayInstructions: 'Report to main reception desk on arrival.',
        isInternational: false,
        hrContact: {
          name: 'Megha Rastogi',
          role: 'Senior HR Business Partner',
          email: 'megha.r@fieldassist.in',
          phone: '+91 99112 33445',
          whatsapp: '+91 99112 33445',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        }
      });
    }
  }, [initialLocation, isOpen]);

  if (!isOpen) return null;

  const handleCountryChange = (country: string) => {
    const isIntl = country.trim().toLowerCase() !== 'india';
    let defaultTz = formData.timeZone;
    if (country === 'United Kingdom') defaultTz = 'BST (UTC+1:00)';
    else if (country === 'Singapore') defaultTz = 'SGT (UTC+8:00)';
    else if (country === 'United States') defaultTz = 'EST (UTC-5:00)';
    else if (country === 'United Arab Emirates') defaultTz = 'GST (UTC+4:00)';
    else if (country === 'Australia') defaultTz = 'AEST (UTC+10:00)';
    else if (country === 'India') defaultTz = 'IST (UTC+5:30)';

    setFormData(prev => ({
      ...prev,
      country,
      isInternational: isIntl,
      timeZone: defaultTz
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.officeAddress) return;

    const locToSave: JoiningLocation = {
      id: formData.id || `loc-${Date.now()}`,
      name: formData.name,
      city: formData.city,
      country: formData.country || 'India',
      officeAddress: formData.officeAddress,
      reportingTime: formData.reportingTime || '09:30 AM',
      timeZone: formData.timeZone || 'IST (UTC+5:30)',
      googleMapsUrl: formData.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(formData.officeAddress)}`,
      dressCode: (formData.dressCode as DressCodeType) || 'Smart Casuals',
      lunchInfo: formData.lunchInfo || 'Complimentary lunch provided',
      firstDayInstructions: formData.firstDayInstructions || 'Report to main reception.',
      isInternational: formData.country ? formData.country.trim().toLowerCase() !== 'india' : Boolean(formData.isInternational),
      hrContact: formData.hrContact || {
        name: 'Megha Rastogi',
        role: 'Senior HR Business Partner',
        email: 'megha.r@fieldassist.in',
        phone: '+91 99112 33445',
        whatsapp: '+91 99112 33445',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      }
    };

    onSaveLocation(locToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
              <Globe className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialLocation ? 'Edit Joining Location' : 'Configure New Joining Location'}
              </h3>
              <p className="text-xs text-purple-200">Set up office details, time zone, address & HR contacts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Scroll Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          
          {/* Section 1: Basic Location Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-purple-100 pb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-700" />
              1. General Location Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Office Name / Display Title *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. London EMEA Operations Hub"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City Name *</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. London / Singapore / Bengaluru"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.country || ''}
                    onChange={e => handleCountryChange(e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    required
                  />
                  <select
                    onChange={e => e.target.value && handleCountryChange(e.target.value)}
                    className="text-xs px-2 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none"
                    value=""
                  >
                    <option value="">Quick Pick</option>
                    {COMMON_COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time Zone *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.timeZone || ''}
                    onChange={e => setFormData({ ...formData, timeZone: e.target.value })}
                    placeholder="e.g. BST (UTC+1:00)"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    required
                  />
                  <select
                    onChange={e => e.target.value && setFormData({ ...formData, timeZone: e.target.value })}
                    className="text-xs px-2 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none"
                    value=""
                  >
                    <option value="">Select Preset</option>
                    {TIMEZONE_PRESETS.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First-Day Reporting Time</label>
                <input
                  type="text"
                  value={formData.reportingTime || ''}
                  onChange={e => setFormData({ ...formData, reportingTime: e.target.value })}
                  placeholder="e.g. 09:00 AM"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-purple-50 p-2.5 rounded-xl border border-purple-200/80 w-full">
                  <input
                    type="checkbox"
                    checked={formData.country ? formData.country.trim().toLowerCase() !== 'india' : formData.isInternational}
                    onChange={e => setFormData({ ...formData, isInternational: e.target.checked })}
                    className="w-4 h-4 text-purple-700 rounded-md focus:ring-purple-600"
                  />
                  <span>International Joining Location</span>
                  {formData.country && formData.country.trim().toLowerCase() !== 'india' && (
                    <span className="ml-auto text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                      Auto-detected International
                    </span>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Office Address *</label>
              <textarea
                value={formData.officeAddress || ''}
                onChange={e => setFormData({ ...formData, officeAddress: e.target.value })}
                rows={2}
                placeholder="FieldAssist HQ, Tower B, 4th Floor, Unitech Cyber Park..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Google Maps Direct Link</label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.googleMapsUrl || ''}
                  onChange={e => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                />
                <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Section 2: Office Culture & Amenities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-purple-100 pb-1.5 flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5 text-purple-700" />
              2. Dress Code & Lunch Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dress Code Policy</label>
                <select
                  value={formData.dressCode || 'Smart Casuals'}
                  onChange={e => setFormData({ ...formData, dressCode: e.target.value as DressCodeType })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                >
                  <option value="Smart Casuals">Smart Casuals</option>
                  <option value="Business Casuals">Business Casuals</option>
                  <option value="Formal">Formal</option>
                  <option value="Casuals">Casuals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lunch & Cafeteria Details</label>
                <input
                  type="text"
                  value={formData.lunchInfo || ''}
                  onChange={e => setFormData({ ...formData, lunchInfo: e.target.value })}
                  placeholder="e.g. Catered welcome lunch & coffee vouchers"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First-Day Access & Security Instructions</label>
              <textarea
                value={formData.firstDayInstructions || ''}
                onChange={e => setFormData({ ...formData, firstDayInstructions: e.target.value })}
                rows={2}
                placeholder="e.g. Present Passport / National ID at ground floor security reception..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
              />
            </div>
          </div>

          {/* Section 3: HR Contact Person for Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-purple-100 pb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-700" />
              3. Assigned HR Contact Person
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HR Contact Name</label>
                <input
                  type="text"
                  value={formData.hrContact?.name || ''}
                  onChange={e => setFormData({
                    ...formData,
                    hrContact: { ...formData.hrContact!, name: e.target.value }
                  })}
                  placeholder="HR Name"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HR Designation / Role</label>
                <input
                  type="text"
                  value={formData.hrContact?.role || ''}
                  onChange={e => setFormData({
                    ...formData,
                    hrContact: { ...formData.hrContact!, role: e.target.value }
                  })}
                  placeholder="e.g. Senior HRBP"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HR Email</label>
                <input
                  type="email"
                  value={formData.hrContact?.email || ''}
                  onChange={e => setFormData({
                    ...formData,
                    hrContact: { ...formData.hrContact!, email: e.target.value }
                  })}
                  placeholder="hr@fieldassist.in"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">HR Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={formData.hrContact?.phone || ''}
                  onChange={e => setFormData({
                    ...formData,
                    hrContact: {
                      ...formData.hrContact!,
                      phone: e.target.value,
                      whatsapp: e.target.value
                    }
                  })}
                  placeholder="+91 99112 00000"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            {initialLocation && onDeleteLocation ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${initialLocation.name}?`)) {
                    onDeleteLocation(initialLocation.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Location</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Location</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
