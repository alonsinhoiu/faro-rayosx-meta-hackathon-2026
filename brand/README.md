# FARO Rayos-X · Identidad visual 1.0

**Claridad para arrendar.**

El símbolo representa un faro: una torre estable y dos haces que sugieren una F. La dirección editorial combina tinta, papel y un acento ámbar; el lenguaje se centra en orientación y evidencia.

## Empezar

- `vista-general.png`: lámina de presentación.
- `guia-visual.html`: guía de ocho páginas para consultar en el navegador.
- `../output/pdf/faro-guia-identidad.pdf`: guía lista para compartir.
- `svg/`: originales editables, sin fondo; letras convertidas a trazados.
- `png/`: exportaciones transparentes de los logos a 3× e iconos de aplicación.
- `social/`: portada 1200 × 630, publicación 1080 × 1080 y avatar 400 × 400.
- `tokens.json` y `tokens.css`: valores reutilizables del sistema.

## Elegir una variante

| Nombre del archivo | Uso |
| --- | --- |
| `horizontal` | Firma principal FARO + Rayos-X |
| `stacked` | Firma vertical, portadas |
| `compact` | FARO con símbolo, sin descriptor |
| `wordmark` | Nombre sin símbolo |
| `symbol` | Símbolo completo desde 32 px |
| `micro` | Símbolo simplificado para 16–24 px |
| `color` | Tinta y ámbar sobre fondos claros |
| `reverse` | Papel y ámbar sobre fondos oscuros |
| `mono-dark` | Una tinta oscura |
| `mono-white` | Una tinta blanca |

Los PNG blancos pueden parecer vacíos al verlos sobre blanco: son transparentes y están preparados para fondos oscuros. Los iconos `app-*` sí tienen fondo sólido. El icono ligero se integra sobre el fondo papel; no lleva un borde adicional.

## Paleta y letras

- Tinta `#111827`; papel `#FAF8F5`; haz `#F4B942`.
- Sans serif: Arial Regular / Bold; alternativa Helvetica o sans serif del sistema.
- Acento editorial: Georgia Italic.
- Estados: verificado `#047857`, pendiente `#B45309`, conflicto `#B91C1C`.
- Conservar números tabulares en precios, medidas y porcentajes.
- No usar ámbar como texto pequeño sobre papel. Acompañar los estados con etiquetas o iconos.

No se redistribuyen fuentes. El logo no requiere instalarlas porque sus letras están trazadas. SVG/PNG se entregan en RGB; para tiradas profesionales, la imprenta debe ajustar la conversión al perfil de su soporte.

## Integración en el producto

Los archivos utilizados por el cliente están en `client/public/brand/`. El encabezado utiliza la firma horizontal; el HTML incluye favicon SVG y apple-touch-icon de 180 px. Los tipos y el acento de marca están declarados en `client/src/index.css`.

## Regenerar

`source/generate_brand.py` crea SVG, tokens y guías HTML usando FontTools y Arial/Georgia de macOS. `source/export_brand.cjs` rasteriza con Sharp, genera el PDF y captura la vista general con Playwright/Chrome; además sincroniza los archivos del cliente. Este exportador referencia las dependencias del runtime local de Codex: ajustar `createRequire(...)` para ejecutarlo en otro equipo. Instalar FontTools en el entorno Python elegido, y Sharp/Playwright en el entorno Node elegido si no están disponibles.

La guía define protección, escalas mínimas, fondos y usos. Versión inicial de diseño, sin estudio de disponibilidad ni registro del nombre.
