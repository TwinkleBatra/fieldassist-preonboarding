import { Candidate, FAQItem, JoiningLocation, FirstDayScheduleItem } from '../types';

export const DEFAULT_FIELDASSIST_SCHEDULE: FirstDayScheduleItem[] = [
  {
    time: '11:00 AM',
    title: 'Arrival & Welcome',
    description: 'Meet HR/Workplace team and complete arrival/security formalities.',
    location: 'Reception'
  },
  {
    time: '11:20 AM',
    title: 'Laptop & Welcome Kit',
    description: 'Collect laptop, IT credentials and welcome kit.',
    location: 'IT / HR Desk'
  },
  {
    time: '11:50 AM',
    title: 'HR Induction',
    description: 'Introduction to FieldAssist, culture, policies, benefits and important HR information.',
    location: 'Conference Room'
  },
  {
    time: '01:15 PM',
    title: 'Welcome Lunch',
    description: 'Lunch with other new joiners and team members.',
    location: 'Cafeteria'
  },
  {
    time: '02:15 PM',
    title: 'Pre-Onboarding Formalities',
    description: 'Complete remaining joining formalities and required documentation.',
    location: 'HR Desk'
  },
  {
    time: '03:00 PM',
    title: 'Buddy Meet',
    description: 'Meet the onboarding buddy and get familiar with the team.',
    location: 'Assigned Team Area'
  },
  {
    time: '03:30 PM',
    title: 'Office Tour',
    description: 'Guided tour of the office and facilities.',
    location: 'Office'
  }
];

export const DEFAULT_REMOTE_SCHEDULE: FirstDayScheduleItem[] = [
  {
    time: '11:00 AM',
    title: 'Join the Call',
    description: 'Join the welcome call using the link in your email',
    location: 'Video Call'
  },
  {
    time: '11:50 AM',
    title: 'Laptop & IT Setup',
    description: 'Get your IT access and setup help. Your laptop is couriered before your joining date.',
    location: 'Video Call'
  },
  {
    time: '01:15 PM',
    title: 'HR Induction',
    description: 'Introduction to FieldAssist, culture, policies, benefits and important HR information.',
    location: 'Video Call'
  },
  {
    time: '03:00 PM',
    title: 'Buddy Meet',
    description: 'Meet your onboarding buddy and get familiar with the team.',
    location: 'Video Call'
  },
  {
    time: '04:30 PM',
    title: 'Pre-Onboarding Formalities',
    description: 'Complete remaining joining formalities and required documentation.',
    location: 'Online'
  }
];

export const INITIAL_LOCATIONS: JoiningLocation[] = [
  {
    id: 'loc-gurugram',
    name: 'Gurgaon Office',
    city: 'Gurugram',
    country: 'India',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    reportingTime: '11:00 AM',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    hrContact: {
      name: 'Megha Rastogi',
      role: 'Senior HR Business Partner',
      email: 'megha.r@fieldassist.in',
      phone: '+91 99112 33445',
      whatsapp: '+91 99112 33445',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    firstDayInstructions: 'Security check-in at 1st Floor Universal Trade Tower reception. Welcome to FieldAssist!',
    isInternational: false
  },
  {
    id: 'loc-bengaluru',
    name: 'Bangalore Office',
    city: 'Bengaluru',
    country: 'India',
    officeAddress: '91 Springboard, 2nd Floor,\nGopala Krishna Complex 45/3,\nResidency Road, Mahatma Gandhi Road,\nBengaluru, Karnataka – 560025',
    reportingTime: '11:00 AM',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=91+Springboard+Residency+Road+Bengaluru',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    hrContact: {
      name: 'Anand Kulkarni',
      role: 'Lead HR Operations - South',
      email: 'anand.k@fieldassist.in',
      phone: '+91 98450 12345',
      whatsapp: '+91 98450 12345',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    firstDayInstructions: 'Report to 91 Springboard 2nd Floor reception at Gopala Krishna Complex.',
    isInternational: false
  },
  {
    id: 'loc-mumbai',
    name: 'Mumbai Office',
    city: 'Mumbai',
    country: 'India',
    officeAddress: 'The Summit Business Bay,\nOffice No. 927, 9th Floor,\nBehind Gurunanak Petrol Pump,\nPrakashwadi, Andheri East,\nMumbai – 400093',
    reportingTime: '11:00 AM',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=The+Summit+Business+Bay+Andheri+East+Mumbai',
    dressCode: 'Business Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    hrContact: {
      name: 'Pooja Kapoor',
      role: 'HR Business Partner - Sales Regional',
      email: 'pooja.k@fieldassist.in',
      phone: '+91 98200 99887',
      whatsapp: '+91 98200 99887',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    },
    firstDayInstructions: 'Collect visitor access card at the main ground floor reception before taking elevator to Floor 9, Office No. 927.',
    isInternational: false
  }
];

export const INITIAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'First Day',
    question: 'What time should I report on my first day?',
    answer: 'Please arrive at your assigned office reporting time according to your location time zone. Your Workplace Experience team will welcome you at reception.'
  },
  {
    id: 'faq-2',
    category: 'IT & Laptop',
    question: 'When will I receive my work laptop and credentials?',
    answer: 'Your assigned work machine (MacBook / Windows based on your preference selected in the Pre-Onboarding form) will be issued during the IT onboarding session on Day 1 along with your FieldAssist Workspace credentials.'
  },
  {
    id: 'faq-3',
    category: 'First Day',
    question: 'Do I need to bring physical documents on Day 1?',
    answer: "You don't need to bring any physical documents. All required documents and details are collected online during the pre-onboarding process / through Keka."
  },
  {
    id: 'faq-4',
    category: 'Culture & Perks',
    question: 'Is lunch provided at the office?',
    answer: 'Yes! FieldAssist offers in-house cafeteria facilities across our physical office locations. For Remote joiners, onboarding sessions and team connects are conducted virtually.'
  },
  {
    id: 'faq-5',
    category: 'General',
    question: 'What is the dress code at FieldAssist?',
    answer: 'We maintain a Smart Casual / Business Casual policy across all global offices. Clean, comfortable smart casuals or neat polo shirts and trousers are great.'
  },
  {
    id: 'faq-6',
    category: 'Documents & HR',
    question: 'When is the pre-onboarding form submission deadline?',
    answer: 'Kindly complete and submit your Pre-Onboarding Form at least 3 days prior to your joining date so our IT and HR Operations teams can finalize your workspace setup.'
  }
];

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-twinkle-9149',
    accessCode: 'FA-9149',
    name: 'Twinkle Verma',
    email: 'twinkle.verma@fieldassist.com',
    phone: '',
    role: 'TA Trainee',
    department: 'HR & Talent Acquisition',
    joiningDate: '2026-09-14',
    workMode: 'Office',
    locationId: 'loc-gurugram',
    reportingTime: '11:00 AM',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    officeCity: 'Gurugram',
    officeCountry: 'India',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    firstDayInstructions: 'Security check-in at 1st Floor Universal Trade Tower reception. Welcome to FieldAssist!',
    reportingManager: '',
    reportingManagerRole: '',
    hrbp: {
      name: 'Khushboo Verma',
      role: 'HR Business Partner - Founder Office, Finance & HR',
      email: 'khushboo.verma@flick2know.com',
      phone: '+91 98222 33445',
      whatsapp: '+91 98222 33445',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Ready for Day 1',
    formStatus: 'Not Started',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    notes: 'TA Trainee joiner.',
    formData: {
      email: 'twinkle.verma@fieldassist.com',
      fullName: 'Twinkle Verma',
      personalEmail: 'twinkle.verma@fieldassist.com',
      phone: '',
      dob: '',
      currentAddress: '',
      permanentAddress: '',
      tshirtSize: 'M',
      maritalStatus: 'Single',
      passion: '',
      hobbiesCommunity: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      highestQualification: '',
      collegeUniversity: '',
      yearOfPassing: '',
      aadhaarNumber: '',
      panNumber: '',
      pfOptIn: 'No',
      isJoiningDateComfortable: 'Yes',
      declarationAccepted: false,
      isSubmitted: false,
      completionPercentage: 0
    },
    documents: [
      { id: 'doc-aadhaar', name: 'Aadhaar Card Upload', required: true, status: 'Pending' },
      { id: 'doc-pan', name: 'PAN Card Upload', required: true, status: 'Pending' },
      { id: 'doc-photo-pro', name: 'Clear Professional Photo Upload', required: true, status: 'Pending' },
      { id: 'doc-photo-casual', name: 'Clear Casual Photo Upload', required: true, status: 'Pending' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted', status: 'Completed', date: '2026-08-11' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Fill your details and upload documents', status: 'Pending' },
      { id: 'm-3', title: 'Background Verification (BGV)', description: 'Document verification', status: 'Pending' },
      { id: 'm-4', title: 'IT Asset Allocation', description: 'Workstation provisioning', status: 'Pending' },
      { id: 'm-5', title: 'Welcome Kit & Swag Box', description: 'Kit shipping', status: 'Pending' },
      { id: 'm-6', title: 'Day 1 Orientation', description: 'Reporting at Gurugram', status: 'Pending', date: '2026-09-14' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  },
  {
    id: 'cand-karan',
    name: 'Karan',
    email: 'karanbatra.kb96@gmail.com',
    phone: '',
    role: 'Software Engineer',
    department: 'Engineering & Technology',
    joiningDate: '2026-09-15',
    workMode: 'Office',
    locationId: 'loc-gurugram',
    reportingTime: '11:00 AM',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    officeCity: 'Gurugram',
    officeCountry: 'India',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    firstDayInstructions: 'Security check-in at 1st Floor Universal Trade Tower reception. Welcome to FieldAssist!',
    reportingManager: '',
    reportingManagerRole: '',
    hrbp: {
      name: 'Pranay Kumar',
      role: 'HR Business Partner - Tech & Engineering',
      email: 'pranay.kumar@flick2know.com',
      phone: '+91 98111 22334',
      whatsapp: '+91 98111 22334',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Ready for Day 1',
    formStatus: 'Not Started',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    notes: 'Software Engineer joiner.',
    formData: {
      email: 'karanbatra.kb96@gmail.com',
      fullName: 'Karan',
      personalEmail: 'karanbatra.kb96@gmail.com',
      phone: '',
      dob: '',
      currentAddress: '',
      permanentAddress: '',
      tshirtSize: 'L',
      maritalStatus: 'Single',
      passion: '',
      hobbiesCommunity: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      highestQualification: '',
      collegeUniversity: '',
      yearOfPassing: '',
      aadhaarNumber: '',
      panNumber: '',
      pfOptIn: 'No',
      isJoiningDateComfortable: 'Yes',
      declarationAccepted: false,
      isSubmitted: false,
      completionPercentage: 0
    },
    documents: [
      { id: 'doc-aadhaar', name: 'Aadhaar Card Upload', required: true, status: 'Pending' },
      { id: 'doc-pan', name: 'PAN Card Upload', required: true, status: 'Pending' },
      { id: 'doc-photo-pro', name: 'Clear Professional Photo Upload', required: true, status: 'Pending' },
      { id: 'doc-photo-casual', name: 'Clear Casual Photo Upload', required: true, status: 'Pending' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted', status: 'Completed', date: '2026-08-15' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Fill your details and upload documents', status: 'Pending' },
      { id: 'm-3', title: 'Background Verification (BGV)', description: 'Document verification', status: 'Pending' },
      { id: 'm-4', title: 'IT Asset Allocation', description: 'Workstation provisioning', status: 'Pending' },
      { id: 'm-5', title: 'Welcome Kit & Swag Box', description: 'Kit shipping', status: 'Pending' },
      { id: 'm-6', title: 'Day 1 Orientation', description: 'Reporting at Gurugram', status: 'Pending', date: '2026-09-15' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  },
  {
    id: 'cand-kavya',
    name: 'Kavya Seth',
    email: 'kavya@fieldassist.in',
    phone: '',
    role: 'TA Manager',
    department: 'HR & Talent Acquisition',
    joiningDate: '2026-09-21',
    workMode: 'Office',
    locationId: 'loc-gurugram',
    reportingTime: '11:00 AM',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    officeCity: 'Gurugram',
    officeCountry: 'India',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    firstDayInstructions: 'Security check-in at 1st Floor Universal Trade Tower reception. Welcome to FieldAssist!',
    reportingManager: '',
    reportingManagerRole: '',
    hrbp: {
      name: 'Nimisha',
      role: 'HR Business Partner',
      email: 'Nimi@01flick2know.com',
      phone: '',
      whatsapp: '',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Offer Accepted',
    formStatus: 'Not Started',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    notes: 'TA Manager joiner.',
    formData: {
      email: 'kavya@fieldassist.in',
      fullName: 'Kavya Seth',
      personalEmail: 'kavya@fieldassist.in',
      phone: '',
      dob: '',
      currentAddress: 'Sector 49, Gurugram',
      permanentAddress: 'Sector 49, Gurugram',
      tshirtSize: 'M',
      maritalStatus: 'Single',
      passion: '',
      hobbiesCommunity: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      highestQualification: 'MBA',
      collegeUniversity: 'Delhi University',
      yearOfPassing: '2021',
      aadhaarNumber: 'XXXX-XXXX-9074',
      panNumber: 'XXXXX9074X',
      pfOptIn: 'No',
      isJoiningDateComfortable: 'Yes',
      declarationAccepted: false,
      isSubmitted: false,
      completionPercentage: 0
    },
    documents: [
      { id: 'doc-aadhaar', name: 'Aadhaar Card Upload', required: true, status: 'Pending' },
      { id: 'doc-pan', name: 'PAN Card Upload', required: true, status: 'Pending' },
      { id: 'doc-photo-pro', name: 'Clear Professional Photo Upload', required: true, status: 'Pending' },
      { id: 'doc-photo-casual', name: 'Clear Casual Photo Upload', required: true, status: 'Pending' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted', status: 'Completed', date: '2026-08-20' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Fill your details and upload documents', status: 'Pending' },
      { id: 'm-3', title: 'Background Verification (BGV)', description: 'Document verification', status: 'Pending' },
      { id: 'm-4', title: 'IT Asset Allocation', description: 'Workstation provisioning', status: 'Pending' },
      { id: 'm-5', title: 'Welcome Kit & Swag Box', description: 'Kit shipping', status: 'Pending' },
      { id: 'm-6', title: 'Day 1 Orientation', description: 'Reporting at Gurugram', status: 'Pending', date: '2026-09-21' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  },
  {
    id: 'cand-nimisha',
    name: 'Nimisha',
    email: 'Nimi@01flick2know.com',
    phone: '',
    role: 'Key Account Manager',
    department: 'Engineering & Technology',
    joiningDate: '2026-09-07',
    workMode: 'Office',
    locationId: 'loc-gurugram',
    reportingTime: '11:00 AM',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    officeCity: 'Gurugram',
    officeCountry: 'India',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    firstDayInstructions: 'Security check-in at 1st Floor Universal Trade Tower reception. Welcome to FieldAssist!',
    reportingManager: '',
    reportingManagerRole: '',
    hrbp: {
      name: 'Tanvi Malik',
      role: 'HR Business Partner - CST & Sales',
      email: 'tanvi@flick2know.com',
      phone: '+91 98100 11223',
      whatsapp: '+91 98100 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Under Review',
    formStatus: 'Completed',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    notes: 'Key Account Manager joiner.',
    formData: {
      email: 'Nimi@01flick2know.com',
      fullName: 'Nimisha',
      personalEmail: 'Nimi@01flick2know.com',
      phone: '',
      dob: '1995-06-12',
      currentAddress: 'Universal Trade Tower, Sector 49, Gurugram',
      permanentAddress: 'Universal Trade Tower, Sector 49, Gurugram',
      tshirtSize: 'M',
      maritalStatus: 'Single',
      passion: 'Client satisfaction & key account growth',
      hobbiesCommunity: 'Reading & Mentorship',
      emergencyContactName: 'Family',
      emergencyContactRelation: 'Parent',
      emergencyContactPhone: '',
      highestQualification: 'Post Graduate',
      collegeUniversity: 'Delhi University',
      yearOfPassing: '2018',
      aadhaarNumber: 'XXXX-XXXX-6829',
      panNumber: 'XXXXX6829X',
      pfOptIn: 'Yes',
      isJoiningDateComfortable: 'Yes',
      declarationAccepted: true,
      isSubmitted: true,
      submittedAt: '2026-08-25T10:00:00.000Z',
      completionPercentage: 100
    },
    documents: [
      { id: 'doc-aadhaar', name: 'Aadhaar Card Upload', required: true, status: 'Verified' },
      { id: 'doc-pan', name: 'PAN Card Upload', required: true, status: 'Verified' },
      { id: 'doc-photo-pro', name: 'Clear Professional Photo Upload', required: true, status: 'Verified' },
      { id: 'doc-photo-casual', name: 'Clear Casual Photo Upload', required: true, status: 'Verified' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted', status: 'Completed', date: '2026-08-01' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Pre-onboarding form 100% completed', status: 'Completed', date: '2026-08-25' },
      { id: 'm-3', title: 'Background Verification (BGV)', description: 'Document verification under review', status: 'In Progress' },
      { id: 'm-4', title: 'IT Asset Allocation', description: 'Workstation provisioning', status: 'Completed', date: '2026-08-28' },
      { id: 'm-5', title: 'Welcome Kit & Swag Box', description: 'Kit shipping', status: 'Completed', date: '2026-08-30' },
      { id: 'm-6', title: 'Day 1 Orientation', description: 'Reporting at Gurugram', status: 'Pending', date: '2026-09-07' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  }
];
