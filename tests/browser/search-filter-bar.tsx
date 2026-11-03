/** Mounts SearchFilterBar from the public barrel, with many and with no applied filters, so its wrapping row runs in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { GolfoUIProvider, Button, Input, SearchFilterBar, SearchFilterBarFields, Select, type SearchFilterBarFilter } from "@golfo/ui";
import "./styles.css";

/** Status choices of the dialog, the way an app passes its own fields. */
const STATUS_OPTIONS = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "all", label: "Todos los estados" },
];

/** Enough chips to wrap on every width, one with a value long enough to truncate on a phone. */
const MANY_FILTERS: SearchFilterBarFilter[] = [
  { id: "status", label: "Estado", value: "Todos los estados" },
  { id: "source", label: "Origen", value: "Solicitud común" },
  { id: "exception", label: "Excepción a la lista", value: "Excepciones a la lista" },
  { id: "verification", label: "Comprobación de contacto", value: "Sin ese requisito actual" },
  { id: "from", label: "Desde", value: "1 de octubre de 2026, 10:00" },
  { id: "note", label: "Nota", value: "Personas que pidieron entrar desde la invitación compartida en el grupo general de la academia" },
];

/** A few chips that fit next to the search on a desktop row. */
const FEW_FILTERS: SearchFilterBarFilter[] = [
  { id: "status", label: "Estado", value: "Aprobadas" },
  { id: "source", label: "Origen", value: "Solicitud común" },
];

/** Owns the search, the dialog draft and the applied filters like an application would. */
function Bar({ testId, initialFilters, formId }: { testId: string; initialFilters: SearchFilterBarFilter[]; formId: string }) {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState(initialFilters);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("pending");
  return (
    <section data-testid={testId}>
      <SearchFilterBar
        searchValue={search}
        onSearchValueChange={setSearch}
        onSearchSubmit={() => undefined}
        searchPlaceholder="Buscá por nombre, correo o teléfono"
        labels={{ search: `Búsqueda ${testId}` }}
        open={open}
        onOpenChange={setOpen}
        dialogDescription="Elegí qué solicitudes ver."
        dialogFooter={<>
          <Button type="button" variant="secondary" onClick={() => { setApplied([]); setOpen(false); }}>Mostrar pendientes</Button>
          <Button type="submit" form={formId}>Aplicar filtros</Button>
        </>}
        appliedFilters={applied}
        onRemoveFilter={(id) => setApplied((current) => current.filter((filter) => filter.id !== id))}
      >
        <form id={formId} onSubmit={(event) => {
          event.preventDefault();
          const label = STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
          setApplied((current) => [{ id: "status", label: "Estado", value: label }, ...current.filter((filter) => filter.id !== "status")]);
          setOpen(false);
        }}>
          <SearchFilterBarFields>
            <Select id={`${formId}-status`} label="Estado" value={status} options={STATUS_OPTIONS} onValueChange={setStatus} />
            <Input type="datetime-local" step="any" label="Desde" />
            <Input type="datetime-local" step="any" label="Hasta" />
          </SearchFilterBarFields>
        </form>
      </SearchFilterBar>
    </section>
  );
}

/** Renders the bars the spec measures. */
function App() {
  return (
    <GolfoUIProvider>
      <main>
        <Bar testId="many" initialFilters={MANY_FILTERS} formId="many-filters" />
        <Bar testId="few" initialFilters={FEW_FILTERS} formId="few-filters" />
        <Bar testId="none" initialFilters={[]} formId="no-filters" />
      </main>
    </GolfoUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
