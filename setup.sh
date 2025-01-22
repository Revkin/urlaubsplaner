#!/bin/bash

# Verzeichnis erstellen und hineinwechseln
INSTALL_DIR="/home/pi/urlaubsplaner"
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# Benötigte Pakete installieren
echo "Installiere benötigte Pakete..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv openssl

# Virtuelles Python-Environment erstellen
python3 -m venv venv
source venv/bin/activate

# Python-Pakete installieren
pip install flask flask-cors python-dotenv PyJWT werkzeug

# SSL-Zertifikate erstellen
echo "Erstelle SSL-Zertifikate..."
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=DE/ST=State/L=City/O=Organization/CN=localhost"

# Zufälligen Secret Key generieren
SECRET_KEY=$(openssl rand -hex 32)
echo "SECRET_KEY=$SECRET_KEY" > .env

# Service-Datei erstellen
echo "Erstelle Systemd Service..."
sudo bash -c 'cat > /etc/systemd/system/urlaubsplaner.service << EOL
[Unit]
Description=Urlaubsplaner Server
After=network.target

[Service]
User=pi
WorkingDirectory='$INSTALL_DIR'
Environment="PATH='$INSTALL_DIR'/venv/bin"
ExecStart='$INSTALL_DIR'/venv/bin/python server.py
Restart=always

[Install]
WantedBy=multi-user.target
EOL'

# Server-Datei erstellen
cat > server.py << 'EOL'
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import datetime, timedelta
import jwt
from functools import wraps
import os
from dotenv import load_dotenv

# Lade Umgebungsvariablen
load_dotenv()

app = Flask(__name__)
CORS(app)

# Sichere Konfiguration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'generate-a-secure-secret-key')
DATABASE = 'urlaubsplaner.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    with app.app_context():
        db = get_db()
        with open('schema.sql', 'r') as f:
            db.executescript(f.read())
        db.commit()

# Token-basierte Authentifizierung
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token fehlt!'}), 401
        try:
            token = token.split(" ")[1]  # Bearer token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['user_id']
        except:
            return jsonify({'message': 'Token ungültig!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Fehlende Daten'}), 400
        
    db = get_db()
    user = db.execute('SELECT id FROM users WHERE email = ?', 
                     (data['email'],)).fetchone()
                     
    if user:
        return jsonify({'message': 'Benutzer existiert bereits'}), 409
        
    hashed_password = generate_password_hash(data['password'])
    
    db.execute('INSERT INTO users (email, password) VALUES (?, ?)',
               (data['email'], hashed_password))
    db.commit()
    
    return jsonify({'message': 'Benutzer erfolgreich registriert'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Fehlende Daten'}), 400
        
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ?', 
                     (data['email'],)).fetchone()
                     
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Ungültige Anmeldedaten'}), 401
        
    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'])
    
    return jsonify({'token': token})

@app.route('/urlaub', methods=['POST'])
@token_required
def create_urlaub(current_user):
    data = request.get_json()
    
    if not data or not data.get('start_date') or not data.get('end_date'):
        return jsonify({'message': 'Fehlende Daten'}), 400
        
    db = get_db()
    db.execute('''
        INSERT INTO urlaub (user_id, start_date, end_date, status)
        VALUES (?, ?, ?, 'pending')
    ''', (current_user, data['start_date'], data['end_date']))
    db.commit()
    
    return jsonify({'message': 'Urlaub erfolgreich eingetragen'}), 201

@app.route('/urlaub', methods=['GET'])
@token_required
def get_urlaub(current_user):
    db = get_db()
    urlaub = db.execute('''
        SELECT * FROM urlaub
        WHERE user_id = ?
        ORDER BY start_date DESC
    ''', (current_user,)).fetchall()
    
    return jsonify([dict(row) for row in urlaub])

if __name__ == '__main__':
    # Initialisiere Datenbank bei Start
    init_db()
    # Produktionsserver-Konfiguration
    app.run(host='0.0.0.0', port=5000, ssl_context=('cert.pem', 'key.pem'))
EOL

# Schema-Datei erstellen
cat > schema.sql << 'EOL'
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS urlaub;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE urlaub (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_urlaub_user ON urlaub(user_id);
EOL

# Dateiberechtigungen setzen
chmod +x server.py
chmod 600 .env cert.pem key.pem

# Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable urlaubsplaner
sudo systemctl start urlaubsplaner

echo "Installation abgeschlossen!"
echo "Der Server läuft unter: https://[deine-ip]:5000"
echo "Bitte stelle sicher, dass Port 5000 in deinem Router weitergeleitet ist."