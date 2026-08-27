import { Candidate, FAQItem, JoiningLocation, FirstDayScheduleItem } from '../types';

export const DEFAULT_FIELDASSIST_SCHEDULE: FirstDayScheduleItem[] = [
  {
    time: '10:30 AM',
    title: 'Arrival & Welcome',
    description: 'Meet HR/Workplace team and complete arrival/security formalities.',
    location: 'Reception'
  },
  {
    time: '10:45 AM',
    title: 'Laptop & Welcome Kit',
    description: 'Collect laptop, IT credentials and welcome kit.',
    location: 'IT / HR Desk'
  },
  {
    time: '11:15 AM',
    title: 'HR Induction',
    description: 'Introduction to FieldAssist, culture, policies, benefits and important HR information.',
    location: 'Conference Room'
  },
  {
    time: '01:00 PM',
    title: 'Welcome Lunch',
    description: 'Lunch with other new joiners and team members.',
    location: 'Cafeteria'
  },
  {
    time: '02:00 PM',
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

export const INITIAL_LOCATIONS: JoiningLocation[] = [
  {
    id: 'loc-gurugram',
    name: 'Gurgaon Office',
    city: 'Gurugram',
    country: 'India',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    reportingTime: '10:30 AM',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor with complimentary hot buffet lunch & espresso bar',
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
    reportingTime: '10:30 AM',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=91+Springboard+Residency+Road+Bengaluru',
    dressCode: 'Smart Casuals',
    lunchInfo: 'Complimentary gourmet lunch buffet & micro-roasted barista coffee daily',
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
    reportingTime: '10:30 AM',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=The+Summit+Business+Bay+Andheri+East+Mumbai',
    dressCode: 'Business Casuals',
    lunchInfo: 'Executive cafeteria vouchers provided for food court & catered team lunch on Day 1',
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
    answer: 'Yes! FieldAssist offers complimentary catered lunch or dining vouchers across all global locations, along with coffee, teas, and healthy snacks.'
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
    id: 'cand-1',
    accessCode: 'FA-1006',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 43210',
    role: 'Senior Software Engineer (Frontend)',
    department: 'Engineering & Technology',
    joiningDate: '2026-08-18',
    workMode: 'Office',
    locationId: 'loc-gurugram',
    reportingTime: '10:30 AM',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    officeCity: 'Gurugram',
    officeCountry: 'India',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor with complimentary hot buffet lunch & espresso bar',
    firstDayInstructions: 'Security check-in at 1st Floor Universal Trade Tower reception. Welcome to FieldAssist!',
    reportingManager: 'Amitabh Sengupta',
    reportingManagerRole: 'VP of Engineering',
    hrbp: {
      name: 'Pranay Kumar',
      role: 'HR Business Partner - Tech & Engineering',
      email: 'pranay.kumar@flick2know.com',
      phone: '+91 98111 22334',
      whatsapp: '+91 98111 22334',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Ready for Day 1',
    formStatus: 'Submitted',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    notes: 'Pre-onboarding form submitted. MacBook M3 Pro assigned by IT. Welcome swag box dispatched via courier.',
    formData: {
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      personalEmail: 'rahul.sharma@example.com',
      phone: '+91 98765 43210',
      dob: '1995-11-14',
      emergencyContactName: 'Priya Sharma',
      emergencyContactRelation: 'Spouse',
      emergencyContactPhone: '+91 98765 00112',
      currentAddress: 'Flat 402, DLF Phase 5, Golf Course Road, Gurugram, Haryana',
      permanentAddress: 'House 12, Sector 15, Chandigarh',
      highestQualification: 'B.Tech in Computer Science - NIT Kurukshetra',
      previousCompany: 'Zomato Media Pvt Ltd',
      totalExperienceYears: 5,
      panNumber: 'ABCPS1234F',
      aadhaarNumber: '4589 1234 9876',
      uanNumber: '100987654321',
      tshirtSize: 'L',
      isSubmitted: true,
      submittedAt: '2026-08-04T10:30:00Z',
      completionPercentage: 100
    },
    documents: [
      { id: 'doc-aadhaar', name: 'Aadhaar Card Upload', required: true, status: 'Verified', uploadedAt: '2026-08-04', fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500' },
      { id: 'doc-pan', name: 'PAN Card Upload', required: true, status: 'Verified', uploadedAt: '2026-08-04', fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500' },
      { id: 'doc-photo-pro', name: 'Clear Professional Photo Upload', required: true, status: 'Verified', uploadedAt: '2026-08-04', fileUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500' },
      { id: 'doc-photo-casual', name: 'Clear Casual Photo Upload', required: true, status: 'Verified', uploadedAt: '2026-08-04', fileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500' },
      { id: 'doc-degree', name: 'Highest Degree Certificate', required: true, status: 'Verified', uploadedAt: '2026-08-04' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted officially on HR Portal', status: 'Completed', date: '2026-08-01' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Personal, statutory and hardware preferences filled', status: 'Completed', date: '2026-08-04' },
      { id: 'm-3', title: 'Background Verification (BGV)', description: 'Employment & document validation by AuthBridge', status: 'Completed', date: '2026-08-06' },
      { id: 'm-4', title: 'IT Asset & Credentials Provisioned', description: 'Google Workspace account & MacBook prepared', status: 'Completed', date: '2026-08-06' },
      { id: 'm-5', title: 'FieldAssist Welcome Swag Box Shipped', description: 'T-shirt, hoodie, tumbler & notebook dispatched', status: 'In Progress', date: 'Estimated 2026-08-10' },
      { id: 'm-6', title: 'Day 1 Orientation & Buddy Intro', description: 'Reporting at Gurugram HQ for Day 1', status: 'Pending', date: '2026-08-18' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  },
  {
    id: 'cand-2',
    accessCode: 'FA-1002',
    name: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    phone: '+44 7700 900456',
    role: 'Senior Solutions Architect (EMEA)',
    department: 'Customer Success & Operations',
    joiningDate: '2026-08-20',
    workMode: 'Remote',
    reportingTime: '10:30 AM',
    officeAddress: 'Remote / Work From Home (London, United Kingdom)',
    officeCity: 'London',
    officeCountry: 'United Kingdom',
    timeZone: 'BST (UTC+1:00)',
    dressCode: 'Smart Casuals',
    lunchInfo: 'Remote food delivery allowance via Deliveroo provided on Day 1',
    firstDayInstructions: 'Your MacBook Pro and welcome kit will be delivered to your address in London via DHL Express. On Day 1, join the Google Meet welcome link sent by your HR Partner at 09:00 AM BST.',
    remoteCountry: 'United Kingdom',
    remoteCity: 'London',
    remoteTimeZone: 'BST (UTC+1:00)',
    remoteInstructions: 'Your MacBook Pro, credentials, and welcome kit will be delivered to your home address in London via DHL Express. On Day 1 at 09:00 AM BST, join the Google Meet welcome call with HR Partner Eleanor Vance.',
    reportingManager: 'Julian Ross',
    reportingManagerRole: 'Director of EMEA Operations',
    hrbp: {
      name: 'Tanvi Malik',
      role: 'HR Business Partner - CST & Sales',
      email: 'tanvi@flick2know.com',
      phone: '+91 98100 11223',
      whatsapp: '+91 98100 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Ready for Day 1',
    formStatus: 'Submitted',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    notes: 'Remote international joiner based in London, UK. Laptop dispatched via DHL.',
    formData: {
      fullName: 'Sophia Chen',
      email: 'sophia.chen@example.com',
      personalEmail: 'sophia.chen@example.com',
      phone: '+44 7700 900456',
      dob: '1993-06-18',
      emergencyContactName: 'Mark Chen',
      emergencyContactRelation: 'Brother',
      emergencyContactPhone: '+44 7700 900789',
      currentAddress: '42 Baker Street, Marylebone, London, W1U 8ED',
      permanentAddress: '42 Baker Street, Marylebone, London, W1U 8ED',
      highestQualification: 'M.Sc. Software Systems - Imperial College London',
      previousCompany: 'Salesforce UK',
      totalExperienceYears: 7,
      panNumber: 'UK-NINO-1234',
      aadhaarNumber: 'PASSPORT-UK-987654',
      tshirtSize: 'M',
      isSubmitted: true,
      submittedAt: '2026-08-05T14:20:00Z',
      completionPercentage: 100
    },
    documents: [
      { id: 'doc-1', name: 'Passport & UK Work Visa / ID', required: true, status: 'Verified', uploadedAt: '2026-08-05' },
      { id: 'doc-2', name: 'Proof of UK Address', required: true, status: 'Verified', uploadedAt: '2026-08-05' },
      { id: 'doc-3', name: 'Degree Certificate', required: true, status: 'Verified', uploadedAt: '2026-08-05' },
      { id: 'doc-4', name: 'Experience Certificate / References', required: true, status: 'Uploaded', uploadedAt: '2026-08-05' },
      { id: 'doc-5', name: 'Bank Details / Direct Deposit Form', required: true, status: 'Verified', uploadedAt: '2026-08-05' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted officially', status: 'Completed', date: '2026-08-02' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Forms submitted', status: 'Completed', date: '2026-08-05' },
      { id: 'm-3', title: 'Remote BGV & Identity Check', description: 'Cleared by Sterling BGV', status: 'Completed', date: '2026-08-06' },
      { id: 'm-4', title: 'IT Credentials & MacBook Delivery', description: 'DHL Tracking #UK98712345', status: 'Completed', date: '2026-08-06' },
      { id: 'm-5', title: 'EMEA Welcome Swag Pack', description: 'Delivered', status: 'Completed', date: '2026-08-06' },
      { id: 'm-6', title: 'Day 1 Virtual Orientation Call', description: 'Google Meet at 09:00 AM BST', status: 'Pending', date: '2026-08-20' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  },
  {
    id: 'cand-3',
    accessCode: 'FA-1003',
    name: 'Marcus Tan',
    email: 'marcus.tan@example.com',
    phone: '+65 9123 9988',
    role: 'Regional Growth Manager (APAC)',
    department: 'Sales & Growth',
    joiningDate: '2026-08-28',
    workMode: 'Remote',
    reportingTime: '10:30 AM',
    officeAddress: 'Remote / Work From Home (Singapore)',
    officeCity: 'Singapore',
    officeCountry: 'Singapore',
    timeZone: 'SGT (UTC+8:00)',
    dressCode: 'Smart Casuals',
    lunchInfo: 'Remote meal allowance via GrabFood provided for Day 1',
    firstDayInstructions: 'Your IT laptop setup will be delivered to your home address in Singapore. On Day 1 at 09:00 AM SGT, join the virtual onboarding call with HR Lead Cheryl Tan.',
    remoteCountry: 'Singapore',
    remoteCity: 'Singapore',
    remoteTimeZone: 'SGT (UTC+8:00)',
    remoteInstructions: 'Your IT laptop setup and onboarding kit will be delivered to your home address via GrabExpress. Join the Google Meet onboarding room at 09:00 AM SGT.',
    reportingManager: 'Kenneth Ho',
    reportingManagerRole: 'VP of APAC Sales',
    hrbp: {
      name: 'Tanvi Malik',
      role: 'HR Business Partner - CST & Sales',
      email: 'tanvi@flick2know.com',
      phone: '+91 98100 11223',
      whatsapp: '+91 98100 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Form Pending',
    formStatus: 'In Progress',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    notes: 'Assigned to Singapore APAC Hub. Form currently in progress.',
    formData: {
      fullName: 'Marcus Tan',
      email: 'marcus.tan@example.com',
      personalEmail: 'marcus.tan@example.com',
      phone: '+65 9123 9988',
      dob: '1991-03-25',
      emergencyContactName: 'Evelyn Tan',
      emergencyContactRelation: 'Spouse',
      emergencyContactPhone: '+65 9123 0011',
      currentAddress: '15 Orchard Turn, #12-04, Singapore 238859',
      permanentAddress: '15 Orchard Turn, #12-04, Singapore 238859',
      highestQualification: 'Bachelor of Business Administration - NUS',
      previousCompany: 'Grab Singapore',
      totalExperienceYears: 8,
      panNumber: 'S9123456A',
      aadhaarNumber: 'NRIC-S9123456A',
      tshirtSize: 'L',
      isSubmitted: false,
      completionPercentage: 60
    },
    documents: [
      { id: 'doc-1', name: 'NRIC / Passport / Employment Pass', required: true, status: 'Uploaded', uploadedAt: '2026-08-06' },
      { id: 'doc-2', name: 'Proof of Address', required: true, status: 'Uploaded', uploadedAt: '2026-08-06' },
      { id: 'doc-3', name: 'Highest Degree Certificate', required: true, status: 'Pending' },
      { id: 'doc-4', name: 'Relieving Letter / Experience Certificate', required: true, status: 'Pending' },
      { id: 'doc-5', name: 'Bank Giro / Account Details', required: true, status: 'Pending' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Accepted for Singapore office', status: 'Completed', date: '2026-08-04' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'In progress', status: 'In Progress', date: 'Due Aug 15' },
      { id: 'm-3', title: 'MOM Work Pass / BGV Check', description: 'Verification in progress', status: 'Pending' },
      { id: 'm-4', title: 'IT Asset Allocation', description: 'ThinkPad allocation', status: 'Pending' },
      { id: 'm-5', title: 'Welcome Kit Dispatch', description: 'Singapore Hub kit', status: 'Pending' },
      { id: 'm-6', title: 'Day 1 Orientation at One Marina Boulevard', description: 'Level 28 office', status: 'Pending', date: '2026-08-28' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  },
  {
    id: 'cand-4',
    accessCode: 'FA-1001',
    name: 'Ananya Verma',
    email: 'ananya.verma@example.com',
    phone: '+91 97112 88990',
    role: 'Lead Product Designer',
    department: 'Product & Design',
    joiningDate: '2026-08-25',
    workMode: 'Office',
    locationId: 'loc-gurugram',
    reportingTime: '10:30 AM',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    officeCity: 'Gurugram',
    officeCountry: 'India',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria with complimentary lunch & barista coffee station',
    firstDayInstructions: 'Security check-in is at Tower B 1st Floor reception. Welcome to FieldAssist!',
    reportingManager: 'Siddharth Roy',
    reportingManagerRole: 'Head of Product',
    hrbp: {
      name: 'Ritika Sharma',
      role: 'HR Business Partner - Product, Marketing & QART',
      email: 'ritika.sharma@flick2know.com',
      phone: '+91 98333 44556',
      whatsapp: '+91 98333 44556',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Form Pending',
    formStatus: 'In Progress',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    notes: 'In progress with form details. Requested MacBook Pro 16 inch with extra monitor for design workflow.',
    formData: {
      fullName: 'Ananya Verma',
      email: 'ananya.verma@example.com',
      personalEmail: 'ananya.verma@example.com',
      phone: '+91 97112 88990',
      dob: '1997-04-20',
      emergencyContactName: 'Rajesh Verma',
      emergencyContactRelation: 'Father',
      emergencyContactPhone: '+91 98100 55443',
      currentAddress: 'Sector 56, Huda Colony, Gurugram',
      permanentAddress: 'C-404, Vasant Kunj, New Delhi',
      highestQualification: 'Master of Design - NID Ahmedabad',
      previousCompany: 'MakeMyTrip India',
      totalExperienceYears: 6,
      panNumber: 'BNXPV5678K',
      aadhaarNumber: '',
      tshirtSize: 'M',
      isSubmitted: false,
      completionPercentage: 55
    },
    documents: [
      { id: 'doc-1', name: 'PAN Card Copy', required: true, status: 'Uploaded', uploadedAt: '2026-08-05' },
      { id: 'doc-2', name: 'Aadhaar Card Copy', required: true, status: 'Pending' },
      { id: 'doc-3', name: 'Highest Degree Certificate', required: true, status: 'Uploaded', uploadedAt: '2026-08-05' },
      { id: 'doc-4', name: 'Relieving Letter / Experience Certificate', required: true, status: 'Pending' },
      { id: 'doc-5', name: 'Cancelled Cheque for Payroll', required: true, status: 'Pending' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted on HR Portal', status: 'Completed', date: '2026-08-03' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Pending final bank details & Aadhaar upload', status: 'In Progress', date: 'Due Aug 12' },
      { id: 'm-3', title: 'Background Verification (BGV)', description: 'Document verification by AuthBridge', status: 'Pending' },
      { id: 'm-4', title: 'IT Asset & Credentials Provisioned', description: 'MacBook Pro allocation', status: 'Pending' },
      { id: 'm-5', title: 'FieldAssist Welcome Swag Box Shipped', description: 'Welcome kit', status: 'Pending' },
      { id: 'm-6', title: 'Day 1 Orientation', description: 'Reporting at Gurugram HQ', status: 'Pending', date: '2026-08-25' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  },
  {
    id: 'cand-5',
    accessCode: 'FA-1005',
    name: 'Vikram Malhotra',
    email: 'vikram.m@example.com',
    phone: '+91 98220 11223',
    role: 'Enterprise Account Executive',
    department: 'Sales & Growth',
    joiningDate: '2026-09-01',
    workMode: 'Office',
    locationId: 'loc-mumbai',
    reportingTime: '10:30 AM',
    officeAddress: 'The Summit Business Bay,\nOffice No. 927, 9th Floor,\nBehind Gurunanak Petrol Pump,\nPrakashwadi, Andheri East,\nMumbai – 400093',
    officeCity: 'Mumbai',
    officeCountry: 'India',
    timeZone: 'IST (UTC+5:30)',
    googleMapsUrl: 'https://maps.google.com/?q=The+Summit+Business+Bay+Andheri+East+Mumbai',
    dressCode: 'Business Casuals',
    lunchInfo: 'Executive cafeteria vouchers provided for food court & catered team lunch on Day 1',
    firstDayInstructions: 'Collect visitor access card at main ground floor reception before taking elevator to Floor 9, Office No. 927.',
    reportingManager: 'Karan Mehra',
    reportingManagerRole: 'VP of Global Enterprise Sales',
    hrbp: {
      name: 'Tanvi Malik',
      role: 'HR Business Partner - CST & Sales',
      email: 'tanvi@flick2know.com',
      phone: '+91 98100 11223',
      whatsapp: '+91 98100 11223',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    status: 'Offer Accepted',
    formStatus: 'Not Started',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    notes: 'Offer accepted. Email notification sent with link to Pre-Onboarding portal.',
    formData: {
      fullName: 'Vikram Malhotra',
      email: 'vikram.m@example.com',
      personalEmail: 'vikram.m@example.com',
      phone: '+91 98220 11223',
      dob: '1992-09-10',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      currentAddress: 'Hiranandani Gardens, Powai, Mumbai',
      permanentAddress: '',
      highestQualification: 'MBA in Marketing - NMIMS Mumbai',
      previousCompany: 'Salesforce India',
      totalExperienceYears: 8,
      panNumber: '',
      aadhaarNumber: '',
      tshirtSize: 'XL',
      isSubmitted: false,
      completionPercentage: 15
    },
    documents: [
      { id: 'doc-1', name: 'PAN Card Copy', required: true, status: 'Pending' },
      { id: 'doc-2', name: 'Aadhaar Card Copy', required: true, status: 'Pending' },
      { id: 'doc-3', name: 'Highest Degree Certificate', required: true, status: 'Pending' },
      { id: 'doc-4', name: 'Relieving Letter / Experience Certificate', required: true, status: 'Pending' },
      { id: 'doc-5', name: 'Cancelled Cheque for Payroll', required: true, status: 'Pending' }
    ],
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted', status: 'Completed', date: '2026-08-05' },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Awaiting form input', status: 'Pending', date: 'Due Aug 20' },
      { id: 'm-3', title: 'Background Verification (BGV)', description: 'Verification', status: 'Pending' },
      { id: 'm-4', title: 'IT Asset Allocation', description: 'ThinkPad X1 Carbon requested', status: 'Pending' },
      { id: 'm-5', title: 'Welcome Kit', description: 'Swag dispatch', status: 'Pending' },
      { id: 'm-6', title: 'Day 1 Orientation in Mumbai', description: 'Bandra Kurla Complex office', status: 'Pending', date: '2026-09-01' }
    ],
    schedule: DEFAULT_FIELDASSIST_SCHEDULE
  }
];
