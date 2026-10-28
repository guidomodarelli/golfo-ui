/** Exercises Arc's Switch, Checkbox and RadioGroup in real engines, where layout, springs and media queries exist. */
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Time a spring gets to settle: headless CI engines can stall animation frames for seconds. */
const SETTLE_TIMEOUT_MS = 15_000;

/** Arc's switch track and the travel of its thumb, in CSS pixels. */
const SWITCH_TRACK_PX = { width: 42, height: 24 };
const SWITCH_THUMB_TRAVEL_PX = 18;

/** How far the held thumb widens toward the other side, in CSS pixels. */
const SWITCH_PRESS_STRETCH_PX = 5;

/** Arc's control height (`--control-height-md`), the minimum touch target, in CSS pixels. */
const CONTROL_HEIGHT_PX = 44;

/** Side of the checkbox square, in CSS pixels. */
const CHECKBOX_SQUARE_PX = 18;

/** How long an arrow key is held, in milliseconds, like a person's key press. */
const ARROW_KEY_HOLD_MS = 80;

/** Tolerance, in CSS pixels, for sub-pixel rounding between engines. */
const PIXEL_TOLERANCE = 0.5;

/**
 * Reads the rendered box of an element.
 * @param locator - Element to measure.
 * @returns Its bounding client rectangle.
 */
async function readBox(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  return locator.evaluate((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  });
}

/**
 * Reads the opacity an element currently renders with.
 * @param locator - Element to read.
 * @returns Its computed opacity.
 */
async function readOpacity(locator: Locator): Promise<number> {
  return locator.evaluate((element) => Number(getComputedStyle(element).opacity));
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/arc-toggles.html");
});

test("should keep the bare switch on the track's box and glide its thumb to the far end", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "Modo compacto" });
  const thumb = toggle.locator("[data-slot=switch-thumb]");
  const track = toggle.locator("[data-slot=switch-track]");
  const trackBox = await readBox(track);
  expect(trackBox.width).toBeCloseTo(SWITCH_TRACK_PX.width, 0);
  expect(trackBox.height).toBeCloseTo(SWITCH_TRACK_PX.height, 0);
  // The bare control does not grow the row that lays it out.
  expect((await readBox(toggle)).height).toBeCloseTo(SWITCH_TRACK_PX.height, 0);
  const uncheckedLeft = (await readBox(thumb)).x;

  await toggle.click();

  await expect(toggle).toBeChecked();
  await expect
    .poll(async () => (await readBox(thumb)).x - uncheckedLeft, { timeout: SETTLE_TIMEOUT_MS })
    .toBeCloseTo(SWITCH_THUMB_TRAVEL_PX, 0);
});

test("should keep the checked thumb centered and off a permanent compositing layer", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "Modo compacto" });
  const thumb = toggle.locator("[data-slot=switch-thumb]");
  const track = toggle.locator("[data-slot=switch-track]");
  await toggle.click();
  await expect(toggle).toBeChecked();
  // Settings rows center the switch next to wrapped text, so it often lands on a fractional pixel.
  await page.getByTestId("bare-switch-row").evaluate((row) => { row.style.marginTop = "0.375px"; });

  await expect
    .poll(async () => (await readBox(thumb)).x + (await readBox(thumb)).width, { timeout: SETTLE_TIMEOUT_MS })
    .toBeCloseTo((await readBox(track)).x + SWITCH_TRACK_PX.width - 3, 0);
  const trackBox = await readBox(track);
  const thumbBox = await readBox(thumb);
  expect(thumbBox.y - trackBox.y).toBeCloseTo(trackBox.y + trackBox.height - (thumbBox.y + thumbBox.height), 1);
  // With a permanent layer, iOS Safari draws the translated thumb about 1px above or below its track's center.
  expect(await thumb.evaluate((element) => getComputedStyle(element).willChange)).toBe("auto");
});

test("should give a labelled switch the full control height and toggle from its text", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "Avisos por correo" });
  expect((await readBox(toggle)).height).toBeGreaterThanOrEqual(CONTROL_HEIGHT_PX - PIXEL_TOLERANCE);

  await page.getByText("Avisos por correo").click();

  await expect(toggle).toBeChecked();
});

test("should widen the held thumb toward the other side and keep its far edge anchored", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "Modo compacto" });
  const thumb = toggle.locator("[data-slot=switch-thumb]");
  await toggle.click();
  await expect
    .poll(async () => (await readBox(thumb)).x + (await readBox(thumb)).width, { timeout: SETTLE_TIMEOUT_MS })
    .toBeCloseTo((await readBox(toggle.locator("[data-slot=switch-track]"))).x + SWITCH_TRACK_PX.width - 3, 0);
  const restingBox = await readBox(thumb);

  await toggle.hover();
  await page.mouse.down();

  // The width and the glide run on different springs, so the far edge is checked once both have settled.
  await expect
    .poll(async () => (await readBox(thumb)).width, { timeout: SETTLE_TIMEOUT_MS })
    .toBeCloseTo(restingBox.width + SWITCH_PRESS_STRETCH_PX, 0);
  await expect
    .poll(async () => {
      const heldBox = await readBox(thumb);
      return heldBox.x + heldBox.width;
    }, { timeout: SETTLE_TIMEOUT_MS })
    .toBeCloseTo(restingBox.x + restingBox.width, 0);
  await page.mouse.up();
  await expect(toggle).not.toBeChecked();
});

test("should keep the bare checkbox square in place while its hit area reaches the touch target", async ({ page }) => {
  const checkbox = page.getByRole("checkbox", { name: "Termina otro día" });
  const box = await readBox(checkbox);
  expect(box.width).toBeCloseTo(CHECKBOX_SQUARE_PX, 0);
  expect(box.height).toBeCloseTo(CHECKBOX_SQUARE_PX, 0);

  // A tap just outside the square, inside the 44px target, still toggles it.
  await page.mouse.click(box.x + box.width / 2, box.y - (CONTROL_HEIGHT_PX - CHECKBOX_SQUARE_PX) / 2 + 2);

  await expect(checkbox).toBeChecked();
});

test("should draw the check and morph the indeterminate dash into it", async ({ page }) => {
  const checkbox = page.getByRole("checkbox", { name: "Recibir novedades" });
  const mark = checkbox.locator("[data-slot=checkbox-indicator] path");
  await expect.poll(() => readOpacity(mark)).toBe(0);

  await page.getByText("Recibir novedades").click();

  await expect(checkbox).toBeChecked();
  await expect.poll(() => readOpacity(mark), { timeout: SETTLE_TIMEOUT_MS }).toBe(1);
  await expect(checkbox).toHaveAccessibleDescription("Un correo por semana como máximo.");

  const selectAll = page.getByRole("checkbox", { name: "Seleccionar todo" });
  const selectAllMark = selectAll.locator("[data-slot=checkbox-indicator] path");
  await expect(selectAll).toHaveAttribute("aria-checked", "mixed");
  const dash = await selectAllMark.getAttribute("d");
  await selectAll.click();
  await expect(selectAll).toBeChecked();
  await expect.poll(() => selectAllMark.getAttribute("d"), { timeout: SETTLE_TIMEOUT_MS }).not.toBe(dash);
});

test("should glide one highlight to the chosen row and follow the arrow keys", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Facturación" });
  const highlight = group.locator("[data-slot=radio-group-highlight]");
  const optionRow = (name: string) => group.locator("[data-slot=radio-group-option]", { hasText: name });
  /**
   * Reads how far the highlight sits from a row, both measured in the same call so layout shifts cannot skew them.
   * @param name - Visible label of the row.
   * @returns The vertical and height differences, in CSS pixels.
   */
  const distanceToRow = (name: string) =>
    Promise.all([readBox(highlight), readBox(optionRow(name))]).then(([highlightBox, rowBox]) =>
      Math.abs(highlightBox.y - rowBox.y) + Math.abs(highlightBox.height - rowBox.height),
    );
  await expect.poll(() => distanceToRow("Mensual")).toBeLessThan(PIXEL_TOLERANCE);
  expect(await readOpacity(highlight)).toBe(1);

  await page.getByText("Dos meses sin cargo.").click();

  await expect(page.getByRole("radio", { name: "Anual" })).toBeChecked();
  await expect.poll(() => distanceToRow("Anual"), { timeout: SETTLE_TIMEOUT_MS }).toBeLessThan(PIXEL_TOLERANCE);

  // Radix checks the radio that roving focus lands on only while the arrow is still held, and moves focus on a timer, so
  // the key is held as long as a person would hold it instead of an instant synthetic press.
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(ARROW_KEY_HOLD_MS);
  await page.keyboard.up("ArrowUp");

  await expect(page.getByRole("radio", { name: "Trimestral" })).toBeChecked();
  await expect.poll(() => distanceToRow("Trimestral"), { timeout: SETTLE_TIMEOUT_MS }).toBeLessThan(PIXEL_TOLERANCE);
});
test("should lay the legend above the option rows, which stretch to the fieldset width", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Facturación" });
  const [groupBox, legendBox, firstRowBox] = await Promise.all([
    readBox(group),
    readBox(group.locator("legend")),
    readBox(group.locator("[data-slot=radio-group-option]").first()),
  ]);

  expect(legendBox.y + legendBox.height).toBeLessThanOrEqual(firstRowBox.y + PIXEL_TOLERANCE);
  expect(firstRowBox.width).toBeCloseTo(groupBox.width, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("should hide the legend without reserving its space while it still names the group", async ({ page }) => {
  const section = page.getByTestId("titled-radio-group");
  const group = section.getByRole("radiogroup", { name: "Frecuencia de pago" });
  const legend = group.locator("legend");
  const [titleBox, groupBox, legendBox, firstRowBox] = await Promise.all([
    readBox(section.getByRole("heading", { name: "Frecuencia de pago" })),
    readBox(group),
    readBox(legend),
    readBox(group.locator("[data-slot=radio-group-option]").first()),
  ]);

  // The legend paints nothing and takes no room: the rows start at the fieldset's top edge, right under the title.
  expect(legendBox.width * legendBox.height).toBeLessThanOrEqual(1);
  expect(await legend.evaluate((element) => getComputedStyle(element).position)).toBe("absolute");
  expect(Math.abs(firstRowBox.y - groupBox.y)).toBeLessThan(PIXEL_TOLERANCE);
  expect(groupBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height - PIXEL_TOLERANCE);
  expect(firstRowBox.width).toBeCloseTo(groupBox.width, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await section.getByText("Quincenal").click();
  await expect(section.getByRole("radio", { name: "Quincenal" })).toBeChecked();
});

test("should place every mark and the highlight at once when motion is reduced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const highlight = page.getByRole("radiogroup", { name: "Facturación" }).locator("[data-slot=radio-group-highlight]");

  await page.getByText("Dos meses sin cargo.").click();
  await page.getByText("Recibir novedades").click();

  // No spring runs: the very next frame already shows the final geometry.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  const highlightOffset = await highlight.evaluate((element) => {
    const row = [...document.querySelectorAll("[data-slot=radio-group-option]")].find((option) => option.textContent?.includes("Anual"))!;
    return element.getBoundingClientRect().top - row.getBoundingClientRect().top;
  });
  expect(highlightOffset).toBeCloseTo(0, 0);
  expect(await readOpacity(page.getByRole("checkbox", { name: "Recibir novedades" }).locator("[data-slot=checkbox-indicator] path"))).toBe(1);
});
