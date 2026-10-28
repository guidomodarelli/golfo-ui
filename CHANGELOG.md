# Cambios

Todos los cambios relevantes de `@golfo/ui` se documentan en este archivo con el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/). Cada cambio agrega sus entradas en `[Unreleased]`; `pnpm create-version` las pasa a la versión publicada con su fecha.

## [Unreleased]

### Fixed

- El círculo de `Switch` activado queda centrado en su riel en iOS Safari; antes se veía corrido 1px hacia arriba o hacia abajo.
- `Input` de fecha y hora (`date`, `datetime-local`, `time`, `month`, `week`) ocupa el ancho de su columna en iOS Safari; antes conservaba el ancho nativo y se salía del formulario.

## [2.2.0] - 2026-10-28

### Changed

- `ReactionButton` con `isDisabled` sigue en el orden del teclado: queda enfocable con `aria-disabled` (y `data-disabled` para los estilos), así un tooltip o una hover card sobre él se siguen abriendo, y se traga los clicks, así un padre clickeable (como la tarjeta de un mensaje) tampoco reacciona. Antes usaba `disabled` nativo y el consumidor tenía que envolverlo en un elemento enfocable.
- Cada versión se publica recién cuando el CI completo (incluidas las pruebas de navegador en Chromium y WebKit) termina en verde sobre su commit exacto, que el workflow de release corre por su cuenta; un push posterior a `main` ya no puede cancelar esa validación ni bloquear la publicación.

## [2.1.2] - 2026-10-22

### Added

- El catálogo de Storybook con todos los componentes se publica en GitHub Pages y se actualiza con cada cambio en `main`, así se pueden ver los componentes y sus variantes sin clonar el repositorio.

## [2.1.1] - 2026-10-22

### Fixed

- `PopoverContent` permite que un hijo directo con `data-popover-shrink` se ajuste al alto disponible del panel y haga scroll por su cuenta, como un panel con encabezado fijo y una lista propia; antes ese hijo conservaba su alto completo y la lista no se podía desplazar. El resto del contenido sigue desplazándose en el panel entero, sin achicar a sus hijos.

## [2.1.0] - 2026-10-22

### Added

- Componentes de tipografía con el estilo de Arc, que también funcionan en Server Components: `Heading` y `H1` a `H6`; `Text`, `Lead`, `Small`, `Blockquote`, `Pre` y `Address`; `Strong`, `B`, `Em`, `I`, `U`, `S`, `Del`, `Ins`, `Mark`, `Code`, `Kbd`, `Samp`, `Var`, `Abbr`, `Cite`, `Dfn`, `Q`, `Sub`, `Sup` y `Time`; y `List`, `OrderedList`, `ListItem`, `DescriptionList`, `DescriptionTerm` y `DescriptionDetails`. Se importan desde la raíz o desde `@golfo/ui/heading`, `@golfo/ui/text`, `@golfo/ui/inline-text` y `@golfo/ui/list`.
- `theme.css` define `--font-code`, la monoespaciada del sistema que Arc usa para el código.

### Changed

- `RadioGroup` acepta `value={null}` para seguir controlado sin ninguna opción elegida, así los formularios ya no tienen que pasar `undefined` mientras falta la elección.
- Cada versión se publica recién cuando el CI de su commit (incluidas las pruebas de navegador en Chromium y WebKit) termina en verde; el workflow de release ya no repite esas pruebas, así que las versiones nuevas llegan antes a npm.

### Fixed

- `RadioGroup` ya no muestra en la consola el aviso de React «changing from uncontrolled to controlled» al elegir la primera opción, tanto sin `defaultValue` como con un valor controlado que arranca vacío.
- `EmptyState` vuelve a animar la altura al cambiar el título o la descripción aunque el dispositivo esté ocupado y tarde en pintar el primer cuadro; antes, en ese caso, el bloque saltaba a la altura nueva sin transición.

## [2.0.0] - 2026-10-19

### Changed

- **Cambio incompatible:** el paquete pasa a llamarse `@golfo/ui`, sin alias ni compatibilidad con `@astra-kit/ui`. Hay que reinstalarlo con `pnpm add @golfo/ui` y actualizar todas las importaciones, incluidos los subpaths (`@golfo/ui/next`, `@golfo/ui/tanstack`, `@golfo/ui/hooks`, `@golfo/ui/sonner`, `@golfo/ui/motion-tokens`, `@golfo/ui/styles.css`, `@golfo/ui/theme.css`, `@golfo/ui/fonts.css` y el resto de entradas por componente).
- **Cambio incompatible:** la API pública usa el prefijo `Golfo` en lugar de `Astra`, también en `@golfo/ui/next` y `@golfo/ui/tanstack`: `GolfoUIProvider`, `GolfoUIProviderProps`, `GolfoUIComponents`, `GolfoLinkProps` y `GolfoImageProps`. Los nombres anteriores ya no existen.
- **Cambio incompatible:** las fuentes de `fonts.css` se registran como `Golfo Inter`, `Golfo Geist` y `Golfo Mono`; la variable CSS de `ReactionButton` pasa a `--golfo-reaction-active-color`, el atributo del menú de tema a `data-golfo-theme-menu` y la animación de entrada del ícono de `EmptyState` a `golfo-empty-state-icon-enter`. Los estilos que usen los nombres anteriores dejan de aplicarse.
- El repositorio pasa a `github.com/guidomodarelli/golfo-ui`.

## [1.2.1] - 2026-10-19

### Fixed

- `EmptyState` ya no puede trabar la página en WebKit (Safari y navegadores basados en WebKit, sobre todo en Linux) mientras entra su ícono: la animación de entrada solo anima opacidad y escala, sin desenfoque.
- `UsageMeter` redondea cada segmento a la precisión de `decimals` antes de calcular todo, así la barra, la insignia, la leyenda y el resumen accesible coinciden (por ejemplo, 200,4 con límite 200 y sin decimales ya no dibuja un excedente que la insignia no muestra).
- `UsageMeter` acepta un segmento con `id="free"` sin confundirlo con el espacio libre de la leyenda.
- La leyenda de `UsageMeter` sigue alcanzable con Tab cuando se quitan segmentos después de mover el foco entre sus ítems.
- La insignia de estado de `UsageMeter` con un texto largo se recorta dentro del ancho del medidor en lugar de desbordarlo.
- `Stepper` muestra el contorno de foco del teclado en el paso actual al llegar con las flechas o End.
- `Timeline` etiqueta como "Ayer" el día calendario anterior en la zona horaria elegida, también en los cambios de horario de verano.
- `Timeline` vuelve a anunciar una actualización nueva aunque su resumen sea igual al anterior.
- `Timeline` ya no vuelve al principio del historial cuando solo cambia la preferencia de movimiento reducido; solo lo hace ante una actualización nueva.
- Los números de `MetricCard` y `UsageMeter` se detienen en su valor si se activa el movimiento reducido mientras ruedan.

## [1.2.0] - 2026-10-19

### Added

- `UsageMeter`: barra segmentada de cupo (por ejemplo, códigos y avisos enviados hoy contra el límite diario) con total animado, insignia de estado (libre, casi lleno, excedido), leyenda navegable con teclado y anuncios para lectores de pantalla. Todo el copy viene en español y se reemplaza con `freeLabel`, `overLabel` y `messages`; los números usan `locale` (por defecto `es-AR`).
- `MetricCard`: tarjeta compacta para un número con contexto, con dígitos que ruedan al cambiar y un chip de variación (`change`) que se tiñe según el signo. Acepta `locale` (por defecto `es-AR`).
- `EmptyState`: estado vacío centrado con ícono, título, descripción y acción opcional; al cambiar el copy, el bloque se ajusta de alto sin saltos.
- `Timeline`: historial de eventos agrupado por día, del más reciente al más antiguo, con encabezados fijos, filas que se expanden en el lugar, tiempos relativos y anuncios de nuevas actualizaciones. Fechas en `es-AR` por defecto; el copy se reemplaza con `messages`.
- `Stepper`: indicador de pasos horizontal o vertical, con navegación opcional a pasos completados (`onStepSelect`), estado de error por paso y modo compacto automático en contenedores angostos. Textos de accesibilidad en español, reemplazables con `label`, `completeLabel` y `messages`.

## [1.1.0] - 2026-10-19

### Added

- `ButtonLink`: un link con el aspecto de `Button` (`variant` y `size`) que rutea con el adaptador del provider y sigue siendo un enlace, para navegar sin estilos propios en cada app. También se exporta `buttonClassName({ variant, size, className })`, con las mismas clases para otros elementos, como un `<label>` que abre un selector de archivos.
- `RadioGroup` acepta `hideLabel` (por defecto `false`), como `Select`: la leyenda sigue nombrando el grupo para lectores de pantalla pero no se ve ni ocupa espacio, para layouts que ya muestran su propio título. Ya no hace falta ocultarla con CSS propio.

## [1.0.0] - 2026-10-18

### Changed

- El paquete pasa a llamarse `@astra-kit/ui` y reinicia la numeración: reemplazá la dependencia `beez-ui` por `@astra-kit/ui` y todos los imports, incluidos los subpaths y el CSS (`@astra-kit/ui/next`, `@astra-kit/ui/styles.css`, …). El repositorio ahora es `guidomodarelli/astra-ui`.
- La API pública usa el prefijo `Astra`: `AstraUIProvider`, `AstraUIProviderProps`, `AstraUIComponents`, `AstraLinkProps`, `AstraImageProps` y `useAstraUIComponents`, también en `@astra-kit/ui/next` y `@astra-kit/ui/tanstack`.
- Las fuentes de `fonts.css` se registran como `Astra Inter`, `Astra Geist` y `Astra Mono`, la variable CSS de `ReactionButton` es `--astra-reaction-active-color` y el atributo del menú de tema es `data-astra-theme-menu`.

### Removed

- No se aceptan los nombres anteriores (`BeezUIProvider`, `BeezLinkProps`, `BeezImageProps`, `useBeezUIComponents`, `Beez Inter`/`Geist`/`Mono`, `--beez-reaction-active-color`, `data-beez-theme-menu`): hay que migrar todo de una vez. El historial de `beez-ui` 0.8.1–4.0.1 queda en [`docs/history/beez-ui-changelog.md`](https://github.com/guidomodarelli/astra-ui/blob/main/docs/history/beez-ui-changelog.md).

### Fixed

- `DropdownMenu` con un `trigger` propio no disponible ya no abre el menú: ni con click o toque cuando el botón está deshabilitado (por su `disabled`, por un `<fieldset disabled>` o por estado interno del componente), ni con Enter, Espacio o flecha abajo cuando tiene `aria-disabled="true"`, como un `Button` en `loading`. Antes se abría porque el navegador igual entrega el `pointerdown` al botón deshabilitado.
