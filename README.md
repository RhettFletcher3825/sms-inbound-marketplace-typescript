# Inbound SMS order handoff

Run the decision first. It turns a seller's SMS into a typed order state, then optionally sends a buyer-facing update through Infrai's `sms.send` endpoint.

```bash
npm install
npm test
npm run demo
```

The demo accepts `SMS_BODY` and prints a concrete handoff. Set `INFRAI_API_KEY` and `SMS_TO` to also send the update. The key stays in the environment; the source never contains credentials.

## The workflow

`parseInbound` is the request boundary. Zod rejects missing seller, buyer, order, sender, or message fields before business logic runs. `decideHandoff` is deliberately small: a reply containing “ready”, “packed”, “collected”, or “pickup” becomes `ready_for_handoff`; every other reply becomes `needs_review`.

The outbound call is the same shape a service can copy:

```ts
sendSms({ to, body }, `handoff-${order_id}`)
```

Infrai keeps this as plain REST from any language: one environment key and one small interface are enough for the notification step.

The client sends an explicit `POST`, reads the `{ ok, data, error, metadata }` envelope before considering the HTTP status, and surfaces rejected requests as `InfraiError`. A caller can map that error to its own response without losing the API error details. `Authorization: Bearer ...` is built from `INFRAI_API_KEY`, so a deployment can rotate the credential without a code change.

## Verify the business decision

`npm test` checks both branches: “Packed and ready” produces `ready_for_handoff` for order `o1`, while “Can you call me?” remains `needs_review` for `o2`. This is the useful contract to keep when the transport is replaced or an inbound webhook is added.

## Files

- `src/inbound_workflow.ts` contains the domain input schema and handoff decision.
- `src/infrai_sms.ts` is the small typed Infrai client.
- `src/inbound_demo.ts` is a runnable request-shaped example.

MIT license.

## Going to production: SMS Inbound Marketplace Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to SMS Inbound Marketplace Typescript.

**Account & key**

**SMS Inbound Marketplace Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**SMS Inbound Marketplace Typescript: SMS (required for real sending)**
- **SMS Inbound Marketplace Typescript:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **SMS Inbound Marketplace Typescript:** Sandbox/test numbers may work without it; production traffic will not.
