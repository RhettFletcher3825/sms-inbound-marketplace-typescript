import { decideHandoff, parseInbound } from "./inbound_workflow.js";
import { sendSms } from "./infrai_sms.js";

const reply = parseInbound({
  seller_id: "seller-17", buyer_id: "buyer-204", order_id: "order-8841",
  from: "+15550001111", body: process.env.SMS_BODY ?? "Packed and ready for pickup"
});
const handoff = decideHandoff(reply);
console.log(JSON.stringify(handoff, null, 2));

if (process.env.SMS_TO) {
  const sent = await sendSms({ to: process.env.SMS_TO, body: `Order ${handoff.order_id}: ${handoff.status}` }, `handoff-${handoff.order_id}`);
  console.log(JSON.stringify({ notification: sent }, null, 2));
}
