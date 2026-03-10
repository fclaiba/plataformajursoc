---
name: Cierre 100 checklist
overview: "Cerrar los gaps finales para dejar la app lista para operación: estabilizar chat realtime de matcheo, validar flujo real con 2 cuentas, reducir deuda de lint, endurecer CI/operación y pulir UX móvil."
todos:
  - id: close-chat-realtime
    content: Resolver definitivamente chat realtime en matcheo con trazas y validación 2 cuentas
    status: completed
  - id: run-real-e2e-two-accounts
    content: Validar flujo real MATCHED->chat->confirmación y documentar evidencia
    status: completed
  - id: clear-global-lint-debt
    content: Cerrar deuda global de lint por lotes y dejar lint en verde
    status: completed
  - id: production-hardening-ci-ops
    content: Endurecer CI smoke y validaciones operativas en admin dashboard
    status: completed
  - id: mobile-ux-final-pass
    content: Hacer barrido UX móvil final para footer/sticky y corregir regresiones
    status: completed
---

# Checklist Cierre 100%

## Prioridad 1: Chat realtime de matcheo (bloqueante)

- Instrumentar temporalmente trazas de chat (cliente y backend) para confirmar `requestId -> threadId -> messages` en tiempo real.
- Corregir cualquier desalineación final de suscripción/envío en:
- [c:\dev\app-permutas\src\context\ChatContext.tsx](c:\dev\app-permutas\src\context\ChatContext.tsx)
- [c:\dev\app-permutas\src\components\chat\ChatWindow.tsx](c:\dev\app-permutas\src\components\chat\ChatWindow.tsx)
- [c:\dev\app-permutas\convex\chat.ts](c:\dev\app-permutas\convex\chat.ts)
- Validar que ambos usuarios del mismo match leen/escriben sobre el mismo hilo compartido.

## Prioridad 2: QA funcional real (2 cuentas)

- Ejecutar script manual de punta a punta: `MATCHED -> chat -> finalize -> complete -> review`.
- Documentar evidencia mínima (pasos + resultado esperado/observado) en runbook/checklist:
- [c:\dev\app-permutas\docs\release\runbook.md](c:\dev\app-permutas\docs\release\runbook.md)
- [c:\dev\app-permutas\docs\release\checklist.md](c:\dev\app-permutas\docs\release\checklist.md)

## Prioridad 3: Deuda de lint global

- Atacar por lotes para no romper features:
- Convex (`convex/*.ts`)
- Contexts/pages críticos (`src/context/*`, `src/pages/*`)
- UI utilities (`src/components/ui/*`)
- Dejar `npm run lint` en verde al final del bloque.

## Prioridad 4: Hardening de producción

- Extender CI para smoke más fuerte y estable:
- [c:\dev\app-permutas\.github\workflows\ci.yml](c:\dev\app-permutas\.github\workflows\ci.yml)
- [c:\dev\app-permutas\tests\e2e\critical-flows.spec.ts](c:\dev\app-permutas\tests\e2e\critical-flows.spec.ts)
- Agregar validaciones operativas periódicas en dashboard admin (estado jobs + logs recientes):
- [c:\dev\app-permutas\convex\admin.ts](c:\dev\app-permutas\convex\admin.ts)
- [c:\dev\app-permutas\src\pages\admin\AdminDashboardPage.tsx](c:\dev\app-permutas\src\pages\admin\AdminDashboardPage.tsx)

## Prioridad 5: Pulido UX móvil (footer/sticky)

- Barrido visual en móviles de flujos críticos (`CreateRequest`, `MyRequests`, `Dashboard`, `Ranking`) y ajuste final de offsets de sticky/footer:
- [c:\dev\app-permutas\src\components\layout\Layout.tsx](c:\dev\app-permutas\src\components\layout\Layout.tsx)
- [c:\dev\app-permutas\src\components\layout\Footer.tsx](c:\dev\app-permutas\src\components\layout\Footer.tsx)
- [c:\dev\app-permutas\src\pages\requests\CreateRequestPage.tsx](c:\dev\app-permutas\src\pages\requests\CreateRequestPage.tsx)

## Criterio de salida

- Chat realtime validado en 2 cuentas sin refrescar.
- Flujo `MATCHED -> chat -> confirmación` validado completo.
- `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e` en verde.
- CI actualizado ejecutando smoke robusto.
- Sin superposición visual footer/sticky en móviles en flujos críticos.