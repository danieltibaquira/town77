import { describe, it, expect } from 'vitest'
import { generateRandomName } from '../../lib/randomName'

describe('generateRandomName', () => {
  it('returns a non-empty string', () => {
    const name = generateRandomName()
    expect(name.length).toBeGreaterThan(0)
  })

  it('matches the format "{adjective} {noun} {number}"', () => {
    const name = generateRandomName()
    // Format: word word 2-digit-number
    expect(name).toMatch(/^[\p{L}áéíóúÁÉÍÓÚñÑ]+ [\p{L}áéíóúÁÉÍÓÚñÑ]+ \d{2}$/u)
  })

  it('generates a number between 10 and 99', () => {
    for (let i = 0; i < 50; i++) {
      const name = generateRandomName()
      const parts = name.split(' ')
      const num = parseInt(parts[parts.length - 1], 10)
      expect(num).toBeGreaterThanOrEqual(10)
      expect(num).toBeLessThanOrEqual(99)
    }
  })

  it('uses only known adjectives', () => {
    const validAdjectives = [
      'Valiente', 'Astuto', 'Rápido', 'Sabio', 'Audaz',
      'Brillante', 'Creativo', 'Dinámico', 'Épico', 'Feroz',
    ]
    for (let i = 0; i < 50; i++) {
      const name = generateRandomName()
      const adjective = name.split(' ')[0]
      expect(validAdjectives).toContain(adjective)
    }
  })

  it('uses only known nouns', () => {
    const validNouns = [
      'Constructor', 'Arquitecto', 'Diseñador', 'Maestro', 'Explorador',
      'Pionero', 'Estratega', 'Campeón', 'Líder', 'Visionario',
    ]
    for (let i = 0; i < 50; i++) {
      const name = generateRandomName()
      const parts = name.split(' ')
      // Noun is the second-to-last part (before the number)
      const noun = parts[parts.length - 2]
      expect(validNouns).toContain(noun)
    }
  })

  it('produces varied results over many calls', () => {
    const names = new Set<string>()
    for (let i = 0; i < 100; i++) {
      names.add(generateRandomName())
    }
    // With 10 adjectives × 10 nouns × 90 numbers = 9000 combinations,
    // 100 calls should produce many unique names
    expect(names.size).toBeGreaterThan(50)
  })
})
