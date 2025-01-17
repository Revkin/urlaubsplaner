'use client';
import './styles.css';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Euro, MapPin, Search } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../components/ui/card';

import {
  initialFormState,
  destinationOptions,
  transportOptions,
  accommodationOptions,
  activityOptions,
  dietaryOptions,
  mealOptions
} from '../components/data/formOptions';

const Page = () => {
  const [formData, setFormData] = useState(null);
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFormData({
      ...initialFormState,
      mealPreference: '',
      dietaryRestrictions: ''
    });
    setMounted(true);
  }, []);

  if (!mounted || !formData) {
    return null;
  }

  const allDestinations = [
    ...destinationOptions.europe
  ];

  const filteredDestinations = searchTerm
    ? allDestinations.filter(dest => 
        dest.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

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

  const checkDuplicateResponse = () => {
    return responses.some(
      response => response.name.toLowerCase() === formData.name.toLowerCase()
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (checkDuplicateResponse()) {
      setError('Du hast bereits eine Antwort abgegeben!');
      return;
    }

    setResponses(prev => [...prev, formData]);
    alert('Danke für deine Antwort! Du kannst alle Antworten unter "Antworten anzeigen" einsehen.');
    setFormData({
      ...initialFormState,
      mealPreference: '',
      dietaryRestrictions: ''
    });
    setError('');
  };

  const findOverlappingDates = () => {
    if (responses.length < 2) return [];
    
    const allPeriods = responses.flatMap(response => 
      response.availablePeriods.map(period => ({
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

              {/* Reisezielsuche */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Reisezielsuche
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Suche nach Reisezielen</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="z.B. Spanien, Bayern, Wien..."
                    />
                  </div>
                  {searchTerm && (
                    <div className="p-4 border rounded bg-gray-50">
                      <h3 className="font-medium mb-2">Suchergebnisse:</h3>
                      {filteredDestinations.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {filteredDestinations.map(dest => (
                            <label key={dest} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.preferredDestinations.includes(dest)}
                                onChange={() => handleMultiSelect('preferredDestinations', dest)}
                                className="rounded"
                              />
                              <span>{dest}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600">Keine Ergebnisse gefunden</p>
                      )}
                    </div>
                  )}
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
              </section>{/* Reiseziele */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Reiseziele
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Reiseziel hinzufügen</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 p-2 border rounded"
                        placeholder="z.B. Berlin, Paris, Rom..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (searchTerm.trim()) {
                            handleMultiSelect('preferredDestinations', searchTerm.trim());
                            setSearchTerm('');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Hinzufügen
                      </button>
                    </div>
                  </div>

                  {/* Ausgewählte Reiseziele */}
                  {formData.preferredDestinations.length > 0 && (
                    <div className="p-4 border rounded">
                      <h3 className="font-medium mb-2">Deine Reiseziele:</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.preferredDestinations.map(dest => (
                          <span 
                            key={dest} 
                            className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
                          >
                            {dest}
                            <button
                              type="button"
                              onClick={() => handleMultiSelect('preferredDestinations', dest)}
                              className="text-gray-500 hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vorschläge */}
                  <div>
                    <h3 className="font-medium mb-2">Beliebte Reiseziele:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {destinationOptions.europe.map(dest => (
                        <label key={dest} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.preferredDestinations.includes(dest)}
                            onChange={() => handleMultiSelect('preferredDestinations', dest)}
                            className="rounded"
                          />
                          <span>{dest}</span>
                        </label>
                      ))}
                    </div>
                  </div>
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
                      /><span>{option.label}</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <p><strong>Teilnehmer:</strong> {response.participants}</p>
                          <div>
                            <strong>Zeiträume:</strong>
                            {response.availablePeriods.map((period, periodIndex) => (
                              <p key={periodIndex} className="ml-4">
                                {period.startDate} bis {period.endDate}
                              </p>
                            ))}
                          </div>
                          <p><strong>Budget:</strong> {response.budget.total}</p>
                          {response.preferredDestinations.length > 0 && (
                            <div>
                              <strong>Gewünschte Ziele:</strong>
                              <ul className="ml-4 list-disc">
                                {response.preferredDestinations.map((dest, destIndex) => (
                                  <li key={destIndex}>{dest}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {response.activities.length > 0 && (
                            <div>
                              <strong>Gewünschte Aktivitäten:</strong>
                              <ul className="ml-4 list-disc">
                                {response.activities.map((activity, actIndex) => (
                                  <li key={actIndex}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {response.additionalNotes && (
                            <div>
                              <strong>Anmerkungen:</strong>
                              <p className="ml-4">{response.additionalNotes}</p>
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
