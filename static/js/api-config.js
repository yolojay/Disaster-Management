/**
 * AI Cyclone & Coastal Disaster Early Warning System
 * Centralized API & Navigation Configuration
 *
 * ─────────────────────────────────────────────────────────
 *  LOCAL DEV  →  http://localhost:8000  (auto-detected)
 *  PRODUCTION →  https://YOUR-PUBLIC-BACKEND-URL  ← UPDATE THIS
 * ─────────────────────────────────────────────────────────
 *
 * TO SET YOUR PRODUCTION BACKEND:
 *   Replace "https://YOUR-PUBLIC-BACKEND-URL" below with
 *   the actual URL of your deployed FastAPI backend, e.g.:
 *     "https://cyclone-ews-api.railway.app"
 *     "https://cyclone-ews.onrender.com"
 *     "https://cyclone-ews.fly.dev"
 */

// ── API Base URL (backend) ───────────────────────────────
const _isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const API_BASE_URL = _isLocal
  ? 'http://localhost:8000'
  : 'https://YOUR-PUBLIC-BACKEND-URL';   // ← REPLACE WITH YOUR DEPLOYED BACKEND URL

// ── Navigation Base (frontend page links) ───────────────
// On localhost:8000 the pages are served under /static/
// On GitHub Pages the repo is served under /Disaster-Management/
const _ghBase = '/Disaster-Management';
const NAV_BASE = _isLocal
  ? '/static'
  : _ghBase;

// ── CSS/JS Asset Base ────────────────────────────────────
// Used to prefix stylesheet/script hrefs from JS (not needed
// in HTML which uses relative paths resolved by the browser).
const ASSET_BASE = NAV_BASE;
