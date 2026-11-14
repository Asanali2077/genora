import { expect, test } from "@playwright/test";

// The whole paid path against the real database: landing → onboarding → reveal → pricing → dashboard → claims.
test("a family goes from the landing page to a paid plan with a logged receipt", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("overpaying for childcare");
  await expect(page.getByText("a year back")).toBeVisible(); // live engine on the landing page

  await page.getByRole("button", { name: "Get my full plan" }).first().click();
  await expect(page).toHaveURL(/\/start/);
  for (let step = 0; step < 6; step++) {
    if (step === 3) await page.fill("#care-daycare", "20000");
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "See my plan" }).click();

  await expect(page).toHaveURL(/\/reveal/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Now vs. the best plan" })).toBeVisible();
  await page.getByText("Show the math").click();
  await expect(page.getByText("Found money per year")).toBeVisible();

  await page.getByRole("button", { name: "Unlock the full plan" }).click();
  await expect(page).toHaveURL(/\/pricing/);
  await page.getByRole("button", { name: "Start annual plan" }).click();

  await expect(page).toHaveURL(/\/app$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "FSA claims" })).toBeVisible();

  await page.goto("/app/claims");
  await page.getByRole("button", { name: "Enter by hand" }).click();
  await page.getByLabel("Provider", { exact: true }).fill("Little Oaks Early Learning");
  await page.fill("#r-amount", "1640");
  await page.getByRole("button", { name: "Save receipt" }).click();
  await expect(page.getByText("Little Oaks Early Learning").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Form 2441 summary" })).toBeVisible();
});
