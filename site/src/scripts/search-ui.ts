import raw from '../../data/directory.json';
import { directorySchema } from '../lib/schema';
import { filtersFromParams, normalize, searchDirectory } from '../lib/search';
const data = directorySchema.parse(raw);
const form = document.querySelector<HTMLFormElement>('#directory-search');
const count = document.querySelector<HTMLElement>('#search-count');
const empty = document.querySelector<HTMLElement>('#search-empty');
const list = document.querySelector<HTMLElement>('#search-results');
if (form && count && empty && list) {
  const cards = new Map(Array.from(list.querySelectorAll<HTMLElement>('[data-business-id]')).map(el => [el.dataset.businessId, el]));
  const cityInput = form.elements.namedItem('comune') as HTMLInputElement | null;
  const serviceSelect = form.elements.namedItem('servizio') as HTMLSelectElement | null;
  const assistantInput = document.querySelector<HTMLTextAreaElement>('#assistente-messaggio');
  const quickServices = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-service]'));
  const initial = new URLSearchParams(location.search);
  for (const field of Array.from(form.elements)) {
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
      const value = initial.get(field.name);
      if (value !== null) field.value = value;
    }
  }
  if (cityInput && !cityInput.value) {
    const cityFromId = data.localita.find(p => p.id === initial.get('localita'))?.comune;
    cityInput.value = cityFromId ?? initial.get('localitaNonCensita') ?? '';
  }
  function update(syncUrl: boolean) {
    if (!form || !count || !empty || !list) return;
    const params = new URLSearchParams();
    const city = cityInput?.value.trim() ?? '';
    for (const [key, value] of new FormData(form)) {
      if (key === 'comune' || key === 'stato') continue;
      if (typeof value === 'string' && value && value !== 'qualsiasi') params.set(key, value);
    }
    let cityNotCovered = false;
    if (city) {
      const match = data.localita.find(p => normalize(p.comune) === normalize(city));
      if (match) params.set('localita', match.id);
      else { params.set('localitaNonCensita', city); cityNotCovered = true; }
    }
    const results = cityNotCovered ? [] : searchDirectory(data, filtersFromParams(params));
    for (const card of cards.values()) card.hidden = true;
    for (const result of results) { const card = cards.get(result.business.id); if (card) { card.hidden = false; list.append(card); } }
    count.textContent = cityNotCovered ? city + ' non è ancora censita' : results.length + (results.length === 1 ? ' attività trovata' : ' attività trovate');
    const ids = results.map(result => result.business.id);
    (window as unknown as { __directoryResults?: string[] }).__directoryResults = ids;
    document.dispatchEvent(new CustomEvent('directory:results', { detail: { ids } }));
    empty.hidden = results.length > 0;
    if (cityNotCovered) empty.textContent = 'Non abbiamo ancora attività censite a ' + city + '. L’assistente qui sopra può cercare lo stesso servizio in altri comuni.';
    if (syncUrl) history.replaceState(null, '', '/cerca/' + (params.size ? '?' + params.toString() : ''));
    for (const button of quickServices) {
      const selected = button.dataset.service === serviceSelect?.value;
      button.setAttribute('aria-pressed', String(selected));
    }
  }
  const prefillAssistantForUncoveredCity = () => {
    const city = cityInput?.value.trim() ?? '';
    if (!city || data.localita.some(p => normalize(p.comune) === normalize(city)) || !assistantInput) return;
    const service = serviceSelect?.selectedOptions[0]?.textContent?.trim();
    const query = new URLSearchParams(location.search).get('q')?.trim();
    assistantInput.value = (service && serviceSelect?.value ? service : query || 'Cerco un orologiaio') + ' a ' + city;
    assistantInput.dispatchEvent(new Event('input', { bubbles: true }));
    assistantInput.focus({ preventScroll: true });
  };
  for (const button of quickServices) button.addEventListener('click', () => {
    if (!serviceSelect) return;
    serviceSelect.value = button.dataset.service ?? '';
    update(true);
  });
  form.addEventListener('submit', event => { event.preventDefault(); update(true); prefillAssistantForUncoveredCity(); });
  form.addEventListener('change', () => update(true));
  form.addEventListener('input', () => update(true));
  form.addEventListener('reset', () => { setTimeout(() => { if (cityInput) cityInput.value = ''; update(true); }, 0); });
  window.addEventListener('popstate', () => location.reload());
  update(false);
}
