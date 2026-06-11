import { describe, expect, it } from 'vitest'
import { town77Theme } from '../../themes/town77'
import { assertValidTheme } from '../helpers/theme-assertions'

describe('town77 theme', () => {
  it('is a valid theme', () => {
    assertValidTheme(town77Theme)
  })

  it('uses playful spring preset (stiffness 260)', () => {
    expect(town77Theme.animationPreset.chipPlace.stiffness).toBe(260)
  })
})
