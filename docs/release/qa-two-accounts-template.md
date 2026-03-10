# QA Real 2 Cuentas (MATCHED -> Chat -> Confirmacion)

Fecha: 2026-02-25 (actualizado)
Entorno: local (`http://localhost:5173`)
Deployment Convex: `tremendous-bandicoot-736`
Cuenta A (email): `qa.a.jursoc@example.com`
Cuenta B (email): Pendiente de ejecucion en sesion aislada

## Paso a paso
- [x] A crea solicitud.
- [ ] B crea solicitud reciproca.
- [ ] Ambas solicitudes quedan en `MATCHED`.
- [ ] A abre chat y envia mensaje.
- [ ] B ve mensaje en tiempo real sin refrescar.
- [ ] B responde mensaje.
- [ ] A ve respuesta en tiempo real sin refrescar.
- [ ] A confirma intercambio.
- [ ] B confirma intercambio.
- [ ] Estado final pasa a `CONFIRMED/COMPLETED` segun flujo.
- [ ] A envia review.
- [ ] B envia review.

## Evidencia minima
- IDs request A/B: `A=<creada en entorno local>`, `B=<pendiente de corrida aislada>`
- ThreadId observado: `<pendiente>`
- Resultado final: FAIL (bloqueante operativo)
- Error observado (si aplica): No se pudo completar corrida realtime A/B porque esta ejecucion se realizo con una sola sesion de navegador autenticada; falta validacion en dos sesiones aisladas simultaneas para confirmar mensajes sin refresh.
- Nota de dominio: se ajusto backend para cierre automatico bilateral (`COMPLETED` solo cuando ambos confirman) y reseña valida unicamente en `COMPLETED`.
- Logs operativos consultados (`domain=chat`): NO

## Evidencia automatizada adicional
- `tests/e2e/exchange-flow.spec.ts`: PASS
- Flujo validado en 2 contextos de navegador:
  - registro de 2 usuarios,
  - escenario matcheado,
  - mensaje texto,
  - imagen en chat,
  - doble confirmacion,
  - reseñas cruzadas,
  - impacto visible en reputacion/perfil.
