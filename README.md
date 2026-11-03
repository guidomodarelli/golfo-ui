# @golfo/ui

Biblioteca de componentes React reutilizables, con adaptadores opcionales por framework y tema compartido. Reúne los componentes de LaTribu y las funcionalidades reutilizables de agenda-mensual.

## Storybook

```bash
pnpm storybook
```

Abre `http://localhost:6006` para explorar los componentes con controles de texto,
variantes, tamaños, estados y comportamiento. El selector de la barra permite
probar el tema claro, oscuro o del sistema. Las stories de componentes compuestos
incluyen sus piezas en ejemplos completos; los campos editables y selectores
sincronizan sus interacciones con Controls. `GolfoUIProvider` configura el preview
y no forma parte del catálogo. Las notificaciones se exploran en `ThemedToaster`,
sin duplicar una story de `Toaster`; `WhatsappIcon` está en la sección `Icons`.

```bash
pnpm build-storybook       # Genera storybook-static para servirlo o publicarlo
pnpm typecheck:stories    # Comprueba stories y configuración con TypeScript
pnpm test:storybook       # Build y navegación/interacciones en Chromium y WebKit
```

El catálogo consume los exports públicos y el CSS compilado de la librería. Los
scripts compilan `@golfo/ui` antes de arrancar; si editás sus fuentes con Storybook
abierto, ejecutá `pnpm build` para actualizar el paquete que muestra el preview.
Los cambios en las stories se actualizan durante el desarrollo. Storybook y sus
addons son dependencias de desarrollo y no se incluyen en el paquete publicado.

Configuración basada en [React con Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite)
y [Controls](https://storybook.js.org/docs/essentials/controls).

## Uso del paquete

El paquete se publica en npm como `@golfo/ui`. No hace falta
configurar el registry ni autenticarse para instalarlo:

```sh
pnpm add @golfo/ui
```


```tsx
import { Avatar, Button, Calendar, DataTable } from "@golfo/ui";

<Avatar name="Ana Núñez" src="/ana.jpg" />;
```

Los componentes adoptados de [Arc](https://uiarc.dev) usan la API pública de Arc: `Switch`, `Checkbox`, `RadioGroup`, `Badge`, `Avatar`, `AvatarGroup`, `Skeleton`, `Card`, `Alert`, `Tooltip`, `HoverCard`, `DropdownMenu`, `Select`, `Pagination`, `Calendar` y `Carousel` son componentes cerrados que se configuran por props (`items`, `options`, `members`, `content`, `title`); `Dialog` (`Dialog`, `DialogTrigger`, `DialogContent` con `title` y `description`, `DialogClose`), `Popover` y `Tabs` conservan las partes de Arc. Cada uno suma solo las extensiones que Arc no cubre, con copy en español por defecto, por ejemplo `getHref` en `Pagination`, `trigger` e ítems con `href` en `DropdownMenu`, `onOpenChange` en `HoverCard`, `footer` y el modo `alert` en `Dialog` (reemplaza a `AlertDialog`), `hideLabel` en `Select` y `RadioGroup`, y `onSettle` en `Carousel`. Los displays de datos de Arc `UsageMeter`, `MetricCard`, `EmptyState`, `Timeline` y `Stepper` también son cerrados y se configuran por props; sus textos visibles y anunciados vienen en español y se reemplazan con `messages` (y con `freeLabel`/`overLabel`, `label` o `completeLabel` donde Arc ya los define), y `locale` formatea números y fechas (`es-AR` por defecto). La tabla de migración desde `beez-ui` 2.x está en [`docs/history/beez-ui-changelog.md`](https://github.com/guidomodarelli/golfo-ui/blob/main/docs/history/beez-ui-changelog.md).

`Button` es para acciones y no tiene `asChild`. Una navegación con aspecto de botón es un `ButtonLink`: el `Link` del provider (rutea con el adaptador configurado y sigue siendo un enlace, que se puede abrir en otra pestaña o copiar) con la receta de `Button` y sus `variant` y `size`. Para otro elemento con aspecto de botón, como un `<label>` que abre un selector de archivos, `buttonClassName({ variant, size, className })` devuelve las mismas clases. Ninguno de los dos incluye la presión ni el spinner de `Button`.

```tsx
import { ButtonLink, buttonClassName } from "@golfo/ui";

<ButtonLink href="/" variant="secondary">Volver al inicio</ButtonLink>;
<label className={buttonClassName({ variant: "ghost", size: "sm" })}>Adjuntar<input type="file" hidden /></label>;
```

Agrupar los imports de componentes desde la raíz. El paquete publica JavaScript ESM y declaraciones TypeScript en `dist`; el consumidor no necesita transpilar el código fuente de la librería. La gramática de filtros y los helpers de mes-año son independientes de React.

La utilidad `cn`, también exportada desde `@golfo/ui`, usa el paquete `cn` para combinar clases condicionales y resolver conflictos de Tailwind.

```css
@import "@golfo/ui/styles.css";
```

`@golfo/ui/styles.css` es CSS listo para el navegador: incluye reset, utilidades, el foundation de [Arc](https://uiarc.dev) (colores, superficies, radios concéntricos, alturas de control, sombras y foco por teclado) con modo claro y oscuro, y las fuentes locales Inter, Geist e IBM Plex Mono. No requiere Tailwind, plugins PostCSS ni declaraciones `@source` en el consumidor. Las clases se compilan en el build de la biblioteca y se publican en `dist/styles.css`; `styles.source.css` es la entrada de desarrollo y no se distribuye.

El modo oscuro se activa con `data-theme="dark"` o la clase `dark` en `<html>`; `GolfoUIProvider` escribe ambos. El acento por defecto es el azul de Arc y se cambia con `data-accent` (`neutral`, `violet`, `blue`, `green`, `amber`, `orange`, `coral` o `rose`) en `<html>`. Los nombres de tokens de shadcn (`--primary`, `--muted`, `--card`…) siguen disponibles como alias de los roles de Arc; `--accent` es el acento de Arc, no el gris de hover de shadcn. Inter se usa para texto y controles y Geist para títulos grandes mediante `--font-display`; las licencias se incluyen en `assets/fonts`. Los consumidores pueden sobrescribir tokens mediante CSS normal. Si la aplicación usa Tailwind para sus propios estilos puede mantenerlo, pero ya no necesita escanear @golfo/ui.

El menú de `DropdownMenu` toma el ancho natural de sus opciones, con un mínimo de 12 rem y un máximo limitado por el espacio disponible. No hereda el ancho del botón disparador: los menús abiertos desde un icono deben mantener sus etiquetas legibles. Para un ancho específico, usar `contentClassName` y ajustar también el mínimo cuando se necesite un menú más pequeño.

Los componentes usan por defecto los espaciados compactos de Agenda: `Select` mide 2 rem (1.75 rem en tamaño pequeño), `TabsList` horizontal mide 2 rem y `PopoverContent` usa 0.625 rem de padding. Los menús tienen un mínimo de 12 rem, con filas compactas. `Dialog` usa 1 rem de padding y un footer con borde superior y fondo diferenciado; `Textarea` distingue el estado deshabilitado mediante su fondo. Estos valores conservan los colores y fuentes del tema compartido. Son cambios de los defaults, sin una prop adicional para activarlos; los consumidores pueden personalizarlos mediante `className`.

Los `Sheet` superiores e inferiores limitan su altura al viewport dinámico (`100dvh`) y permiten desplazar el contenido para mantener accesibles las acciones de paneles largos.

## Movimiento

El movimiento sigue a [Arc](https://uiarc.dev): explica causa y efecto (qué se abrió,
qué cambió, de dónde vino) y no decora. Si una animación no explica nada, no está.
Las animaciones usan la dependencia `motion`: `animate` controla la reproducción,
`hover` y `press` los gestos, y `AnimatePresence` / `usePresence` retienen los
overlays durante su salida. Los presets y tiempos viven en `src/motion/`. No se usan
keyframes CSS para estas animaciones.

`MotionSlot` anima el nodo original del primitive mediante refs compuestos,
sin agregar wrappers al DOM ni reemplazar sus handlers. Los tokens exportados en
`@golfo/ui/motion-tokens` son únicamente los presets de Arc
(`components/arc/lib/motion-tokens.ts`):

- Springs: `snappy` (0.26 s, rebote 0.12) para presiones, indicadores chicos y cambios de
  ícono (`SPRING_PRESS`, `SPRING_POP`, `SPRING_CHEVRON`); `smooth` (0.4 s, sin rebote) para
  paneles, alturas y todo lo que informa un estado (`SPRING_PANEL`); `morph` (0.42 s, rebote
  0.16) para resaltados compartidos (`SPRING_LAYOUT`).
- Duraciones: `instant` 0.12 s, `fast` 0.16 s, `exit` 0.18 s, `enter`/`standard` 0.24 s y
  `considered` 0.48 s. Las salidas son más cortas que las entradas.
- Curvas: `MOTION_EASE` (entrada), `MOTION_EASE_EXIT`, `MOTION_EASE_STANDARD` y
  `MOTION_EASE_IN_OUT`.

Ningún componente agrega movimiento que Arc no tenga: no hay entradas al montar en cards,
badges, separadores, filas de tabla ni alertas estáticas; no hay hovers con escala,
rotación u opacidad en enlaces e íconos; los campos no reaccionan al foco con movimiento y
no tiemblan al pasar a `aria-invalid="true"`.

- `Button`, `ControlButton` y los pasos de `Pagination` usan la presión de Arc: se comprimen
  a 0.97 (un poco más los de solo ícono y menos los anchos) y vuelven con `snappy`; los
  disparadores de menús, popovers y diálogos responden solo con color.
- `Checkbox`, `RadioGroup`, `Switch`, `Tabs`, `Calendar`, `Carousel`, `Card`, `Avatar`,
  `AvatarGroup`, `Badge`, `Alert`, `ActionButton`, `SplitButton`, `UsageMeter`, `MetricCard`,
  `EmptyState`, `Timeline` y `Stepper` usan el movimiento de sus componentes de Arc. Los
  números de `UsageMeter` y `MetricCard` ruedan como un odómetro y sus segmentos o dígitos
  entran la primera vez que el componente se ve; con movimiento reducido saltan al valor final.
- Una `Card` interactiva se eleva 2 px con el borde fuerte y la sombra `--shadow-raised` de
  Arc al pasar un puntero fino.
- `Tooltip`, `Popover` y `HoverCard` se acercan desde su trigger con escala y fundido.
  `DropdownMenu` crece 5 px desde su trigger y desde 0.97 con el spring de Arc y sale en
  130 ms; sus ítems entran escalonados. `Select` crece 6 px desde 0.97 en 0.24 s; sus
  opciones no se animan por separado y el check de la opción elegida aparece desde 0.6 con
  un desenfoque breve, igual que el de los ítems con check de `DropdownMenu`.
- `Dialog`, también en su modo `alert`, entra como el diálogo de Arc: el fondo se oscurece en 0.24 s y el
  panel sube 8 px y crece desde 0.96 con el spring `smooth` mientras aparece en 0.16 s; al
  cerrar baja 4 px hasta 0.98 y se desvanece en 0.16 s, y una reapertura parte de donde
  está. `Sheet` entra desde su borde con `smooth` y sale en 0.24 s con la curva estándar,
  desvaneciéndose al final como el drawer de Arc. Los botones de cierre no tienen animación
  de entrada.
- `GlideSlot` desliza el indicador activo entre ítems como un `layoutId` compartido: la
  pestaña activa de `Tabs`, la página actual de `Pagination` y el resaltado de `DropdownMenu`,
  que se desliza con el puntero y salta al instante con el teclado. `Select` y las
  sugerencias de `FilterQueryBar` no tienen resaltado deslizante.
- El chevron del trigger de `Select` gira 180° con el spring CSS de Arc y los chevrons de
  `DataTable` (grupos y columnas) giran con `snappy`; CSS define el ángulo final.
- `FormMessage` sube un tercio de línea desde un desenfoque al aparecer, como las filas de
  ayuda y error de Arc.
- El ancho de `Sidebar` cambia con `smooth` entre el panel y el riel de íconos, las
  etiquetas se desvanecen y se desplazan 6 px al colapsar, el resaltado del ítem activo se
  desliza con `morph`, el hover solo cambia el color, los submenús abren su altura con
  `smooth` y en pantallas chicas se abre como hoja con foco atrapado.
- El ícono de `AnimatedThemeToggler` crece desde 0.7 desde un desenfoque con `snappy`; el
  botón no gira ni se desvanece al cambiar el tema.
- La foto de `Avatar` aparece desde un desenfoque de 4 px al terminar de cargar; las
  imágenes ya cargadas al montar no se animan.
- `ReactionButton` le da al ícono el impulso de las reacciones de Arc al activarse.
- `AnimatedCollapse` abre y cierra su altura con `smooth`; `PresenceSwap` usa el swap de
  Arc (sube 0.3 em desde un desenfoque y la versión anterior sale hacia arriba);
  `AnimatedListItem` entra 4 px desde un desenfoque leve y se reordena con `smooth`.
- El cursor de `TypingAnimation` queda fijo mientras escribe y parpadea en reposo. Las animaciones especializadas
  existentes de Embla, Sonner y rough-notation se conservan.

El contenido que está saliendo deja de ser interactivo y accesible de inmediato.
Cada familia de overlays tiene un contexto de visibilidad independiente para
soportar composiciones anidadas; los portales sin nodo visible no bloquean el
cierre del padre. `Select` conserva su desmontaje nativo y usa Motion en la entrada.
La elección explícita de `forceMount` permanece bajo control del consumidor.

Se respeta `prefers-reduced-motion`: las nuevas animaciones se cancelan y se
restauran los estilos; las anotaciones se dibujan sin animación y el texto aparece
completo, incluidas todas las palabras de una secuencia. Los controles del carrusel
avanzan directamente. El CSS solo aporta el fallback de movimiento reducido para
los efectos heredados. `GolfoUIProvider` configura `MotionConfig` con
`reducedMotion="user"`. El primer render conserva el contrato de SSR.

El selector aplica el tema inmediatamente y anima su icono con Motion; no depende
de View Transitions nativas ni de una animación para completar el cambio. Los estilos temporales se liberan al terminar
la reproducción. Las stories permiten probar los gestos y estados reales; el
selector de tema de la story y la barra de Storybook se mantienen sincronizados.

## Providers de UI

Elegir un único `GolfoUIProvider` según el framework. Los componentes y `useTheme` siempre se importan desde `@golfo/ui`.

| Import del provider | Navegación | Imágenes de avatar |
| --- | --- | --- |
| `@golfo/ui` | Anclas nativas | `@unpic/react` |
| `@golfo/ui/next` | `next/link` | `next/image` |
| `@golfo/ui/tanstack` | TanStack Router | `@unpic/react` |

```tsx
"use client";

import type { ReactNode } from "react";
import { GolfoUIProvider } from "@golfo/ui/next";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <GolfoUIProvider themeOptions={{ storageKey: "tutribu-theme", defaultTheme: "system" }}>
      {children}
    </GolfoUIProvider>
  );
}
```

Todos los providers usan `next-themes` con clases CSS. El consumidor configura `themeOptions` y conecta sus controles a `useTheme` desde `@golfo/ui`. Al migrar una aplicación, conservar su clave de almacenamiento y retirar los scripts y estados anteriores que modifiquen el tema. En Next, mantener `suppressHydrationWarning` en el elemento `html` porque el provider restaura la preferencia antes de hidratar.

El provider de Next desactiva prefetch y optimización de imágenes por defecto, como LaTribu. Se activan con `prefetch` y `optimizeImages`; para optimizar imágenes remotas hay que configurar sus hosts en la app. `Link` y los enlaces de paginación usan el adaptador del provider. El contrato común de `Link` acepta href como string y atributos de ancla, no todas las opciones exclusivas de Next.

El provider de TanStack se monta dentro del router de la aplicación. Preserva query y hash; `prefetch` activa precarga por intención. TanStack no aporta un componente Image propio: Unpic genera variantes responsivas para CDNs compatibles y conserva las URLs que no reconoce; no instala un servidor de optimización.

Next y TanStack Router son peers opcionales aislados en sus entrypoints. El provider nativo admite overrides mediante `components`. Sin provider, los componentes conservan anclas e imágenes HTML como fallback.

## Responsabilidades del consumidor

- Tema: `AnimatedThemeToggler` y `ThemedToaster` consumen el contexto compartido. Sus props explícitas de tema siguen disponibles para usos controlados.
- Navegación: con `getHref`, `Pagination` dibuja enlaces con el `Link` del provider. Sin proveedor usa anclas nativas; con el proveedor de Next usa su navegación cliente.
- Sidebar: en `SidebarProvider`, `defaultOpen` y el modo controlado conservan la semántica de LaTribu. Los ítems con `href` navegan con el adaptador de router del proveedor. `storageKey` activa opcionalmente persistencia local segura tras hidratar, sin cambiar la cookie pública `sidebar_state` ni sus siete días de duración; `cookieName` y `cookieMaxAge` la reemplazan cuando la app ya lee su propia cookie en el servidor. Para el contenido propio: `SidebarBrandButton` arma la fila de marca (sirve como `trigger` de `DropdownMenu`), `SidebarLabel` saca del riel de íconos el texto que solo tiene sentido expandido, `useSidebarPanel()` expone `collapsed` y `AccountMenu` con `triggerVariant="sidebar"` se reduce solo al avatar. No dependas de los atributos `data-*` internos del sidebar: pueden cambiar entre versiones.
- Formularios y tablas: el consumidor provee sus datos, validaciones y callbacks. No se importan servicios, modelos de negocio ni endpoints de agenda-mensual.

## Componentes incorporados desde agenda-mensual

`Alert`, `AnimatedThemeToggler`, `Calendar`, `DataTable`, `FilterQueryBar`, `Form`, `Highlighter`, `InputGroup`, `Label`, `RadioGroup`, `TypingAnimation` y `ThemedToaster`, junto con sus tipos y gramática de filtros.

`FilterQueryBar` mantiene el foco en el input mientras se recorren las sugerencias con el puntero o las flechas. Enter aplica la opción activa; interactuar con el input no cierra la lista.

La tabla conserva agrupación estable, columnas configurables, memoización, exclusiones y sincronización de qualifiers por identificadores. La barra conserva navegación por teclado, autocompletado y filtros de texto, rangos, fechas, presencia y carpetas. `Calendar` usa español por defecto y acepta otra locale. Los textos y configuraciones de filtros se pueden personalizar por props.

Los componentes compartidos conservan el tema de LaTribu. Se incorporaron atributos `data-variant`/`data-size` del botón, scroll para paneles largos y persistencia opcional del sidebar. `Button` sigue la API de Arc: `variant` `primary`, `secondary`, `ghost` o `danger`, `size` `sm`, `md` o `lg` y `loading`; renderiza un `<button>` nativo con `type="button"` por defecto y no admite `asChild`: un link con aspecto de botón se estiliza como link. Se mantienen los estados deshabilitados y los skeletons deterministas. La foto de `Avatar` delega carga y fallback a Base UI; conserva carga diferida y recuperación al cambiar `src`. El export `Toaster` conserva el aspecto y las props de Sonner, y sus toasts responden al click y al teclado (Alt+T) con un `Dialog` o `Sheet` abierto; `ThemedToaster` se apoya en él y agrega los estilos e iconos compartidos.

## Tipografía

Los componentes de texto siguen las reglas tipográficas de Arc: tamaños de su escala (`--text-xs` a `--text-5xl`), pesos 400 y 500 (nunca negrita), Inter para texto y Geist para títulos de 30px en adelante, y jerarquía con los colores `--foreground`, `--text-secondary` y `--text-muted`. No usan hooks de cliente, así que también se renderizan en Server Components. Tampoco agregan márgenes: el espaciado entre bloques lo decide el layout del consumidor.

- Títulos: `Heading` con `level` (1 a 6, `h2` por defecto) y `size` opcional, para separar el nivel del outline del tamaño visual; `H1` a `H6` son atajos (36, 28, 22, 18, 16 y 14px por defecto).
- Bloques: `Text` (`p`, con `size` `xs`, `sm`, `base` o `lg` y `tone` `default`, `secondary` o `muted`), `Lead`, `Small`, `Blockquote`, `Pre` y `Address`.
- En línea: `Strong`, `B`, `Em`, `I`, `U`, `S`, `Del`, `Ins`, `Mark`, `Code`, `Kbd` (la tecla de Arc, con `size` `md` o `sm`), `Samp`, `Var`, `Abbr`, `Cite`, `Dfn`, `Q`, `Sub`, `Sup` y `Time`. Heredan el tamaño del texto que los rodea.
- Listas: `List` (`marker` `disc` o `none`), `OrderedList`, `ListItem`, `DescriptionList`, `DescriptionTerm` y `DescriptionDetails`.

Las fuentes son las de Arc: Inter y Geist vienen autoalojadas en `fonts.css`, y el código (`Code`, `Pre`, `Samp`) usa la monoespaciada del sistema mediante `--font-code`, como el bloque de código de Arc, sin descargar otra fuente.

```tsx
import { H1, Kbd, Lead, Text } from "@golfo/ui";

<H1>Tribus de lectura</H1>
<Lead>Encontrá a la gente que comparte lo que te gusta.</Lead>
<Text tone="secondary">Abrí la paleta con <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>.</Text>
```

## Componentes de producto reutilizables

Provienen de las carpetas de producto de LaTribu y agenda-mensual y quedaron desacoplados de su dominio: reciben datos ya resueltos y textos por props, con valores por defecto en español. Solo se incorporan piezas genéricas que no fijan decisiones de un producto y que no son una composición trivial de primitivas existentes; los flujos propios de una app (notificaciones, calendarios de eventos, handoff de navegadores internos, actualización de PWA) y los envoltorios simples (estados vacío y de error, loaders, popovers de ayuda) se mantienen en esa app.

- Movimiento: `PresenceSwap`, `AnimatedCount`, `AnimatedCollapse` y `AnimatedListItem`. Los tokens que usa la biblioteca se exportan desde la raíz y desde `@golfo/ui/motion-tokens`, así las apps animan sus superficies con las mismas curvas y springs en lugar de copiarlos.
- Indicadores: `ProgressRing` y `ReactionButton`. El color del ícono activo de la reacción se configura con `activeColor`.
- Acciones (de Arc, sobre `Button`): `ActionButton` corre una acción asíncrona (`onAction`) y muestra el resultado en el propio botón: pasa de la flecha al spinner con `pendingLabel` ("Guardando") y al check con `successLabel` ("Guardado"), y vuelve solo a idle después de `resetAfterMs`. Mientras corre sigue enfocable e ignora nuevas pulsaciones, y si falla vuelve a idle y entrega el error a `onActionError`. `SplitButton` une una acción principal con un menú de acciones relacionadas (`actions`): su ícono y su label cambian en el lugar, y la mitad del menú se nombra "Más acciones de {label}" o con `menuLabel`. Para un envío común sin estado de éxito, usá `Button` con `loading`.
- Cuenta: `AccountMenu`, con inicio de sesión mediante `signInHref` o `onSignIn`.
- Contenido: `RichTextContent`, `RichMarkdownContent`, `RichLinkEditor` y `useRichLinkEditor`. Solo interpretan links en markdown, URLs sueltas, listas y negrita; el HTML del contenido nunca se renderiza como markup.
- Búsqueda con filtros: `SearchFilterBar` reúne en una fila que se acomoda sola (`flex-wrap`, sin breakpoints) la búsqueda, que se aplica con Enter y mide hasta 24rem (`--search-filter-bar-search-max` lo cambia), el botón «Filtros», que abre un `Dialog` con los campos que la app pasa como `children` y sus acciones en `dialogFooter`, y un chip por cada filtro aplicado (`appliedFilters`). El botón muestra cuántos hay y, con `onRemoveFilter`, cada chip se puede quitar; al quitarlo, el foco pasa al chip siguiente o al botón. El diálogo puede ser controlado (`open`, `onOpenChange`) para cerrarlo solo cuando la app aplicó los filtros. El diálogo mide hasta 40rem y `SearchFilterBarFields` acomoda sus campos en dos columnas cuando entran y en una en el teléfono, sin breakpoints. Al angostarse la fila, primero bajan juntos los chips (que se acomodan entre sí), después se achica la búsqueda hasta 12rem y recién entonces el botón baja debajo de ella. Los textos están en español y se cambian con `labels`.
- Filtros guardados: `FilterPresetsBar` y `FilterPresetSaveButton` guardan, aplican, editan y borran consultas con nombre de `FilterQueryBar`. La app decide dónde persistirlas; `parseFilterPresets` valida lo que vuelve del almacenamiento.
- Archivos: `FileUpload`, `FileUploadDropZone`, `FileUploadList` y `FileUploadItem` validan tipo y tamaño, pero no suben archivos: el progreso y los errores los informa la app. Cada ítem acepta un ícono propio y un progreso en barra (`bar`) o de relleno (`fill`).
- Utilidades: `formatFileSize`, `copyTextToClipboard` y búsqueda difusa.

Los hooks de uso general se importan desde `@golfo/ui/hooks`: `useIsMobile`, `useIsHydrated`, `useViewerTimeZone`, `usePrefersReducedMotion` y `useHorizontalSwipe` (con `resolveHorizontalSwipe`). `useIsMobile` también sigue disponible desde la raíz.

```tsx
import { useIsHydrated } from "@golfo/ui/hooks";
```

## React Compiler

El build usa el port de React Compiler en Rust de [Oxc](https://oxc.rs/blog/2026-08-18-react-compiler-support), mediante `oxc-transform-react`. Esta integración sigue marcada como experimental por Oxc.

Las optimizaciones se incluyen en el JavaScript publicado: el consumidor no necesita habilitar React Compiler en Vite, Next ni otro bundler. El target es React 19 y utiliza `react/compiler-runtime`, incluido en el peer React 19.2; no se añade un runtime independiente.

TypeScript 7 valida los tipos y genera las declaraciones. Oxc recibe los fuentes originales y ejecuta React Compiler antes de eliminar TypeScript y transformar JSX. Conserva ESM, los exports y las directivas de cliente. Sólo los módulos cuyo prólogo declara `"use client"` reciben memoización automática; los módulos compatibles con Server Components se emiten sin cachés de cliente. Esto evita introducir hooks del runtime de cliente en el render servidor de Next.

La cobertura depende de las heurísticas del compilador y de las reglas de React: algunas funciones conservan su implementación sin optimizar. Las memoizaciones y comentarios del código fuente permanecen intactos. El build informa cuántos módulos incluyen memoización automática y falla ante errores fatales de transformación.

```sh
# Comparar el comportamiento sin memoización automática.
pnpm test:uncompiled

# Volver a generar la distribución optimizada.
pnpm build
```

`test:uncompiled` usa `pnpm build --no-react-compiler` y ejecuta Vitest. CI y `release:prepare` ejecutan esa comparación antes del check normal, que restaura el build optimizado. Los consumidores de prueba no habilitan un segundo compilador: ejercen el paquete generado, incluido un componente de servidor real en Next.

## Desarrollo y validación

Usar pnpm **12.3.4**. Las dependencias tienen rangos `^` y el lockfile fija las versiones verificadas.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright install chromium webkit
pnpm test:browser
pnpm build
pnpm release:prepare
```

`pnpm build` genera las declaraciones con TypeScript 7, JavaScript con Oxc/React Compiler y CSS con el CLI de Tailwind. `pnpm check` ejecuta oxlint (configurado en `.oxlintrc.json`), los typechecks separados de código y tests con TypeScript 7, y Vitest 5. `tests/tsconfig.json` incorpora los matchers de Testing Library y los tipos de Vite sin incluirlos en el código de producción. `test:browser` verifica una app React/Vite nativa y una app Next real en Chromium y WebKit, tanto en desktop como en móvil. Los tests unitarios importan los archivos compilados. Los consumidores de navegador no instalan plugins de Tailwind, y una prueba adicional sirve el tarball por HTTP sin procesadores CSS para verificar estilos computados y carga de fuentes. Una prueba adicional instala el tarball en un consumidor aislado sin Next y verifica render, filtrado y declaraciones públicas.

En Windows, una corrida de Playwright que muere de golpe (proceso terminado a la fuerza, sesión cerrada o timeout de la herramienta que la lanzó) deja vivos `Playwright.exe` de WebKit y sus procesos `WebKitGPUProcess.exe`, `WebKitNetworkProcess.exe` y `WebKitWebProcess.exe`: Windows no termina a los hijos de un proceso terminado y `globalTeardown` no llega a correr. Esos procesos quedan sin padre y mantienen bloqueada la carpeta del repositorio, que heredan como directorio de trabajo. `playwright.config.ts` y `playwright.storybook.config.ts` usan como `globalSetup` y `globalTeardown` las entradas `@golfo/cleaner/playwright/global-setup` y `@golfo/cleaner/playwright/global-teardown` del paquete [`@golfo/cleaner`](https://github.com/guidomodarelli/golfo-cleaner), compartido con TuTribu y agenda-mensual, así que cada corrida cierra los que dejaron las anteriores. Solo cierra procesos cuyo ejecutable está dentro de una carpeta `ms-playwright` y cuyo proceso padre ya no existe (o también se está cerrando por huérfano). Como Windows reutiliza los identificadores de proceso, un proceso vivo que arrancó después del hijo no cuenta como su padre; si no se conoce alguna de las dos horas de inicio, el proceso se conserva. Nunca toca un navegador en uso. Si la consulta o el cierre fallan, imprime un aviso y la corrida sigue. Para cerrarlos a mano sin correr tests, usar `pnpm test:browser:cleanup` (ejecuta `cleaner playwright`); `pnpm test:browser:cleanup --dry-run` solo lista los procesos que cerraría. En otras plataformas no hace nada. `@golfo/cleaner` está en `minimumReleaseAgeExclude` de `pnpm-workspace.yaml` para poder tomar sus versiones apenas se publican.

Los tests resuelven `@golfo/ui`, `@golfo/ui/next`, `@golfo/ui/tanstack` y `@golfo/ui/hooks` mediante rutas explícitas a las declaraciones compiladas en `tests/tsconfig.json`. Ejecutar `pnpm build` después de clonar o si falta `dist`; los comandos de validación completos ya lo hacen. Si el editor conserva diagnósticos anteriores después del build, reiniciar su servidor de TypeScript.

El compilador `tsc` es TypeScript 7. El paquete `typescript` apunta a la [API de compatibilidad oficial de TypeScript 6](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0) mediante un alias, porque el plugin de docgen de Storybook lo declara como dependencia peer; no reemplaza el compilador de los typechecks. El lint no depende de él: oxlint analiza TypeScript sin el compilador.

## Crear y publicar una versión

### Cómo se publica

`pnpm create-version` (alias `pnpm cv`) corre en tu máquina: diagnostica el repositorio, crea el commit `X.Y.Z` y el tag anotado `vX.Y.Z`, los pushea y despacha el workflow **Release** (`.github/workflows/release.yml`) con `version`, `tag` y `sha`. El workflow verifica que el tag apunte a ese commit y que esté en `main`, prepara y valida el tarball y lo publica en npm con [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, `id-token: write`), sin tokens de npm ni secrets en el repositorio.

Como la publicación usa OIDC, solo puede correr en GitHub Actions: `--local` no publica este paquete. Si el workflow falla después del push, corré `pnpm cv --retry-ci vX.Y.Z` para reintentarlo sobre el mismo tag.

### Un solo comando: `pnpm create-version` (alias `pnpm cv`)

```sh
pnpm create-version                         # diagnóstico, plan y release interactivo
pnpm create-version --bump minor            # patch | minor | major sin preguntar
pnpm create-version -b m                    # atajo de --bump: acepta p | m | M (o -b=m)
pnpm create-version -m                      # atajos --patch/-p, --minor/-m, --major/-M
pnpm create-version --set-version 0.7.0     # versión exacta
pnpm create-version -sv 0.7.0               # atajo de --set-version (o -sv=0.7.0)
pnpm create-version -l                      # atajo de --local: todo el release en esta máquina
pnpm create-version --accept-suggested     # toma la versión sugerida por los commits
pnpm create-version --dry-run               # solo muestra el diagnóstico y el plan
pnpm cv                                     # alias de pnpm create-version
pnpm create-version -h                      # todas las opciones (atajo de --help)
```

Los flags cortos distinguen mayúsculas (`-m` es minor y `-M` major) y van de a uno (`-l -m`, no `-lm`). Pedir dos tipos de versión distintos, combinar un tipo con `--set-version` o `--ci` con `--local` corta con un error.

El comando es el motor compartido `golfo-rp create-version` (devDependency `@golfo/rp`). Su funcionamiento general (diagnóstico, bloqueos, reanudación, versiones permitidas) está documentado en el README de [@golfo/rp](https://github.com/guidomodarelli/golfo-rp#create-version). Lo propio de @golfo/ui vive en `golfo-rp.config.js`: la descripción de cada tipo de versión, la zona horaria de la fecha del CHANGELOG (`releaseTimeZone`), el hook `prepare` de `scripts/release-hooks.js` y la publicación en npm del tarball preparado (`publish: "npm"` + `artifact`, con `publication.authentication: "oidc"`).

Los releases salen sólo desde `main`, limpio y al día con origin (sólo `CHANGELOG.md` puede quedar sin commitear). En otra rama explica qué falta: pushear, abrir o mergear el PR. El último release es el último commit de `origin/main` que cambió el `version` de `package.json`, así que reconoce tanto los commits `X.Y.Z` como los anteriores `chore(release): prepara la versión X.Y.Z`.

### Flujo validado de un release nuevo

1. Actualiza `main` con fast-forward si está atrás.
2. Verifica que `CHANGELOG.md` tenga un bloque `## [Unreleased]` con entradas y solo secciones de Keep a Changelog. Si faltan, las redacta con Claude Code o, si falla, con Codex (`changelogDraft: true` en `golfo-rp.config.js`) y las muestra en la terminal; si ningún agente puede, bloquea el release.
3. Pide la versión (sugiere `patch`, `minor` o `major` según los commits) y crea el commit `X.Y.Z` con la versión del manifiesto, el CHANGELOG con `[Unreleased]` renombrado a `## [X.Y.Z] - AAAA-MM-DD` y un `## [Unreleased]` vacío arriba, y el tag anotado `vX.Y.Z`, antes de las validaciones largas.
4. `prepare` (`scripts/release-hooks.js`): reusa el tarball ya preparado para esa versión si es posterior al último cambio de código (el commit de versión no cuenta); si no, ejecuta `pnpm release:prepare` sobre el commit de versión: instalación congelada, tests sin React Compiler, build optimizado, lint, typechecks y tests unitarios, y genera el tarball verificado con `npm pack --ignore-scripts` (npm y no pnpm, para que sea reproducible) en `releases/<version>-<sha256>/golfo-ui-<version>.tgz`.
5. Sube `main` y el tag `vX.Y.Z` a origin con un único `git push --atomic`.
6. Publicación: golfo-rp exige que el commit de versión siga sin cambios, toma `releases/<version>-<sha256>/golfo-ui-<version>.tgz`, verifica el SHA-256 de su ruta y compara su SHA-512 con el `integrity` de `npm pack --dry-run` sobre ese commit (`npm pack` es reproducible, así que coincidir prueba que es byte a byte lo que npm empaqueta) y recién ahí lo publica en npm con etiqueta `latest`. Además, `prepublishOnly` ejecuta `golfo-rp guard-publish`, que corta un `pnpm publish` manual (o yarn/bun): se publica sólo con `pnpm create-version`, que usa npm.

Si algo falla después del commit de versión, basta con volver a ejecutar `pnpm create-version`: si `HEAD` es el commit `X.Y.Z` y npm todavía no tiene esa versión, retoma sólo la preparación (reusando el tarball si sigue vigente), el push si falta y la publicación. Nunca vuelve a subir la versión.

La publicación usa el cliente oficial de npm contra `https://registry.npmjs.org/` con [trusted publishing](https://docs.npmjs.com/trusted-publishers): el workflow **Release** tiene `id-token: write`, instala npm 11.5.1 y npm intercambia el token OIDC de GitHub Actions por una credencial de un solo uso, así que no hay tokens de npm guardados en el repositorio ni en los secrets. El paquete `@golfo/ui` en npm tiene configurado como trusted publisher este repositorio y el workflow `release.yml`; por eso la publicación solo funciona desde ese workflow. Instalación, build y checks siguen usando pnpm 12.

### CHANGELOG

`CHANGELOG.md` sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Cada cambio agrega sus entradas en el bloque `## [Unreleased]`, agrupadas en `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed` y `### Security` (solo las que apliquen). Si faltan entradas, `pnpm create-version` las redacta con Claude Code o Codex y las escribe sin confirmar (revisalas en la salida del comando); si ningún agente puede, bloquea el release mientras `[Unreleased]` no exista o no tenga entradas. Con `@golfo/rp` 1.0.0, el commit de versión renombra `[Unreleased]` a `## [X.Y.Z] - AAAA-MM-DD` (fecha en la hora de Argentina por `releaseTimeZone: "America/Argentina/Buenos_Aires"`, aunque el workflow **Release** corra en un runner en UTC) y deja un `[Unreleased]` vacío arriba; si el CHANGELOG no está en UTF-8, el release se detiene antes del bump. Ni las personas ni los hooks cierran la sección: hacerlo (por ejemplo con `releaseUnreleased`) la cerraría dos veces o dejaría `[Unreleased]` vacío y bloquearía el release. `release:prepare` exige el bloque fechado que coincide con la versión del manifiesto. La regla completa está en `AGENTS.md`.

Para validar y empaquetar la versión actual sin publicarla:

```sh
pnpm release:prepare
```

El paquete excluye fuentes privadas, tests, scripts, `.env` y `.npmrc`; incluye JavaScript, declaraciones, CSS, fuentes tipográficas y licencias. Conserva releases anteriores.

`prepack` ejecuta el build para los empaquetados manuales. `dist` y `releases` son generados e ignorados por Git. La CI verifica los checks, los tres providers y el catálogo de Storybook (`pnpm test:storybook`) en ambos motores de navegador (Chromium y WebKit) en Linux. La suite de Playwright (`tests/browser/`) corre en CI repartida en 4 shards con `fullyParallel`, y un run nuevo cancela el anterior de la misma rama o pull request (también en `main`). La publicación se ejecuta desde el workflow **Release**, que recibe la versión, el tag y el commit creados por `pnpm create-version`: antes de publicar corre el CI completo sobre ese commit exacto (como workflow reutilizable, en un grupo propio que ningún push cancela) y se detiene si falla.

Tras publicar, los consumidores pueden instalar `pnpm add @golfo/ui`. También pueden instalar directamente el `.tgz` validado antes de una publicación.

Los componentes nuevos de shadcn/ui se agregan mediante su CLI en esta biblioteca y se exportan desde la raíz. No editar las copias instaladas en los consumidores.

## Procedencia

Fuentes originales: `guidomodarelli/TuTribu` (`components/ui`) y `agenda-mensual` (`src/components/ui`). Se preservan las funcionalidades y los comentarios que explican sus decisiones; la integración adapta imports, contratos y dependencias del consumidor. Consultar `LICENSE.md` para la licencia original de shadcn/ui y `assets/fonts/*-LICENSE.txt` para las fuentes. El icono de WhatsApp proviene del registry `@svgl`.
