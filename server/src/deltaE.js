/**
 * ΔE2000 — CIE standard for perceptual colour difference.
 * Returns a value where < 1 = imperceptible, < 2 = industry pass.
 */
export function deltaE2000(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1
  const { L: L2, a: a2, b: b2 } = lab2

  const kL = 1, kC = 1, kH = 1

  const C1 = Math.sqrt(a1 ** 2 + b1 ** 2)
  const C2 = Math.sqrt(a2 ** 2 + b2 ** 2)
  const Cbar = (C1 + C2) / 2
  const Cbar7 = Cbar ** 7
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)))

  const a1p = a1 * (1 + G)
  const a2p = a2 * (1 + G)
  const C1p = Math.sqrt(a1p ** 2 + b1 ** 2)
  const C2p = Math.sqrt(a2p ** 2 + b2 ** 2)

  const h1p = toDeg(Math.atan2(b1, a1p)) % 360 + (b1 === 0 && a1p === 0 ? 0 : 0)
  const h2p = toDeg(Math.atan2(b2, a2p)) % 360 + (b2 === 0 && a2p === 0 ? 0 : 0)
  const hpFix = (h) => ((h % 360) + 360) % 360

  const h1pf = hpFix(h1p)
  const h2pf = hpFix(h2p)

  const dLp = L2 - L1
  const dCp = C2p - C1p

  let dhp
  if (C1p * C2p === 0) {
    dhp = 0
  } else if (Math.abs(h2pf - h1pf) <= 180) {
    dhp = h2pf - h1pf
  } else if (h2pf - h1pf > 180) {
    dhp = h2pf - h1pf - 360
  } else {
    dhp = h2pf - h1pf + 360
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(toRad(dhp / 2))

  const Lbar = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2

  let Hbarp
  if (C1p * C2p === 0) {
    Hbarp = h1pf + h2pf
  } else if (Math.abs(h1pf - h2pf) <= 180) {
    Hbarp = (h1pf + h2pf) / 2
  } else if (h1pf + h2pf < 360) {
    Hbarp = (h1pf + h2pf + 360) / 2
  } else {
    Hbarp = (h1pf + h2pf - 360) / 2
  }

  const T = 1
    - 0.17 * Math.cos(toRad(Hbarp - 30))
    + 0.24 * Math.cos(toRad(2 * Hbarp))
    + 0.32 * Math.cos(toRad(3 * Hbarp + 6))
    - 0.20 * Math.cos(toRad(4 * Hbarp - 63))

  const SL = 1 + 0.015 * (Lbar - 50) ** 2 / Math.sqrt(20 + (Lbar - 50) ** 2)
  const SC = 1 + 0.045 * Cbarp
  const SH = 1 + 0.015 * Cbarp * T

  const Cbarp7 = Cbarp ** 7
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + 25 ** 7))
  const dTheta = 30 * Math.exp(-(Math.pow((Hbarp - 275) / 25, 2)))
  const RT = -Math.sin(toRad(2 * dTheta)) * RC

  return Math.sqrt(
    (dLp / (kL * SL)) ** 2 +
    (dCp / (kC * SC)) ** 2 +
    (dHp / (kH * SH)) ** 2 +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  )
}

function toRad(deg) { return deg * Math.PI / 180 }
function toDeg(rad) { return rad * 180 / Math.PI }
