import raw from '../../data/directory.json';
import { directorySchema, type Business } from '../lib/schema';
import { filtersFromParams, normalize, searchDirectory } from '../lib/search';
import { interpretaRichiesta, cercaOrologiaio } from '../lib/assistant';

const data = directorySchema.parse(raw);
const form = document.querySelector<HTMLFormElement>('#directory-search');
const count = document.querySelector<HTMLElement>('#search-count');
const empty = document.querySelector<HTMLElement>('#search-empty');
const list = document.querySelector<HTMLElement>('#search-results');
const zoneBadge = document.querySelector<HTMLElement>('#zone-badge');
const zoneInfo = document.querySelector<HTMLElement>('#zone-info');
const zoneModify = document.querySelector<HTMLButtonElement>('#zone-modify');

if (form && count && empty && list) {
  const cards = new Map(Array.from(list.querySelectorAll<HTMLElement>('[data-business-id]')).map(el => [el.dataset.businessId, el]));
  const cityInput = form.elements.namedItem('comune') as HTMLInputElement | null;
  const serviceSelect = form.elements.namedItem('servizio') as HTMLSelectElement | null;
  const assistantInput = document.querySelector<HTMLTextAreaElement>('#assistente-messaggio');
  const quickServices = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-service]'));
  const initial = new URLSearchParams(location.search);

  // Popola i campi da URL
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

  // Scorciatoie categoria: anche i pulsanti dei servizi rapidi portano questi attributi.
  const shortcuts = Array.from(document.querySelectorAll<HTMLButtonElement>('.search-shortcut'));
  for (const btn of shortcuts) {
    btn.addEventListener('click', () => {
      const field = btn.dataset.shortcutField;
      const val = btn.dataset.shortcutValue;
      const target = form.elements.namedItem(field ?? '') as HTMLInputElement | HTMLSelectElement | null;
      if (target && val) {
        target.value = val;
        // Se si clicca una scorciatoia, svuotiamo il testo libero generico per evitare conflitti
        const qInput = form.elements.namedItem('q') as HTMLInputElement | null;
        if (qInput && ['batteria', 'revisione', 'vintage'].some(s => qInput.value.toLowerCase().includes(s))) {
          qInput.value = '';
        }
        update(true);
      }
    });
  }

  // Modifica zona suggerita: apre i filtri avanzati e mette a fuoco la regione
  if (zoneModify) {
    zoneModify.addEventListener('click', () => {
      const details = form.querySelector('details');
      if (details) details.open = true;
      const regSelect = form.elements.namedItem('regione') as HTMLSelectElement | null;
      if (regSelect) regSelect.focus();
    });
  }

  // Rilevamento facoltativo e non bloccante della zona suggerita dalla connessione (senza GPS)
  async function rilevaZonaSuggerita() {
    if (!zoneBadge || !zoneInfo) return;
    // Se la query ha già un comune o una regione fissata nell'URL, non sovrascrivere
    if (initial.get('regione') || initial.get('localita')) return;
    try {
      const res = await (window.fetch ? window.fetch('/api/posizione', { headers: { accept: 'application/json' } }) : fetch('/api/posizione', { headers: { accept: 'application/json' } }));
      if (!res.ok) return;
      const pos = await res.json() as { disponibile?: boolean; regioneSlug?: string; regioneNome?: string };
      if (pos.disponibile && pos.regioneSlug && pos.regioneNome) {
        const regSelect = form?.elements.namedItem('regione') as HTMLSelectElement | null;
        // Se l'utente non ha impostato manualmente una regione:
        if (regSelect && !regSelect.value) {
          zoneInfo.textContent = `Zona suggerita dalla connessione: ${pos.regioneNome}`;
          zoneBadge.hidden = false;
        }
      }
    } catch {
      // Ignora silenziosamente: la ricerca manuale resta completamente funzionante
    }
  }

  const emptyDefault = empty.textContent ?? '';

  // Coerenza regione-provincia-città: la regione scelta nasconde le province di altre regioni
  // e azzera una città o una provincia che non appartengono più alla regione selezionata.
  const regionSelect = form.elements.namedItem('regione') as HTMLSelectElement | null;
  const provinceSelect = form.elements.namedItem('provincia') as HTMLSelectElement | null;
  function syncRegione() {
    const reg = regionSelect?.value ?? '';
    if (provinceSelect) {
      for (const opt of Array.from(provinceSelect.options)) {
        if (!opt.value) continue;
        const visibile = !reg || opt.dataset.regione === reg;
        opt.hidden = !visibile;
        opt.disabled = !visibile;
        if (!visibile && opt.selected) provinceSelect.value = '';
      }
    }
    const city = cityInput?.value.trim() ?? '';
    if (reg && city && cityInput) {
      const match = data.localita.find(p => normalize(p.comune) === normalize(city));
      if (match && match.regioneSlug !== reg) cityInput.value = '';
    }
  }

  function update(syncUrl: boolean) {
    if (!form || !count || !empty || !list) return;
    syncRegione();
    const params = new URLSearchParams();
    const city = cityInput?.value.trim() ?? '';
    for (const [key, value] of new FormData(form)) {
      // "comune" è un testo libero convertito sotto in località / localitàNonCensita.
      if (key === 'comune') continue;
      if (typeof value === 'string' && value && value !== 'qualsiasi') params.set(key, value);
    }
    let cityNotCovered = false;
    if (city) {
      const match = data.localita.find(p => normalize(p.comune) === normalize(city));
      if (match) params.set('localita', match.id);
      else { params.set('localitaNonCensita', city); cityNotCovered = true; }
    }

    const filters = filtersFromParams(params);
    const q = (filters.q ?? '').trim();

    // Verifichiamo se l'utente ha impostato filtri manuali oltre a 'q'
    const hasManualFilters = Boolean(
      filters.localita || filters.provincia || filters.regione || filters.servizio ||
      filters.marca || (filters.ruoloMarca && filters.ruoloMarca !== 'qualsiasi') ||
      filters.tipo || filters.specializzazione || filters.stato
    );

    let finalBusinesses: Business[] = [];
    let isAlternative = false;

    if (cityNotCovered) {
      // Città non censita: nessun risultato inventato; l'assistente può cercare altrove.
      finalBusinesses = [];
    } else if (hasManualFilters) {
      // Ricerca con filtri combinati esatti
      finalBusinesses = searchDirectory(data, filters).map(r => r.business);
    } else if (!q) {
      // Nessun filtro: mostra tutte le attività
      finalBusinesses = searchDirectory(data, {}).map(r => r.business);
    } else {
      // Campo unico «Che cosa ti serve?»: interprete intelligente
      const inter = interpretaRichiesta(q, data);
      const crit = inter.criteri;
      const haIntentoTecnicoOMarca = Boolean(crit.servizio || (crit.marca && (crit.ruoloMarca || crit.specializzazione || crit.tipo)));
      const letterale = searchDirectory(data, { q });
      const busMap = new Map(data.attivita.map(b => [b.id, b]));

      if (haIntentoTecnicoOMarca) {
        // La pagina di ricerca mostra tutti i risultati esatti (non il limite breve della chat).
        const sem = cercaOrologiaio(data, crit, { limite: 200 });
        if (sem.totale > 0) {
          finalBusinesses = sem.risultati.map(r => busMap.get(r.id)!);
        } else if (sem.alternative.length > 0) {
          finalBusinesses = sem.alternative.map(r => busMap.get(r.id)!);
          isAlternative = true;
        }
      } else if (letterale.length > 0) {
        finalBusinesses = letterale.map(r => r.business);
      } else if (Object.keys(crit).length > 0) {
        const sem = cercaOrologiaio(data, crit, { limite: 200 });
        if (sem.totale > 0) {
          finalBusinesses = sem.risultati.map(r => busMap.get(r.id)!);
        } else if (sem.alternative.length > 0) {
          finalBusinesses = sem.alternative.map(r => busMap.get(r.id)!);
          isAlternative = true;
        }
      }
    }

    // Aggiornamento DOM cards
    for (const card of cards.values()) card.hidden = true;
    for (const b of finalBusinesses) {
      const card = cards.get(b.id);
      if (card) {
        card.hidden = false;
        list.append(card);
      }
    }

    const n = finalBusinesses.length;
    if (cityNotCovered) {
      count.textContent = city + ' non è ancora censita';
    } else if (isAlternative) {
      count.textContent = `${n} ${n === 1 ? 'alternativa pertinente trovata' : 'alternative pertinenti trovate'} (nessuna corrispondenza esatta)`;
    } else {
      count.textContent = `${n} ${n === 1 ? 'attività trovata' : 'attività trovate'}`;
    }

    const ids = finalBusinesses.map(b => b.id);
    (window as unknown as { __directoryResults?: string[] }).__directoryResults = ids;
    document.dispatchEvent(new CustomEvent('directory:results', { detail: { ids } }));
    empty.hidden = n > 0;
    empty.textContent = cityNotCovered
      ? 'Non abbiamo ancora attività censite a ' + city + '. L’assistente qui sopra può cercare lo stesso servizio in altri comuni.'
      : emptyDefault;

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
  void rilevaZonaSuggerita();
}
