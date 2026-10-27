# INSTRUCCIONES PARA MUSE CODE (DÍA 3 — WORKBENCH FORENSE UI)

**Proyecto:** `faro-rayosx-meta-hackathon-2026`  
**Modelo en uso:** `muse-spark-1.3` (razonamiento `high`)  
**Misión:** Construir la interfaz de usuario en React + Vite + Tailwind CSS para el **Workbench Forense de FARO Rayos-X**, conectada a la API local de Node.js en `http://localhost:3000/api`.

---

## 1. Reglas de Diseño Estrictas (`CONSTRAINTS.md`)
- **Cero AI Slop:** Prohibidos los iconos `<Sparkles>`, los gradientes morado/celeste y los contenedores falsos de celular (`PhoneFrame.jsx`). Debe ser un layout de escritorio completo de 3 paneles (responsive a 1 columna en móviles).
- **Tipografía y Números:** Toda cifra monetaria (`$560.000 CLP`), porcentaje y coordenada DEBE usar la clase Tailwind `tabular-nums`.
- **Contraste WCAG 2.2 AA/AAA:**
  - Fondo papel cálido: `#FAF8F5`
  - Tinta de texto: `#111827`
  - Éxito/Pass: `#047857` (verde esmeralda, 5.48:1 sobre blanco)
  - Alerta/Unknown: `#B45309` (ámbar, 5.02:1 sobre blanco)
  - Error/Veto/Contradicción: `#B91C1C` (carmesí, 6.40:1 sobre blanco)

---

## 2. Los 3 Paneles del Workbench Forense

### Panel Izquierdo: Perfil Vivo y Desglose Financiero Real
- Muestra el perfil del arrendatario (presupuesto máximo, mascotas, lavadora, luz natural).
- Barra comparativa de costo:
  - **Canon Publicado:** `$560.000 CLP`
  - **Gastos Comunes:** `$65.000 CLP`
  - **Comisión Corretaje Amortizada:** `$27.767 CLP/mes`
  - **Amortiguador Reajuste UF:** `$10.640 CLP/mes`
  - **COSTO MENSUAL REAL (Año 1):** `$663.407 CLP/mes (+18.5%)`
- **Banner de Veto Duro:** Si `is_vetoed === true`, muestra tarjeta destacada en rojo con el veredicto (`VETOED_BY_CONSTRAINT` o `VETOED_BY_BUDGET`) y las razones exactas.

### Panel Central: Visor Rayos-X (Fotos con Bounding Boxes + Visor PDF)
- **Visor de Fotos:** Muestra la foto seleccionada (ej. Foto 0 de la sala o Foto 1 del baño).
  - Superpone cajas interactivas usando las coordenadas `bbox_1000: { x_min, y_min, x_max, y_max }`:
    - `left: ${x_min / 10}%`
    - `top: ${y_min / 10}%`
    - `width: ${(x_max - x_min) / 10}%`
    - `height: ${(y_max - y_min) / 10}%`
  - Al pasar el cursor o hacer clic sobre una caja, muestra la explicación visual del defecto (ej. *"Filtración y Humedad Activa en Cielo de Baño"*).
- **Pestaña de Contrato PDF:** Muestra las cláusulas críticas del borrador con las trampas resaltadas (Cláusula 11 de mascotas y Cláusula 14 de multas).

### Panel Derecho: Rúbrica de 15 Checks, Contradicciones y Kit de Acción
- **Scorecard Dual:**
  - Calce Verificado (`45/100`)
  - Cobertura de Evidencia (`80%`)
  - Nivel de Transparencia (`ALTA_TRANSPARENCIA`)
- **Lista de Contradicciones Cruzadas (`[CONTRADICTION]`):**
  - Muestra las alertas en rojo (ej. *"Aviso promete 100% pet-friendly vs. Cláusula 11 del PDF que prohíbe animales"*).
- **Kit de Acción del Arrendatario:**
  - Botón *"Copiar Interrogatorio de WhatsApp para el Corredor"* (con feedback visual de copiado).
  - Acordeón de *"Contra-Cláusulas Legales Sugeridas (Redlines)"*.

---

## 3. Endpoints a Consumir
- `GET http://localhost:3000/api/health` -> Estado y saldo de API.
- `GET http://localhost:3000/api/fixtures/sample` -> Carga el caso Providencia en 1 clic.
- `POST http://localhost:3000/api/audit` -> Audita un nuevo aviso pegado por el usuario.
- `GET http://localhost:3000/api/properties` -> Lista de propiedades auditadas.
