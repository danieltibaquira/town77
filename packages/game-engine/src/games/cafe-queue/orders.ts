import type { CafeQueueOrder } from '@town77/shared-types'

const PLACEHOLDER_ORDERS: CafeQueueOrder[] = [
  { id: 'cafe-queue-01', recipe: { beans: 1, water: 1 }, isSpecialty: false },
  { id: 'cafe-queue-02', recipe: { beans: 1, milk: 1 }, isSpecialty: false },
  { id: 'cafe-queue-03', recipe: { beans: 1, steam: 1 }, isSpecialty: false },
  { id: 'cafe-queue-04', recipe: { beans: 1, ice: 1 }, isSpecialty: false },
  { id: 'cafe-queue-05', recipe: { tea: 1, water: 1 }, isSpecialty: true },
  { id: 'cafe-queue-06', recipe: { chocolate: 1, milk: 1 }, isSpecialty: false },
  { id: 'cafe-queue-07', recipe: { caramel: 1, milk: 1 }, isSpecialty: false },
  { id: 'cafe-queue-08', recipe: { beans: 2, steam: 1 }, isSpecialty: false },
  { id: 'cafe-queue-09', recipe: { tea: 1, ice: 1, water: 1 }, isSpecialty: true },
  { id: 'cafe-queue-10', recipe: { chocolate: 1, caramel: 1, milk: 1 }, isSpecialty: false },
  { id: 'cafe-queue-11', recipe: { beans: 1, steam: 1, milk: 1 }, isSpecialty: false },
  { id: 'cafe-queue-12', recipe: { tea: 1, ice: 1, steam: 1 }, isSpecialty: true },
]

export function createPlaceholderOrders(): CafeQueueOrder[] {
  return PLACEHOLDER_ORDERS.map((order) => ({
    ...order,
    recipe: { ...order.recipe },
  }))
}
