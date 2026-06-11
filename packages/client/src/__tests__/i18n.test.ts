import { beforeAll, describe, expect, it } from 'vitest'
import i18n from '../lib/i18n'

describe('i18n', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('es')
  })

  it('resolves common:create_room in Spanish', () => {
    expect(i18n.t('common:create_room')).toBe('Crear sala')
  })

  it('resolves game:your_turn', () => {
    expect(i18n.t('game:your_turn')).toBe('Tu turno')
  })

  it('resolves errors:not_your_turn', () => {
    expect(i18n.t('errors:not_your_turn')).toBe('No es tu turno')
  })

  it('resolves config:grid_size', () => {
    expect(i18n.t('config:grid_size')).toBe('Tamaño del tablero')
  })

  it('resolves results:winner', () => {
    expect(i18n.t('results:winner')).toBe('Ganador')
  })

  it('switches to English and back', async () => {
    await i18n.changeLanguage('en')
    expect(i18n.t('common:create_room')).toBe('Create room')
    await i18n.changeLanguage('es')
  })
})
