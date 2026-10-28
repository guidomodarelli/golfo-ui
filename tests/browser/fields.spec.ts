/** Exercises the labelled Input and Textarea fields in real engines, where layout, ResizeObserver and media queries exist. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Frames sampled after a message row mounts; enough to see an opening spring start. */
const SAMPLED_FRAMES = 6;

/** Time a row gets to settle: headless CI engines can stall animation frames for seconds. */
const ROW_SETTLE_TIMEOUT_MS = 15_000;

/** Selector of the clipped slot that animates the height of a message row. */
const messageSlot = (copySlot: string) => `span:has(> [data-slot="${copySlot}"])`;

/**
 * Reads the rendered height of an element.
 * @param locator - Element to measure.
 * @returns Its height in CSS pixels.
 */
async function readHeight(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getBoundingClientRect().height);
}

/** One animation frame of a message row. */
type RowSample = { slotHeight: number; copyHeight: number; wordOpacity: number };

/**
 * Clicks a button and samples, on each following animation frame, the height of a message slot and the opacity of
 * one of its words.
 * @param page - Page that holds the field.
 * @param buttonName - Accessible name of the button that changes the message.
 * @param copySlot - `data-slot` of the message copy to sample.
 * @param word - Visible word whose opacity is sampled.
 * @returns One sample per frame.
 */
async function clickAndSampleRow(page: Page, buttonName: string, copySlot: string, word: string): Promise<RowSample[]> {
  const button = page.getByRole("button", { name: buttonName, exact: true });
  return button.evaluate(
    async (element, { frames, slotSelector, copySelector, sampledWord }) => {
      (element as HTMLButtonElement).click();
      const samples: RowSample[] = [];
      for (let frame = 0; frame < frames; frame++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const slot = document.querySelector(slotSelector);
        const copy = document.querySelector(copySelector);
        const wordElement = [...(copy?.querySelectorAll('[aria-hidden="true"] > span') ?? [])].find(
          (candidate) => candidate.textContent?.trim() === sampledWord,
        );
        samples.push({
          slotHeight: slot?.getBoundingClientRect().height ?? -1,
          copyHeight: copy?.getBoundingClientRect().height ?? -1,
          wordOpacity: wordElement ? Number(getComputedStyle(wordElement).opacity) : -1,
        });
      }
      return samples;
    },
    { frames: SAMPLED_FRAMES, slotSelector: messageSlot(copySlot), copySelector: `[data-slot="${copySlot}"]`, sampledWord: word },
  );
}

/**
 * Clicks a button and samples, frame by frame, the vertical offset of the digit entering the units column of the count
 * in a field description: positive while it rolls up from below, negative while it rolls down from above.
 * @param page - Page that holds the field.
 * @param buttonName - Accessible name of the button that changes the count.
 * @param descriptionText - Text that identifies the description holding the count.
 * @param enteringDigit - Digit that enters the units column.
 * @returns One offset per frame in which the entering digit is mounted.
 */
async function clickAndSampleEnteringDigit(page: Page, buttonName: string, descriptionText: string, enteringDigit: string): Promise<number[]> {
  return page.getByRole("button", { name: buttonName, exact: true }).evaluate(
    async (button, { frames, text, digit }) => {
      (button as HTMLButtonElement).click();
      const samples: number[] = [];
      for (let frame = 0; frame < frames; frame++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const description = [...document.querySelectorAll('[data-slot="field-description"]')].find((element) => element.textContent?.includes(text));
        const units = [...(description?.querySelectorAll('[aria-hidden="true"] .tabular-nums') ?? [])].at(-1);
        const entering = [...(units?.children ?? [])].find((candidate) => candidate.textContent === digit);
        if (entering) samples.push(new DOMMatrixReadOnly(getComputedStyle(entering).transform).f);
      }
      return samples;
    },
    { frames: SAMPLED_FRAMES, text: descriptionText, digit: enteringDigit },
  );
}

/**
 * Waits until a message slot is exactly as tall as its copy.
 * @param slot - The clipped slot.
 * @param copy - The copy it holds.
 */
async function expectSlotToFitCopy(slot: Locator, copy: Locator): Promise<void> {
  await expect
    .poll(async () => Math.abs((await readHeight(slot)) - (await readHeight(copy))), { timeout: ROW_SETTLE_TIMEOUT_MS })
    .toBeLessThan(1);
}

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/fields.html");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
  });

  test("should keep date and time fields inside their column without the native appearance", async ({ page }) => {
    const column = page.getByTestId("date-time-fields");
    const columnBox = (await column.boundingBox())!;
    for (const name of ["Desde", "Hasta", "Fecha", "Hora"]) {
      const control = page.getByLabel(name, { exact: true });
      const box = (await control.boundingBox())!;
      expect(box.x + box.width, name).toBeLessThanOrEqual(columnBox.x + columnBox.width + 0.5);
      // iOS Safari keeps the native width of a date control, ignoring `width: 100%`, unless its appearance is reset.
      expect(await control.evaluate((element) => getComputedStyle(element).appearance), name).toBe("none");
    }
    // An empty date field keeps the height of one with a value.
    const empty = (await page.getByLabel("Desde", { exact: true }).boundingBox())!;
    const filled = (await page.getByLabel("Hasta", { exact: true }).boundingBox())!;
    expect(empty.height).toBeCloseTo(filled.height, 0);
  });

  test("should fill a horizontal flex row like the bare control", async ({ page }) => {
    const row = page.getByTestId("flex-row");
    const control = page.getByRole("textbox", { name: "Ciudad" });

    const rowWidth = await row.evaluate((element) => element.getBoundingClientRect().width);

    await expect.poll(() => control.evaluate((element) => element.getBoundingClientRect().width)).toBeCloseTo(rowWidth, 0);
  });

  test("should open the error row from a collapsed height and settle on its copy", async ({ page }) => {
    const samples = await clickAndSampleRow(page, "Validar correo", "field-error", "correo");
    const error = page.locator('[data-slot="field-error"]');

    expect(samples[0]!.slotHeight).toBeLessThan(samples[0]!.copyHeight);
    await expectSlotToFitCopy(page.locator(messageSlot("field-error")), error);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Correo" })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("textbox", { name: "Correo" })).toHaveAccessibleDescription(/Ingresá un correo válido$/);
  });

  test("should grow the helper row when a longer message wraps onto more lines", async ({ page }) => {
    const description = page.locator('[data-slot="field-description"]').filter({ hasText: "Solo para recibos." });
    const slot = page.locator(messageSlot("field-description")).filter({ has: description });
    await expectSlotToFitCopy(slot, description);
    const oneLineHeight = await readHeight(slot);

    await page.getByRole("button", { name: "Mostrar ayuda larga", exact: true }).click();

    const longDescription = page.locator('[data-slot="field-description"]').filter({ hasText: "nunca para publicidad" });
    const longSlot = page.locator(messageSlot("field-description")).filter({ has: longDescription });
    await expect.poll(() => readHeight(longDescription)).toBeGreaterThan(oneLineHeight);
    await expectSlotToFitCopy(longSlot, longDescription);
  });

  test("should roll only the digits of the count that changed", async ({ page }) => {
    const bio = page.getByRole("textbox", { name: "Biografía" });
    const field = page.locator('[data-slot="field"]').filter({ has: bio });
    const columns = field.locator('[data-slot="field-description"] [aria-hidden="true"] .tabular-nums');
    await expect(columns).toHaveCount(3);
    await columns.nth(0).evaluate((column) => {
      (column.firstElementChild as HTMLElement).dataset.marked = "hundreds";
    });

    await bio.pressSequentially("a");

    await expect(bio).toHaveAccessibleDescription("Quedan 119 caracteres");
    await expect(columns.nth(0).locator('[data-marked="hundreds"]')).toHaveText("1");
    await expect.poll(() => columns.evaluateAll((items) => items.map((item) => item.lastElementChild?.textContent).join(""))).toBe("119");
  });

  test("should roll a Spanish count up when it grows past a thousand", async ({ page }) => {
    const offsets = await clickAndSampleEnteringDigit(page, "Sumar miembro", "miembros", "0");

    expect(offsets.length).toBeGreaterThan(0);
    expect(Math.max(...offsets)).toBeGreaterThan(0);
    expect(Math.min(...offsets)).toBeGreaterThanOrEqual(0);
    await expect(page.getByRole("textbox", { name: "Cupo" })).toHaveAccessibleDescription("1.000 miembros");
  });

  test("should roll a countdown down when its seconds go from 0:10 to 0:09", async ({ page }) => {
    const offsets = await clickAndSampleEnteringDigit(page, "Restar segundo", "Vence", "9");

    expect(offsets.length).toBeGreaterThan(0);
    expect(Math.min(...offsets)).toBeLessThan(0);
    expect(Math.max(...offsets)).toBeLessThanOrEqual(0);
    await expect(page.getByRole("textbox", { name: "Código" })).toHaveAccessibleDescription("Vence en 0:09");
  });

  test("should keep the words after an inserted word mounted", async ({ page }) => {
    const control = page.getByRole("textbox", { name: "Aviso" });
    const field = page.locator('[data-slot="field"]').filter({ has: control });
    const words = field.locator('[data-slot="field-description"] [aria-hidden="true"] > span');
    await words.filter({ hasText: "disponibles" }).evaluate((word) => {
      (word as HTMLElement).dataset.marked = "kept";
    });

    await page.getByRole("button", { name: "Anteponer palabra", exact: true }).click();

    await expect(control).toHaveAccessibleDescription("Solo 10 caracteres disponibles");
    await expect(words.filter({ hasText: "disponibles" })).toHaveAttribute("data-marked", "kept");
    await expect(words.filter({ hasText: "caracteres" })).toHaveCount(1);
  });
});

test.describe("with reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/fields.html");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
  });

  test("should show the error row at full height and reword it without fading", async ({ page }) => {
    const opened = await clickAndSampleRow(page, "Validar correo", "field-error", "correo");

    expect(Math.abs(opened[0]!.slotHeight - opened[0]!.copyHeight)).toBeLessThan(1);

    const reworded = await clickAndSampleRow(page, "Cambiar error", "field-error", "registrado");

    expect(reworded[0]!.wordOpacity).toBe(1);
    await expect(page.getByRole("textbox", { name: "Correo" })).toHaveAccessibleDescription(/Ese correo ya está registrado$/);
  });
});

/**
 * Reads the color that shows behind an element: its own background, or the first opaque one among its ancestors.
 * @param locator - Element whose visible background is read.
 * @returns The computed background color that paints behind it.
 */
async function readVisibleBackground(locator: Locator): Promise<string> {
  return locator.evaluate((element) => {
    for (let current: Element | null = element; current; current = current.parentElement) {
      const color = getComputedStyle(current).backgroundColor;
      if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") return color;
    }
    return getComputedStyle(document.documentElement).backgroundColor;
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`should show the surface that hosts the rich link editor in the ${theme} theme`, async ({ page }) => {
    await page.goto("/fields.html");
    await page.evaluate((appliedTheme) => {
      document.documentElement.dataset.theme = appliedTheme;
      document.documentElement.classList.toggle("dark", appliedTheme === "dark");
    }, theme);

    const surface = page.getByTestId("raised-surface");
    const editor = surface.getByRole("textbox", { name: "Mensaje" });

    expect(await readVisibleBackground(editor)).toBe(await readVisibleBackground(surface));
  });
}
