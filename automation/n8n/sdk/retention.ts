import { workflow, node, trigger, sticky, placeholder, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const supabase = { supabaseApi: newCredential('Supabase · Bilans') };

const nightly = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: { name: 'Codziennie o 3:00', parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 3, triggerAtMinute: 0 }] } }, position: [0, 0] },
  output: [{}],
});

const purge = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'purge_expired_leads()',
    parameters: {
      method: 'POST',
      url: 'https://buvjolifagbjgouhmcxs.supabase.co/rest/v1/rpc/purge_expired_leads',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'supabaseApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: '{}',
      options: { response: { response: { fullResponse: true } } },
    },
    credentials: supabase,
    position: [240, 0],
  },
  output: [{ statusCode: 200, body: 2 }],
});

const anyDeleted = ifElse({
  version: 2.2,
  config: {
    name: 'Usunięto coś?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ Number($json.body) }}'), operator: { type: 'number', operation: 'gt' }, rightValue: 0 }],
        combinator: 'and',
      },
    },
    position: [480, 0],
  },
});

const report = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Raport retencji',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: placeholder('ID czatu Telegram biura'),
      text: expr('🗑️ Bilans · retencja RODO: usunięto {{ Number($json.body) }} leadów starszych niż 12 miesięcy ({{ $now.setZone("Europe/Warsaw").toFormat("dd.LL.yyyy") }}).'),
      additionalFields: { appendAttribution: false },
    },
    credentials: { telegramApi: { id: 'U1PTOapogFAXwIvH', name: 'Telegram account' } },
    position: [720, -80],
  },
  output: [{ ok: true }],
});

const about = sticky(
  '## Bilans · retention\nRODO: lead żyje 12 miesięcy (`purge_after` ustawia API). Codziennie o 3:00 funkcja `purge_expired_leads()` usuwa przeterminowane wiersze - `lead_events` znika kaskadowo. Raport na Telegram tylko wtedy, gdy coś usunięto.',
  [purge, anyDeleted, report],
  { color: 7 },
);

export default workflow('bilans-retention', 'Bilans · retention')
  .add(nightly)
  .to(purge)
  .to(anyDeleted.onTrue(report))
  .add(about);
