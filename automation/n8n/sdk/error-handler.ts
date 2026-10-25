import { workflow, node, trigger, sticky, expr } from '@n8n/workflow-sdk';

const onError = trigger({
  type: 'n8n-nodes-base.errorTrigger',
  version: 1,
  config: { name: 'Błąd w workflow Bilans', position: [0, 0] },
  output: [{ execution: { id: '231', url: 'https://sm-art.app.n8n.cloud/workflow/okeWEINyCHuxR1Il/executions/231', lastNodeExecuted: 'Przejmij lead', error: { message: 'connect ECONNREFUSED' }, mode: 'webhook' }, workflow: { id: 'okeWEINyCHuxR1Il', name: 'Bilans · lead-created' } }],
});

const alert = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Alert na Telegram',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $vars.BILANS_TELEGRAM_CHAT_ID }}'),
      text: expr('⚠️ {{ $json.workflow.name }}\nWęzeł: {{ $json.execution.lastNodeExecuted ?? "?" }}\nBłąd: {{ String($json.execution.error?.message ?? "brak opisu").slice(0, 300) }}\nTryb: {{ $json.execution.mode }}\n{{ $json.execution.url ?? "" }}'),
      additionalFields: { appendAttribution: false, disable_web_page_preview: true },
    },
    credentials: { telegramApi: { id: 'U1PTOapogFAXwIvH', name: 'Telegram account' } },
    position: [240, 0],
  },
  output: [{ ok: true }],
});

const about = sticky(
  '## Bilans · error-handler\nUstawiony jako Error Workflow we wszystkich workflow Bilans. Alert idzie na czat z `BILANS_TELEGRAM_CHAT_ID`: nazwa workflow, węzeł, komunikat i link do wykonania. Bez danych z formularza - szczegóły są w wykonaniu w n8n.',
  [onError, alert],
  { color: 7 },
);

export default workflow('bilans-error-handler', 'Bilans · error-handler')
  .add(onError)
  .to(alert)
  .add(about);
