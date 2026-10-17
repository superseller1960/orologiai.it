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

const chat = document.querySelector<HTMLElement>('#assistente-chat');
const form = document.querySelector<HTMLFormElement>('#assistente-form');
const textarea = document.querySelector<HTMLTextAreaElement>('#assistente-messaggio');
const inviaBtn = document.querySelector<HTMLButtonElement>('#assistente-invia');
const contatore = document.querySelector<HTMLElement>('#assistente-contatore');
const stato = document.querySelector<HTMLElement>('#assistente-stato');
const modalitaEl = document.querySelector<HTMLElement>('#assistente-modalita');
const suggerimentiBox = document.querySelector<HTMLElement>('#assistente-suggerimenti');
const campoErrore = document.querySelector<HTMLElement>('#assistente-campo-errore');

if (chat && form && textarea && inviaBtn && contatore && stato && modalitaEl && suggerimentiBox && campoErrore) {
  // La posizione resta solo in memoria per la ricerca in corso: non viene salvata né inviata.
  let origine: { lat: number; lon: number } | undefined;
  let inviando = false;
  let ultimiCriteri: Criteri = {};
  let ultimoTesto = '';

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

  const scorri = () => { chat.scrollTop = chat.scrollHeight; };
  const annuncia = (testo: string) => { stato.textContent = testo; };

  const aggiornaContatore = () => { contatore.textContent = `${textarea.value.length} / ${MAX_MESSAGGIO} caratteri`; };
  const aggiornaInvia = () => { inviaBtn.disabled = inviando || textarea.value.trim().length === 0; };
  const altezzaAutomatica = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  };
  const aggiornaComposer = () => { aggiornaContatore(); aggiornaInvia(); altezzaAutomatica(); };

  const mostraCampoErrore = (testo: string | null) => {
    campoErrore.hidden = testo === null;
    campoErrore.textContent = testo ?? '';
  };

  const bolla = (autore: 'utente' | 'assistente', classe = ''): HTMLElement => {
    const article = el('article', undefined, `msg msg-${autore === 'utente' ? 'utente' : 'bot'}${classe ? ` ${classe}` : ''}`);
    if (autore === 'assistente') article.append(el('p', 'Orologiaio', 'msg-autore'));
    return article;
  };

  const messaggioUtente = (testo: string) => {
    const article = bolla('utente');
    const p = el('p', testo, 'msg-testo');
    article.append(p);
    chat.append(article);
    scorri();
  };

  const messaggioAssistente = (righe: string[], extra?: (contenitore: HTMLElement) => void, classe = '') => {
    const article = bolla('assistente', classe);
    for (const riga of righe) article.append(el('p', riga, 'msg-testo'));
    if (extra) extra(article);
    chat.append(article);
    scorri();
    return article;
  };

  const chip = (testo: string, azione: () => void, classe = 'chip'): HTMLButtonElement => {
    const bottone = el('button', testo, classe);
    bottone.type = 'button';
    bottone.addEventListener('click', azione);
    return bottone;
  };

  const chipLista = (voci: { testo: string; azione: () => void }[]): HTMLElement => {
    const ul = el('ul', undefined, 'chips');
    for (const voce of voci) {
      const li = el('li');
      li.append(chip(voce.testo, voce.azione));
      ul.append(li);
    }
    return ul;
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
    const li = el('li', undefined, 'chat-result');
    li.dataset.businessId = r.id;
    const top = el('div', undefined, 'chat-result-top');
    top.append(el('span', r.comune, 'chat-result-comune'), el('span', r.stato, 'status'));
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
    const scheda = el('a', 'Apri la scheda →', 'chat-result-link');
    scheda.href = r.href;
    li.append(scheda);
    return li;
  };

  const listaRisultati = (voci: RisultatoAttivita[]): HTMLElement => {
    const ul = el('ul', undefined, 'chat-results');
    for (const r of voci) ul.append(card(r));
    return ul;
  };

  const mostraModalita = (m: Modalita) => {
    modalitaEl.hidden = false;
    modalitaEl.textContent = m === 'ai' ? 'Risposte con AI Gemini' : 'Interpretazione locale';
    modalitaEl.className = `chat-badge chat-badge-${m === 'ai' ? 'ai' : 'locale'}`;
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
      return locale('Servizio AI non raggiungibile in questo momento: ho usato l’interpretazione locale. I risultati arrivano comunque dal database.');
    }
    if (res.status === 429) return locale('Troppe richieste in poco tempo: ho usato l’interpretazione locale. Riprova tra un minuto.');
    if (!res.ok) return locale('Servizio AI non disponibile in questo momento: ho usato l’interpretazione locale.');
    const parsed = rispostaSchema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) return locale('Il servizio ha risposto in modo non valido: ho usato l’interpretazione locale.');
    const { modalita, criteri, chiarimenti, avviso } = parsed.data;
    return { criteri, chiarimenti, avviso, modalita: modalita === 'ai' ? 'ai' : modalita === 'non-configurato' ? 'non-configurato' : 'locale' };
  };

  // Continuità: la località si mantiene, gli altri criteri restano solo se la nuova frase non ne propone di nuovi.
  const combinaCriteri = (nuovi: Criteri): { criteri: Criteri; ereditati: string[] } => {
    const temaNuovo = (['servizio', 'marca', 'tipo', 'specializzazione', 'apertoOggi'] as const).some(k => nuovi[k] !== undefined);
    const criteri: Criteri = temaNuovo ? {} : { ...ultimiCriteri };
    for (const [chiave, valore] of Object.entries(nuovi) as [keyof Criteri, Criteri[keyof Criteri]][]) {
      if (valore !== undefined) (criteri as Record<string, unknown>)[chiave] = valore;
    }
    if (temaNuovo && !criteri.localita && !criteri.localitaNonCensita && ultimiCriteri.localita) criteri.localita = ultimiCriteri.localita;
    if (criteri.localita) delete criteri.bisognoPosizione;
    const ereditati = (Object.keys(criteri) as (keyof Criteri)[])
      .filter(k => nuovi[k] === undefined && criteri[k] !== undefined)
      .map(k => String(k));
    return { criteri, ereditati };
  };

  const etichettaCriterio = (chiave: string, c: Criteri): string => {
    switch (chiave) {
      case 'localita': return `comune: ${data.localita.find(p => p.id === c.localita)?.comune ?? c.localita}`;
      case 'servizio': return `servizio: ${c.servizio ? services[c.servizio] : ''}`;
      case 'marca': return `marchio: ${c.marca ?? ''}`;
      case 'tipo': return `tipologia: ${c.tipo ?? ''}`;
      case 'specializzazione': return `specializzazione: ${c.specializzazione ?? ''}`;
      case 'apertoOggi': return 'aperto oggi';
      default: return chiave;
    }
  };

  const riprova = (testo: string) => () => { void invia(testo, { ripetizione: true }); };

  const chiediPosizione = (testo: string, bottone: HTMLButtonElement) => {
    if (!('geolocation' in navigator)) {
      messaggioAssistente(['Il browser non offre la posizione. Puoi indicare una città o un indirizzo nel messaggio, per esempio “revisione a Firenze”.']);
      return;
    }
    bottone.disabled = true;
    annuncia('Richiesta della posizione in corso…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        origine = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        void invia(testo, { ripetizione: true });
      },
      () => {
        origine = undefined;
        bottone.disabled = false;
        messaggioAssistente(['Posizione non concessa dal browser. Scrivi una città o un indirizzo e cerco lì, oppure riprova con la posizione.']);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const invia = async (testoGrezzo: string, opzioni: { ripetizione?: boolean } = {}) => {
    if (inviando) return;
    const testo = testoGrezzo.trim();
    if (!testo) { mostraCampoErrore('Scrivi una richiesta, oppure scegli uno dei suggerimenti.'); aggiornaInvia(); return; }
    if (testo.length > MAX_MESSAGGIO) { mostraCampoErrore(`La richiesta supera ${MAX_MESSAGGIO} caratteri: accorciala di ${testo.length - MAX_MESSAGGIO}.`); annuncia(`La richiesta supera ${MAX_MESSAGGIO} caratteri.`); return; }

    mostraCampoErrore(null);
    inviando = true;
    ultimoTesto = testo;
    aggiornaInvia();
    suggerimentiBox.hidden = true;
    textarea.value = '';
    aggiornaComposer();
    if (!opzioni.ripetizione) messaggioUtente(testo);

    const caricamento = bolla('assistente', 'msg-loading');
    caricamento.append(el('span', undefined, 'dots'));
    caricamento.append(el('span', 'Sto cercando nel database…', 'msg-loading-testo'));
    chat.append(caricamento);
    chat.setAttribute('aria-busy', 'true');
    annuncia('Sto cercando nel database…');
    scorri();

    try {
      const interp = await interpreta(testo);
      const { criteri, ereditati } = combinaCriteri(interp.criteri);
      const esito: EsitoRicerca = cercaOrologiaio(data, criteri, { origine });
      ultimiCriteri = criteri;
      mostraModalita(interp.modalita);

      const righe: string[] = [];
      const riepilogo = riassunto(criteri);
      if (riepilogo) righe.push(riepilogo);
      if (ereditati.length) righe.push(`Ho mantenuto dalla richiesta precedente: ${ereditati.map(k => etichettaCriterio(k, criteri)).join(' · ')}.`);
      if (interp.avviso) righe.push(interp.avviso);
      righe.push(...interp.chiarimenti, ...esito.messaggi);
      if (!righe.length && !esito.risultati.length) righe.push('Non ho trovato attività con questi criteri. Prova a indicare una località o un servizio diverso.');

      caricamento.remove();
      const risposta = messaggioAssistente(righe);

      if (esito.stato === 'serve-posizione') {
        const azione = chip('Usa la mia posizione', () => undefined);
        azione.addEventListener('click', () => chiediPosizione(testo, azione));
        const ul = el('ul', undefined, 'chips');
        const li = el('li');
        li.append(azione);
        ul.append(li);
        risposta.append(ul);
      }

      if (esito.risultati.length) {
        risposta.append(listaRisultati(esito.risultati));
        if (esito.totale > esito.risultati.length) risposta.append(el('p', `Mostro ${esito.risultati.length} attività su ${esito.totale}. Aggiungi un criterio per restringere.`, 'small muted'));
      }
      if (esito.alternative.length) {
        const titolo = el('p', 'Alternative da verificare (non autorizzate)', 'msg-sottotitolo');
        risposta.append(titolo, listaRisultati(esito.alternative));
      }
      if (ereditati.length) {
        risposta.append(chipLista([{ testo: 'Ricomincia da zero', azione: () => {
          ultimiCriteri = {};
          messaggioAssistente(['Va bene, ripartiamo: dimmi che cosa ti serve e cerco senza i criteri precedenti.']);
          annuncia('Criteri precedenti azzerati.');
        } }]));
      }
      if (interp.avviso) {
        risposta.append(chipLista([{ testo: 'Riprova con il servizio AI', azione: riprova(testo) }]));
      }

      annuncia(esito.totale > 0 ? `${esito.totale} ${esito.totale === 1 ? 'attività pertinente trovata' : 'attività pertinenti trovate'}.` : 'Nessuna attività trovata con questi criteri.');
    } catch {
      caricamento.remove();
      const errore = messaggioAssistente(['Non sono riuscito a completare la ricerca: si è verificato un errore imprevisto. Puoi riprovare o usare la ricerca con i filtri.'], undefined, 'msg-errore');
      errore.append(chipLista([{ testo: 'Riprova', azione: riprova(testo) }]));
      annuncia('Errore durante la ricerca.');
    } finally {
      inviando = false;
      chat.setAttribute('aria-busy', 'false');
      aggiornaInvia();
      altezzaAutomatica();
    }
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    void invia(textarea.value);
  });

  textarea.addEventListener('input', () => { aggiornaComposer(); if (!campoErrore.hidden) mostraCampoErrore(null); });
  textarea.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    // Su telefono e desktop Invio invia; Maiusc + Invio va a capo.
    event.preventDefault();
    if (inviando) return;
    void invia(textarea.value);
  });

  for (const bottone of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-suggerimento]'))) {
    bottone.addEventListener('click', () => { void invia(bottone.dataset.suggerimento ?? ''); });
  }

  form.addEventListener('reset', () => { ultimiCriteri = {}; origine = undefined; setTimeout(aggiornaComposer, 0); });

  aggiornaComposer();
}
