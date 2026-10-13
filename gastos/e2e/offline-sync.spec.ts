import { expect, test } from '@playwright/test';
import { startMockSyncServer, type MockSyncServer } from './mockSyncServer';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('Registro offline y sincronizacion al volver la conexion', () => {
  let mock: MockSyncServer;

  test.beforeEach(async () => {
    mock = await startMockSyncServer();
  });

  test.afterEach(async () => {
    await mock.close();
  });

  test('un gasto registrado sin conexion persiste y se sincroniza al reconectar', async ({ page, context }) => {
    // 1) Primera visita en linea: deja que el service worker precachee la app
    //    y configura la sincronizacion con nuestro servidor de prueba.
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Guardar gasto' })).toBeVisible();

    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
    });

    await page.locator('text=Mas').last().click();
    await page.locator('text=Ajustes').last().click();
    await page.getByLabel('URL del worker').fill(`http://localhost:${mock.port}`);
    await page.getByLabel('Clave personal').fill('clave-de-prueba-e2e');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('button', { name: 'Sincronizar ahora' })).toBeEnabled();

    // 2) Sin conexion: recargar la app (debe servirse desde cache) y registrar un gasto.
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Guardar gasto' })).toBeVisible();
    await expect(page.getByText('Sin conexion')).toBeVisible();

    const amountInput = page.getByPlaceholder('$ 0');
    await amountInput.fill('45000');
    await page.getByRole('button', { name: /Vivienda/ }).click();
    await page.getByPlaceholder('Ej: Almuerzo con el equipo').fill('Arriendo marzo (prueba e2e)');
    await page.getByRole('button', { name: 'Guardar gasto' }).click();
    await expect(page.getByRole('button', { name: 'Guardado ✓' })).toBeVisible();

    // 3) El gasto debe quedar visible en el historial mientras seguimos sin conexion.
    await page.locator('text=Historial').last().click();
    await expect(page.getByText('Arriendo marzo (prueba e2e)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Arriendo marzo.*45\.000/s })).toBeVisible();

    // 4) Volver a tener conexion: la app debe sincronizar sola y el servidor debe recibir el gasto.
    await context.setOffline(false);
    await page.locator('text=Mas').last().click();
    await page.locator('text=Ajustes').last().click();
    await page.getByRole('button', { name: 'Sincronizar ahora' }).click();

    await expect(page.getByText('Estado: synced')).toBeVisible({ timeout: 10_000 });

    expect(mock.requests.length).toBeGreaterThan(0);
    const pushedExpense = mock.requests
      .flatMap((r) => (r as { changes?: { expenses?: { note: string }[] } }).changes?.expenses ?? [])
      .find((e) => e.note === 'Arriendo marzo (prueba e2e)');
    expect(pushedExpense).toBeTruthy();

    // 5) Recargar en linea: el estado de sincronizacion persiste y el gasto sigue ahi.
    await page.reload();
    await page.locator('text=Historial').last().click();
    await expect(page.getByText('Arriendo marzo (prueba e2e)')).toBeVisible();
  });
});
