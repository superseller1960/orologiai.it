import raw from '../../data/directory.json';
import { directorySchema, services, type Business } from '../lib/schema';
import { filtersFromParams, localityMatches, searchDirectory } from '../lib/search';
import { interpretaRichiesta, cercaOrologiaio } from '../lib/assistant';

const data = directorySchema.parse(raw);
const form = document.querySelector<HTMLFormElement>('#directory-search');
const count = document.querySelector<HTMLElement>('#search-count');
const empty = document.querySelector<HTMLElement>('#search-empty');
const list = document.querySelector<HTMLElement>('#search-results');
if (form && count && empty && list) {
  const searchForm = form, heading = count, resultsList = list, emptyBox = empty;
  const cards = new Map(Array.from(list.querySelectorAll<HTMLElement>('[data-business-id]')).map(el => [el.dataset.businessId, el]));
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
  const advancedCount = document.querySelector<HTMLElement>('#advanced-count')!;
  let businesses: Business[] = [], shown = 12;
  let params = new URLSearchParams();

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
      const card = cards.get(business.id);
      if (card) {
        card.hidden = false;
        const tags = card.querySelector('.tags');
        if (tags) {
          const claims = [...business.servizi].sort((a,b) => Number(b.id === service.value) - Number(a.id === service.value)).slice(0,3);
          tags.replaceChildren(...claims.map(claim => { const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = services[claim.id]; return tag; }));
        }
        resultsList.append(card);
      }
    }
    more.hidden = shown >= businesses.length;
    pageCount.textContent = businesses.length ? `Mostrate ${Math.min(shown, businesses.length)} di ${businesses.length} attività` : '';
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
    if (!uncovered && !ambiguous) {
      if (manual || !q) businesses = searchDirectory(data, filters).map(r => r.business);
      else {
        // Mantiene i deep link in linguaggio naturale e lo stesso interprete dell'assistente.
        const { criteri } = interpretaRichiesta(q, data);
        const technical = Boolean(criteri.servizio || (criteri.marca && (criteri.ruoloMarca || criteri.specializzazione || criteri.tipo)));
        const literal = searchDirectory(data, { q });
        if (!technical && literal.length) businesses = literal.map(r => r.business);
        else if (Object.keys(criteri).length) {
          const semantic = cercaOrologiaio(data, criteri, { limite: data.attivita.length });
          const ids = semantic.totale ? semantic.risultati.map(b => b.id) : semantic.alternative.map(b => b.id);
          const byId = new Map(data.attivita.map(b => [b.id, b]));
          businesses = ids.map(id => byId.get(id)!).filter(Boolean);
          alternative = !semantic.totale && ids.length > 0;
        }
      }
    }
    const n = businesses.length;
    heading.textContent = ambiguous ? `Scegli il comune di ${city}` : uncovered ? `0 attività a ${city}` : alternative ? `${n} alternative pertinenti (nessuna corrispondenza esatta)` : `${n} ${n === 1 ? 'attività trovata' : 'attività trovate'}${selected ? ' a ' + selected.comune : ''}`;
    context.textContent = [service.value ? services[service.value as keyof typeof services] : '', alternative ? 'Alternative alla richiesta, non corrispondenze esatte.' : !city && !region.value && !province.value ? 'Ricerca in tutta Italia' : ''].filter(Boolean).join(' · ');
    emptyBox.hidden = n > 0;
    emptyMessage.textContent = ambiguous ? `Esistono più località chiamate ${city}. Scegli provincia e regione nei suggerimenti.` : uncovered ? `${city} non è ancora censita. Non sostituiamo la città con altre località.${service.value ? ' Servizio richiesto: ' + services[service.value as keyof typeof services] + '.' : ''}` : `Nessuna attività${city ? ' a ' + city : ''} soddisfa tutti i filtri${service.value ? ': ' + services[service.value as keyof typeof services] : ''}. Rimuovi un filtro o modifica la ricerca.`;
    removeService.hidden = !service.value;
    const assistant = document.querySelector<HTMLTextAreaElement>('#assistente-messaggio');
    if (uncovered && assistant) {
      assistant.value = (service.value ? services[service.value as keyof typeof services] : q || 'Cerco un orologiaio') + ' a ' + city;
      assistant.dispatchEvent(new Event('input', { bubbles: true }));
    }
    shown = mode === 'initial' ? Math.max(12, Math.min(data.attivita.length, Number(new URLSearchParams(location.search).get('mostra')) || 12)) : 12;
    if (shown > 12) params.set('mostra', String(shown));
    paginate();
    const ids = businesses.map(b => b.id);
    (window as unknown as { __directoryResults?: string[] }).__directoryResults = ids;
    document.dispatchEvent(new CustomEvent('directory:results', { detail: { ids } }));
    renderChips();
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-service]')) button.setAttribute('aria-pressed', String(button.dataset.service === service.value));
    const url = '/cerca/' + (params.size ? '?' + params.toString() : '');
    if (mode === 'push' && url !== location.pathname + location.search) history.pushState(null, '', url);
    else if (mode !== 'draft') history.replaceState(null, '', url);
    if (reveal) revealResults();
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
    const link = firstNew && cards.get(firstNew.id)?.querySelector<HTMLElement>('h3 a'); link?.focus();
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
  for (const button of document.querySelectorAll<HTMLButtonElement>('.search-shortcut')) button.addEventListener('click', () => {
    const target = field(button.dataset.shortcutField ?? 'servizio'); if (target) target.value = button.dataset.shortcutValue ?? '';
    update('push', true);
  });
  load();
  if (location.search) revealResults();
}
