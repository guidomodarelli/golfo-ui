/** Demonstrates SearchFilterBar with the dialog fields, the applied filters and the search owned by the example. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Input, SearchFilterBar, SearchFilterBarFields, Select, type SearchFilterBarFilter } from "@golfo/ui";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "all", label: "Todos los estados" },
];
const SOURCE_OPTIONS = [
  { value: "any", label: "Todos los orígenes" },
  { value: "common", label: "Solicitud común" },
  { value: "personal", label: "Invitación personal" },
];
const FORM_ID = "search-filter-bar-story";

/** Applied values of the example; the initial pending status is not a filter, so it shows no chip. */
type AppliedValues = { status: string; source: string; from: string };
const INITIAL_VALUES: AppliedValues = { status: "approved", source: "common", from: "" };

/** @param values - Applied values. @returns The chips of every value that differs from the initial pending view. */
function chipsFor(values: AppliedValues): SearchFilterBarFilter[] {
  return [
    values.status !== "pending" && { id: "status", label: "Estado", value: STATUS_OPTIONS.find((option) => option.value === values.status)?.label ?? values.status },
    values.source !== "any" && { id: "source", label: "Origen", value: SOURCE_OPTIONS.find((option) => option.value === values.source)?.label ?? values.source },
    values.from && { id: "from", label: "Desde", value: values.from.replace("T", " ") },
  ].filter((chip): chip is SearchFilterBarFilter => Boolean(chip));
}

/** Keeps the applied values and the dialog draft in memory, where an application would read them from its URL. */
function SearchFilterBarExample() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState(INITIAL_VALUES);
  const [draft, setDraft] = useState(INITIAL_VALUES);
  const [open, setOpen] = useState(false);
  const defaults: AppliedValues = { status: "pending", source: "any", from: "" };

  return (
    <div className="max-w-3xl">
      <SearchFilterBar
        searchValue={search}
        onSearchValueChange={setSearch}
        onSearchSubmit={() => undefined}
        searchPlaceholder="Buscá por nombre, correo o teléfono"
        open={open}
        onOpenChange={(next) => { setOpen(next); setDraft(applied); }}
        dialogDescription="Elegí qué solicitudes ver. La lista cambia cuando aplicás los filtros."
        dialogFooter={<>
          <Button type="button" variant="secondary" onClick={() => { setApplied(defaults); setDraft(defaults); setOpen(false); }}>Mostrar pendientes</Button>
          <Button type="submit" form={FORM_ID}>Aplicar filtros</Button>
        </>}
        appliedFilters={chipsFor(applied)}
        onRemoveFilter={(id) => setApplied((current) => ({ ...current, [id]: defaults[id as keyof AppliedValues] }))}
      >
        <form id={FORM_ID} onSubmit={(event) => { event.preventDefault(); setApplied(draft); setOpen(false); }}>
          <SearchFilterBarFields>
            <Select id={`${FORM_ID}-status`} label="Estado" value={draft.status} options={STATUS_OPTIONS} onValueChange={(status) => setDraft({ ...draft, status })} />
            <Select id={`${FORM_ID}-source`} label="Origen" value={draft.source} options={SOURCE_OPTIONS} onValueChange={(source) => setDraft({ ...draft, source })} />
            <Input type="datetime-local" step="any" label="Desde" value={draft.from} onChange={(event) => setDraft({ ...draft, from: event.target.value })} />
          </SearchFilterBarFields>
        </form>
      </SearchFilterBar>
    </div>
  );
}

const meta = {
  title: "Components/SearchFilterBar",
  render: () => <SearchFilterBarExample />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
