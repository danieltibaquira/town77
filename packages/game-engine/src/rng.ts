import Prando from 'prando'

export interface RNG {
  nextFloat(): number
}

export class MathRNG implements RNG {
  nextFloat(): number {
    return Math.random()
  }
}

export class SeededRNG implements RNG {
  private readonly prng: Prando

  constructor(seed: number | string) {
    this.prng = new Prando(seed)
  }

  nextFloat(): number {
    return this.prng.next()
  }
}
