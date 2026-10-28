/** Verifies the progress ring and the reaction toggle through their public contracts. */
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProgressRing, ReactionButton } from "@golfo/ui";

describe("ProgressRing", () => {
  it("stays decorative without a label", () => {
    const { container } = render(<ProgressRing fraction={0.5} />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("exposes the clamped value when labelled and hides the arc when empty", () => {
    const { rerender, container } = render(<ProgressRing fraction={1.4} label="Cuotas pagadas" />);

    expect(screen.getByRole("progressbar", { name: "Cuotas pagadas" })).toHaveAttribute("aria-valuenow", "100");

    rerender(<ProgressRing fraction={0} label="Cuotas pagadas" />);

    expect(screen.getByRole("progressbar", { name: "Cuotas pagadas" })).toHaveAttribute("aria-valuenow", "0");
    expect(container.querySelector('[data-slot="progress-ring-indicator"]')).not.toBeInTheDocument();
  });
});

/** Long enough for several animation frames, well before the kick's spring settles on its own. */
const KICK_SAMPLE_DELAY_MS = 60;

/** Emulates a live `prefers-reduced-motion` preference that the viewer can change mid-animation. */
function emulateReducedMotionPreference() {
  let matches = false;
  const listeners = new Set<() => void>();
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    get matches() {
      return matches;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }) as unknown as MediaQueryList);
  return {
    set(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) => listener());
    },
  };
}

describe("ReactionButton", () => {
  afterEach(() => vi.restoreAllMocks());

  /** Owns the optimistic reaction state like a consumer would. */
  function ReactionHarness() {
    const [isActive, setIsActive] = useState(false);
    const [count, setCount] = useState(2);

    return (
      <ReactionButton
        ariaLabel={`Me gusta ${count}`}
        isActive={isActive}
        count={count}
        onClick={() => {
          setIsActive(!isActive);
          setCount(isActive ? count - 1 : count + 1);
        }}
      />
    );
  }

  it("exposes the state as a pressed toggle and settles on the new count", async () => {
    const user = userEvent.setup();
    render(<ReactionHarness />);

    const button = screen.getByRole("button", { name: "Me gusta 2" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);

    const likedButton = screen.getByRole("button", { name: "Me gusta 3" });
    expect(likedButton).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(likedButton).toHaveTextContent(/^3$/));
  });

  it("fills the active icon with the requested color", () => {
    render(<ReactionButton ariaLabel="Me gusta 1" isActive count={1} activeColor="var(--primary)" onClick={() => {}} />);

    expect(screen.getByRole("button", { name: "Me gusta 1" }).style.getPropertyValue("--golfo-reaction-active-color")).toBe("var(--primary)");
  });

  it("stops a running kick and rests the icon when reduced motion turns on", async () => {
    const reducedMotion = emulateReducedMotionPreference();
    const { rerender } = render(<ReactionButton ariaLabel="Me gusta 1" isActive={false} count={1} onClick={() => {}} />);
    rerender(<ReactionButton ariaLabel="Me gusta 2" isActive count={2} onClick={() => {}} />);
    const icon = screen.getByRole("button", { name: "Me gusta 2" }).querySelector("svg")!.parentElement!;
    await waitFor(() => expect(icon.style.transform).toMatch(/scale|rotate/));

    act(() => reducedMotion.set(true));
    await new Promise((resolve) => setTimeout(resolve, KICK_SAMPLE_DELAY_MS));

    expect(icon.style.transform).toBe("none");
  });

  it("does not react while disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ReactionButton ariaLabel="Me gusta 1" isActive={false} count={1} isDisabled onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Me gusta 1" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps a disabled reaction focusable and swallows its clicks, so a clickable parent ignores them too", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onParentClick = vi.fn();
    render(
      // The parent stands for a card that opens on click, like a message in a feed.
      <div role="presentation" onClick={onParentClick}>
        <ReactionButton ariaLabel="Me gusta 2" count={2} isActive={false} isDisabled onClick={onClick} />
      </div>,
    );
    const button = screen.getByRole("button", { name: "Me gusta 2" });

    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.click(button);
    await user.keyboard("{Enter}");
    expect(onClick).not.toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
