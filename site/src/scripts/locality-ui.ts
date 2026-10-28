import { normalize } from '../lib/search';
type Place = { id: string; comune: string; provincia: string; regione: string };
for (const root of document.querySelectorAll<HTMLElement>('[data-locality-picker]')) {
  const input = root.querySelector<HTMLInputElement>('input')!;
  const list = root.querySelector<HTMLUListElement>('[role="listbox"]')!;
  const hint = root.querySelector<HTMLElement>('[role="status"]')!;
  const places: Place[] = JSON.parse(root.dataset.places ?? '[]');
  let matches: Place[] = [], active = -1;
  const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; };
  function choose(place: Place) {
    input.value = place.comune;
    input.dataset.localita = place.id;
    hint.textContent = `${place.comune} · ${place.provincia}, ${place.regione}`;
    close();
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.focus({ preventScroll: true });
  }
  function suggest() {
    const query = normalize(input.value);
    const exact = places.filter(p => normalize(p.comune) === query);
    matches = query ? places.filter(p => normalize(p.comune).includes(query)).slice(0, 10) : [];
    list.replaceChildren(); active = -1;
    for (const [i, place] of matches.entries()) {
      const option = document.createElement('li'); option.id = `${list.id}-${i}`; option.role = 'option'; option.setAttribute('aria-selected', 'false');
      option.textContent = `${place.comune} · ${place.provincia}, ${place.regione}`;
      option.addEventListener('pointerdown', event => event.preventDefault());
      option.addEventListener('click', () => choose(place)); list.append(option);
    }
    hint.textContent = !query ? 'Lascia vuoto per cercare in tutta Italia.' : exact.length > 1 ? 'Più comuni con questo nome: scegli provincia e regione.' : !matches.length ? `${input.value.trim()} non è presente tra le località censite. Nessun comune verrà sostituito automaticamente.` : 'Scegli un suggerimento o completa il nome del comune.';
    list.hidden = matches.length === 0; input.setAttribute('aria-expanded', String(!list.hidden));
  }
  input.addEventListener('input', () => { delete input.dataset.localita; suggest(); });
  input.addEventListener('focus', () => { if (input.value) suggest(); });
  input.addEventListener('blur', () => setTimeout(close, 100));
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); event.preventDefault(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); if (list.hidden) suggest(); if (!matches.length) return;
      active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      for (const [i, el] of Array.from(list.children).entries()) el.setAttribute('aria-selected', String(i === active));
      const option = list.children[active] as HTMLElement; input.setAttribute('aria-activedescendant', option.id); option.scrollIntoView?.({ block: 'nearest' });
    } else if (event.key === 'Enter' && !list.hidden && active >= 0) { event.preventDefault(); choose(matches[active]); }
  });
  input.form?.addEventListener('submit', event => {
    const exact = places.filter(p => normalize(p.comune) === normalize(input.value));
    if (exact.length > 1 && !exact.some(p => p.id === input.dataset.localita)) {
      event.preventDefault(); event.stopImmediatePropagation(); suggest(); input.focus(); return;
    }
    close();
    // La homepage mantiene GET/HTML; un ID scelto disambigua anche comuni omonimi.
    if (input.form?.id !== 'directory-search') {
      let field = input.form?.querySelector<HTMLInputElement>('input[name="localita"]');
      if (input.dataset.localita) {
        if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.name = 'localita'; input.form?.append(field); }
        field.value = input.dataset.localita;
      } else field?.remove();
    }
  });
  input.form?.addEventListener('reset', () => { delete input.dataset.localita; close(); hint.textContent = 'Lascia vuoto per cercare in tutta Italia.'; });
}
