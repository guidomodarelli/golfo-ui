/** Exercises a disabled ReactionButton in real engines: its styling without `:disabled`, focus and swallowed clicks. */
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

/**
 * Reads the computed styles a disabled reaction must keep.
 * @param locator - Reaction to read.
 * @returns Background, text color, cursor and box shadow.
 */
async function readLooks(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, color: style.color, cursor: style.cursor, shadow: style.boxShadow };
  });
}

/**
 * Resolves a theme color on the page, the way the button would paint it.
 * @param locator - Any element of the page.
 * @param property - CSS property that takes the color.
 * @param value - Color to resolve, such as `var(--muted)`.
 * @returns The computed color.
 */
async function resolveColor(locator: Locator, property: "backgroundColor" | "color", value: string) {
  return locator.evaluate(
    (element, [cssProperty, cssValue]) => {
      const probe = document.createElement("span");
      probe.style[cssProperty as "color"] = cssValue;
      element.append(probe);
      const resolved = getComputedStyle(probe)[cssProperty as "color"];
      probe.remove();
      return resolved;
    },
    [property, value],
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/reaction-button.html");
  await expect(page.getByRole("button", { name: "Me gusta deshabilitado 2" })).toBeVisible();
});

test("a disabled reaction looks disabled at rest and on hover", async ({ page }) => {
  const disabled = page.getByRole("button", { name: "Me gusta deshabilitado 2" });
  await expect(disabled).toHaveAttribute("aria-disabled", "true");
  await expect(disabled).toHaveAttribute("data-disabled", "");
  const muted = await resolveColor(disabled, "backgroundColor", "var(--muted)");
  const mutedText = await resolveColor(disabled, "color", "var(--muted-foreground)");
  const atRest = await readLooks(disabled);
  expect(atRest).toMatchObject({ background: muted, color: mutedText, cursor: "not-allowed" });

  await disabled.hover();
  await expect.poll(() => readLooks(disabled)).toMatchObject({ background: muted, cursor: "not-allowed" });
});

test("a disabled reaction takes the keyboard focus and ignores Enter and Space", async ({ page }) => {
  const disabled = page.getByRole("button", { name: "Me gusta deshabilitado 2" });
  await page.getByRole("button", { name: "Me gusta 0" }).focus();
  await page.keyboard.press("Tab");
  await expect(disabled).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(page.getByTestId("likes")).toHaveText("0");
  await expect(page.getByTestId("card-clicks")).toHaveText("0");
});

test("a click on a disabled reaction reaches neither its handler nor the card", async ({ page }) => {
  // Playwright waits for an `aria-disabled` control to become enabled; a person can still click it.
  await page.getByRole("button", { name: "Me gusta deshabilitado 2" }).click({ force: true });
  await expect(page.getByTestId("likes")).toHaveText("0");
  await expect(page.getByTestId("card-clicks")).toHaveText("0");

  // An enabled reaction still works and lets the click bubble, so the card counts it.
  await page.getByRole("button", { name: "Me gusta 0" }).click();
  await expect(page.getByTestId("likes")).toHaveText("1");
  await expect(page.getByTestId("card-clicks")).toHaveText("1");
});
