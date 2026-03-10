# App Permutas - Plataforma JurSoc

Aplicacion web para estudiantes de la Facultad de Ciencias Juridicas y Sociales enfocada en:
- gestion de materias y comisiones,
- solicitudes de permuta con matching por prioridades,
- chat y notificaciones entre estudiantes,
- ranking docente y mapa de correlativas.

## Scripts

- `npm run dev`: desarrollo local.
- `npm run build`: compilacion TypeScript + bundle Vite.
- `npm run lint`: analisis estatico.
- `npm run test`: tests unitarios (Vitest).
- `npm run test:e2e`: smoke e2e (Playwright).
- `npm run preview`: preview del build.
- `npm run convex:dev`: levantar funciones Convex en desarrollo.
- `npm run convex:deploy`: deploy de funciones Convex.

## Arquitectura (frontend + Convex)

- `src/context/`: estado de dominio por modulo (`Auth`, `Requests`, `Chat`, `Notifications`, `Professors`, `Tour`).
- `src/pages/`: pantallas de producto.
- `src/components/`: componentes reutilizables y modales de flujo.
- `src/domain/`: reglas puras de negocio testeables (`requestMatching`, `scheduleRules`).
- `src/data/`: datasets de referencia no operativos (la fuente de verdad de negocio vive en Convex).
- `src/convex/`: proveedor y wiring del cliente Convex.
- `convex/`: schema y funciones backend (`users`, `subjects`, `requests`, `matches`, `chat`, `notifications`, `reviews`, `ranking`).

## Variables de entorno

- `VITE_CONVEX_URL`: URL del deployment Convex.
- `VITE_CONVEX_SITE_URL`: URL base para providers de Convex Auth.
- `CONVEX_DEPLOYMENT`: nombre de deployment (`dev:...` / `prod:...`).
- `VITE_SENTRY_DSN`: DSN de Sentry para monitoreo de errores en entorno de salida.

## Sprint 0 - Setup Convex (dev/prod)

1. Ejecutar `npm run convex:dev` y seguir el wizard para enlazar el proyecto local.
2. Confirmar que `convex/` contiene `schema.ts`, `auth.ts`, `http.ts` y módulos de dominio.
3. Configurar `VITE_CONVEX_URL` con tu deployment de desarrollo.
4. Verificar conectividad frontend: en el footer debe verse `Convex: online`.
5. Para producción, ejecutar `npm run convex:deploy` en pipeline o manualmente con credenciales de Convex.

Comandos de validación:
- `npm run convex:check` (estructura Convex y typecheck si hay `CONVEX_DEPLOYMENT`).
- `npm run test`
- `npm run build`

## Flujo funcional principal

1. Usuario se registra o inicia sesion.
2. Registra materias/comision con validaciones (cupo + conflictos horarios).
3. Crea solicitud de permuta con prioridades.
4. Motor de matching busca reciprocidad y marca solicitudes compatibles.
5. Ambas partes coordinan por chat y confirman intercambio.
6. Se cierra la permuta y se registra reseña.

## Criterios minimos de release

- Build y lint en verde.
- Tests unitarios en verde para reglas de negocio core.
- Sin bypass de autenticacion.
- Solicitudes con estados consistentes (`PENDING`, `MATCHED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
- Persistencia Convex consistente para sesion, inscripciones, solicitudes, chat, notificaciones, ranking y reseñas.

## Roadmap estratégico

Consultar `docs/sprints/roadmap-convex.md` para el plan completo por sprints (S0-S8), y `docs/release/` para runbook/checklist de salida.
