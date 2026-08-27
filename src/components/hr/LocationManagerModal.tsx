import React, { useState } from 'react';
import { X, Globe, MapPin, Plus, Edit2, Trash2, Clock, Shirt, Utensils, ExternalLink, ShieldAlert } from 'lucide-react';
import { JoiningLocation } from '../../types';

interface LocationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: JoiningLocation[];
  onOpenAddLocation: () => void;
  onOpenEditLocation: (location: JoiningLocation) => void;
  onDeleteLocation: (locationId: string) => void;
}

export const LocationManagerModal: React.FC<LocationManagerModalProps> = ({
  isOpen,
  onClose,
  locations,
  onOpenAddLocation,
  onOpenEditLocation,
  onDeleteLocation
}) => {
  const [filterType, setFilterType] = useState<'All' | 'Domestic' | 'International'>('All');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredLocations = locations.filter(loc => {
    const matchesSearch =
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.city.toLowerCase().includes(search.toLowerCase()) ||
      loc.country.toLowerCase().includes(search.toLowerCase()) ||
      loc.officeAddress.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'Domestic') {
      return matchesSearch && (!loc.country || loc.country.trim().toLowerCase() === 'india');
    } else if (filterType === 'International') {
      return matchesSearch && loc.country && loc.country.trim().toLowerCase() !== 'india';
    }
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-400/30">
              <Globe className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Global Joining Locations Directory</h3>
              <p className="text-xs text-purple-200 mt-0.5">Configure domestic and international office addresses, time zones, reporting times & instructions</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search city, office name, country..."
              className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
            />
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 text-xs font-bold text-slate-600">
              <button
                onClick={() => setFilterType('All')}
                className={`px-3 py-1 rounded-md transition ${filterType === 'All' ? 'bg-purple-700 text-white' : 'hover:bg-slate-100'}`}
              >
                All ({locations.length})
              </button>
              <button
                onClick={() => setFilterType('Domestic')}
                className={`px-3 py-1 rounded-md transition ${filterType === 'Domestic' ? 'bg-purple-700 text-white' : 'hover:bg-slate-100'}`}
              >
                🇮🇳 Domestic
              </button>
              <button
                onClick={() => setFilterType('International')}
                className={`px-3 py-1 rounded-md transition ${filterType === 'International' ? 'bg-purple-700 text-white' : 'hover:bg-slate-100'}`}
              >
                🌍 Intl
              </button>
            </div>
          </div>

          <button
            onClick={onOpenAddLocation}
            className="w-full sm:w-auto px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Location</span>
          </button>
        </div>

        {/* Locations Grid List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLocations.map(loc => {
                const isIntl = loc.country && loc.country.trim().toLowerCase() !== 'india';
                return (
                  <div
                    key={loc.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 transition flex flex-col justify-between gap-4 relative group"
                  >
                    <div>
                      {/* Top Location Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{loc.name}</h4>
                            {isIntl ? (
                              <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                                🌍 International
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                                🇮🇳 Domestic
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-purple-800 mt-0.5">
                            {loc.city}, {loc.country}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => onOpenEditLocation(loc)}
                            className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                            title="Edit Location"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete location ${loc.name}? Candidates assigned will fall back to city details.`)) {
                                onDeleteLocation(loc.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Delete Location"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Location Details Grid */}
                      <div className="mt-3 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span>
                            Reporting: <strong className="text-slate-900">{loc.reportingTime}</strong> ({loc.timeZone})
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{loc.officeAddress}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Shirt className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span>Dress Code: <strong className="text-slate-800">{loc.dressCode}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Utensils className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span className="line-clamp-1">{loc.lunchInfo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer HR Contact */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        <span className="text-slate-400">HR Contact: </span>
                        <strong className="text-slate-800">{loc.hrContact?.name || 'Megha Rastogi'}</strong>
                      </div>
                      {loc.googleMapsUrl && (
                        <a
                          href={loc.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No locations found matching query.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Close Directory
          </button>
        </div>

      </div>
    </div>
  );
};
