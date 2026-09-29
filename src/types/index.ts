export type OnboardingStatus = 'Offer Accepted' | 'Form Pending' | 'Under Review' | 'Ready for Day 1' | 'Joined' | 'Onboarding Complete';

export type DressCodeType = 'Business Casuals' | 'Smart Casuals' | 'Formal Wear' | 'Casual';

export type WorkMode = 'Office' | 'Remote';

export interface HRContact {
  name: string;
  role: string;
  email: string;
  phone: string;
  whatsapp?: string;
  avatarUrl?: string;
}

export interface FirstDayScheduleItem {
  time: string;
  title: string;
  description: string;
  location: string;
  iconName?: string;
}

export interface RequiredDocument {
  id: string;
  name: string;
  required: boolean;
  status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';
  fileUrl?: string;
  uploadedAt?: string;
}

export interface CandidateFormData {
  // Section 1 - Welcome & Email
  email: string;

  // Section 2 - Personal Details
  fullName: string;
  fullNameAadhaar?: string;
  personalEmail: string;
  phone: string;
  dob: string;
  currentAddress: string;
  permanentAddress: string;
  linkedinUrl?: string;
  tshirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced / Separated' | 'Widowed' | string;
  spouseName?: string;
  spouseDob?: string;
  hasChildren?: boolean | 'Yes' | 'No';
  child1Name?: string;
  child1Dob?: string;
  child2Name?: string;
  child2Dob?: string;
  childDetails?: string;

  // Section 3 - Get to Know You
  passion?: string;
  hobbiesCommunity?: string;

  // Section 4 - Emergency Contact Details
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;

  // Section 5 - Education Details
  highestQualification: string;
  collegeUniversity?: string;
  yearOfPassing?: string;

  // Section 6 - Previous & Current Employment Details
  currentCompany?: string;
  previousCompany?: string;
  previousDesignation?: string;
  totalWorkExperience?: string;
  totalExperienceYears?: number;
  lastWorkingDate?: string;
  uanNumber?: string;

  // Section 7 - Identity Details & Candidate Documents
  aadhaarNumber: string;
  aadhaarDocUrl?: string;
  aadhaarDocName?: string;
  panNumber: string;
  panDocUrl?: string;
  panDocName?: string;
  professionalPhotoUrl?: string;
  professionalPhotoName?: string;
  casualPhotoUrl?: string;
  casualPhotoName?: string;
  pfOptIn?: 'Yes' | 'No' | string;

  // HR Verification
  verifiedByHrbp?: string;
  hrRemarks?: string;

  // Section 8 - Joining Information
  joiningDate?: string;
  isJoiningDateComfortable?: 'Yes' | 'No' | string;
  joiningDateUncomfortableReason?: string;

  // Section 9 - Declaration & Meta
  declarationAccepted?: boolean;

  isSubmitted: boolean;
  submittedAt?: string;
  completionPercentage: number;
}

export interface MilestoneStep {
  id: string;
  title: string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  date?: string;
}

export interface JoiningLocation {
  id: string;
  name: string; // e.g. "Gurugram HQ", "London EMEA Hub", "Singapore Regional Center"
  city: string;
  country: string;
  officeAddress: string;
  reportingTime: string; // e.g. "09:30 AM"
  timeZone: string; // e.g. "IST (UTC+5:30)", "BST (UTC+1:00)", "SGT (UTC+8:00)"
  ianaTimeZone?: string; // IANA time zone identifier, e.g. "Asia/Kolkata", "Asia/Dubai"
  region?: 'India' | 'Africa' | 'Middle East' | 'Asia-Pacific' | 'Latin America';
  googleMapsUrl?: string;
  dressCode: DressCodeType | string;
  lunchInfo: string;
  hrContact: HRContact;
  firstDayInstructions: string;
  isInternational?: boolean;
  defaultSchedule?: FirstDayScheduleItem[];
}

export type EmailStageKey = 'account_ready' | 'welcome_7d' | 'culture_5d' | 'comm_3d' | 'day1_1d';

export type EmailDeliveryStatus = 'Pending' | 'Sent' | 'Failed';

export interface EmailBulletItem {
  text: string;
  linkLabel?: string;
  linkKey?: string;
}

export type EmailBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'bullets'; items: EmailBulletItem[] }
  | { type: 'button'; label: string; linkKey: string }
  | { type: 'note'; text: string };

export interface EmailTemplateDoc {
  id: string; // stageKey, e.g. 'welcome_7d'
  subject: string;
  greeting: string;
  blocks: EmailBlock[];
  signoff: string;
  updatedAt?: string;
}

export type LinksSettingsDoc = Record<string, string>;

export interface EmailStageLog {
  id: string;
  stageKey: EmailStageKey;
  stageName: string;
  daysBeforeJoining: number;
  targetDate: string; // YYYY-MM-DD
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: EmailDeliveryStatus;
  sentAt?: string; // ISO string
  errorMessage?: string;
  triggeredBy?: 'automated_cron' | 'hr_manual' | 'test_simulation';
  provider?: string;
  logs?: string[];
}

export interface CandidateEmailAutomation {
  stages: Record<EmailStageKey, EmailStageLog>;
  lastEvaluatedAt?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  joiningDate: string; // YYYY-MM-DD
  workMode?: WorkMode; // 'Office' | 'Remote'
  locationId?: string; // Reference to JoiningLocation id (for Office mode)
  joiningLocation?: JoiningLocation; // Full assigned location object
  reportingTime: string;
  officeAddress: string;
  officeCity: string;
  officeCountry?: string;
  timeZone?: string;
  ianaTimeZone?: string;
  region?: 'India' | 'Africa' | 'Middle East' | 'Asia-Pacific' | 'Latin America';
  googleMapsUrl?: string;
  dressCode: DressCodeType | string;
  lunchInfo: string;
  firstDayInstructions?: string;

  // Remote joiner specific fields
  remoteCountry?: string;
  remoteCity?: string;
  remoteTimeZone?: string;
  remoteInstructions?: string;

  reportingManager: string;
  reportingManagerRole: string;
  hrbp: HRContact;
  
  status: OnboardingStatus;
  formStatus: 'Not Started' | 'In Progress' | 'Submitted' | 'Verified' | 'Completed';
  
  formData: CandidateFormData;
  documents: RequiredDocument[];
  milestones: MilestoneStep[];
  schedule: FirstDayScheduleItem[];
  
  emailAutomation?: CandidateEmailAutomation;

  notes?: string;
  avatarUrl?: string;
  accessCode?: string;

  // Additional Document & Statutory URLs
  aadhaarDocUrl?: string;
  panDocUrl?: string;
  photoDocUrl?: string;
  totalExperience?: string;
  currentCompany?: string;
  lastEmployer?: string;
  lastDesignation?: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  verifiedByHrbp?: string;
  hrRemarks?: string;
}

export interface FAQItem {
  id: string;
  category: 'General' | 'First Day' | 'IT & Laptop' | 'Documents & HR' | 'Culture & Perks';
  question: string;
  answer: string;
}

export interface HRQuery {
  id: string;
  candidateId: string;
  candidateName: string;
  recipientName?: string;
  recipientEmail?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'Open' | 'Resolved';
  hrResponse?: string;
}
