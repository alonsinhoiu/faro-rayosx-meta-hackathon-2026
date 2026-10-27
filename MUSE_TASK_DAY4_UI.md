# GUÍA Y PROMPT PARA MUSE CODE: REFINAMIENTO DE INTERFAZ DESKTOP / MOBILE

**Proyecto:** `faro-rayosx-meta-hackathon-2026`  
**Arquitectura:** React 19 + Tailwind CSS + Lucide React  
**Estructura de Componentes Desacoplada:**
- Desktop: `client/src/components/desktop/DesktopWorkbench.tsx` (Mesa de control panorámica en 3 columnas)
- Mobile: `client/src/components/mobile/MobileTenantView.tsx` (App táctil moderna con 4 tabs inferiores)
- Compartidos: `client/src/components/shared/` (`CostBreakdownCard`, `PhotoViewerWithBBoxes`, `VetoAlertCard`, `WhatsAppButton`)
- Hook de Detección/Toggle: `client/src/hooks/useViewport.ts`

---

## Prompt para pasarle a Muse Code (si quieres pedirle ajustes visuales):

```markdown
En este repositorio `faro-rayosx-meta-hackathon-2026`, la interfaz de usuario está desacoplada en:
- `client/src/components/desktop/DesktopWorkbench.tsx` para computadores.
- `client/src/components/mobile/MobileTenantView.tsx` para celulares.
- `client/src/components/shared/` para componentes visuales reutilizables.

[ESCRIBE AQUÍ EL AJUSTE QUE QUIERAS, POR EJEMPLO:]
Por favor, mejora el diseño de `MobileTenantView.tsx`: haz que las tarjetas de las contradicciones tengan bordes más sutiles, que el selector de fotos tenga indicadores de puntos (dots) y que el botón de WhatsApp tenga un micro-efecto de pulsación táctil. No toques `DesktopWorkbench.tsx`.
```
