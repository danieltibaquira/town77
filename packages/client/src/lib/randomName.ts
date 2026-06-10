const ADJECTIVES = [
  'Valiente',
  'Astuto',
  'Rápido',
  'Sabio',
  'Audaz',
  'Brillante',
  'Creativo',
  'Dinámico',
  'Épico',
  'Feroz',
]

const NOUNS = [
  'Constructor',
  'Arquitecto',
  'Diseñador',
  'Maestro',
  'Explorador',
  'Pionero',
  'Estratega',
  'Campeón',
  'Líder',
  'Visionario',
]

/**
 * Generates a random Spanish-themed player name.
 * Format: "{adjective} {noun} {number}" (number is 10–99)
 */
export function generateRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const number = Math.floor(Math.random() * 90) + 10 // 10–99
  return `${adjective} ${noun} ${number}`
}
