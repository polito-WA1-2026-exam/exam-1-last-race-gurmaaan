import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('./database.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS line_stations (
    line_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (line_id, station_id),
    FOREIGN KEY (line_id) REFERENCES lines(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    effect INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    salt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    start_station INTEGER NOT NULL,
    dest_station INTEGER NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Lines
const insertLine = db.prepare('INSERT OR IGNORE INTO lines (id, name, color) VALUES (?, ?, ?)');
insertLine.run(1, 'Red Line', 'red');
insertLine.run(2, 'Blue Line', 'blue');
insertLine.run(3, 'Green Line', 'green');
insertLine.run(4, 'Yellow Line', 'yellow');
insertLine.run(5, 'Orange Line', 'orange');

// Stations
const insertStation = db.prepare('INSERT OR IGNORE INTO stations (id, name) VALUES (?, ?)');
insertStation.run(1, 'Torino Porta Nuova');
insertStation.run(2, 'Lingotto');
insertStation.run(3, 'Mirafiori');
insertStation.run(4, 'Stupinigi');
insertStation.run(5, 'Porta Susa');
insertStation.run(6, 'Collegno');
insertStation.run(7, 'Rivoli');
insertStation.run(8, 'Repubblica');
insertStation.run(9, 'Aurora');
insertStation.run(10, 'Barriera di Milano');
insertStation.run(11, 'Rebaudengo');
insertStation.run(12, 'Settimo');
insertStation.run(13, 'Grugliasco');
insertStation.run(14, 'Orbassano');

// Red Line: Porta Nuova -> Lingotto -> Mirafiori -> Stupinigi
const insertLS = db.prepare('INSERT OR IGNORE INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)');
insertLS.run(1, 1, 1);
insertLS.run(1, 2, 2);
insertLS.run(1, 3, 3);
insertLS.run(1, 4, 4);

// Blue Line: Porta Nuova -> Porta Susa -> Collegno -> Rivoli
insertLS.run(2, 1, 1);
insertLS.run(2, 5, 2);
insertLS.run(2, 6, 3);
insertLS.run(2, 7, 4);

// Green Line: Porta Susa -> Repubblica -> Aurora -> Barriera di Milano
insertLS.run(3, 5, 1);
insertLS.run(3, 8, 2);
insertLS.run(3, 9, 3);
insertLS.run(3, 10, 4);

// Yellow Line: Lingotto -> Repubblica -> Rebaudengo -> Settimo
insertLS.run(4, 2, 1);
insertLS.run(4, 8, 2);
insertLS.run(4, 11, 3);
insertLS.run(4, 12, 4);

// Orange Line: Mirafiori -> Aurora -> Grugliasco -> Orbassano
insertLS.run(5, 3, 1);
insertLS.run(5, 9, 2);
insertLS.run(5, 13, 3);
insertLS.run(5, 14, 4);

// Events
const insertEvent = db.prepare('INSERT OR IGNORE INTO events (id, description, effect) VALUES (?, ?, ?)');
insertEvent.run(1, 'Quiet journey', 0);
insertEvent.run(2, 'Wrong platform', -2);
insertEvent.run(3, 'Kind passenger', 1);
insertEvent.run(4, 'Missed connection', -3);
insertEvent.run(5, 'Found coins on the seat', 2);
insertEvent.run(6, 'No ticket, conductor fine', -4);
insertEvent.run(7, 'Helped tourist', 3);
insertEvent.run(8, 'Express train', 4);
insertEvent.run(9, 'Train delayed', -1);
insertEvent.run(10, 'Friendly conductor', 1);

// Users (password: "password" for all)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return { hash, salt };
}

const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, password, salt) VALUES (?, ?, ?, ?)');

const u1 = hashPassword('alice123');
insertUser.run(1, 'alice', u1.hash, u1.salt);

const u2 = hashPassword('bob456');
insertUser.run(2, 'bob', u2.hash, u2.salt);

const u3 = hashPassword('carol789');
insertUser.run(3, 'carol', u3.hash, u3.salt);

// Games for alice and bob (already played some games)
const insertGame = db.prepare('INSERT OR IGNORE INTO games (id, user_id, start_station, dest_station, score, created_at) VALUES (?, ?, ?, ?, ?, ?)');
insertGame.run(1, 1, 1, 12, 18, '2026-06-01T10:00:00');
insertGame.run(2, 1, 5, 4,  22, '2026-06-02T14:30:00');
insertGame.run(3, 2, 2, 10, 15, '2026-06-03T09:00:00');
insertGame.run(4, 2, 7, 12, 20, '2026-06-04T16:00:00');

console.log('Database initialized successfully.');
db.close();
