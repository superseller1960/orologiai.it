import raw from '../../data/directory.json';
import { z } from 'zod';
import { directorySchema, services } from '../lib/schema';
import { MAX_MESSAGGIO, criteriSchema, cercaOrologiaio, interpretaConProvider, type Criteri, type EsitoRicerca, type RisultatoAttivita, type StatoOrari } from '../lib/assistant';

// Risposta dell'endpoint: solo criteri validati e la modalità reale usata.
const rispostaSchema = z.object({
  modalita: z.enum(['ai', 'non-configurato', 'fallback']),
  avviso: z.string().nullable(),
  criteri: criteriSchema,
  chiarimenti: z.array(z.string()).max(5),
});
type Modalita = 'ai' | 'non-configurato' | 'locale';
type Interpretazione = { criteri: Criteri; chiarimenti: string[]; avviso: string | null; modalita: Modalita };

const data = directorySchema.parse(raw);
const form = document.querySelector<HTMLFormElement>('#assistente-form');
const stato = document.querySelector<HTMLElement>('#assistente-stato');
const spiegazione = document.querySelector<HTMLElement>('#assistente-spiegazione');
const messaggi = document.querySelector<HTMLElement>('#assistente-messaggi');
const risultati = document.querySelector<HTMLElement>('#assistente-risultati');
const alternative = document.querySelector<HTMLElement>('#assistente-alternative');
const alternativeTitolo = document.querySelector<HTMLElement>('#assistente-alternative-titolo');
const contatore = document.querySelector<HTMLElement>('#assistente-contatore');
const posizioneBtn = document.querySelector<HTMLButtonElement>('#assistente-posizione');
const modalitaEl = document.querySelector<HTMLElement>('#assistente-modalita');

if (form && stato && spiegazione && messaggi && risultati && alternative && alternativeTitolo && contatore && posizioneBtn && modalitaEl) {
  // La posizione resta solo in memoria per la ricerca in corso: non viene salvata né inviata.
  let origine: { lat: number; lon: number } | undefined;
  const textarea = form.querySelector<HTMLTextAreaElement>('textarea[name="messaggio"]')!;
  const selectLocalita = form.querySelector<HTMLSelectElement>('select[name="localita"]')!;

  const ORARI: Record<StatoOrari, string> = {
    'indicato-oggi': 'Orari di oggi indicati dalla fonte',
    'fuori-orario-oggi': 'Fuori dall’orario indicato per oggi',
    'nessun-orario-oggi': 'Nessun orario indicato per oggi',
    'non-recente': 'Orari non recenti: contatta il negozio',
    'non-disponibile': 'Orari non disponibili: contatta il negozio',
  };

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };

  const updateCounter = () => { contatore.textContent = `${textarea.value.length} / ${MAX_MESSAGGIO} caratteri`; };
  textarea.addEventListener('input', updateCounter);
  updateCounter();

  document.querySelectorAll<HTMLButtonElement>('[data-esempio]').forEach(btn => {
    btn.addEventListener('click', () => {
      textarea.value = btn.dataset.esempio ?? '';
      updateCounter();
      textarea.focus();
    });
  });

  posizioneBtn.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      stato.textContent = 'Il browser non offre la posizione. Indica una città nel campo località.';
      return;
    }
    stato.textContent = 'Richiesta di posizione in corso…';
    navigator.geolocation.getCurrentPosition(
      pos => {
        origine = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        stato.textContent = 'Posizione ricevuta: sarà usata solo per questa ricerca.';
      },
      () => {
        origine = undefined;
        stato.textContent = 'Posizione non concessa. Puoi indicare una città o un indirizzo nel testo o nel campo località.';
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  });

  form.addEventListener('reset', () => {
    origine = undefined;
    setTimeout(() => { updateCounter(); clearResults(); stato.textContent = ''; }, 0);
  });

  const clearResults = () => {
    risultati.replaceChildren();
    alternative.replaceChildren();
    alternativeTitolo.hidden = true;
    messaggi.hidden = true;
    messaggi.replaceChildren();
    spiegazione.hidden = true;
    spiegazione.replaceChildren();
  };

  const riassunto = (c: Criteri): string => {
    const parti: string[] = [];
    if (c.servizio) parti.push(`servizio: ${services[c.servizio]}`);
    if (c.marca) parti.push(`marchio: ${c.marca}${c.ruoloMarca && c.ruoloMarca !== 'qualsiasi' ? ` (${c.ruoloMarca})` : ''}`);
    if (c.tipo) parti.push(`tipologia: ${c.tipo}`);
    if (c.specializzazione) parti.push(`specializzazione: ${c.specializzazione}`);
    if (c.localita) parti.push(`comune: ${data.localita.find(p => p.id === c.localita)?.comune ?? c.localita}`);
    if (c.apertoOggi) parti.push('aperto oggi (solo orari verificati)');
    if (c.distanzaMaxKm) parti.push(`entro ${c.distanzaMaxKm} km`);
    return parti.length ? `Ho interpretato la richiesta come: ${parti.join(' · ')}.` : '';
  };

  const card = (r: RisultatoAttivita): HTMLElement => {
    const li = el('li', undefined, 'card');
    li.dataset.businessId = r.id;
    const top = el('div', undefined, 'card-top');
    top.append(el('span', `${r.comune}`, 'eyebrow dark'), el('span', r.stato, 'status'));
    const h = el('h3');
    const a = el('a', r.nome);
    a.href = r.href;
    h.append(a);
    li.append(top, h);
    if (r.indirizzo) li.append(el('p', r.indirizzo, 'small muted'));
    if (r.distanzaKm !== null) li.append(el('p', `Distanza in linea d’aria stimata: ${r.distanzaKm} km (non è il percorso stradale).`, 'small'));
    if (r.telefono) {
      const p = el('p', undefined, 'small');
      const tel = el('a', `Tel. ${r.telefono}`);
      tel.href = `tel:${r.telefono.replace(/[^+\d]/g, '')}`;
      p.append(tel);
      li.append(p);
    }
    if (r.sito) {
      const p = el('p', undefined, 'small');
      const s = el('a', 'Sito ufficiale');
      s.href = r.sito;
      s.rel = 'noopener noreferrer';
      p.append(s);
      li.append(p);
    }
    if (r.motivi.length) {
      const ul = el('ul', undefined, 'small');
      for (const m of r.motivi) ul.append(el('li', m));
      li.append(el('p', 'Perché compare:', 'small'), ul);
    }
    if (r.attenzione.length) {
      const ul = el('ul', undefined, 'small muted');
      for (const m of r.attenzione) ul.append(el('li', m));
      li.append(ul);
    }
    li.append(el('p', `${ORARI[r.orari]}${r.verificataIl ? ` · scheda verificata il ${r.verificataIl}` : ''}. Non indica disponibilità per riparazioni o appuntamenti.`, 'small muted'));
    if (origine && r.coordinate) {
      const dir = el('a', 'Indicazioni stradali');
      // Il link è generato solo su azione dell'utente, con coordinate già presenti nella pagina.
      dir.href = `https://www.openstreetmap.org/directions?from=${origine.lat}%2C${origine.lon}&to=${r.coordinate.lat}%2C${r.coordinate.lon}`;
      dir.rel = 'noopener noreferrer';
      li.append(dir);
    }
    const scheda = el('a', 'Apri la scheda →');
    scheda.href = r.href;
    li.append(scheda);
    return li;
  };

  // Prova l'endpoint server-side; se non è raggiungibile o non valido, usa l'interpretazione locale dichiarandolo.
  const interpreta = async (testo: string): Promise<Interpretazione> => {
    const locale = async (avviso: string | null): Promise<Interpretazione> => {
      const r = await interpretaConProvider(testo, data, null);
      return { criteri: r.criteri, chiarimenti: r.chiarimenti, avviso, modalita: 'locale' };
    };
    let res: Response;
    try {
      res = await fetch('/api/orologiaio', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messaggio: testo }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return locale('Servizio AI non raggiungibile in questo ambiente: uso l’interpretazione locale.');
    }
    if (res.status === 429) return locale('Troppe richieste in poco tempo: uso l’interpretazione locale. Riprova tra un minuto.');
    if (!res.ok) return locale('Servizio AI non disponibile in questo momento: uso l’interpretazione locale.');
    const parsed = rispostaSchema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) return locale('Risposta del servizio non valida: uso l’interpretazione locale.');
    const { modalita, criteri, chiarimenti, avviso } = parsed.data;
    return {
      criteri,
      chiarimenti,
      avviso,
      modalita: modalita === 'ai' ? 'ai' : modalita === 'non-configurato' ? 'non-configurato' : 'locale',
    };
  };

  const mostraModalita = (m: Modalita) => {
    modalitaEl.hidden = false;
    modalitaEl.textContent = m === 'ai'
      ? 'Interpretazione: modello Gemini (Google AI). I risultati arrivano dal database di Orologiai.it.'
      : m === 'non-configurato'
        ? 'Interpretazione locale: il modello AI non è configurato su questo ambiente. I risultati arrivano dal database.'
        : 'Interpretazione locale (regole). I risultati arrivano dal database di Orologiai.it.';
  };

  const esegui = async (event: Event) => {
    event.preventDefault();
    clearResults();
    modalitaEl.hidden = true;
    const testo = textarea.value.trim();
    if (!testo) { stato.textContent = 'Scrivi una richiesta, oppure scegli un esempio.'; return; }
    if (testo.length > MAX_MESSAGGIO) { stato.textContent = `La richiesta supera ${MAX_MESSAGGIO} caratteri.`; return; }

    stato.setAttribute('aria-busy', 'true');
    stato.textContent = 'Sto cercando nel database…';
    try {
      const interp = await interpreta(testo);
      const criteri: Criteri = { ...interp.criteri };
      if (selectLocalita.value && !criteri.localita && !criteri.provincia && !criteri.regione && !criteri.localitaNonCensita) {
        criteri.localita = selectLocalita.value;
      }
      if (criteri.localita) delete criteri.bisognoPosizione;
      const esito: EsitoRicerca = cercaOrologiaio(data, criteri, { origine });
      mostraModalita(interp.modalita);
      mostra(esito, [...interp.chiarimenti, ...(interp.avviso ? [interp.avviso] : [])], riassunto(criteri));
      stato.textContent = esito.totale > 0 ? `${esito.totale} ${esito.totale === 1 ? 'attività pertinente' : 'attività pertinenti'}.` : '';
    } catch {
      messaggi.hidden = false;
      messaggi.textContent = 'Non è stato possibile completare la ricerca. Riprova, oppure usa la ricerca classica con i filtri.';
      stato.textContent = '';
    } finally {
      stato.setAttribute('aria-busy', 'false');
    }
  };

  const mostra = (esito: EsitoRicerca, extra: string[], riepilogo: string) => {
    if (riepilogo) { spiegazione.hidden = false; spiegazione.textContent = riepilogo; }
    const righe = [...extra, ...esito.messaggi];
    if (righe.length) {
      messaggi.hidden = false;
      for (const r of righe) messaggi.append(el('p', r));
    }
    for (const r of esito.risultati) risultati.append(card(r));
    if (esito.alternative.length) {
      alternativeTitolo.hidden = false;
      for (const r of esito.alternative) alternative.append(card(r));
    }
  };

  form.addEventListener('submit', esegui);
}
