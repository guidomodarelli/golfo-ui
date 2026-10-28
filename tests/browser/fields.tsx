/** Mounts labelled Input and Textarea fields from the public barrel, so their layout and message motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { GolfoUIProvider, Button, Input, RichLinkEditor, Textarea, useRichLinkEditor } from "@golfo/ui";
import "./styles.css";

/** Characters the bio accepts; the count starts with three digits so a keystroke rolls only the last ones. */
const BIO_MAX_LENGTH = 120;

/** Helper copy long enough to wrap onto more lines on a phone than on a desktop. */
const LONG_DESCRIPTION =
  "Usamos este correo para enviarte los recibos de cada pago, los avisos de renovación y los cambios importantes de tu tribu, nunca para publicidad.";

/** Date and time fields in a narrow grid column, the layout where iOS Safari kept their native width and overflowed. */
function DateTimeFields() {
  return (
    <div data-testid="date-time-fields" style={{ display: "grid", gridTemplateColumns: "minmax(0, 14rem)", gap: "1rem" }}>
      <Input type="datetime-local" step="any" label="Desde" />
      <Input type="datetime-local" step="any" label="Hasta" defaultValue="2026-10-28T18:30" />
      <Input type="date" label="Fecha" defaultValue="2026-10-28" />
      <Input type="time" label="Hora" defaultValue="18:30" />
    </div>
  );
}

/** A field inside a horizontal flex row, where it must fill the row like the bare control does. */
function FlexRowField() {
  return (
    <div className="controls" data-testid="flex-row">
      <Input label="Ciudad" description="Donde se encuentra la tribu." />
    </div>
  );
}

/** An email field whose error and helper copy the spec shows and rewords, narrow enough for the long helper copy to wrap. */
function EmailField() {
  const [error, setError] = useState<string>();
  const [hasLongDescription, setHasLongDescription] = useState(false);
  return (
    <>
      <div className="narrow-field">
        <Input
          label="Correo"
          type="email"
          description={hasLongDescription ? LONG_DESCRIPTION : "Solo para recibos."}
          error={error}
        />
      </div>
      <div className="controls">
        <Button variant="secondary" onClick={() => setError("Ingresá un correo válido")}>
          Validar correo
        </Button>
        <Button variant="secondary" onClick={() => setError("Ese correo ya está registrado")}>
          Cambiar error
        </Button>
        <Button variant="secondary" onClick={() => setHasLongDescription(true)}>
          Mostrar ayuda larga
        </Button>
      </div>
    </>
  );
}

/** A bio field with a live character count in its description. */
function BioField() {
  const [bio, setBio] = useState("");
  return (
    <Textarea
      label="Biografía"
      maxLength={BIO_MAX_LENGTH}
      value={bio}
      onChange={(event) => setBio(event.target.value)}
      description={`Quedan ${BIO_MAX_LENGTH - bio.length} caracteres`}
    />
  );
}

/** Members the count starts from, one below the first count Spanish formats with a grouping separator. */
const INITIAL_MEMBER_COUNT = 999;

/** Locale whose grouping separator is a dot, as TuTribu formats counts. */
const COUNT_LOCALE = "es-AR";

/** A field whose description carries a count formatted in Spanish, which the spec grows past a thousand. */
function MembersField() {
  const [members, setMembers] = useState(INITIAL_MEMBER_COUNT);
  return (
    <>
      <Input label="Cupo" description={`${members.toLocaleString(COUNT_LOCALE)} miembros`} />
      <Button variant="secondary" onClick={() => setMembers((current) => current + 1)}>
        Sumar miembro
      </Button>
    </>
  );
}

/** A field whose description the spec rewords by inserting a word in front of the existing copy. */
function NoticeField() {
  const [hasPrefix, setHasPrefix] = useState(false);
  return (
    <>
      <Input label="Aviso" description={`${hasPrefix ? "Solo " : ""}10 caracteres disponibles`} />
      <Button variant="secondary" onClick={() => setHasPrefix(true)}>
        Anteponer palabra
      </Button>
    </>
  );
}

/** Seconds the countdown starts from, so the next tick crosses from 0:10 to 0:09. */
const COUNTDOWN_START_SECONDS = 10;

/** Seconds per minute, to format the countdown as m:ss. */
const SECONDS_PER_MINUTE = 60;

/** A field whose description carries a countdown the spec ticks down. */
function CountdownField() {
  const [seconds, setSeconds] = useState(COUNTDOWN_START_SECONDS);
  const countdown = `${Math.floor(seconds / SECONDS_PER_MINUTE)}:${String(seconds % SECONDS_PER_MINUTE).padStart(2, "0")}`;
  return (
    <>
      <Input label="Código" description={`Vence en ${countdown}`} />
      <Button variant="secondary" onClick={() => setSeconds((current) => current - 1)}>
        Restar segundo
      </Button>
    </>
  );
}

/** A rich link editor on the raised surface of a panel, like a composer inside a dialog, whose surface it must show through. */
function RaisedSurfaceEditor() {
  const editor = useRichLinkEditor();
  return (
    <div data-testid="raised-surface" style={{ background: "var(--surface-raised)", padding: "1rem" }}>
      <RichLinkEditor ariaLabel="Mensaje" editor={editor} placeholder="Contá una novedad" />
    </div>
  );
}

/** Renders the fields the spec drives. */
function Fields() {
  return <GolfoUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Campos</h1>
    <section><FlexRowField /></section>
    <section><DateTimeFields /></section>
    <section><EmailField /></section>
    <section><BioField /></section>
    <section><MembersField /></section>
    <section><NoticeField /></section>
    <section><CountdownField /></section>
    <section><RaisedSurfaceEditor /></section>
  </main></GolfoUIProvider>;
}

createRoot(document.getElementById("root")!).render(<Fields />);
