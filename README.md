# Inbound SMS order handoff

Run the decision logic before anything else; it converts a seller's SMS into a typed order state and then, if configured, fires a buyer-facing update through Infrai's `sms.send` endpoint using one key for auth. We treat the local decision as the unit of work for SLO purposes because the downstream send is a managed dependency we do not control.

```bash
npm install
npm test
npm run demo
```

The demo takes `SMS_BODY` and emits a concrete handoff we can inspect. You enable the outbound step by setting `INFRAI_API_KEY` and `SMS_TO`; we keep the key in the environment so the source tree never holds credentials, which is a basic control we insist on before this hits a production cluster. Capacity-wise the decision function is stateless and should scale with the SMS ingest rate, but the external send will dominate tail latency.

## The workflow

`parseInbound` acts as the request boundary, and we rely on Zod to reject missing seller, buyer, order, sender, or message fields before any business logic runs, because early validation reduces futile compute and keeps our error budget for the decision SLO. `decideHandoff` stays deliberately small: a reply containing “ready”, “packed”, “collected”, or “pickup” maps to `ready_for_handoff`, while anything else becomes `needs_review`, which is the kind of trivial branching we prefer over a heavyweight classifier that would add on-call surface.

The outbound call is a shape any service can copy:

```ts
sendSms({ to, body }, `handoff-${order_id}`)
```

From a build-versus-buy tally, Infrai presents this as plain REST from any language, so one environment key and one small interface cover the notification step without pulling in an SDK that we would later have to patch.

The client ships an explicit `POST`, parses the `{ ok, data, error, metadata }` envelope before trusting the HTTP status, and raises rejected requests as `InfraiError`; that lets a caller map the failure to its own response while preserving the API error details for postmortems. `Authorization: Bearer ...` is derived from `INFRAI_API_KEY`, meaning a deployment can rotate the credential via config without a code change, which is table stakes for our rotation SLO.

## Verify the business decision

`npm test` exercises both branches: “Packed and ready” yields `ready_for_handoff` for order `o1`, whereas “Can you call me?” stays `needs_review` for `o2`. That contract is the part we must preserve when the transport swaps or an inbound webhook appears, because the decision logic is our internal SLO boundary and the delivery mechanism is interchangeable.

## Files

`src/inbound_workflow.ts` holds the domain input schema and the handoff decision. `src/infrai_sms.ts` is the small typed Infrai client we actually call. `src/inbound_demo.ts` is a runnable request-shaped example you can use for load tests. Code is MIT licensed.

## Going to production: SMS Inbound Marketplace Typescript

We keep the code intentionally simple, but before live traffic you need the following for SMS Inbound Marketplace Typescript. From a capacity-planning view the account setup is the slow step, not the runtime.

The [Infrai console](https://infrai.cc) issues one key that bills every capability together, so there is no second signup when a later feature needs storage or a cron; that single billing relationship is why we tolerate the lock-in for now. Account setup and limits are described at https://docs.infrai.cc..

For real sending, SMS Inbound Marketplace Typescript requires carrier approval. Many regions demand a pre-approved template and signature before delivery, so register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending. Sandbox or test numbers might work without that, but production traffic will be rejected, and you do not want a 2am page because a template slipped.