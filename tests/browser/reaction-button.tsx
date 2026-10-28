/** Mounts an enabled and a disabled ReactionButton inside a clickable card, so real engines style and route them. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { GolfoUIProvider, ReactionButton } from "@golfo/ui";
import "./styles.css";

/** Counts clicks on the reactions and on the card around them, which the spec reads from the page. */
function ReactionCard() {
  const [likes, setLikes] = useState(0);
  const [cardClicks, setCardClicks] = useState(0);
  return (
    <section role="presentation" onClick={() => setCardClicks((count) => count + 1)}>
      <ReactionButton ariaLabel={`Me gusta ${likes}`} count={likes} isActive={likes > 0} onClick={() => setLikes((count) => count + 1)} />
      <ReactionButton ariaLabel="Me gusta deshabilitado 2" count={2} isActive={false} isDisabled onClick={() => setLikes((count) => count + 100)} />
      <p data-testid="likes">{likes}</p>
      <p data-testid="card-clicks">{cardClicks}</p>
    </section>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <GolfoUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}>
    <main>
      <h1>Reacciones</h1>
      <ReactionCard />
    </main>
  </GolfoUIProvider>,
);
