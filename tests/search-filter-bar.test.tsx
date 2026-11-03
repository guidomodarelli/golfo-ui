/** Verifies the search, the filter dialog and the removable chips of SearchFilterBar through the real Dialog. */
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Input, SearchFilterBar, type SearchFilterBarFilter } from "@golfo/ui";

const STATUS_FILTER: SearchFilterBarFilter = { id: "status", label: "Estado", value: "Aprobadas" };
const SOURCE_FILTER: SearchFilterBarFilter = { id: "source", label: "Origen", value: "Solicitud común" };

/** Owns the search, the dialog draft and the applied filters like an application would. */
function Harness({ onApply = vi.fn(), initialFilters = [STATUS_FILTER, SOURCE_FILTER] }: { onApply?: (search: string, filters: SearchFilterBarFilter[]) => void; initialFilters?: SearchFilterBarFilter[] }) {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState(initialFilters);
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState("");
  const apply = () => {
    const next = owner ? [...applied.filter((filter) => filter.id !== "owner"), { id: "owner", label: "Responsable", value: owner }] : applied;
    setApplied(next);
    setOpen(false);
    onApply(search, next);
  };
  return (
    <SearchFilterBar
      searchValue={search}
      onSearchValueChange={setSearch}
      onSearchSubmit={() => onApply(search, applied)}
      searchPlaceholder="Buscá por nombre"
      searchInputProps={{ maxLength: 20 }}
      labels={{ search: "Búsqueda" }}
      open={open}
      onOpenChange={(next) => { setOpen(next); if (!next) setOwner(""); }}
      dialogDescription="Elegí qué solicitudes ver."
      dialogFooter={<Button type="submit" form="filters">Aplicar filtros</Button>}
      appliedFilters={applied}
      onRemoveFilter={(id) => setApplied((current) => current.filter((filter) => filter.id !== id))}
    >
      <form id="filters" onSubmit={(event) => { event.preventDefault(); apply(); }}>
        <Input label="Responsable" value={owner} onChange={(event) => setOwner(event.target.value)} />
      </form>
    </SearchFilterBar>
  );
}

describe("SearchFilterBar", () => {
  it("should apply the search with Enter without opening the dialog", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    const search = screen.getByRole("searchbox", { name: "Búsqueda" });
    expect(search).toHaveAttribute("placeholder", "Buscá por nombre");
    expect(search).toHaveAttribute("maxlength", "20");
    expect(search).toHaveAttribute("enterkeyhint", "search");
    expect(screen.getByRole("search", { name: "Búsqueda" })).toContainElement(search);
    await user.type(search, "Ana{Enter}");
    expect(onApply).toHaveBeenCalledExactlyOnceWith("Ana", [STATUS_FILTER, SOURCE_FILTER]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should say how many filters apply and list each one as a chip", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Filtros (2 aplicados)" })).toBeEnabled();
    const chips = within(screen.getByRole("list", { name: "Filtros aplicados" })).getAllByRole("listitem");
    expect(chips.map((chip) => chip.textContent)).toEqual(["Estado: Aprobadas", "Origen: Solicitud común"]);
  });

  it("should name the button without a count and render no chip list when nothing applies", () => {
    render(<Harness initialFilters={[]} />);
    expect(screen.getByRole("button", { name: "Filtros" })).toBeEnabled();
    expect(screen.queryByRole("list", { name: "Filtros aplicados" })).not.toBeInTheDocument();
  });

  it("should open the app fields in the dialog, apply them from the footer and return the focus to the button", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    await user.click(screen.getByRole("button", { name: /^Filtros/ }));
    const dialog = await screen.findByRole("dialog", { name: "Filtros" });
    expect(dialog).toHaveAccessibleDescription("Elegí qué solicitudes ver.");
    await user.type(within(dialog).getByLabelText("Responsable"), "Leo{Enter}");
    expect(onApply).toHaveBeenCalledExactlyOnceWith("", [STATUS_FILTER, SOURCE_FILTER, { id: "owner", label: "Responsable", value: "Leo" }]);
    // The page stays hidden from assistive technology until the dialog finishes its exit.
    const trigger = await screen.findByRole("button", { name: "Filtros (3 aplicados)" });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("should tell the app when the person dismisses the dialog without applying", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    await user.click(screen.getByRole("button", { name: /^Filtros/ }));
    await user.type(await screen.findByLabelText("Responsable"), "Sin aplicar");
    await user.keyboard("{Escape}");
    expect(onApply).not.toHaveBeenCalled();
    await user.click(await screen.findByRole("button", { name: /^Filtros/ }));
    expect(await screen.findByLabelText("Responsable")).toHaveValue("");
  });

  it("should remove a chip and move the focus to the next chip, then to the button when none is left", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Quitar Estado: Aprobadas" }));
    expect(screen.getByRole("button", { name: "Quitar Origen: Solicitud común" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Filtros (1 aplicado)" })).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveFocus();
    expect(screen.queryByRole("list", { name: "Filtros aplicados" })).not.toBeInTheDocument();
  });

  it("should show read-only chips when the app does not remove filters", () => {
    render(<SearchFilterBar searchValue="" onSearchValueChange={vi.fn()} onSearchSubmit={vi.fn()} appliedFilters={[STATUS_FILTER]} />);
    expect(screen.getByRole("listitem")).toHaveTextContent("Estado: Aprobadas");
    expect(screen.queryByRole("button", { name: /^Quitar/ })).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toBeInTheDocument();
  });

  it("should block the search, the dialog and the chips while disabled", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn(), onRemoveFilter = vi.fn();
    render(<SearchFilterBar disabled searchValue="Ana" onSearchValueChange={vi.fn()} onSearchSubmit={onSearchSubmit} appliedFilters={[STATUS_FILTER]} onRemoveFilter={onRemoveFilter} />);
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Filtros (1 aplicado)" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quitar Estado: Aprobadas" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Quitar Estado: Aprobadas" }));
    expect(onRemoveFilter).not.toHaveBeenCalled();
    expect(onSearchSubmit).not.toHaveBeenCalled();
  });

  it("should open an uncontrolled dialog and report each change", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<SearchFilterBar searchValue="" onSearchValueChange={vi.fn()} onSearchSubmit={vi.fn()} onOpenChange={onOpenChange} labels={{ dialogTitle: "Más filtros", filters: "Filtrar" }}><p>Campos de la app</p></SearchFilterBar>);
    await user.click(screen.getByRole("button", { name: "Filtrar" }));
    expect(await screen.findByRole("dialog", { name: "Más filtros" })).toHaveTextContent("Campos de la app");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Cerrar diálogo" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
