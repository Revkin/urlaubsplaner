# Basis-Image für React
FROM node:16

# Arbeitsverzeichnis im Container
WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Projektdateien kopieren
COPY . .

# Projekt bauen
RUN npm run build

# Port freigeben
EXPOSE 3000

# Startbefehl
CMD ["npm", "start"]