import axios from 'axios';

const API = process.env.REACT_APP_API_URL;
const TTL_MS = 60000;

let cache = null;
let cacheTime = 0;
let inflight = null;

export function getPis({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache && now - cacheTime < TTL_MS) {
    return Promise.resolve(cache);
  }
  if (inflight) return inflight;
  inflight = axios.get(`${API}/api/pi`)
    .then(res => {
      cache = res.data.data || [];
      cacheTime = Date.now();
      return cache;
    })
    .finally(() => { inflight = null; });
  return inflight;
}

export function invalidatePis() {
  cache = null;
  cacheTime = 0;
}