import type { CafeQueueOrder } from '@town77/shared-types'

const PLACEHOLDER_ORDER_SEEDS: ReadonlyArray<Omit<CafeQueueOrder, 'id'>> = [
  { recipe: { beans: 1, water: 1 }, isSpecialty: false },
  { recipe: { beans: 1, milk: 1 }, isSpecialty: false },
  { recipe: { beans: 1, steam: 1 }, isSpecialty: false },
  { recipe: { beans: 1, ice: 1 }, isSpecialty: false },
  { recipe: { tea: 1, water: 1 }, isSpecialty: true },
  { recipe: { chocolate: 1, milk: 1 }, isSpecialty: false },
  { recipe: { caramel: 1, milk: 1 }, isSpecialty: false },
  { recipe: { beans: 2, steam: 1 }, isSpecialty: false },
  { recipe: { tea: 1, ice: 1, water: 1 }, isSpecialty: true },
  { recipe: { chocolate: 1, caramel: 1, milk: 1 }, isSpecialty: false },
  { recipe: { beans: 1, steam: 1, milk: 1 }, isSpecialty: false },
  { recipe: { tea: 1, ice: 1, steam: 1 }, isSpecialty: true },
]

export function createPlaceholderOrders(): CafeQueueOrder[] {
  return Array.from({ length: 80 }, (_, index) => {
    const seed = PLACEHOLDER_ORDER_SEEDS[index % PLACEHOLDER_ORDER_SEEDS.length]!
    return {
      id: `cafe-queue-${String(index + 1).padStart(2, '0')}`,
      recipe: { ...seed.recipe },
      isSpecialty: seed.isSpecialty,
    }
  })
}
