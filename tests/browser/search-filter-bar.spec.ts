/** Measures SearchFilterBar's wrapping row and its dialog in real engines, where flex layout and focus exist. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Widths, in CSS pixels, between the phone and desktop projects where the row must still wrap cleanly. */
const INTERMEDIATE_WIDTHS = [300, 320, 600, 700, 900] as const;

/** Rounding slack, in CSS pixels, when comparing edges and rows. */
const LAYOUT_TOLERANCE_PX = 1;

/**
 * Reads the layout box of an element, failing clearly when it is not rendered.
 * @param locator - Element to measure.
 * @returns Its bounding box in CSS pixels.
 */
async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, "the element must be laid out").not.toBeNull();
  return box!;
}

/**
 * @param page - Page under test.
 * @returns Whether the document scrolls sideways.
 */
async function scrollsSideways(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

/**
 * Checks that every child of a bar stays inside it, so nothing is cut off or overflows the row.
 * @param bar - Root of the bar.
 * @returns Nothing; fails on the first item outside the bar.
 */
async function expectItemsInside(bar: Locator) {
  const outer = await boxOf(bar);
  for (const item of await bar.locator("[data-slot=search-filter-bar-search], [data-slot=search-filter-bar-trigger], [data-slot=search-filter-bar-filter]").all()) {
    const box = await boxOf(item);
    expect(box.x).toBeGreaterThanOrEqual(outer.x - LAYOUT_TOLERANCE_PX);
    expect(box.x + box.width).toBeLessThanOrEqual(outer.x + outer.width + LAYOUT_TOLERANCE_PX);
  }
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/search-filter-bar.html");
});

/** Default maximum width of the search, in CSS pixels (24rem). */
const SEARCH_MAX_WIDTH_PX = 384;

/** Width, in CSS pixels, below which the search stops shrinking and the button moves under it (12rem). */
const SEARCH_MIN_WIDTH_PX = 192;

/**
 * Measures the parts of one bar after resizing the page.
 * @param page - Page under test.
 * @param testId - Section that holds the bar.
 * @param width - Viewport width in CSS pixels.
 * @returns The boxes of the bar, its search, its button and its chips.
 */
async function measure(page: Page, testId: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  const bar = page.getByTestId(testId).locator("[data-slot=search-filter-bar]");
  const chips = await Promise.all((await bar.locator("[data-slot=search-filter-bar-filter]").all()).map(boxOf));
  return { bar: await boxOf(bar), search: await boxOf(bar.locator("[data-slot=search-filter-bar-search]")), trigger: await boxOf(bar.locator("[data-slot=search-filter-bar-trigger]")), chips };
}

/**
 * @param first - One box.
 * @param second - Another box.
 * @returns Whether both sit on the same row, comparing their vertical centers.
 */
function sameRow(first: { y: number; height: number }, second: { y: number; height: number }) {
  return Math.abs(first.y + first.height / 2 - (second.y + second.height / 2)) <= LAYOUT_TOLERANCE_PX;
}

test("should keep everything on one row, with the search at its maximum width, while the chips fit", async ({ page }) => {
  const { search, trigger, chips } = await measure(page, "few", 1280);
  expect(search.width).toBeCloseTo(SEARCH_MAX_WIDTH_PX, 0);
  expect(sameRow(search, trigger)).toBe(true);
  for (const chip of chips) expect(sameRow(search, chip)).toBe(true);
});

test("should move all the chips together under the search before the search shrinks", async ({ page }) => {
  const { search, trigger, chips } = await measure(page, "few", 700);
  // The search keeps its maximum width and the button stays next to it.
  expect(search.width).toBeCloseTo(SEARCH_MAX_WIDTH_PX, 0);
  expect(sameRow(search, trigger)).toBe(true);
  // Both chips left the first row at once and share the next one.
  for (const chip of chips) expect(chip.y).toBeGreaterThanOrEqual(search.y + search.height);
  expect(sameRow(chips[0], chips[1])).toBe(true);
});

test("should wrap the chips among themselves under the search", async ({ page }) => {
  const { search, chips } = await measure(page, "many", 1280);
  for (const chip of chips) expect(chip.y).toBeGreaterThanOrEqual(search.y + search.height);
  expect(new Set(chips.map((chip) => Math.round(chip.y))).size).toBeGreaterThan(1);
});

test("should shrink the search before the button leaves its row", async ({ page }) => {
  const { search, trigger } = await measure(page, "many", 390);
  expect(search.width).toBeLessThan(SEARCH_MAX_WIDTH_PX);
  expect(search.width).toBeGreaterThanOrEqual(SEARCH_MIN_WIDTH_PX);
  expect(sameRow(search, trigger)).toBe(true);
});

test("should move the button under the search last, when the search cannot shrink further", async ({ page }) => {
  const { bar, search, trigger, chips } = await measure(page, "many", 300);
  expect(trigger.y).toBeGreaterThanOrEqual(search.y + search.height);
  expect(search.width).toBeCloseTo(bar.width, 0);
  for (const chip of chips) expect(chip.y).toBeGreaterThanOrEqual(trigger.y + trigger.height);
});

test("should never grow the search past its maximum width, also with no filter applied", async ({ page }) => {
  const { search, trigger } = await measure(page, "none", 1440);
  await expect(page.getByTestId("none").getByRole("list")).toHaveCount(0);
  expect(search.width).toBeCloseTo(SEARCH_MAX_WIDTH_PX, 0);
  expect(sameRow(search, trigger)).toBe(true);
});

test("should take another maximum width from the app", async ({ page }) => {
  await page.getByTestId("none").locator("[data-slot=search-filter-bar]").evaluate((element) => (element as HTMLElement).style.setProperty("--search-filter-bar-search-max", "16rem"));
  const { search } = await measure(page, "none", 1280);
  expect(search.width).toBeCloseTo(256, 0);
});

test("should truncate a chip value longer than the row instead of overflowing it", async ({ page }) => {
  const bar = page.getByTestId("many").locator("[data-slot=search-filter-bar]");
  const chip = bar.locator("[data-slot=search-filter-bar-filter]").filter({ hasText: "Nota" });
  const text = chip.locator("span").first();
  expect((await boxOf(chip)).width).toBeLessThanOrEqual((await boxOf(bar)).width + LAYOUT_TOLERANCE_PX);
  await expect(text).toHaveCSS("text-overflow", "ellipsis");
  // The remove button stays visible and pressable next to the cut value.
  await expect(chip.getByRole("button", { name: /^Quitar Nota/ })).toBeVisible();
});

test("should wrap cleanly at intermediate widths without sideways scroll", async ({ page }) => {
  for (const width of INTERMEDIATE_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const testId of ["many", "few", "none"]) await expectItemsInside(page.getByTestId(testId).locator("[data-slot=search-filter-bar]"));
    expect(await scrollsSideways(page), `no sideways scroll at ${width}px`).toBe(false);
  }
});

test("should open the app fields above the page without moving the bar and return the focus when it closes", async ({ page }) => {
  const bar = page.getByTestId("few").locator("[data-slot=search-filter-bar]");
  const before = await boxOf(bar);
  await bar.getByRole("button", { name: /^Filtros/ }).click();
  const dialog = page.getByRole("dialog", { name: "Filtros" });
  await expect(dialog).toHaveCSS("transform", "none");
  await expect(dialog.getByRole("combobox", { name: "Estado" })).toBeVisible();
  expect(await boxOf(bar)).toEqual(before);
  // The panel is on top of the bar it opened from.
  const center = await boxOf(dialog);
  expect(await page.evaluate(({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest("[role=dialog]")), { x: center.x + center.width / 2, y: center.y + center.height / 2 })).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(bar.getByRole("button", { name: /^Filtros/ })).toBeFocused();
  expect(await scrollsSideways(page)).toBe(false);
});

test("should lay the dialog fields in two columns on a wide panel and in one on a phone", async ({ page, isMobile }, testInfo) => {
  const phone = isMobile || (page.viewportSize()?.width ?? 0) < 640;
  await page.getByTestId("few").getByRole("button", { name: /^Filtros/ }).click();
  const dialog = page.getByRole("dialog", { name: "Filtros" });
  await expect(dialog).toHaveCSS("transform", "none");
  const [panel, status, from, until] = [await boxOf(dialog), await boxOf(dialog.getByRole("combobox", { name: "Estado" })), await boxOf(dialog.getByLabel("Desde")), await boxOf(dialog.getByLabel("Hasta"))];
  expect(panel.width, testInfo.project.name).toBeLessThanOrEqual(page.viewportSize()!.width);
  if (phone) {
    // One column: every field below the previous one.
    expect(from.y).toBeGreaterThanOrEqual(status.y + status.height);
    expect(until.y).toBeGreaterThanOrEqual(from.y + from.height);
  } else {
    // Wider than Dialog's 440px panel, two equal columns and never a third.
    expect(panel.width).toBeGreaterThan(440);
    expect(panel.width).toBeLessThanOrEqual(640);
    expect(sameRow(status, from)).toBe(true);
    expect(Math.abs(status.width - from.width)).toBeLessThanOrEqual(LAYOUT_TOLERANCE_PX);
    expect(until.y).toBeGreaterThanOrEqual(status.y + status.height);
    expect(until.x).toBeCloseTo(status.x, 0);
  }
});

test("should apply the dialog and show the new chip with the count", async ({ page }) => {
  const bar = page.getByTestId("none").locator("[data-slot=search-filter-bar]");
  await bar.getByRole("button", { name: "Filtros" }).click();
  const dialog = page.getByRole("dialog", { name: "Filtros" });
  await dialog.getByRole("combobox", { name: "Estado" }).click();
  await page.getByRole("option", { name: "Aprobadas" }).click();
  await dialog.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(bar.getByRole("button", { name: "Filtros (1 aplicado)" })).toBeFocused();
  await expect(bar.getByRole("listitem")).toHaveText("Estado: Aprobadas");
});

test("should move the focus along the chips as they are removed with the keyboard", async ({ page }) => {
  const bar = page.getByTestId("few").locator("[data-slot=search-filter-bar]");
  await bar.getByRole("button", { name: "Quitar Estado: Aprobadas" }).focus();
  await page.keyboard.press("Enter");
  await expect(bar.getByRole("button", { name: "Quitar Origen: Solicitud común" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(bar.getByRole("button", { name: "Filtros" })).toBeFocused();
  await expect(bar.getByRole("list")).toHaveCount(0);
});

test("should paint the chips with the theme tokens in light and dark", async ({ page }) => {
  const chip = page.getByTestId("few").locator("[data-slot=search-filter-bar-filter]").first();
  const light = await chip.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect.poll(() => chip.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(light);
  expect(light).not.toBe("rgba(0, 0, 0, 0)");
});
