import raw from '../../data/directory.json';
import { z } from 'zod';
import { directorySchema, services } from '../lib/schema';
import { MAX_MESSAGGIO, criteriSchema, cercaOrologiaioPreciso, combinaCriteri as aggiornaCriteri, interpretaRichiesta, interpretaConProvider, type Criteri, type EsitoRicerca, type RisultatoAttivita, type StatoOrari } from '../lib/assistant';
import { REGIONI_ITALIA } from '../lib/geo';

// Risposta dell'endpoint: solo criteri validati e la modalità reale usata.
  const rispostaSchema = z.object({
  modalita: z.enum(['ai', 'non-configurato', 'fallback']),
  avviso: z.string().nullable(),
  risposta: z.string().max(500).nullable(),
  consiglio: z.enum(Object.keys(services) as [keyof typeof services, ...(keyof typeof services)[]]).nullable().optional(),
  criteri: criteriSchema,
  chiarimenti: z.array(z.string()).max(5),
});
type Modalita = 'ai' | 'non-configurato' | 'locale';
type Interpretazione = { criteri: Criteri; chiarimenti: string[]; avviso: string | null; modalita: Modalita; risposta: string | null; consiglio: keyof typeof services | null };

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
  let nazionale=false;

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
    if (c.localitaNonCensita) parti.push(`comune non ancora censito: ${c.localitaNonCensita}`);
    if (c.provincia) parti.push(`provincia: ${c.provincia}`);
    if (c.regione) parti.push(`regione: ${REGIONI_ITALIA[c.regione]?.nome ?? c.regione}`);
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
    // Fonte esterna già censita: il testo viene recuperato dal Worker solo su richiesta, con l'URL
    // registrato nel catalogo (nessuna ricerca web generale, nessun URL arbitrario).
    const schedaAttivita = data.attivita.find(b => b.id === r.id);
    const fonte = schedaAttivita ? data.fonti.find(f => schedaAttivita.attendibilita.fonti.includes(f.id)) : undefined;
    if (fonte) {
      const dettagli = el('details', undefined, 'chat-fonte');
      const sommario = el('summary', 'Leggi la fonte esterna');
      const corpo = el('p', 'Recupero la pagina citata nella scheda…', 'small muted');
      const link = el('a', 'Apri la fonte originale ↗');
      link.href = fonte.url;
      link.rel = 'noopener noreferrer';
      let caricata = false;
      dettagli.addEventListener('toggle', () => {
        if (!dettagli.open || caricata) return;
        caricata = true;
        void (async () => {
          try {
            const res = await fetch(`/api/fonte?url=${encodeURIComponent(fonte.url)}`, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) { corpo.textContent = 'La fonte non è raggiungibile in questo momento: apri il collegamento originale.'; return; }
            const dati = (await res.json()) as { snippet?: string; recuperatoIl?: string };
            corpo.textContent = dati.snippet
              ? `«${dati.snippet}» · testo della fonte esterna recuperato il ${dati.recuperatoIl}, distinto dai dati del catalogo.`
              : 'La fonte non contiene testo leggibile: apri il collegamento originale.';
          } catch {
            corpo.textContent = 'Recupero non riuscito: apri il collegamento originale.';
          }
        })();
      });
      dettagli.append(sommario, corpo, link);
      li.append(dettagli);
    }
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
    modalitaEl.textContent = m === 'ai' ? 'AI attiva' : m === 'non-configurato' ? 'AI da configurare · ricerca locale' : 'Ricerca locale';
    modalitaEl.className = `chat-badge chat-badge-${m === 'ai' ? 'ai' : 'locale'}`;
  };

  // Prova l'endpoint server-side; se non è raggiungibile o non valido, usa l'interpretazione locale dichiarandolo.
  const interpreta = async (testo: string): Promise<Interpretazione> => {
    const locale = async (avviso: string | null): Promise<Interpretazione> => {
      const r = await interpretaConProvider(testo, data, null, undefined, ultimiCriteri);
      return { criteri: r.criteri, chiarimenti: r.chiarimenti, avviso, modalita: 'locale', risposta: null, consiglio: null };
    };
    let res: Response;
    try {
      res = await fetch('/api/orologiaio', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Il contesto (criteri già confermati) parte col messaggio: il server lo valida come i criteri.
        body: JSON.stringify({ messaggio: testo, contesto: Object.keys(ultimiCriteri).length ? ultimiCriteri : undefined }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return locale('Servizio AI non raggiungibile in questo momento: ho usato l’interpretazione locale. I risultati arrivano comunque dal database.');
    }
    if (res.status === 429) return locale('Troppe richieste in poco tempo: ho usato l’interpretazione locale. Riprova tra un minuto.');
    if (!res.ok) return locale('Servizio AI non disponibile in questo momento: ho usato l’interpretazione locale.');
    const parsed = rispostaSchema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) return locale('Il servizio ha risposto in modo non valido: ho usato l’interpretazione locale.');
    const { modalita, criteri, chiarimenti, avviso, risposta, consiglio } = parsed.data;
    return { criteri, chiarimenti, avviso, risposta, consiglio: consiglio ?? null, modalita: modalita === 'ai' ? 'ai' : modalita === 'non-configurato' ? 'non-configurato' : 'locale' };
  };

  const etichettaCriterio = (chiave: string, c: Criteri): string => {
    switch (chiave) {
      case 'localita': return `comune: ${data.localita.find(p => p.id === c.localita)?.comune ?? c.localita}`;
      case 'servizio': return `servizio: ${c.servizio ? services[c.servizio] : ''}`;
      case 'regione': return `regione: ${c.regione ? REGIONI_ITALIA[c.regione]?.nome ?? c.regione : ''}`;
      case 'provincia': return `provincia: ${c.provincia ?? ''}`;
      case 'localitaNonCensita': return `comune non ancora censito: ${c.localitaNonCensita ?? ''}`;
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
      // I criteri dei soli nuovi messaggi, senza il contesto: servono al riepilogo e al ripiego.
      const nuovi = interpretaRichiesta(testo, data).criteri;
      const uniti = aggiornaCriteri(ultimiCriteri, interp.criteri, testo);
      // Se il contesto ereditato azzera i risultati ma la nuova richiesta da sola ne ha, si usano i soli criteri nuovi.
      // Il contesto precedente è dichiarato solo se esisteva già: al primo messaggio è vuoto.
      if(/\b(?:ricomincia|ripartiamo|nuova ricerca|azzera)\b/i.test(testo))nazionale=false;
      if(/\b(?:tutta italia|tutta l['’ ]italia|ovunque|tutte le regioni)\b/i.test(testo))nazionale=true;
      if(nuovi.localita||nuovi.provincia||nuovi.regione||nuovi.localitaNonCensita)nazionale=false;
      const criteri: Criteri = uniti;
      const informativa = interp.criteri.intento === 'tecnica' || interp.criteri.intento === 'marca-storia' || interp.criteri.intento === 'aggiornata' || (/\b(?:come funziona|cosa significa|che cos|a cosa serve)\b/i.test(testo)&&!nuovi.servizio);
      const esito: EsitoRicerca = informativa ? {stato:'nessun-criterio',totale:0,risultati:[],alternative:[],messaggi:[]} : cercaOrologiaioPreciso(data,criteri,{origine,nazionale});
      const ereditati=(Object.keys(criteri) as (keyof Criteri)[]).filter(k=>k!=='intento'&&nuovi[k]===undefined&&criteri[k]!==undefined).map(String);
      if (!informativa) ultimiCriteri = criteri;
      mostraModalita(interp.modalita);

      const righe: string[] = [];
      // Il testo conversazionale del modello (se presente) apre la bolla: è di per sé il riconoscimento della richiesta.
      if (informativa && interp.risposta) righe.push(interp.risposta);
      else if(informativa)righe.push('Posso aiutarti a individuare il servizio più adatto, ma per questa domanda tecnica mi serve qualche dettaglio in più. Che tipo di orologio hai e che cosa vuoi capire?');
      const riepilogo = riassunto(criteri);
      if (!informativa && riepilogo) righe.push(riepilogo);
      if (interp.avviso) righe.push(interp.avviso);
      // I chiarimenti del parser restano: in fallback sono l'unica voce; con il modello guidano il passo successivo.
      if(!informativa)righe.push(...esito.messaggi);
      if (!righe.length && !esito.risultati.length) righe.push('Non ho ancora trovato attività con questi criteri: indica una località o un servizio diverso.');

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
        scorri();
      }
      if(!informativa && esito.stato==='nessun-criterio' && (criteri.servizio||criteri.marca) && !criteri.localita&&!criteri.provincia&&!criteri.regione&&!criteri.cap){risposta.append(chipLista([{testo:'Cerca in tutta Italia',azione:()=>{void invia('Cerca in tutta Italia');}}]));}
      if(!informativa&&esito.stato==='nessun-risultato'&&(criteri.localita||criteri.provincia||criteri.regione)){
        const luogo=data.localita.find(p=>p.id===criteri.localita);
        const azioni:{testo:string;azione:()=>void}[]=[];
        if(luogo)azioni.push({testo:'Amplia alla provincia di '+luogo.provincia,azione:()=>{void invia('Cerca nella provincia di '+luogo.provincia);}});
        azioni.push({testo:'Cerca in tutta Italia',azione:()=>{void invia('Cerca in tutta Italia');}});risposta.append(chipLista(azioni));
      }
      if (ereditati.length || !informativa) {
        risposta.append(chipLista([{ testo: 'Ricomincia da zero', azione: () => {
          ultimiCriteri = {}; nazionale=false; origine=undefined;
          messaggioAssistente(['Va bene, ripartiamo: dimmi che cosa ti serve e cerco senza i criteri precedenti.']);
          annuncia('Criteri precedenti azzerati.');
        } }]));
      }
      if (interp.avviso) {
        risposta.append(chipLista([{ testo: 'Riprova con il servizio AI', azione: riprova(testo) }]));
      }
      // Suggerimento di filtro: porta alla stessa ricerca, senza inventare attività.
      if (informativa && interp.consiglio && criteri.servizio !== interp.consiglio) {
        const servizio = interp.consiglio;
        const query = new URLSearchParams({ servizio });
        if (criteri.localita) query.set('localita', criteri.localita);
        risposta.append(chipLista([{ testo: `Cerca «${services[servizio]}» con i filtri`, azione: () => { location.href = `/cerca/?${query.toString()}`; } }]));
      }

      // Con zero corrispondenze esatte ma alternative mostrate, l'annuncio non deve dire «nessuna attività».
      annuncia(esito.totale > 0
        ? `${esito.totale} ${esito.totale === 1 ? 'attività pertinente trovata' : 'attività pertinenti trovate'}.`
        : esito.alternative.length
          ? `${esito.alternative.length} ${esito.alternative.length === 1 ? 'alternativa pertinente' : 'alternative pertinenti'}, nessuna corrispondenza esatta.`
          : 'Nessuna attività trovata con questi criteri.');
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

  // Deep link contestuale (pagine servizio): precompila la richiesta senza inviarla.
  const richiestaIniziale = new URLSearchParams(location.search).get('q');
  if (richiestaIniziale) {
    textarea.value = richiestaIniziale.slice(0, MAX_MESSAGGIO);
    aggiornaComposer();
  }

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

  form.addEventListener('reset', () => { ultimiCriteri = {}; nazionale=false; origine = undefined; setTimeout(aggiornaComposer, 0); });

  aggiornaComposer();
}
