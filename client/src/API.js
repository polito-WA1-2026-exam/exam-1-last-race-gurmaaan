const SERVER_URL = 'http://localhost:3001';

async function getNetwork() {
  const res = await fetch(`${SERVER_URL}/api/network`);
  if (!res.ok) throw new Error('Failed to get network');
  return res.json();
}

async function getGameStart() {
  const res = await fetch(`${SERVER_URL}/api/game/start`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to start game');
  return res.json();
}

async function submitGame(route, startId, destId) {
  const res = await fetch(`${SERVER_URL}/api/game/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ route, startId, destId }),
  });
  if (!res.ok) throw new Error('Failed to submit game');
  return res.json();
}

async function getRanking() {
  const res = await fetch(`${SERVER_URL}/api/ranking`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to get ranking');
  return res.json();
}

async function login(username, password) {
  const res = await fetch(`${SERVER_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  return res.json();
}

async function logout() {
  await fetch(`${SERVER_URL}/api/sessions/current`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

async function getCurrentUser() {
  const res = await fetch(`${SERVER_URL}/api/sessions/current`, { credentials: 'include' });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

const API = { getNetwork, getGameStart, submitGame, getRanking, login, logout, getCurrentUser };
export default API;
