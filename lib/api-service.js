const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiService = {
  async getAllResponses() {
    const response = await fetch(`${API_URL}/responses`);
    if (!response.ok) throw new Error('Fehler beim Laden der Antworten');
    return response.json();
  },

  async saveResponse(data) {
    const response = await fetch(`${API_URL}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Fehler beim Speichern der Antwort');
    return response.json();
  },

  // ... weitere API-Methoden
};