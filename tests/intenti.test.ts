import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { interpretaConProvider, type AssistantProvider } from '../site/src/lib/assistant.ts';
import { directorySchema } from '../site/src/lib/schema.ts';

const dir = directorySchema.parse(JSON.parse(readFileSync('site/data/directory.json', 'utf8')));
const provider = (output: Record<string, unknown>): AssistantProvider => ({ async interpreta() { return output; } });

test('Domanda tecnica: nessun filtro commerciale e nessun servizio consigliato', async () => {
  const esito = await interpretaConProvider(
    'Come funziona il movimento automatico di un orologio?',
    dir,
    provider({ risposta: 'Il rotore carica la molla motrice con il movimento del polso.', intento: 'tecnica', servizio: 'riparazione-automatici', consiglioServizio: 'riparazione-automatici' }),
  );
  assert.equal(esito.consiglio, null, 'Una domanda tecnica non deve proporre un servizio');
  assert.equal(esito.criteri.servizio, undefined);
});

test('Domanda sulla storia di un marchio: nessun servizio proposto', async () => {
  const esito = await interpretaConProvider(
    'Quando è nata la Omega e che calibri usava negli anni Cinquanta?',
    dir,
    provider({ risposta: 'Omega nasce nel 1848 a La Chaux-de-Fonds.', intento: 'marca-storia', consiglioServizio: 'riparazione' }),
  );
  assert.equal(esito.consiglio, null);
});

test('Guasto dichiarato: il servizio pertinente resta proponibile', async () => {
  const esito = await interpretaConProvider(
    'Il mio orologio automatico si è fermato e non riparte, sono a Firenze',
    dir,
    provider({ risposta: 'Capisco: vediamo chi può intervenire.', intento: 'guasto', servizio: 'riparazione', consiglioServizio: 'riparazione' }),
  );
  assert.equal(esito.consiglio, 'riparazione');
  assert.equal(esito.criteri.localita, 'firenze');
});

test('Richiesta esplicita di una bottega: il servizio consigliato sopravvive', async () => {
  const esito = await interpretaConProvider(
    'Cerco un laboratorio per la revisione di un orologio a Milano',
    dir,
    provider({ risposta: 'Guardo le attività a Milano.', intento: 'servizio', servizio: 'revisione', consiglioServizio: 'revisione' }),
  );
  assert.equal(esito.consiglio, 'revisione');
  assert.equal(esito.criteri.localita, 'milano');
});
