import { workflow, node, trigger, sticky, newCredential, expr } from '@n8n/workflow-sdk';

const supabase = { supabaseApi: newCredential('Supabase · Bilans') };

const every10min = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: { name: 'Co 10 minut', parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 10 }] } }, position: [0, 0] },
  output: [{}],
});

const pending = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Leady pending_delivery',
    parameters: {
      method: 'GET',
      url: 'https://buvjolifagbjgouhmcxs.supabase.co/rest/v1/leads',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'status', value: 'eq.pending_delivery' },
          { name: 'created_at', value: expr('lt.{{ $now.minus(2, "minutes").toUTC().toISO() }}') },
          { name: 'select', value: 'id,created_at,intent,quote_input,quote,score,temperature,advisor_slug,situation,start_when,name,email,phone,message,consent_contact,consent_marketing' },
          { name: 'order', value: 'created_at.asc' },
          { name: 'limit', value: '20' },
        ],
      },
      options: {},
    },
    credentials: supabase,
    position: [240, 0],
  },
  output: [{ id: '6f1c', created_at: '2026-10-25T10:00:00Z', intent: 'pdf', quote_input: {}, quote: {}, score: 7, temperature: 'hot', advisor_slug: 'anna-bielecka', situation: 'switching', start_when: 'next-month', name: 'Anna', email: 'anna@example.com', phone: null, message: null, consent_contact: true, consent_marketing: false }],
});

const process = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Bilans · lead-created',
    parameters: {
      mode: 'each',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'okeWEINyCHuxR1Il', cachedResultName: 'Bilans · lead-created' },
      options: { waitForSubWorkflow: false },
    },
    position: [480, 0],
  },
  output: [{ id: '6f1c' }],
});

const markDelivered = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Oznacz jako doręczony',
    parameters: {
      method: 'POST',
      url: 'https://buvjolifagbjgouhmcxs.supabase.co/rest/v1/rpc/mark_lead_delivery',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ p_id: $("Leady pending_delivery").item.json.id, p_delivered: true, p_detail: { source: "n8n.lead-redelivery", execution: $execution.id } }) }}'),
      options: {},
    },
    credentials: supabase,
    position: [720, 0],
  },
  output: [{}],
});

const about = sticky(
  '## Bilans · lead-redelivery\nOutbox z ADR-005: gdy webhook z `/api/lead` nie dojdzie (n8n wyłączony, timeout 4 s), lead zostaje w bazie jako `pending_delivery`. Co 10 minut dociągamy do 20 takich leadów starszych niż 2 minuty i przepuszczamy przez **Bilans · lead-created** (wejście „Z lead-redelivery”). Idempotencja w `processed_webhooks` chroni przed podwójną wysyłką, gdy webhook jednak doszedł.',
  [pending, process, markDelivered],
  { color: 7 },
);

export default workflow('bilans-lead-redelivery', 'Bilans · lead-redelivery')
  .add(every10min)
  .to(pending)
  .to(process)
  .to(markDelivered)
  .add(about);
