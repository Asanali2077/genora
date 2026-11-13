import { test, expect } from "@playwright/test";

// Smoke всего пути: лендинг → квиз → результат → пейволл → покупка → результат (премиум открыт).
test("full funnel", async ({ page }) => {
  await page.goto("/");
  await page.locator('a[href="/quiz"]').first().click();
  await expect(page).toHaveURL(/\/quiz/);

  for (let i = 0; i < 14 && !page.url().includes("/result"); i++) {
    await page.waitForTimeout(450);
    const radio = page.getByRole("radio").first();
    const box = page.getByRole("checkbox").first();
    if (await radio.count()) { await radio.click(); await page.waitForTimeout(700); continue; }
    if (await box.count()) await box.click();
    const next = page.getByRole("button", { name: /Дальше|Продолжить|Пропустить/ });
    if (await next.count()) await next.click(); else break;
  }

  await page.waitForURL(/\/result/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Доступно в Премиуме").first()).toBeVisible();

  await page.getByRole("link", { name: "Открыть всё" }).click();
  await expect(page).toHaveURL(/\/paywall/);
  await page.getByRole("button", { name: /Начать бесплатный период|Открыть мой план/ }).click();
  await page.waitForURL(/\/result/, { timeout: 10_000 });
  await expect(page.getByText("Доступно в Премиуме")).toHaveCount(0);
});

test("paywall variant b via query", async ({ page }) => {
  await page.goto("/paywall?v=b");
  await expect(page.getByRole("button", { name: "Открыть мой план" })).toBeVisible();
  await expect(page.getByRole("timer")).toHaveCount(0);
});
