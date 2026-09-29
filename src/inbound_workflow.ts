import { z } from "zod";

export const inboundReply = z.object({
  seller_id: z.string().min(1),
  buyer_id: z.string().min(1),
  order_id: z.string().min(1),
  body: z.string().trim().min(1),
  from: z.string().min(1)
});

export type InboundReply = z.infer<typeof inboundReply>;
export type Handoff = { order_id: string; seller_id: string; buyer_id: string; status: "ready_for_handoff" | "needs_review"; note: string };

export function decideHandoff(input: InboundReply): Handoff {
  const normalized = input.body.toLowerCase();
  const ready = /\b(ready|packed|collected|pickup)\b/.test(normalized);
  return {
    order_id: input.order_id,
    seller_id: input.seller_id,
    buyer_id: input.buyer_id,
    status: ready ? "ready_for_handoff" : "needs_review",
    note: ready ? "Seller confirmed the asset is ready." : "Reply needs a coordinator review."
  };
}

export function parseInbound(body: unknown): InboundReply { return inboundReply.parse(body); }
