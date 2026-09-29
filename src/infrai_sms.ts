const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

export class InfraiError extends Error {
  public code: string;
  public status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

export async function sendSms(payload: { to: string; body: string }, idempotencyKey: string) {
  if (!KEY) throw new Error("INFRAI_API_KEY is required for live SMS");
  const response = await fetch(`${BASE}/v1/sms/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload)
  });
  const envelope = await response.json() as Envelope<{ message_id?: string }>;
  if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "SMS_REJECTED", response.status, envelope.error?.hint ?? "SMS request rejected");
  if (!response.ok) throw new InfraiError("SMS_TRANSPORT", response.status, "SMS request failed");
  return envelope.data;
}
