import test from "node:test";
import assert from "node:assert/strict";
import { decideHandoff, parseInbound } from "./inbound_workflow.js";

test("packed seller reply moves the order to handoff", () => {
  const input = parseInbound({ seller_id: "s1", buyer_id: "b1", order_id: "o1", from: "+1", body: "Packed and ready" });
  assert.deepEqual(decideHandoff(input), { order_id: "o1", seller_id: "s1", buyer_id: "b1", status: "ready_for_handoff", note: "Seller confirmed the asset is ready." });
});

test("unclear reply stays with review", () => {
  const input = parseInbound({ seller_id: "s1", buyer_id: "b1", order_id: "o2", from: "+1", body: "Can you call me?" });
  assert.equal(decideHandoff(input).status, "needs_review");
});
