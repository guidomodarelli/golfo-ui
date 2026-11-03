"use client";

/**
 * A collection search with its filters: a free text search applied with Enter, a "Filtros" button that opens a dialog
 * with the fields the app passes as children, and the applied filters as chips that can be removed one by one.
 *
 * The bar adapts to any width with flex wrapping alone, without breakpoints. It is one wrapping row of two groups: the
 * search with its button, and the chips. As the row narrows, the chips first move together to the next line and wrap
 * among themselves; then the search shrinks from its maximum width (`--search-filter-bar-search-max`, 24rem by
 * default) to 12rem; only then the button moves under the search.
 * Built from @golfo/ui's Input, Button, Badge and Dialog; the app owns the fields, their values and what applying does.
 */
import { useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { Button } from "./button.js";
import { Dialog, DialogContent, DialogTrigger } from "./dialog.js";
import { Input } from "./input.js";

/** One applied filter, shown as a chip next to the search. */
export interface SearchFilterBarFilter {
  /** Stable identity, usually the field name; `onRemoveFilter` receives it. */
  id: string;
  /** Field name, such as "Estado". */
  label: string;
  /** Applied value in words, such as "Todos los estados". */
  value: string;
}

/** Copy of the bar. Spanish by default; override any entry through `labels`. */
export interface SearchFilterBarLabels {
  /** Accessible name of the search field and of its search landmark. */
  search: string;
  /** Text of the button that opens the dialog. */
  filters: string;
  /** Screen reader suffix of the button with the number of applied filters. */
  appliedCount: (count: number) => string;
  /** Title of the dialog. */
  dialogTitle: string;
  /** Accessible name of the list of chips. */
  appliedFilters: string;
  /** Accessible name of the remove button of one chip. */
  removeFilter: (filter: SearchFilterBarFilter) => string;
}

/** Spanish copy used when `labels` leaves an entry out. */
export const SEARCH_FILTER_BAR_DEFAULT_LABELS: SearchFilterBarLabels = {
  search: "Buscar",
  filters: "Filtros",
  appliedCount: (count) => (count === 1 ? "(1 aplicado)" : `(${count} aplicados)`),
  dialogTitle: "Filtros",
  appliedFilters: "Filtros aplicados",
  removeFilter: (filter) => `Quitar ${filter.label}: ${filter.value}`,
};

/**
 * Widens Dialog's 440px panel to 40rem, the width where two 13rem columns of fields fit with their padding. It overrides
 * the primitive's own `sm:` maximum, so phones keep the full-width panel.
 */
const DIALOG_PANEL_CLASS_NAME = "sm:max-w-[40rem]";

/**
 * Up to two equal columns, each at least 13rem wide and at least half the row, so a third never fits and a narrow panel
 * falls back to one column without a breakpoint.
 */
const FIELDS_CLASS_NAME = "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,max(13rem,calc((100%_-_1rem)/2))),1fr))]";

/** Props of `SearchFilterBarFields`: every attribute of a `div`. */
export type SearchFilterBarFieldsProps = ComponentProps<"div">;

/**
 * Lays out the fields of the filter dialog in two columns when the panel is wide and in one on phones.
 * @param props - Native `div` attributes; `className` adds to the grid.
 * @returns The grid of fields.
 */
export function SearchFilterBarFields({ className, ...props }: SearchFilterBarFieldsProps) {
  return <div data-slot="search-filter-bar-fields" className={cn(FIELDS_CLASS_NAME, className)} {...props} />;
}

/** Native attributes of the search input; the bar owns its type, value, label and change handler. */
type SearchInputProps = Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange" | "disabled" | "children">;

export interface SearchFilterBarProps {
  /** Current text of the search, controlled by the app. */
  searchValue: string;
  /** Receives each edit of the search; editing alone does not apply it. */
  onSearchValueChange: (value: string) => void;
  /** Applies the search, when the person presses Enter in it. */
  onSearchSubmit: () => void;
  /** Hint inside the empty search. */
  searchPlaceholder?: string;
  /** Extra native attributes of the search input, such as `maxLength`, `name` or `id`. */
  searchInputProps?: SearchInputProps;
  /**
   * Fields of the dialog. Put them in a `<form>` whose submit button lives in `dialogFooter` with `form={id}`, and lay
   * them out with `SearchFilterBarFields` to get two columns on wide screens and one on phones.
   */
  children?: ReactNode;
  /** Supporting line under the dialog title. */
  dialogDescription?: ReactNode;
  /** Action row of the dialog, usually its apply and reset buttons. */
  dialogFooter?: ReactNode;
  /** Classes of the dialog panel, which is up to 40rem wide so two columns of fields fit. */
  dialogClassName?: string;
  /** Whether the dialog is open, to control it; leave it out for an uncontrolled dialog. */
  open?: boolean;
  /** Initial open state of an uncontrolled dialog. */
  defaultOpen?: boolean;
  /** Called when the person opens or dismisses the dialog (button, Escape, outside press or close button). */
  onOpenChange?: (open: boolean) => void;
  /** Applied filters, shown as chips after the button; the button shows how many there are. */
  appliedFilters?: readonly SearchFilterBarFilter[];
  /** Removes one applied filter. Without it the chips only show what applies. */
  onRemoveFilter?: (id: string) => void;
  /** Disables the search, the button and the chip remove buttons, for example while a read is running. */
  disabled?: boolean;
  /** Partial copy override. */
  labels?: Partial<SearchFilterBarLabels>;
  /** Classes of the root row. */
  className?: string;
}

/**
 * Search, filter dialog and applied filter chips in one wrapping row.
 * @param props - Search value and callbacks, dialog fields and actions, open state, applied filters, copy and classes.
 * @returns The bar and its dialog.
 */
export function SearchFilterBar({
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
  searchPlaceholder,
  searchInputProps,
  children,
  dialogDescription,
  dialogFooter,
  dialogClassName,
  open,
  defaultOpen = false,
  onOpenChange,
  appliedFilters = [],
  onRemoveFilter,
  disabled = false,
  labels,
  className,
}: SearchFilterBarProps) {
  const copy = { ...SEARCH_FILTER_BAR_DEFAULT_LABELS, ...labels };
  const generatedId = useId();
  const searchId = searchInputProps?.id ?? `${generatedId}-search`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const dialogOpen = open ?? uncontrolledOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const count = appliedFilters.length;

  /** @param next - Open state Radix asks for. @returns Nothing after updating the uncontrolled state and telling the app. */
  const changeOpen = (next: boolean) => {
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  /** @param event - Search submission. @returns Nothing after asking the app to apply the search once. */
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disabled) onSearchSubmit();
  };

  /**
   * Removes a chip and moves the focus to the next chip, the previous one or the button, so it never falls to the page.
   * @param index - Position of the removed chip.
   * @returns Nothing after asking the app to remove the filter.
   */
  const removeFilter = (index: number) => {
    const neighbor = appliedFilters[index + 1] ?? appliedFilters[index - 1];
    onRemoveFilter?.(appliedFilters[index].id);
    const next = neighbor ? removeButtons.current.get(neighbor.id) : undefined;
    if (next) next.focus();
    else triggerRef.current?.focus();
  };

  return (
    <div data-slot="search-filter-bar" className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      {/* The group asks for the search at its maximum width, so the chips leave the row before the search shrinks;
          inside it the search wraps from 12rem, so the button leaves the row last. */}
      <div data-slot="search-filter-bar-controls" className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
        <form
          role="search"
          aria-label={copy.search}
          data-slot="search-filter-bar-search"
          className="flex w-[var(--search-filter-bar-search-max,24rem)] min-w-0 max-w-[min(100%,var(--search-filter-bar-search-max,24rem))] grow basis-48"
          onSubmit={submitSearch}
        >
          <label htmlFor={searchId} className="sr-only">
            {copy.search}
          </label>
          <Input
            enterKeyHint="search"
            placeholder={searchPlaceholder}
            {...searchInputProps}
            id={searchId}
            className={cn("w-full min-w-0", searchInputProps?.className)}
            type="search"
            value={searchValue}
            disabled={disabled}
            onChange={(event) => onSearchValueChange(event.target.value)}
          />
        </form>
        <Dialog open={dialogOpen} onOpenChange={changeOpen}>
          <DialogTrigger asChild>
            <Button ref={triggerRef} type="button" variant="secondary" disabled={disabled} data-slot="search-filter-bar-trigger">
              <SlidersHorizontal aria-hidden="true" />
              {copy.filters}
              {count > 0 && (
                <>
                  <Badge size="sm" aria-hidden="true">
                    {count}
                  </Badge>{" "}
                  <span className="sr-only">{copy.appliedCount(count)}</span>
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent title={copy.dialogTitle} description={dialogDescription} footer={dialogFooter} className={cn(DIALOG_PANEL_CLASS_NAME, dialogClassName)}>
            {children}
          </DialogContent>
        </Dialog>
      </div>
      {count > 0 && (
        <ul aria-label={copy.appliedFilters} data-slot="search-filter-bar-filters" className="m-0 flex min-w-0 max-w-full list-none flex-wrap items-center gap-2 p-0">
          {appliedFilters.map((filter, index) => (
            <li
              key={filter.id}
              data-slot="search-filter-bar-filter"
              className="inline-flex min-w-0 max-w-full items-center overflow-hidden rounded-full border border-border bg-muted text-xs leading-none"
            >
              <span className={cn("min-w-0 truncate py-[0.45rem] pl-[0.7rem]", onRemoveFilter ? "pr-1" : "pr-[0.7rem]")}>
                <span className="font-medium">{filter.label}:</span> {filter.value}
              </span>
              {onRemoveFilter && (
                <button
                  ref={(element) => {
                    if (element) removeButtons.current.set(filter.id, element);
                    else removeButtons.current.delete(filter.id);
                  }}
                  type="button"
                  aria-label={copy.removeFilter(filter)}
                  disabled={disabled}
                  className="inline-flex shrink-0 cursor-pointer items-center self-stretch border-0 bg-transparent pr-2 pl-[0.15rem] text-muted-foreground hover:not-disabled:text-foreground focus-visible:text-foreground disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-3"
                  onClick={() => removeFilter(index)}
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
