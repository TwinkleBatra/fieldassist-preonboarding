import React, { useState, useEffect } from 'react';
import {
  X,
  Link2,
  Save,
  RotateCcw,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Code,
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  getCachedLinks,
  getCachedTemplates,
  updateStoredLinks,
  updateStoredTemplate,
  syncEmailStoreWithFirestore,
  INITIAL_APPROVED_LINKS,
  INITIAL_APPROVED_TEMPLATES
} from '../../services/emailStore';
import { EmailBlock, EmailBulletItem, EmailTemplateDoc, LinksSettingsDoc } from '../../types';
import { renderFirestoreTemplate } from '../../services/emailRenderer';

interface EmailSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'templates' | 'links';
}

const LINK_KEYS_META: Record<string, { label: string; placeholder: string; description: string }> = {
  ammoPreread: {
    label: 'AMMO Pre-Read URL',
    placeholder: 'TODO: Link pending',
    description: 'Guide for new joiners to get familiar with FieldAssist'
  },
  voicesFromInside: {
    label: 'Voices From The Inside URL',
    placeholder: 'https://...',
    description: 'Videos & quotes from FA team members'
  },
  goaHighlights: {
    label: 'Goa Offsite Highlights URL',
    placeholder: 'https://www.linkedin.com/...',
    description: 'LinkedIn post showcasing company culture in motion'
  },
  newsletter: {
    label: 'FA Newsletter URL',
    placeholder: 'https://www.fieldassist.com/newsletter',
    description: 'Latest edition of company newsletter'
  },
  linkedinPage: {
    label: 'LinkedIn Page URL',
    placeholder: 'https://www.linkedin.com/company/fieldassist',
    description: 'Official LinkedIn corporate profile'
  },
  instagram: {
    label: 'Instagram URL',
    placeholder: 'https://www.instagram.com/fieldassist/',
    description: 'People, events, and behind-the-scenes'
  },
  pathfinderVideo: {
    label: "Pathfinder's Video URL",
    placeholder: 'https://youtu.be/...',
    description: 'Employee growth and journey video'
  },
  ambitionBox: {
    label: 'AmbitionBox Rating URL',
    placeholder: 'https://www.ambitionbox.com/reviews/fieldassist-reviews',
    description: 'Candidate and employee company reviews'
  },
  glassdoor: {
    label: 'Glassdoor Rating URL',
    placeholder: 'https://www.glassdoor.co.in/Reviews/FieldAssist-Reviews-E1204893.htm',
    description: 'Verified reviews and ratings'
  }
};

const STAGES_META = [
  { key: 'welcome_7d', title: "7 Days Before – The Story You're Joining" },
  { key: 'culture_5d', title: '5 Days Before – Everyone Gets to Build' },
  { key: 'comm_3d', title: '3 Days Before – World Stage & NDTV Profit' }
];

export const EmailSettingsModal: React.FC<EmailSettingsModalProps> = ({ isOpen, onClose, initialTab = 'templates' }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'links'>(initialTab);
  const [selectedStage, setSelectedStage] = useState<string>('welcome_7d');
  
  const [links, setLinks] = useState<LinksSettingsDoc>({});
  const [templates, setTemplates] = useState<Record<string, EmailTemplateDoc>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Load from store whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setLinks(getCachedLinks());
      setTemplates(getCachedTemplates());
      setSavedSuccess(false);
      setErrorMessage(null);
      // Background sync from Firestore
      setIsSyncing(true);
      syncEmailStoreWithFirestore()
        .then(result => {
          setLinks(result.links);
          setTemplates(result.templates);
        })
        .catch(err => console.warn('Sync failed:', err))
        .finally(() => setIsSyncing(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTemplate: EmailTemplateDoc = templates[selectedStage] || {
    id: selectedStage,
    subject: '',
    greeting: '',
    blocks: [],
    signoff: ''
  };

  const handleLinkChange = (key: string, value: string) => {
    setLinks(prev => ({ ...prev, [key]: value }));
  };

  const handleTemplateFieldChange = (field: 'subject' | 'greeting' | 'signoff', value: string) => {
    setTemplates(prev => ({
      ...prev,
      [selectedStage]: {
        ...currentTemplate,
        [field]: value
      }
    }));
  };

  const handleBlockChange = (index: number, updatedBlock: EmailBlock) => {
    const nextBlocks = [...currentTemplate.blocks];
    nextBlocks[index] = updatedBlock;
    setTemplates(prev => ({
      ...prev,
      [selectedStage]: {
        ...currentTemplate,
        blocks: nextBlocks
      }
    }));
  };

  const handleAddBlock = (type: EmailBlock['type']) => {
    let newBlock: EmailBlock;
    if (type === 'paragraph') newBlock = { type: 'paragraph', text: '' };
    else if (type === 'heading') newBlock = { type: 'heading', text: '' };
    else if (type === 'bullets') newBlock = { type: 'bullets', items: [{ text: '', linkLabel: '', linkKey: '' }] };
    else if (type === 'button') newBlock = { type: 'button', label: 'Click Here', linkKey: 'goaHighlights' };
    else newBlock = { type: 'note', text: '' };

    setTemplates(prev => ({
      ...prev,
      [selectedStage]: {
        ...currentTemplate,
        blocks: [...currentTemplate.blocks, newBlock]
      }
    }));
  };

  const handleRemoveBlock = (index: number) => {
    const nextBlocks = currentTemplate.blocks.filter((_, i) => i !== index);
    setTemplates(prev => ({
      ...prev,
      [selectedStage]: {
        ...currentTemplate,
        blocks: nextBlocks
      }
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      // 1. Save links
      await updateStoredLinks(links);

      // 2. Save active template (or all modified)
      for (const [key, tpl] of Object.entries(templates)) {
        if (tpl && typeof tpl === 'object' && 'id' in tpl) {
          await updateStoredTemplate(key, tpl as EmailTemplateDoc);
        }
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save to Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCurrentTemplate = () => {
    if (confirm(`Reset ${selectedStage} template to approved default copy?`)) {
      const defaultDoc = INITIAL_APPROVED_TEMPLATES[selectedStage];
      if (defaultDoc) {
        setTemplates(prev => ({
          ...prev,
          [selectedStage]: JSON.parse(JSON.stringify(defaultDoc))
        }));
      }
    }
  };

  const handleResetLinks = () => {
    if (confirm('Reset all resource URLs to approved defaults?')) {
      setLinks({ ...INITIAL_APPROVED_LINKS });
    }
  };

  // Compute live preview
  let previewData = { subject: '', bodyHtml: '', bodyText: '' };
  try {
    const mockCandidate = {
      id: 'FA-MOCK',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 98765 43210',
      role: 'Product Specialist',
      department: 'Engineering',
      joiningDate: '2026-10-05',
      reportingTime: '11:00 AM',
      officeAddress: 'Plot No. 12, Sector 44, Gurugram, Haryana 122003',
      officeCity: 'Gurugram',
      lunchInfo: 'Cafeteria on 1st floor',
      dressCode: 'Smart Casuals',
      reportingManager: 'Twinkle Verma',
      reportingManagerRole: 'HRBP',
      hrbp: { name: 'Twinkle Verma', email: 'twinkle.verma@fieldassist.com', phone: '', role: 'HRBP' },
      status: 'Offer Accepted' as any,
      formStatus: 'Not Started' as any,
      formData: {} as any,
      documents: [],
      milestones: [],
      schedule: [],
      accessCode: 'FA-7842'
    };

    previewData = renderFirestoreTemplate(
      selectedStage,
      mockCandidate,
      'Priya',
      currentTemplate,
      links
    );
  } catch (e: any) {
    previewData = {
      subject: 'Error previewing template',
      bodyHtml: `<p style="color:red;">Preview error: ${e.message}</p>`,
      bodyText: `Preview error: ${e.message}`
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Email Content &amp; Links Settings</h3>
                {isSyncing && (
                  <span className="flex items-center gap-1 text-[11px] bg-purple-800/60 text-purple-200 px-2 py-0.5 rounded-full">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Syncing Firestore
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200">
                Custom approved email copy stored in Firestore <code className="bg-purple-950/60 px-1 py-0.5 rounded font-mono text-[11px]">emailTemplates</code> and <code className="bg-purple-950/60 px-1 py-0.5 rounded font-mono text-[11px]">settings/links</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'templates'
                  ? 'border-purple-700 text-purple-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Email Templates (Copy Editor)</span>
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'links'
                  ? 'border-purple-700 text-purple-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Settings Links (Resource URLs)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Firestore!
              </span>
            )}
            {errorMessage && (
              <span className="flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg font-semibold border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" /> {errorMessage}
              </span>
            )}
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'templates' ? (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Sub-sidebar: Stages */}
              <div className="w-full md:w-64 border-r border-slate-200 bg-slate-50 p-3 space-y-1.5 shrink-0 overflow-y-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                  Select Email Stage
                </div>
                {STAGES_META.map(stage => {
                  const isSelected = selectedStage === stage.key;
                  return (
                    <button
                      key={stage.key}
                      onClick={() => setSelectedStage(stage.key)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span className="truncate">{stage.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-purple-800 text-purple-200' : 'bg-slate-100 text-slate-500'}`}>
                        {stage.key.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })}

                <div className="mt-4 p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-[11px] text-indigo-950 space-y-1.5">
                  <div className="font-bold flex items-center gap-1 text-indigo-900">
                    <Code className="w-3.5 h-3.5" /> Supported Variables:
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-indigo-900/80 font-mono">
                    <li>{'{{firstName}}'}</li>
                    <li>{'{{joiningDate}}'}</li>
                    <li>{'{{accessCode}}'}</li>
                  </ul>
                  <p className="text-[10px] text-indigo-800 pt-1 leading-snug">
                    Portal CTA button and credentials box are rendered automatically in code.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetCurrentTemplate}
                    className="w-full py-2 px-3 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Default Copy
                  </button>
                </div>
              </div>

              {/* Right Panel: Template Block Editor or Preview */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                
                {/* Stage Header toolbar */}
                <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                  <div className="text-xs font-bold text-slate-800">
                    Editing: <span className="text-purple-900 font-mono">{selectedStage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLivePreview(!showLivePreview)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                        showLivePreview
                          ? 'bg-purple-100 border-purple-300 text-purple-900'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{showLivePreview ? 'Back to Editor' : 'Live Preview'}</span>
                    </button>
                  </div>
                </div>

                {/* Editor or Preview View */}
                {showLivePreview ? (
                  <div className="flex-1 overflow-y-auto p-5 bg-slate-100">
                    <div className="max-w-2xl mx-auto space-y-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-500">Subject: </span>
                        <span className="font-semibold text-slate-900">{previewData.subject}</span>
                      </div>
                      <div
                        className="bg-white rounded-xl shadow-xs overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: previewData.bodyHtml }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Subject Line
                      </label>
                      <input
                        type="text"
                        value={currentTemplate.subject}
                        onChange={e => handleTemplateFieldChange('subject', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                        placeholder="e.g. Welcome to FieldAssist – Your Onboarding Journey Starts Here!"
                      />
                    </div>

                    {/* Greeting */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Greeting Line
                      </label>
                      <input
                        type="text"
                        value={currentTemplate.greeting}
                        onChange={e => handleTemplateFieldChange('greeting', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-mono"
                        placeholder="Hi {{firstName}},"
                      />
                    </div>

                    {/* Blocks Array */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Email Content Blocks ({currentTemplate.blocks.length})
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddBlock('paragraph')}
                            className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition cursor-pointer"
                          >
                            + Paragraph
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock('heading')}
                            className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition cursor-pointer"
                          >
                            + Heading
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock('bullets')}
                            className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition cursor-pointer"
                          >
                            + Bullets
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock('button')}
                            className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition cursor-pointer"
                          >
                            + Button
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBlock('note')}
                            className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition cursor-pointer"
                          >
                            + Note
                          </button>
                        </div>
                      </div>

                      {currentTemplate.blocks.map((block, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase">
                            <span className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              Block Type: <span className="text-purple-900 font-mono">{block.type}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(idx)}
                              className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                              title="Delete block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {block.type === 'paragraph' && (
                            <textarea
                              rows={3}
                              value={block.text}
                              onChange={e => handleBlockChange(idx, { type: 'paragraph', text: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-sans"
                              placeholder="Enter paragraph copy..."
                            />
                          )}

                          {block.type === 'heading' && (
                            <input
                              type="text"
                              value={block.text}
                              onChange={e => handleBlockChange(idx, { type: 'heading', text: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                              placeholder="e.g. A Culture that Walks the Talk"
                            />
                          )}

                          {block.type === 'bullets' && (
                            <div className="space-y-2">
                              {block.items.map((item, bulletIdx) => (
                                <div key={bulletIdx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                                  <span className="text-xs text-slate-400 mt-1.5">•</span>
                                  <div className="flex-1 space-y-1.5">
                                    <textarea
                                      rows={2}
                                      value={item.text}
                                      onChange={e => {
                                        const newItems = [...block.items];
                                        newItems[bulletIdx] = { ...item, text: e.target.value };
                                        handleBlockChange(idx, { type: 'bullets', items: newItems });
                                      }}
                                      className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-600/40"
                                      placeholder="Bullet text..."
                                    />
                                    <div className="flex items-center gap-2 text-xs">
                                      <input
                                        type="text"
                                        value={item.linkLabel || ''}
                                        onChange={e => {
                                          const newItems = [...block.items];
                                          newItems[bulletIdx] = { ...item, linkLabel: e.target.value };
                                          handleBlockChange(idx, { type: 'bullets', items: newItems });
                                        }}
                                        placeholder="Optional Link Label (e.g. Read Newsletter)"
                                        className="flex-1 text-[11px] p-1 border border-slate-200 rounded"
                                      />
                                      <select
                                        value={item.linkKey || ''}
                                        onChange={e => {
                                          const newItems = [...block.items];
                                          newItems[bulletIdx] = { ...item, linkKey: e.target.value || undefined };
                                          handleBlockChange(idx, { type: 'bullets', items: newItems });
                                        }}
                                        className="text-[11px] p-1 border border-slate-200 rounded bg-white font-mono"
                                      >
                                        <option value="">No Link</option>
                                        {Object.keys(LINK_KEYS_META).map(lk => (
                                          <option key={lk} value={lk}>{lk}</option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newItems = block.items.filter((_, i) => i !== bulletIdx);
                                          handleBlockChange(idx, { type: 'bullets', items: newItems });
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  handleBlockChange(idx, {
                                    type: 'bullets',
                                    items: [...block.items, { text: '', linkLabel: '', linkKey: '' }]
                                  });
                                }}
                                className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer pt-1"
                              >
                                <Plus className="w-3 h-3" /> Add Bullet Item
                              </button>
                            </div>
                          )}

                          {block.type === 'button' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Button Label</label>
                                <input
                                  type="text"
                                  value={block.label}
                                  onChange={e => handleBlockChange(idx, { ...block, label: e.target.value })}
                                  className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-600/40"
                                  placeholder="e.g. See the Highlights"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Link Key</label>
                                <select
                                  value={block.linkKey}
                                  onChange={e => handleBlockChange(idx, { ...block, linkKey: e.target.value })}
                                  className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white font-mono"
                                >
                                  {Object.keys(LINK_KEYS_META).map(lk => (
                                    <option key={lk} value={lk}>{lk}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {block.type === 'note' && (
                            <input
                              type="text"
                              value={block.text}
                              onChange={e => handleBlockChange(idx, { type: 'note', text: e.target.value })}
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg italic text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                              placeholder="e.g. (Yes, that energy is real. Yes, you'll love it here.)"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Signoff */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Signoff &amp; Signature Text
                      </label>
                      <textarea
                        rows={3}
                        value={currentTemplate.signoff}
                        onChange={e => handleTemplateFieldChange('signoff', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-mono"
                        placeholder="Thanks & Regards,&#10;Twinkle Verma | FieldAssist HR"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Settings Links (URLs) */
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Resource Links Directory</h4>
                  <p className="text-xs text-slate-500">
                    Stored in Firestore document <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">settings/links</code>. Templates refer to these strictly by <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">linkKey</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetLinks}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(LINK_KEYS_META).map(([key, meta]) => {
                  const val = links[key] || '';
                  const isMissing = !val || val.trim() === '';
                  return (
                    <div key={key} className={`p-3.5 rounded-xl border transition ${isMissing ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{meta.label}</span>
                          <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            {key}
                          </span>
                        </label>
                        {isMissing ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            TODO: URL Missing
                          </span>
                        ) : (
                          <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-purple-700 p-0.5"
                            title="Test Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">{meta.description}</p>
                      <input
                        type="text"
                        value={val}
                        onChange={e => handleLinkChange(key, e.target.value)}
                        placeholder={meta.placeholder}
                        className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          isMissing
                            ? 'border-rose-300 focus:ring-rose-400/40 bg-white'
                            : 'border-slate-300 focus:ring-purple-600/30 bg-white'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Changes are saved directly to Firestore and cached locally for instant email generation.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving to Firestore...' : 'Save to Firestore'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
