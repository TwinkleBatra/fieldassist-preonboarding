export type LocationRegion = 'India' | 'Africa' | 'Middle East' | 'Asia-Pacific' | 'Latin America';
export type LocationType = 'office' | 'remote';

export interface MasterLocation {
  id: string;
  label: string;
  city: string;
  country: string;
  region: LocationRegion;
  type: LocationType;
  ianaTimeZone: string;
  tzAbbreviation: string;
  officeAddress?: string;
  googleMapsUrl?: string;
  reportingTime?: string;
  dressCode?: string;
  lunchInfo?: string;
  firstDayInstructions?: string;
}

export const MASTER_LOCATIONS: MasterLocation[] = [
  // India Offices (Work Mode = Office only)
  {
    id: 'loc-gurgaon',
    label: 'Gurgaon Office',
    city: 'Gurgaon',
    country: 'India',
    region: 'India',
    type: 'office',
    ianaTimeZone: 'Asia/Kolkata',
    tzAbbreviation: 'IST',
    officeAddress: 'FieldAssist\n149, First Floor, Universal Trade Tower,\nSector-49, Sohna-Gurugram Road,\nGurugram, Haryana – 122018',
    googleMapsUrl: 'https://maps.google.com/?q=Universal+Trade+Tower+Sector+49+Gurugram',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    firstDayInstructions: 'Security check-in at 1st Floor Universal Trade Tower reception. Welcome to FieldAssist!'
  },
  {
    id: 'loc-mumbai',
    label: 'Mumbai Office',
    city: 'Mumbai',
    country: 'India',
    region: 'India',
    type: 'office',
    ianaTimeZone: 'Asia/Kolkata',
    tzAbbreviation: 'IST',
    officeAddress: 'The Summit Business Bay,\nOffice No. 927, 9th Floor,\nBehind Gurunanak Petrol Pump,\nPrakashwadi, Andheri East,\nMumbai – 400093',
    googleMapsUrl: 'https://maps.google.com/?q=The+Summit+Business+Bay+Andheri+East+Mumbai',
    reportingTime: '11:00 AM',
    dressCode: 'Business Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    firstDayInstructions: 'Collect visitor access card at the main ground floor reception before taking elevator to Floor 9, Office No. 927.'
  },
  {
    id: 'loc-bangalore',
    label: 'Bangalore Office',
    city: 'Bangalore',
    country: 'India',
    region: 'India',
    type: 'office',
    ianaTimeZone: 'Asia/Kolkata',
    tzAbbreviation: 'IST',
    officeAddress: '91 Springboard, 2nd Floor,\nGopala Krishna Complex 45/3,\nResidency Road, Mahatma Gandhi Road,\nBengaluru, Karnataka – 560025',
    googleMapsUrl: 'https://maps.google.com/?q=91+Springboard+Residency+Road+Bengaluru',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: 'In-house cafeteria on the 1st floor. Day 1 welcome lunch with fellow new joiners.',
    firstDayInstructions: 'Report to 91 Springboard 2nd Floor reception at Gopala Krishna Complex.'
  },

  // India Remote (Work Mode = Remote)
  {
    id: 'loc-india-remote',
    label: 'India (Work from Home)',
    city: 'Remote',
    country: 'India',
    region: 'India',
    type: 'remote',
    ianaTimeZone: 'Asia/Kolkata',
    tzAbbreviation: 'IST',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },

  // Africa (Remote)
  {
    id: 'loc-nigeria',
    label: 'Nigeria',
    city: 'Lagos',
    country: 'Nigeria',
    region: 'Africa',
    type: 'remote',
    ianaTimeZone: 'Africa/Lagos',
    tzAbbreviation: 'WAT',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },
  {
    id: 'loc-kenya',
    label: 'Kenya',
    city: 'Nairobi',
    country: 'Kenya',
    region: 'Africa',
    type: 'remote',
    ianaTimeZone: 'Africa/Nairobi',
    tzAbbreviation: 'EAT',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },

  // Middle East (Remote)
  {
    id: 'loc-dubai',
    label: 'Dubai (UAE)',
    city: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    type: 'remote',
    ianaTimeZone: 'Asia/Dubai',
    tzAbbreviation: 'GST',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },
  {
    id: 'loc-morocco',
    label: 'Morocco',
    city: 'Casablanca',
    country: 'Morocco',
    region: 'Middle East',
    type: 'remote',
    ianaTimeZone: 'Africa/Casablanca',
    tzAbbreviation: 'WET',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },

  // Asia-Pacific (Remote)
  {
    id: 'loc-vietnam',
    label: 'Vietnam',
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    region: 'Asia-Pacific',
    type: 'remote',
    ianaTimeZone: 'Asia/Ho_Chi_Minh',
    tzAbbreviation: 'ICT',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },
  {
    id: 'loc-philippines',
    label: 'Philippines',
    city: 'Manila',
    country: 'Philippines',
    region: 'Asia-Pacific',
    type: 'remote',
    ianaTimeZone: 'Asia/Manila',
    tzAbbreviation: 'PHT',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },
  {
    id: 'loc-jakarta',
    label: 'Jakarta (Indonesia)',
    city: 'Jakarta',
    country: 'Indonesia',
    region: 'Asia-Pacific',
    type: 'remote',
    ianaTimeZone: 'Asia/Jakarta',
    tzAbbreviation: 'WIB',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },

  // Latin America (Remote)
  {
    id: 'loc-latam-brazil',
    label: 'Latin America - Brazil',
    city: 'São Paulo',
    country: 'Brazil',
    region: 'Latin America',
    type: 'remote',
    ianaTimeZone: 'America/Sao_Paulo',
    tzAbbreviation: 'BRT',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },
  {
    id: 'loc-latam-mexico',
    label: 'Latin America - Mexico',
    city: 'Mexico City',
    country: 'Mexico',
    region: 'Latin America',
    type: 'remote',
    ianaTimeZone: 'America/Mexico_City',
    tzAbbreviation: 'CST',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  },
  {
    id: 'loc-latam-colombia',
    label: 'Latin America - Colombia',
    city: 'Bogota',
    country: 'Colombia',
    region: 'Latin America',
    type: 'remote',
    ianaTimeZone: 'America/Bogota',
    tzAbbreviation: 'COT',
    reportingTime: '11:00 AM',
    dressCode: 'Smart Casuals',
    lunchInfo: '',
    firstDayInstructions: 'On Day 1, join the welcome video call link sent by your HR Partner.'
  }
];

export const OFFICE_LOCATIONS = MASTER_LOCATIONS.filter(l => l.type === 'office');
export const REMOTE_LOCATIONS = MASTER_LOCATIONS.filter(l => l.type === 'remote');

export const REGIONS: LocationRegion[] = [
  'India',
  'Africa',
  'Middle East',
  'Asia-Pacific',
  'Latin America'
];

export function findLocationById(id?: string): MasterLocation | undefined {
  if (!id) return undefined;
  // Handle aliases
  if (id === 'loc-gurugram') id = 'loc-gurgaon';
  if (id === 'loc-bengaluru') id = 'loc-bangalore';
  return MASTER_LOCATIONS.find(l => l.id === id);
}

export function findLocationByCandidate(c: { locationId?: string; officeCity?: string; remoteCity?: string; remoteCountry?: string; workMode?: string }): MasterLocation {
  if (c.locationId) {
    const loc = findLocationById(c.locationId);
    if (loc) return loc;
  }
  if (c.workMode === 'Remote') {
    const country = (c.remoteCountry || '').toLowerCase();
    const city = (c.remoteCity || c.officeCity || '').toLowerCase();
    const found = REMOTE_LOCATIONS.find(l => 
      l.country.toLowerCase() === country || 
      l.label.toLowerCase().includes(country) ||
      l.city.toLowerCase() === city
    );
    if (found) return found;
    return MASTER_LOCATIONS.find(l => l.id === 'loc-india-remote')!;
  }
  const city = (c.officeCity || '').toLowerCase();
  const officeFound = OFFICE_LOCATIONS.find(l => l.city.toLowerCase() === city || l.label.toLowerCase().includes(city));
  if (officeFound) return officeFound;
  return MASTER_LOCATIONS[0];
}
