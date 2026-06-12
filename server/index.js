import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import db from './db.js';

const app = express();
const port = 3001;

// middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(session({
  secret: 'wa1-last-race-secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// passport setup
passport.use(new LocalStrategy((username, password, done) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return done(null, false, { message: 'Incorrect username.' });

  const hash = crypto.scryptSync(password, user.salt, 32).toString('hex');
  if (hash !== user.password) return done(null, false, { message: 'Incorrect password.' });

  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  done(null, user);
});

// middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// GET /api/network - returns all lines, stations and segments
app.get('/api/network', (req, res) => {
  const lines = db.prepare('SELECT * FROM lines').all();
  const stations = db.prepare('SELECT * FROM stations').all();

  // segments: pairs of adjacent stations on the same line
  const lineStations = db.prepare('SELECT * FROM line_stations ORDER BY line_id, position').all();

  const segments = [];
  for (const line of lines) {
    const stops = lineStations.filter(ls => ls.line_id === line.id);
    for (let i = 0; i < stops.length - 1; i++) {
      segments.push({
        line_id: line.id,
        station_a: stops[i].station_id,
        station_b: stops[i + 1].station_id,
      });
    }
  }

  res.json({ lines, stations, segments });
});

// GET /api/game/start - assigns random start and destination
app.get('/api/game/start', isLoggedIn, (req, res) => {
  const stations = db.prepare('SELECT * FROM stations').all();

  // build adjacency to find reachable stations at distance >= 3
  const lineStations = db.prepare('SELECT * FROM line_stations ORDER BY line_id, position').all();
  const segments = [];
  const lines = db.prepare('SELECT * FROM lines').all();
  for (const line of lines) {
    const stops = lineStations.filter(ls => ls.line_id === line.id);
    for (let i = 0; i < stops.length - 1; i++) {
      segments.push({ a: stops[i].station_id, b: stops[i + 1].station_id });
    }
  }

  // BFS to find distance between stations
  function bfsDistance(startId, destId) {
    const visited = new Set();
    const queue = [{ id: startId, dist: 0 }];
    visited.add(startId);
    while (queue.length > 0) {
      const { id, dist } = queue.shift();
      if (id === destId) return dist;
      for (const seg of segments) {
        let neighbor = null;
        if (seg.a === id && !visited.has(seg.b)) neighbor = seg.b;
        if (seg.b === id && !visited.has(seg.a)) neighbor = seg.a;
        if (neighbor !== null) {
          visited.add(neighbor);
          queue.push({ id: neighbor, dist: dist + 1 });
        }
      }
    }
    return -1;
  }

  // pick random start, then find valid destinations (distance >= 3)
  let start, dest;
  let attempts = 0;
  do {
    start = stations[Math.floor(Math.random() * stations.length)];
    const valid = stations.filter(s => s.id !== start.id && bfsDistance(start.id, s.id) >= 3);
    if (valid.length > 0) {
      dest = valid[Math.floor(Math.random() * valid.length)];
    }
    attempts++;
  } while (!dest && attempts < 100);

  if (!dest) return res.status(500).json({ error: 'Could not find valid stations' });

  res.json({ start, dest });
});

// POST /api/game/submit - validate route and execute journey
app.post('/api/game/submit', isLoggedIn, (req, res) => {
  const { route, startId, destId } = req.body;
  // route is an array of station ids: [1, 2, 3, ...]

  if (!route || !Array.isArray(route) || route.length < 2) {
    saveGame(req.user.id, startId, destId, 0);
    return res.json({ valid: false, score: 0, steps: [] });
  }

  // build network data
  const lineStations = db.prepare('SELECT * FROM line_stations ORDER BY line_id, position').all();
  const lines = db.prepare('SELECT * FROM lines').all();

  // find all segments with their line
  const networkSegments = [];
  for (const line of lines) {
    const stops = lineStations.filter(ls => ls.line_id === line.id);
    for (let i = 0; i < stops.length - 1; i++) {
      networkSegments.push({ line_id: line.id, a: stops[i].station_id, b: stops[i + 1].station_id });
    }
  }

  // interchange stations: served by more than one line
  const stationLines = {};
  for (const ls of lineStations) {
    if (!stationLines[ls.station_id]) stationLines[ls.station_id] = new Set();
    stationLines[ls.station_id].add(ls.line_id);
  }
  const interchanges = new Set(
    Object.entries(stationLines)
      .filter(([, lines]) => lines.size > 1)
      .map(([id]) => parseInt(id))
  );

  // validate route
  function validateRoute(route, startId, destId) {
    if (route[0] !== startId || route[route.length - 1] !== destId) return false;

    const usedSegments = new Set();
    let currentLine = null;

    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      const segKey = [Math.min(from, to), Math.max(from, to)].join('-');

      // no repeated segments
      if (usedSegments.has(segKey)) return false;
      usedSegments.add(segKey);

      // find a line that connects from -> to
      const possibleLines = networkSegments
        .filter(s => (s.a === from && s.b === to) || (s.b === from && s.a === to))
        .map(s => s.line_id);

      if (possibleLines.length === 0) return false;

      if (currentLine === null) {
        currentLine = possibleLines[0];
      } else if (!possibleLines.includes(currentLine)) {
        // need to change line - only allowed at interchange
        if (!interchanges.has(from)) return false;
        currentLine = possibleLines[0];
      }
    }
    return true;
  }

  const isValid = validateRoute(route, startId, destId);

  if (!isValid) {
    saveGame(req.user.id, startId, destId, 0);
    return res.json({ valid: false, score: 0, steps: [] });
  }

  // execute journey: apply random events to each segment
  const events = db.prepare('SELECT * FROM events').all();
  let coins = 20;
  const steps = [];

  for (let i = 0; i < route.length - 1; i++) {
    const event = events[Math.floor(Math.random() * events.length)];
    coins += event.effect;
    steps.push({
      from: route[i],
      to: route[i + 1],
      event: event.description,
      effect: event.effect,
      coins: coins,
    });
  }

  const finalScore = Math.max(0, coins);
  saveGame(req.user.id, startId, destId, finalScore);

  res.json({ valid: true, score: finalScore, steps });
});

function saveGame(userId, startId, destId, score) {
  db.prepare('INSERT INTO games (user_id, start_station, dest_station, score, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(userId, startId, destId, score, new Date().toISOString());
}

// GET /api/ranking - best score per user
app.get('/api/ranking', isLoggedIn, (req, res) => {
  const ranking = db.prepare(`
    SELECT users.username, MAX(games.score) as best_score
    FROM games JOIN users ON games.user_id = users.id
    GROUP BY users.id
    ORDER BY best_score DESC
  `).all();
  res.json(ranking);
});

// --- Auth routes ---

app.post('/api/sessions', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message });
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ id: user.id, username: user.username });
    });
  })(req, res, next);
});

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ id: req.user.id, username: req.user.username });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logged out' });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
