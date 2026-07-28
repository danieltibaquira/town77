import { describe, expect, it } from 'vitest'
import { DEFAULT_CAFE_QUEUE_CONFIG } from '@town77/shared-types'
import { createPlaceholderOrders } from '../orders'

describe('Cafe Queue placeholder orders', () => {
  it('defines the documented finite ingredient and rush supplies', () => {
    expect(DEFAULT_CAFE_QUEUE_CONFIG.ingredientSupply).toEqual({
      beans: 18,
      milk: 12,
      steam: 12,
      ice: 12,
      chocolate: 12,
      caramel: 12,
      tea: 12,
      water: 12,
    })
    expect(DEFAULT_CAFE_QUEUE_CONFIG.rushSupply).toBe(15)
  })

  it('creates eighty deterministic placeholder cards with unique identities', () => {
    const orders = createPlaceholderOrders()

    expect(orders).toHaveLength(80)
    expect(new Set(orders.map((order) => order.id)).size).toBe(80)
    expect(orders).toContainEqual({
      id: 'cafe-queue-01',
      recipe: { beans: 1, water: 1 },
      isSpecialty: false,
    })
    expect(orders.filter((order) => order.isSpecialty)).toHaveLength(19)
  })

  it('clones repeated recipe data instead of sharing mutable recipe objects', () => {
    const orders = createPlaceholderOrders()

    orders[0]!.recipe.beans = 99

    expect(orders[12]!.recipe.beans).toBe(1)
  })
})
