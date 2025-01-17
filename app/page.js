'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Euro, MapPin, Search } from 'lucide-react';

// UI Komponenten direkt hier definiert
const Card = ({ className = "", ...props }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
);

const CardHeader = ({ className = "", ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardTitle = ({ className = "", ...props }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
);

const CardContent = ({ className = "", ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

// Formularoptionen
const destinationOptions = {
  europe: [
    'Spanien - Festland', 'Spanien - Mallorca', 'Spanien - Kanaren',
    'Italien - Festland', 'Italien - Sizilien', 'Italien - Sardinien',
    'Griechenland - Festland', 'Griechenland - Inseln', 'Kroatien',
    'Portugal - Festland', 'Portugal - Madeira', 'Frankreich', 'Frankreich - Korsika'
  ]
};

const transportOptions = [
  { id: 'plane', label: 'Flugzeug' },
  { id: 'train', label: 'Zug' },
  { id: 'car', label: 'Auto' },
  { id: 'bus', label: 'Bus' },
  { id: 'ship', label: 'Schiff/Fähre' },
  { id: 'rentalCar', label: 'Mietwagen vor Ort' }
];

const accommodationOptions = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'apartment', label: 'Ferienwohnung' },
  { id: 'resort', label: 'Resort' },
  { id: 'camping', label: 'Camping' },
  { id: 'hostel', label: 'Hostel' },
  { id: 'airbnb', label: 'Airbnb/Privatunterkunft' }
];

const activityOptions = [
  'Strand & Baden', 'Städtebesichtigung', 'Wandern', 'Radfahren',
  'Wassersport', 'Wellness & Spa', 'Kultur & Museen', 'Kulinarik & Restaurants',
  'Shopping', 'Nachtleben', 'Sport & Fitness', 'Naturerkundung'
];

const dietaryOptions = [
  'Keine besonderen Anforderungen', 'Vegetarisch', 'Vegan', 'Glutenfrei',
  'Laktosefrei', 'Halal', 'Kosher', 'Allergien (bitte in Anmerkungen spezifizieren)'
];

const mealOptions = [
  'All-Inclusive', 'Vollpension', 'Halbpension', 'Frühstück', 'Selbstverpflegung'
];

const initialFormState = {
  name: '',
  participants: '1',
  availablePeriods: [{ startDate: '', endDate: '' }],
  preferredDestinations: [],
  transportPreferences: [],
  accommodationPreferences: [],
  budget: {
    total: '',
  },
  activities: [],
  mealPreference: '',
  dietaryRestrictions: '',
  additionalNotes: ''
};

// Hauptkomponente
const Page = () => {
  const [formData, setFormData] = useState(null);
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchCache, setSearchCache] = useState({});
  const debouncedSearch = useRef(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/responses');
        if (response.ok) {
          const savedResponses = await response.json();
          setResponses(savedResponses);
        }
        setFormData({
          ...initialFormState,
          mealPreference: '',
          dietaryRestrictions: ''
        });
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        setError('Fehler beim Laden der gespeicherten Daten.');
      }
      setMounted(true);
    };

    loadInitialData();
  }, []);

  if (!mounted || !formData) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleBudgetChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [category]: value
      }
    }));
  };

  const handleMultiSelect = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const handleDateChange = (index, field, value) => {
    const newPeriods = [...formData.availablePeriods];
    newPeriods[index] = {
      ...newPeriods[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      availablePeriods: newPeriods
    }));
  };

  const addDatePeriod = () => {
    setFormData(prev => ({
      ...prev,
      availablePeriods: [...prev.availablePeriods, { startDate: '', endDate: '' }]
    }));
  };

  const removeDatePeriod = (index) => {
    if (formData.availablePeriods.length > 1) {
      setFormData(prev => ({
        ...prev,
        availablePeriods: prev.availablePeriods.filter((_, i) => i !== index)
      }));
    }
  };

  const handleDestinationSearch = async (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    // Check cache first
    if (searchCache[term]) {
      setSearchResults(searchCache[term]);
      return;
    }

    // Clear previous timeout
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }

    // Set new timeout
    debouncedSearch.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchLower = term.toLowerCase().trim();
        
        // First try exact city name match
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=5&addressdetails=1`
        );
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        // Format results with better city/country information
        const onlineResults = data.map(item => {
          const city = item.address.city || item.address.town || item.address.village || item.name;
          const country = item.address.country;
          return {
            display: `${city}, ${country}`,
            value: `${city}, ${country}`,
            type: 'online'
          };
        }).filter(Boolean);

        // If we have online results, cache and use them
        if (onlineResults.length > 0) {
          setSearchCache(prev => ({...prev, [term]: onlineResults}));
          setSearchResults(onlineResults);
          return;
        }

        // Fallback to local search with more flexible matching
        const localResults = destinationOptions.europe
          .filter(dest => {
            const destLower = dest.toLowerCase();
            // Match any part of the destination name
            return destLower.includes(searchLower);
          })
          .sort((a, b) => {
            // Sort by how close the match is to the beginning
            const aIndex = a.toLowerCase().indexOf(searchLower);
            const bIndex = b.toLowerCase().indexOf(searchLower);
            return aIndex - bIndex;
          })
          .map(dest => ({
            display: dest,
            value: dest,
            type: 'local'
          }));

        // If we have local results, cache and use them
        if (localResults.length > 0) {
          setSearchCache(prev => ({...prev, [term]: localResults}));
          setSearchResults(localResults);
          return;
        }

        // If no results found, show suggestions
        const suggestions = [
          'Bitte versuchen Sie:',
          '- Einen spezifischeren Ortsnamen (z.B. "Bern" statt "Schweiz")',
          '- Ein Land oder eine Region (z.B. "Italien" oder "Balearen")',
          '- Eine bekannte Stadt (z.B. "Paris" oder "Rom")'
        ].map(text => ({
          display: text,
          value: text,
          type: 'suggestion'
        }));

        setSearchCache(prev => ({...prev, [term]: suggestions}));
        setSearchResults(suggestions);
        
      } catch (error) {
        console.error('Fehler bei der Suche:', error);
        const errorMessage = [{
          display: 'Fehler bei der Suche. Bitte versuchen Sie es später erneut.',
          value: 'error',
          type: 'error'
        }];
        setSearchCache(prev => ({...prev, [term]: errorMessage}));
        setSearchResults(errorMessage);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce
  };

  const checkDuplicateResponse = () => {
    return responses.some(
      response => response.name.toLowerCase() === formData.name.toLowerCase()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (checkDuplicateResponse()) {
      setError('Du hast bereits eine Antwort abgegeben!');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Netzwerkfehler beim Speichern');
      }

      setResponses(prev => [...prev, formData]);
      alert('Danke für deine Antwort! Du kannst alle Antworten unter "Antworten anzeigen" einsehen.');
      setFormData({
        ...initialFormState,
        mealPreference: '',
        dietaryRestrictions: ''
      });
      setError('');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setError('Fehler beim Speichern der Antwort.');
    }
  };

  const findOverlappingDates = () => {
    if (responses.length < 2) return [];
    
    const allPeriods = responses.flatMap(response => 
      (response.data?.availablePeriods || []).map(period => ({
        start: new Date(period.startDate),
        end: new Date(period.endDate),
        person: response.name
      }))
    );

    const overlaps = [];
    for (let i = 0; i < allPeriods.length; i++) {
      for (let j = i + 1; j < allPeriods.length; j++) {
        const a = allPeriods[i];
        const b = allPeriods[j];
        if (a.start <= b.end && b.start <= a.end) {
          overlaps.push({
            start: new Date(Math.max(a.start, b.start)),
            end: new Date(Math.min(a.end, b.end)),
            people: [a.person, b.person]
          });
        }
      }
    }
    return overlaps;
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Urlaubsplanung 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => setShowResponses(!showResponses)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              {showResponses ? 'Zurück zum Formular' : 'Antworten anzeigen'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {!showResponses ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Persönliche Daten */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Persönliche Daten
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Anzahl Mitreisende *
                    </label>
                    <input
                      type="number"
                      name="participants"
                      value={formData.participants}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Reisezeiträume */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Reisezeiträume
                  </h2>
                  <button
                    type="button"
                    onClick={addDatePeriod}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    + Weiteren Zeitraum hinzufügen
                  </button>
                </div>

                {formData.availablePeriods.map((period, index) => (
                  <div key={index} className="p-4 border rounded bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Zeitraum {index + 1}</span>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeDatePeriod(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">Von *</label>
                        <input
                          type="date"
                          value={period.startDate}
                          onChange={(e) => handleDateChange(index, 'startDate', e.target.value)}
                          min="2025-01-01"
                          max="2025-12-31"
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Bis *</label>
                        <input
                          type="date"
                          value={period.endDate}
                          onChange={(e) => handleDateChange(index, 'endDate', e.target.value)}
                          min={period.startDate || '2025-01-01'}
                          max="2025-12-31"
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              {/* Reiseziele */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Reiseziele
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Suche nach Reisezielen
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleDestinationSearch(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="z.B. Spanien, Bayern, Wien..."
                      />
                      {isSearching && (
                        <div className="absolute right-2 top-2 text-gray-500">
                          Suche...
                        </div>
                      )}
                    </div>
                  </div>

                  {searchTerm && searchResults.length > 0 && (
                    <div className="p-4 border rounded bg-gray-50">
                      <h3 className="font-medium mb-2">Suchergebnisse:</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {searchResults.map((result, index) => (
                          result.type === 'error' || result.type === 'suggestion' ? (
                            <div key={index} className="text-gray-600 italic">
                              {result.display}
                            </div>
                          ) : (
                            <label key={result.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.preferredDestinations.includes(result.value)}
                                onChange={() => handleMultiSelect('preferredDestinations', result.value)}
                                className="rounded"
                              />
                              <span>{result.display}</span>
                            </label>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.preferredDestinations.length > 0 && (
                    <div className="p-4 border rounded bg-gray-50">
                      <h3 className="font-medium mb-2">Ausgewählte Reiseziele:</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.preferredDestinations.map(dest => (
                          <div 
                            key={dest}
                            className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full"
                          >
                            <span>{dest}</span>
                            <button
                              type="button"
                              onClick={() => handleMultiSelect('preferredDestinations', dest)}
                              className="text-gray-500 hover:text-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Transport */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Transport</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {transportOptions.map(option => (
                    <label key={option.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.transportPreferences.includes(option.id)}
                        onChange={() => handleMultiSelect('transportPreferences', option.id)}
                        className="rounded"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Unterkunft */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Unterkunft</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {accommodationOptions.map(option => (
                    <label key={option.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.accommodationPreferences.includes(option.id)}
                        onChange={() => handleMultiSelect('accommodationPreferences', option.id)}
                        className="rounded"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Budget */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Budget pro Person
                </h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Gesamtbudget *</label>
                  <select
                    name="budget.total"
                    value={formData.budget.total || ''}
                    onChange={(e) => handleBudgetChange('total', e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Bitte wählen...</option>
                    <option value="500-1000">500-1000€</option>
                    <option value="1000-1500">1000-1500€</option>
                    <option value="1500-2000">1500-2000€</option>
                    <option value="2000-2500">2000-2500€</option>
                    <option value="2500+">Über 2500€</option>
                  </select>
                </div>
              </section>

              {/* Aktivitäten */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Aktivitäten</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {activityOptions.map(activity => (
                    <label key={activity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.activities.includes(activity)}
                        onChange={() => handleMultiSelect('activities', activity)}
                        className="rounded"
                      />
                      <span>{activity}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Verpflegung */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Verpflegung</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Verpflegungsart</label>
                  <select
                    name="mealPreference"
                    value={formData.mealPreference || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Bitte wählen...</option>
                    {mealOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ernährungsbesonderheiten</label>
                  <select
                    name="dietaryRestrictions"
                    value={formData.dietaryRestrictions || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Bitte wählen...</option>
                    {dietaryOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Zusätzliche Anmerkungen */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Zusätzliche Anmerkungen</h2>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows="4"
                  placeholder="Weitere Wünsche, Anmerkungen oder Vorschläge..."
                />
              </section>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Absenden
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Bisherige Antworten</h3>
              {responses.length === 0 ? (
                <p className="text-gray-500">Noch keine Antworten vorhanden.</p>
              ) : (
                <>
                  {responses.map((response, index) => (
                    <div key={index} className="p-4 border rounded bg-gray-50">
                      <h4 className="text-lg font-medium">{response.name}</h4>
                      <div className="mt-2 space-y-2">
                        <p><strong>Teilnehmer:</strong> {response.data?.participants || 'Nicht angegeben'}</p>
                        <div>
                          <strong>Zeiträume:</strong>
                          {(response.data?.availablePeriods || []).map((period, periodIndex) => (
                            <p key={periodIndex} className="ml-4">
                              {period.startDate || 'Nicht angegeben'} bis {period.endDate || 'Nicht angegeben'}
                            </p>
                          ))}
                          {(!response.data?.availablePeriods || response.data.availablePeriods.length === 0) && (
                            <p className="ml-4 text-gray-500">Keine Zeiträume angegeben</p>
                          )}
                        </div>
                        <p><strong>Budget:</strong> {response.data?.budget?.total || 'Nicht angegeben'}</p>
                        {response.data?.preferredDestinations?.length > 0 && (
                          <div>
                            <strong>Gewünschte Ziele:</strong>
                            <ul className="ml-4 list-disc">
                              {response.data.preferredDestinations.map((dest, destIndex) => (
                                <li key={destIndex}>{dest}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {response.data?.activities?.length > 0 && (
                          <div>
                            <strong>Gewünschte Aktivitäten:</strong>
                            <ul className="ml-4 list-disc">
                              {response.data.activities.map((activity, actIndex) => (
                                <li key={actIndex}>{activity}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {response.data?.additionalNotes && (
                          <div>
                            <strong>Anmerkungen:</strong>
                            <p className="ml-4">{response.data.additionalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Überschneidende Zeiträume */}
                  <div className="mt-8 p-4 border rounded bg-green-50">
                    <h3 className="text-lg font-semibold mb-3">Mögliche gemeinsame Zeiträume:</h3>
                    {findOverlappingDates().length === 0 ? (
                      <p className="text-gray-600">Keine überlappenden Zeiträume gefunden.</p>
                    ) : (
                      <ul className="space-y-2">
                        {findOverlappingDates().map((overlap, index) => (
                          <li key={index} className="text-green-800">
                            <strong>{overlap.people.join(' & ')}:</strong>{' '}
                            {overlap.start.toLocaleDateString()} - {overlap.end.toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
