/**
 * Calibration patch set — ~96 CMYKOG combinations covering the printable gamut.
 * Single-channel ramps, two-channel combinations, three-channel CMY mixes,
 * and extended gamut (O/G) patches.
 */

function patch(c, m, y, k, o, g) {
  return { c, m, y, k, o, g }
}

const patches = [
  // ── Single channel ramps ─────────────────────────────────────────────────
  // Cyan
  patch(10,0,0,0,0,0), patch(25,0,0,0,0,0), patch(50,0,0,0,0,0),
  patch(75,0,0,0,0,0), patch(100,0,0,0,0,0),
  // Magenta
  patch(0,10,0,0,0,0), patch(0,25,0,0,0,0), patch(0,50,0,0,0,0),
  patch(0,75,0,0,0,0), patch(0,100,0,0,0,0),
  // Yellow
  patch(0,0,10,0,0,0), patch(0,0,25,0,0,0), patch(0,0,50,0,0,0),
  patch(0,0,75,0,0,0), patch(0,0,100,0,0,0),
  // Black
  patch(0,0,0,10,0,0), patch(0,0,0,25,0,0), patch(0,0,0,50,0,0),
  patch(0,0,0,75,0,0), patch(0,0,0,100,0,0),
  // Orange
  patch(0,0,0,0,10,0), patch(0,0,0,0,25,0), patch(0,0,0,0,50,0),
  patch(0,0,0,0,75,0), patch(0,0,0,0,100,0),
  // Green
  patch(0,0,0,0,0,10), patch(0,0,0,0,0,25), patch(0,0,0,0,0,50),
  patch(0,0,0,0,0,75), patch(0,0,0,0,0,100),

  // ── Two-channel CMY ──────────────────────────────────────────────────────
  patch(25,25,0,0,0,0), patch(50,50,0,0,0,0), patch(75,75,0,0,0,0),
  patch(25,0,25,0,0,0), patch(50,0,50,0,0,0), patch(75,0,75,0,0,0),
  patch(0,25,25,0,0,0), patch(0,50,50,0,0,0), patch(0,75,75,0,0,0),

  // ── With Black ───────────────────────────────────────────────────────────
  patch(25,0,0,25,0,0), patch(50,0,0,25,0,0), patch(75,0,0,25,0,0),
  patch(0,25,0,25,0,0), patch(0,50,0,25,0,0), patch(0,75,0,25,0,0),
  patch(0,0,25,25,0,0), patch(0,0,50,25,0,0), patch(0,0,75,25,0,0),

  // ── Extended gamut — Orange combos ───────────────────────────────────────
  patch(0,25,0,0,25,0), patch(0,50,0,0,50,0), patch(0,75,0,0,75,0),
  patch(0,0,25,0,25,0), patch(0,0,50,0,50,0), patch(0,0,75,0,75,0),
  patch(0,25,25,0,50,0), patch(0,50,50,0,75,0),
  patch(0,75,50,0,75,0), patch(0,50,75,0,75,0),

  // ── Extended gamut — Green combos ────────────────────────────────────────
  patch(25,0,0,0,0,25), patch(50,0,0,0,0,50), patch(75,0,0,0,0,75),
  patch(0,0,25,0,0,25), patch(0,0,50,0,0,50), patch(0,0,75,0,0,75),
  patch(50,0,25,0,0,50), patch(75,0,50,0,0,75),
  patch(25,0,50,0,0,50), patch(50,0,75,0,0,75),

  // ── Three-channel CMY ────────────────────────────────────────────────────
  patch(25,25,25,0,0,0), patch(50,50,50,0,0,0), patch(75,75,75,0,0,0),
  patch(75,25,25,0,0,0), patch(25,75,25,0,0,0), patch(25,25,75,0,0,0),
  patch(75,75,25,0,0,0), patch(75,25,75,0,0,0), patch(25,75,75,0,0,0),
  patch(50,75,25,0,0,0), patch(25,50,75,0,0,0), patch(75,50,25,0,0,0),

  // ── CMY + K ──────────────────────────────────────────────────────────────
  patch(50,50,50,25,0,0), patch(50,50,50,50,0,0),
  patch(75,25,50,25,0,0), patch(25,75,50,25,0,0),
  patch(50,50,0,50,0,0),  patch(0,50,50,50,0,0),

  // ── Rich black / neutral ramp ────────────────────────────────────────────
  patch(25,25,25,25,0,0), patch(50,50,50,50,0,0),
  patch(10,10,10,50,0,0), patch(0,0,0,0,0,0),

  // ── O+G combos ───────────────────────────────────────────────────────────
  patch(0,0,0,0,50,50), patch(0,0,0,0,75,50), patch(0,0,0,0,50,75),
  patch(25,0,0,0,50,25), patch(0,25,0,0,50,0),

  // ── Common spot-colour territories ───────────────────────────────────────
  patch(0,100,100,0,0,0),   // red
  patch(100,0,100,0,0,0),   // blue/purple
  patch(0,0,100,0,75,0),    // deep yellow/orange
  patch(100,0,0,0,0,75),    // cyan/green
  patch(0,50,100,0,50,0),   // warm orange
  patch(50,0,0,0,0,100),    // teal/green
]

// Assign sequential IDs
export default patches.map((p, i) => ({ id: i + 1, ...p }))
