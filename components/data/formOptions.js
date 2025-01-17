export const destinationOptions = {
    europe: [
      'Spanien - Festland',
      'Spanien - Mallorca',
      'Spanien - Kanaren',
      'Italien - Festland',
      'Italien - Sizilien',
      'Italien - Sardinien',
      'Griechenland - Festland',
      'Griechenland - Inseln',
      'Kroatien',
      'Portugal - Festland',
      'Portugal - Madeira',
      'Frankreich',
      'Frankreich - Korsika'
    ]
  };
  
  export const transportOptions = [
    { id: 'plane', label: 'Flugzeug' },
    { id: 'train', label: 'Zug' },
    { id: 'car', label: 'Auto' },
    { id: 'bus', label: 'Bus' },
    { id: 'ship', label: 'Schiff/Fähre' },
    { id: 'rentalCar', label: 'Mietwagen vor Ort' }
  ];
  
  export const accommodationOptions = [
    { id: 'hotel', label: 'Hotel' },
    { id: 'apartment', label: 'Ferienwohnung' },
    { id: 'resort', label: 'Resort' },
    { id: 'camping', label: 'Camping' },
    { id: 'hostel', label: 'Hostel' },
    { id: 'airbnb', label: 'Airbnb/Privatunterkunft' }
  ];
  
  export const activityOptions = [
    'Strand & Baden',
    'Städtebesichtigung',
    'Wandern',
    'Radfahren',
    'Wassersport',
    'Wellness & Spa',
    'Kultur & Museen',
    'Kulinarik & Restaurants',
    'Shopping',
    'Nachtleben',
    'Sport & Fitness',
    'Naturerkundung'
  ];
  
  export const dietaryOptions = [
    'Keine besonderen Anforderungen',
    'Vegetarisch',
    'Vegan',
    'Glutenfrei',
    'Laktosefrei',
    'Halal',
    'Kosher',
    'Allergien (bitte in Anmerkungen spezifizieren)'
  ];
  
  export const roomOptions = [
    'Einzelzimmer',
    'Doppelzimmer',
    'Suite',
    'Mehrbettzimmer',
    'Apartment',
    'Bungalow'
  ];
  
  export const mealOptions = [
    'All-Inclusive',
    'Vollpension',
    'Halbpension',
    'Frühstück',
    'Selbstverpflegung'
  ];
  
  export const locationPreferences = [
    'Stadtzentrum',
    'Strandnähe',
    'Ruhige Lage',
    'Berge',
    'Natur',
    'Einkaufsmöglichkeiten in der Nähe',
    'Gute ÖPNV-Anbindung'
  ];
  
  export const initialFormState = {
    name: '',
    email: '',
    phone: '',
    availablePeriods: [{ startDate: '', endDate: '' }],
    preferredDestinations: [],
    transportPreferences: [],
    accommodationPreferences: [],
    budget: {
      total: '',
      transport: '',
      accommodation: '',
      activities: ''
    },
    travelPreferences: [],
    activities: [],
    dietaryRestrictions: [],
    roomPreference: '',
    participants: '1',
    additionalNotes: '',
    minDuration: '7'
  };