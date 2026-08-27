import { HRContact } from '../types';

export const OFFICIAL_HRBPS: Record<string, HRContact> = {
  tanvi: {
    name: 'Tanvi Malik',
    role: 'HR Business Partner - CST & Sales',
    email: 'tanvi@flick2know.com',
    phone: '+91 98100 11223',
    whatsapp: '+91 98100 11223',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  pranay: {
    name: 'Pranay Kumar',
    role: 'HR Business Partner - Tech & Engineering',
    email: 'pranay.kumar@flick2know.com',
    phone: '+91 98111 22334',
    whatsapp: '+91 98111 22334',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  khushboo: {
    name: 'Khushboo Verma',
    role: 'HR Business Partner - Founder Office, Finance & HR',
    email: 'khushboo.verma@flick2know.com',
    phone: '+91 98222 33445',
    whatsapp: '+91 98222 33445',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  ritika: {
    name: 'Ritika Sharma',
    role: 'HR Business Partner - Product, Marketing & QART',
    email: 'ritika.sharma@flick2know.com',
    phone: '+91 98333 44556',
    whatsapp: '+91 98333 44556',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
};

export const LIST_OF_OFFICIAL_HRBPS: HRContact[] = Object.values(OFFICIAL_HRBPS);

export const DEPARTMENT_OPTIONS = [
  'Engineering & Technology',
  'Customer Success & CST',
  'Sales & Growth',
  'Product & Design',
  'Marketing',
  'QART',
  'Founder Office',
  'Finance',
  'International',
  'HR & Talent Acquisition'
];

/**
 * Returns the automatically assigned HRBP based on candidate's department/team.
 * CST/Sales → Tanvi Malik — tanvi@flick2know.com
 * Tech → Pranay Kumar — pranay.kumar@flick2know.com
 * Founder Office/Finance/International/HR → Khushboo Verma — khushboo.verma@flick2know.com
 * Product/Marketing/QART → Ritika Sharma — ritika.sharma@flick2know.com
 */
export function getHRBPForDepartment(dept: string): HRContact {
  if (!dept) return { ...OFFICIAL_HRBPS.khushboo };
  const d = dept.toLowerCase().trim();

  // CST / Sales
  if (d.includes('cst') || d.includes('sales') || d.includes('customer success')) {
    return { ...OFFICIAL_HRBPS.tanvi };
  }

  // Tech
  if (d.includes('tech') || d.includes('engineering') || d.includes('data') || d.includes('developer') || d.includes('software')) {
    return { ...OFFICIAL_HRBPS.pranay };
  }

  // Founder Office / Finance / International / HR
  if (
    d.includes('founder') ||
    d.includes('finance') ||
    d.includes('international') ||
    d.includes('hr') ||
    d.includes('talent') ||
    d.includes('people')
  ) {
    return { ...OFFICIAL_HRBPS.khushboo };
  }

  // Product / Marketing / QART
  if (
    d.includes('product') ||
    d.includes('marketing') ||
    d.includes('qart') ||
    d.includes('qa') ||
    d.includes('design')
  ) {
    return { ...OFFICIAL_HRBPS.ritika };
  }

  return { ...OFFICIAL_HRBPS.khushboo };
}
