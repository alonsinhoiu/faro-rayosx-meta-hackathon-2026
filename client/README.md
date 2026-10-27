# Client — FARO Rayos-X Workbench Forense

Vite + React 19 + Tailwind CSS v4 + Lucide React.

## Desarrollo

```bash
# Terminal 1 — API local (raíz del repo)
npm run build && npm run dev
# → http://localhost:3000

# Terminal 2 — frontend
cd client
npm install
npm run dev
# → http://localhost:5173 (proxy /api → :3000)
```

## Endpoints consumidos

- `GET /api/health` — indicador EN LÍNEA / SIN CONEXIÓN.
- `GET /api/fixtures/sample` — botón “Caso Providencia · 1 clic”.
- `POST /api/audit` — formulario “Auditar aviso” (perfil demo fijo).

Los desgloses financieros, vetos y scorecard se recalculan en cliente con
réplicas deterministas 1:1 de `src/validators/` (el LLM nunca calcula).
