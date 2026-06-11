import { test, expect } from '@playwright/test'

test.describe('Home Screen', () => {
  test('displays game title', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Town 77' })).toBeVisible()
  })

  test('has create room button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('btn-create')).toBeVisible()
    await expect(page.getByTestId('btn-create')).toHaveText('Crear sala')
  })

  test('has join button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('btn-join')).toBeVisible()
    await expect(page.getByTestId('btn-join')).toHaveText('Unirse')
  })

  test('navigates to config screen on create click', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-create').click()
    await expect(page).toHaveURL(/\/config/)
    await expect(page.getByTestId('config-screen')).toBeVisible()
  })

  test('navigates to join screen on join click', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-join').click()
    await expect(page).toHaveURL(/\/join/)
    await expect(page.getByTestId('join-screen')).toBeVisible()
  })
})
