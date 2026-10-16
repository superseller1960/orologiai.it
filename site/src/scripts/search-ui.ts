import raw from '../../data/directory.json';
import { directorySchema } from '../lib/schema';
import { filtersFromParams, searchDirectory } from '../lib/search';
const data = directorySchema.parse(raw);
const form = document.querySelector<HTMLFormElement>('#directory-search');
const count = document.querySelector<HTMLElement>('#search-count');
const empty = document.querySelector<HTMLElement>('#search-empty');
const list = document.querySelector<HTMLElement>('#search-results');
if (form && count && empty && list) {
  const cards = new Map(Array.from(list.querySelectorAll<HTMLElement>('[data-business-id]')).map(el => [el.dataset.businessId, el]));
  const initial = new URLSearchParams(location.search);
  for (const field of Array.from(form.elements)) {
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
      const value = initial.get(field.name);
      if (value !== null) field.value = value;
    }
  }
  function update(syncUrl: boolean) {
    if (!form || !count || !empty || !list) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) if (typeof value === 'string' && value && value !== 'qualsiasi') params.set(key, value);
    const results = searchDirectory(data, filtersFromParams(params));
    for (const card of cards.values()) card.hidden = true;
    for (const r of results) { const card = cards.get(r.business.id); if (card) { card.hidden = false; list.append(card); } }
    count.textContent = `${results.length} ${results.length === 1 ? 'attività trovata' : 'attività trovate'}`;
    const ids = results.map(r => r.business.id);
    (window as unknown as { __directoryResults?: string[] }).__directoryResults = ids;
    document.dispatchEvent(new CustomEvent('directory:results', { detail: { ids } }));
    empty.hidden = results.length > 0;
    if (syncUrl) history.replaceState(null, '', `/cerca/${params.size ? '?' + params.toString() : ''}`);
  }
  form.addEventListener('submit', event => { event.preventDefault(); update(true); });
  form.addEventListener('change', () => update(true));
  form.addEventListener('input', () => update(true));
  form.addEventListener('reset', () => { setTimeout(() => update(true), 0); });
  window.addEventListener('popstate', () => location.reload());
  update(false);
}
