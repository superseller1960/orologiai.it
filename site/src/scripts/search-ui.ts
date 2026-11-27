// Fase 42: la ricerca usa l'indice compatto (soli campi di filtro e card), non il catalogo completo.
import raw from '../../data/indice-ricerca.json';
import { services, type Business, type Directory } from '../lib/schema';
import { filtersFromParams, localityMatches, searchDirectory, searchDirectoryTiered, SERVIZI_GENERICI_PERTINENTI } from '../lib/search';
import { featuredServices } from '../lib/business-presentation';
import { motiviPerRichiesta, servizioSoloInterno } from '../lib/recommendations';
import { creaCard } from './card-render';

const data = raw as unknown as Directory;
const form = document.querySelector<HTMLFormElement>('#directory-search');
const count = document.querySelector<HTMLElement>('#search-count');
const empty = document.querySelector<HTMLElement>('#search-empty');
const list = document.querySelector<HTMLElement>('#search-results');
if (form && count && empty && list) {
  const searchForm = form, heading = count, resultsList = list, emptyBox = empty;
  const cards = new Map(Array.from(list.querySelectorAll<HTMLElement>('[data-business-id]')).map(el => [el.dataset.businessId, el]));
  const luoghi = new Map(data.localita.map(p => [p.id, p]));
  // Le card non presenti nell'HTML iniziale vengono create qui, con lo stesso markup.
  // L'elenco resta completo: cambia solo quando il browser paga il costo del markup.
  const cardDi = (business: Business): HTMLElement => {
    let card = cards.get(business.id);
    if (!card) {
      const place = luoghi.get(business.localitaId);
      card = creaCard(business, { comune: place?.comune ?? business.localitaId, siglaProvincia: place?.siglaProvincia ?? '' });
      cards.set(business.id, card);
    }
    return card;
  };
  const field = (name: string) => searchForm.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  const cityInput = field('comune') as HTMLInputElement;
  const region = field('regione'), province = field('provincia');
  const service = field('servizio') as HTMLSelectElement;
  const more = document.querySelector<HTMLButtonElement>('#search-more')!;
  const pageCount = document.querySelector<HTMLElement>('#search-page-count')!;
  const context = document.querySelector<HTMLElement>('#search-context')!;
  const chips = document.querySelector<HTMLElement>('#active-filters')!;
  const emptyMessage = document.querySelector<HTMLElement>('#search-empty-message')!;
  const removeService = document.querySelector<HTMLButtonElement>('#remove-service')!;
  const widen = document.querySelector<HTMLButtonElement>('#search-widen')!;
  const alternative = document.querySelector<HTMLElement>('#search-alternative')!;
  const serviceHint = document.querySelector<HTMLElement>('#search-service-hint')!;
  const advancedCount = document.querySelector<HTMLElement>('#advanced-count')!;
  const relatedBox = document.querySelector<HTMLElement>('#search-related')!;
  const relatedList = document.querySelector<HTMLElement>('#search-related-list')!;
  const relatedNote = document.querySelector<HTMLElement>('#search-related-note')!;
  // Criteri usati per la motivazione «Perché è adatto alla tua richiesta» sulle card.
  let criteriMotivo: Parameters<typeof motiviPerRichiesta>[2] = {};
  let businesses: Business[] = [], nonVerificate = new Set<string>(), shown = 12;
  let params = new URLSearchParams();
  // L'interpretazione semantica pesa centinaia di KB: si carica solo per una richiesta libera
  // e non trattiene il primo render. La ricerca letterale resta il pavimento di funzionamento.
  let tokenSemantico = 0;
  async function interpretaInDifferita(q: string) {
    const token = ++tokenSemantico;
    const letterale = businesses.map(b => b.id).join(',');
    if (context.textContent !== null) context.textContent = 'Sto interpretando la richiesta…';
    try {
      const { interpretaRichiesta, cercaOrologiaio } = await import('../lib/assistant.ts');
      const campo = field('q') as HTMLInputElement;
      if (token !== tokenSemantico || q !== campo.value.trim()) return;
      const { criteri } = interpretaRichiesta(q, data);
      if (!Object.keys(criteri).length) { context.textContent = ''; return; }
      // Come prima della Fase 41: un nome o un indirizzo già trovato non viene sostituito
      // dall'interpretazione territoriale. Si affina solo una richiesta tecnica o senza risultati.
      const tecnica = Boolean(criteri.servizio || (criteri.marca && (criteri.ruoloMarca || criteri.specializzazione || criteri.tipo)));
      if (letterale && !tecnica) { context.textContent = ''; return; }
      const esito = cercaOrologiaio(data, criteri, { limite: data.attivita.length });
      const ids = esito.totale ? esito.risultati.map(x => x.id) : esito.alternative.map(x => x.id);
      // Se l'interpretazione non migliora la ricerca letterale, non la sostituisce.
      if (!ids.length || ids.join(',') === letterale) { context.textContent = ''; return; }
      const perId = new Map(data.attivita.map(b => [b.id, b]));
      businesses = ids.map(id => perId.get(id)!).filter(Boolean);
      const n = businesses.length;
      const soloAlternative = !esito.totale;
      heading.textContent = soloAlternative ? `${n} alternative pertinenti (nessuna corrispondenza esatta)` : `${n} ${n === 1 ? 'attività trovata' : 'attività trovate'}`;
      context.textContent = soloAlternative ? 'Alternative alla richiesta, non corrispondenze esatte.' : 'Interpretazione della richiesta applicata ai risultati.';
      emptyBox.hidden = n > 0;
      criteriMotivo = { servizio: criteri.servizio, marca: criteri.marca, ruoloMarca: criteri.ruoloMarca, tipo: criteri.tipo, specializzazione: criteri.specializzazione, localita: criteri.localita };
      shown = 12;
      paginate();
      const mapState = { ids, relatedIds: [], localita: criteri.localita, comune: field('comune') ? String((field('comune') as HTMLInputElement).value || '') || undefined : undefined, restricted: true };
      (window as unknown as { __directoryResults?: string[] }).__directoryResults = ids;
      (window as unknown as { __directoryMapState?: typeof mapState }).__directoryMapState = mapState;
      document.dispatchEvent(new CustomEvent('directory:results', { detail: mapState }));
    } catch {
      // Nessuna perdita di funzione: restano i risultati letterali già mostrati.
      if (token === tokenSemantico) context.textContent = '';
    }
  }

  function restore() {
    searchForm.reset();
    params = new URLSearchParams(location.search);
    for (const control of Array.from(searchForm.elements)) {
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) {
        const value = params.get(control.name);
        if (value !== null) control.value = value;
      }
    }
    const place = data.localita.find(p => p.id === params.get('localita'));
    cityInput.value = place?.comune ?? params.get('comune') ?? params.get('localitaNonCensita') ?? params.get('localita') ?? '';
    if (place) cityInput.dataset.localita = place.id;
  }
  function revealResults() {
    // Il DOM e l'altezza delle card sono già aggiornati prima del salto.
    const show = () => {
      const header = document.querySelector<HTMLElement>('.site-header');
      const style = header ? getComputedStyle(header) : null;
      const inset = header && style && ['fixed', 'sticky'].includes(style.position) ? header.getBoundingClientRect().height + 16 : 16;
      heading.focus({ preventScroll: true });
      window.scrollTo?.({ top: Math.max(0, heading.getBoundingClientRect().top + window.scrollY - inset), behavior: 'instant' });
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(show);
    // jsdom/non-visual environments do not perform viewport scrolling.
  }
  function paginate() {
    for (const card of cards.values()) card.hidden = true;
    for (const business of businesses.slice(0, shown)) {
      const card = cardDi(business);
      {
        card.hidden = false;
        card.dataset.proof = service.value ? (nonVerificate.has(business.id) ? 'da-verificare' : 'documentata') : '';
        const tags = card.querySelector('.tags');
        if (tags) {
          const preferred = featuredServices(business);
          const requested = business.servizi.find(s => s.id === service.value);
          const claims = (requested ? [requested, ...preferred.filter(s => s.id !== requested.id)] : preferred).slice(0,4);
          tags.replaceChildren(...claims.map(claim => { const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = services[claim.id]; return tag; }));
        }
        const reason = card.querySelector<HTMLElement>('[data-reason]');
        if (reason) {
          const servizioScelto = service.value as keyof typeof services | '';
          const daVerificare = Boolean(servizioScelto) && nonVerificate.has(business.id);
          const primo = daVerificare ? undefined : motiviPerRichiesta(data, business, criteriMotivo)[0];
          const etichetta = daVerificare ? 'Servizio da confermare' : 'Perché è adatto alla tua richiesta';
          const testo = daVerificare
            ? servizioSoloInterno(business, servizioScelto as keyof typeof services)
              ? `«${services[servizioScelto as keyof typeof services]}»: la fonte descrive solo una lavorazione sui propri orologi, non un servizio al cliente.`
              : `«${services[servizioScelto as keyof typeof services]}»: servizio indicato nella scheda, da confermare con l’attività.`
            : primo?.testo ?? '';
          reason.hidden = !testo;
          if (testo) {
            const label = document.createElement('span');
            label.className = 'result-reason-label';
            label.textContent = etichetta;
            const body = document.createElement('span');
            body.className = 'result-reason-text';
            body.textContent = testo;
            reason.replaceChildren(label, body);
            // La prova resta a un clic, fuori dal testo: nessun URL grezzo nella motivazione.
            if (primo?.verifica) {
              const link = document.createElement('a');
              link.className = 'result-reason-source';
              link.href = primo.verifica.url;
              link.rel = 'noopener noreferrer nofollow';
              link.target = '_blank';
              link.textContent = 'Verifica la fonte';
              link.setAttribute('aria-label', `Verifica la fonte: ${primo.verifica.etichetta}`);
              reason.append(link);
            }
          }
        }
        resultsList.append(card);
      }
    }
    more.hidden = shown >= businesses.length;
    pageCount.textContent = businesses.length ? `Mostrate ${Math.min(shown, businesses.length)} di ${businesses.length} attività` : '';
  }
  function refreshServiceCounts(selected: { comune: string } | undefined, scope: URLSearchParams) {
    // Conteggi contestuali: stesso perimetro della ricerca, senza il filtro servizio.
    const senzaServizio = filtersFromParams(scope);
    senzaServizio.servizio = '';
    const perimetro = searchDirectory(data, senzaServizio);
    const counts = new Map<string, number>();
    // Conteggi allineati ai risultati del filtro: nessuna opzione che promette più di quanto mostri.
    for (const { business } of perimetro) for (const s of business.servizi) counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
    for (const option of Array.from(service.options)) {
      if (!option.value) continue;
      const label = option.dataset.label ?? option.textContent?.replace(/\s*\(\d+\)$/, '') ?? option.value;
      option.dataset.label = label;
      const n = counts.get(option.value) ?? 0;
      option.textContent = `${label} (${n})`;
      option.disabled = n === 0 && option.value !== service.value;
    }
    if (serviceHint) {
      serviceHint.textContent = selected
        ? `Servizi disponibili a ${selected.comune}. Le opzioni senza corrispondenze sono disabilitate; puoi rimuovere la città per ampliare la ricerca.`
        : region.value || province.value
          ? 'Numero di attività nel territorio selezionato per ciascun servizio.'
          : 'Numero di attività in tutta Italia per ciascun servizio. Scegliere una località aggiorna i conteggi.';
    }
  }
  function syncGeography() {
    const exact = localityMatches(data, cityInput.value, true);
    const selected = exact.find(p => p.id === cityInput.dataset.localita) ?? (exact.length === 1 ? exact[0] : undefined);
    if (selected) {
      cityInput.dataset.localita = selected.id;
      // Mai cancellare il comune per conservare un vecchio vincolo incompatibile.
      if (region.value && region.value !== selected.regioneSlug) region.value = '';
      if (province.value && province.value !== selected.provinciaSlug) province.value = '';
    }
    for (const option of Array.from((province as HTMLSelectElement).options)) {
      const available = !region.value || !option.value || option.dataset.regione === region.value;
      option.hidden = !available; option.disabled = !available;
      if (!available && option.selected) province.value = '';
    }
    return { exact, selected };
  }
  function update(mode: 'initial' | 'replace' | 'push' | 'draft' = 'replace', reveal = false) {
    const { exact, selected } = syncGeography();
    params = new URLSearchParams();
    for (const [key, value] of new FormData(searchForm)) {
      if (key !== 'comune' && typeof value === 'string' && value && value !== 'qualsiasi') params.set(key, value);
    }
    const city = cityInput.value.trim();
    if (selected) params.set('localita', selected.id);
    else if (city) params.set('localitaNonCensita', city);
    const ambiguous = Boolean(city && exact.length > 1 && !selected);
    const uncovered = Boolean(city && !selected && !ambiguous);
    const filters = filtersFromParams(params);
    const q = (filters.q ?? '').trim();
    const manual = Boolean(filters.localita || filters.regione || filters.provincia || filters.servizio || filters.marca || filters.ruoloMarca !== 'qualsiasi' || filters.tipo || filters.specializzazione || filters.stato);
    let alternative = false;
    businesses = [];
    nonVerificate = new Set();
    if (!uncovered && !ambiguous) {
      if (manual || !q) {
        // Fase 43: le corrispondenze con prova documentata precedono quelle solo elencate,
        // che restano visibili e segnalate finché l'utente non chiede il contrario.
        const { esatti, daVerificare } = searchDirectoryTiered(data, filters);
        nonVerificate = new Set(daVerificare.map(r => r.business.id));
        businesses = (filters.soloDocumentate ? esatti.filter(r => !nonVerificate.has(r.business.id)) : esatti).map(r => r.business);
      } else {
        // Deep link in linguaggio naturale: elenco immediato, interpretazione semantica in differita.
        businesses = searchDirectory(data, { q }).map(r => r.business);
        void interpretaInDifferita(q);
      }
    }
    const n = businesses.length;
    const documentate = businesses.filter(b => !nonVerificate.has(b.id)).length;
    heading.textContent = ambiguous ? `Scegli il comune di ${city}` : uncovered ? `0 attività a ${city}` : alternative ? `${n} alternative pertinenti (nessuna corrispondenza esatta)` : `${n} ${n === 1 ? 'attività trovata' : 'attività trovate'}${selected ? ' a ' + selected.comune : ''}`;
    context.textContent = [
      service.value ? services[service.value as keyof typeof services] : '',
      nonVerificate.size ? `${documentate} con prova documentata · ${n - documentate} da verificare` : '',
      alternative ? 'Alternative alla richiesta, non corrispondenze esatte.' : !city && !region.value && !province.value ? 'Ricerca in tutta Italia' : '',
    ].filter(Boolean).join(' · ');
    emptyBox.hidden = n > 0;
    emptyMessage.textContent = ambiguous ? `Esistono più località chiamate ${city}. Scegli provincia e regione nei suggerimenti.` : uncovered ? `${city} non è ancora censita. Non sostituiamo la città con altre località.${service.value ? ' Servizio richiesto: ' + services[service.value as keyof typeof services] + '.' : ''}` : `Nessuna attività${city ? ' a ' + city : ''} soddisfa tutti i filtri${service.value ? ': ' + services[service.value as keyof typeof services] : ''}. Rimuovi un filtro o modifica la ricerca.`;
    removeService.hidden = !service.value;
    const geoOnly = Boolean(filters.localita || filters.regione || filters.provincia || uncovered);
    maybeOfferWiderSearch(n, geoOnly, filters);
    refreshServiceCounts(selected, params);
    const assistant = document.querySelector<HTMLTextAreaElement>('#assistente-messaggio');
    if (uncovered && assistant) {
      assistant.value = (service.value ? services[service.value as keyof typeof services] : q || 'Cerco un orologiaio') + ' a ' + city;
      assistant.dispatchEvent(new Event('input', { bubbles: true }));
    }
    shown = mode === 'initial' ? Math.max(12, Math.min(data.attivita.length, Number(new URLSearchParams(location.search).get('mostra')) || 12)) : 12;
    if (shown > 12) params.set('mostra', String(shown));
    criteriMotivo = {
      servizio: filters.servizio || undefined, marca: filters.marca || undefined,
      ruoloMarca: filters.ruoloMarca && filters.ruoloMarca !== 'qualsiasi' ? filters.ruoloMarca : undefined,
      tipo: filters.tipo || undefined, specializzazione: filters.specializzazione || undefined,
      localita: selected?.id,
      cap: /^\d{5}$/.test((filters.q ?? '').trim()) ? (filters.q ?? '').trim() : undefined,
    };
    paginate();
    const ids = businesses.map(b => b.id);
    const relatedIds = renderRelated(filters, uncovered || ambiguous || alternative);
    const mapState = { ids, relatedIds, localita: selected?.id, comune: city || undefined, restricted: Boolean(city || region.value || province.value || q || service.value || manual) };
    (window as unknown as { __directoryResults?: string[] }).__directoryResults = ids;
    (window as unknown as { __directoryMapState?: typeof mapState }).__directoryMapState = mapState;
    document.dispatchEvent(new CustomEvent('directory:results', { detail: mapState }));
    renderChips();
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-service]')) button.setAttribute('aria-pressed', String(button.dataset.service === service.value));
    const url = '/cerca/' + (params.size ? '?' + params.toString() : '');
    if (mode === 'push' && url !== location.pathname + location.search) history.pushState(null, '', url);
    else if (mode !== 'draft') history.replaceState(null, '', url);
    if (reveal) revealResults();
  }
  function renderRelated(filters: ReturnType<typeof filtersFromParams>, skip: boolean) {
    // Livello 2: solo con servizio selezionato e solo per servizi generici documentati, mai mescolati ai risultati esatti.
    if (skip || !filters.servizio) { relatedBox.hidden = true; relatedList.replaceChildren(); return []; }
    const { pertinenti } = searchDirectoryTiered(data, filters);
    const nome = services[filters.servizio as keyof typeof services];
    const visibili = pertinenti.map(r => r.business);
    relatedBox.hidden = visibili.length === 0;
    relatedNote.textContent = `Attività che documentano il servizio generico «${services[SERVIZI_GENERICI_PERTINENTI[filters.servizio as keyof typeof services]?.[0] ?? filters.servizio as keyof typeof services]}», non la voce «${nome}». Verifica con il laboratorio se esegue l’intervento richiesto.`;
    relatedList.replaceChildren(...visibili.map(b => { const clone = cardDi(b).cloneNode(true) as HTMLElement; clone.hidden = false; clone.dataset.match = 'pertinente'; return clone; }));
    return visibili.map(b => b.id);
  }
  function maybeOfferWiderSearch(n: number, geoOnly: boolean, filters: ReturnType<typeof filtersFromParams>) {
    // L'ampliamento è sempre dichiarato: nessun risultato fuori territorio mescolato ai risultati esatti.
    if (!geoOnly || n > 0 || !service.value) { widen.hidden = true; alternative.hidden = true; return; }
    const altrove = searchDirectory(data, { ...filters, localita: '', regione: '', provincia: '' }).length;
    const nome = services[service.value as keyof typeof services];
    alternative.textContent = altrove
      ? `«${nome}» compare in ${altrove} ${altrove === 1 ? 'attività' : 'attività'} in altre località. Puoi ampliare la ricerca: saranno risultati fuori dal territorio scelto, non corrispondenze nella località.`
      : `«${nome}» non risulta documentata nel database attuale: nessuna attività viene inventata o sostituita.`;
    alternative.hidden = false;
    widen.hidden = altrove === 0;
  }
  function renderChips() {
    chips.replaceChildren();
    let advanced = 0;
    for (const [key, value] of params) {
      if (key === 'mostra') continue;
      const control = searchForm.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
      const isCity = ['localita', 'localitaNonCensita'].includes(key);
      if (!isCity && key !== 'servizio') advanced++;
      const text = isCity ? cityInput.value : control instanceof HTMLSelectElement ? control.selectedOptions[0]?.textContent ?? value : value;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'filter-chip';
      button.textContent = `${text} ×`; button.setAttribute('aria-label', `Rimuovi filtro ${text}`);
      button.addEventListener('click', () => {
        if (isCity) { cityInput.value = ''; delete cityInput.dataset.localita; }
        else if (control) control.value = key === 'ruoloMarca' ? 'qualsiasi' : '';
        update('push');
      }); chips.append(button);
    }
    advancedCount.textContent = advanced ? `(${advanced} attivi)` : '';
  }
  more.addEventListener('click', () => {
    const firstNew = businesses[shown]; shown += 12; paginate();
    params.set('mostra', String(shown)); history.replaceState(null, '', '/cerca/?' + params.toString());
    const link = firstNew && cardDi(firstNew).querySelector<HTMLElement>('h3 a'); link?.focus();
  });
  searchForm.addEventListener('submit', event => { event.preventDefault(); update('push', true); });
  searchForm.addEventListener('change', () => update('draft'));
  searchForm.addEventListener('input', () => update('draft'));
  let restoring = false;
  searchForm.addEventListener('reset', () => {
    if (restoring) return;
    setTimeout(() => { cityInput.value = ''; delete cityInput.dataset.localita; update('push'); }, 0);
  });
  function load() { restoring = true; restore(); restoring = false; update('initial'); }
  window.addEventListener('popstate', () => { load(); revealResults(); });
  removeService.addEventListener('click', () => { service.value = ''; update('push', true); });
  widen.addEventListener('click', () => {
    cityInput.value = ''; delete cityInput.dataset.localita;
    region.value = ''; province.value = '';
    update('push', true);
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>('.search-shortcut')) button.addEventListener('click', () => {
    const target = field(button.dataset.shortcutField ?? 'servizio'); if (target) target.value = button.dataset.shortcutValue ?? '';
    update('push', true);
  });
  // Percorso guidato: pulsanti che applicano i filtri reali, nessun motore parallelo.
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-bisogno]')) button.addEventListener('click', () => {
    const bisogno = button.dataset.bisogno ?? '';
    if (bisogno === 'assistenza-marca') {
      service.value = '';
      const marca = field('marca') as HTMLSelectElement | null;
      const ruolo = field('ruoloMarca') as HTMLSelectElement | null;
      if (marca) marca.value = '';
      if (ruolo) ruolo.value = 'assistenzaUfficiale';
      marca?.focus();
      update('push', true);
      return;
    }
    service.value = bisogno;
    update('push', true);
  });
  load();
  if (location.search) revealResults();
}
