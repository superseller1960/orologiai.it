// Fase 41 — le card oltre le prime vengono create nel browser, con lo stesso markup della scheda
// server-side. Il catalogo viaggia già nel bundle della ricerca: qui si evita solo di spedire
// 556 copie di HTML prima che l'utente le abbia chieste.
import { services, type Business } from '../lib/schema';

export type Luogo = { comune: string; siglaProvincia: string };

const testo = (tag: string, classe: string, valore: string) => {
  const el = document.createElement(tag);
  el.className = classe;
  el.textContent = valore;
  return el;
};

export function creaCard(b: Business, place: Luogo): HTMLElement {
  const li = document.createElement('li');
  li.className = 'card search-result-card';
  li.dataset.businessId = b.id;

  const top = document.createElement('div');
  top.className = 'result-topline';
  top.append(testo('span', 'result-place', `${place.comune} · ${place.siglaProvincia}`));
  top.append(testo('span', 'result-types', b.tipi.join(' · ')));

  const main = document.createElement('div');
  main.className = 'result-main';
  const identity = document.createElement('div');
  identity.className = 'result-identity';
  const h3 = document.createElement('h3');
  const link = document.createElement('a');
  link.href = `/orologeria/${b.slug}/`;
  link.textContent = b.nome;
  h3.append(link);
  const reason = document.createElement('p');
  reason.className = 'result-reason';
  reason.dataset.reason = '';
  reason.hidden = true;
  identity.append(h3, reason, testo('p', 'result-editorial', b.descrizione));

  const facts = document.createElement('div');
  facts.className = 'result-facts';
  facts.append(testo('span', 'result-facts-label', 'In evidenza nei servizi'));
  const tags = document.createElement('div');
  tags.className = 'tags';
  tags.setAttribute('aria-label', 'Servizi principali');
  for (const servizio of b.servizi.slice(0, 4)) tags.append(testo('span', 'tag', services[servizio.id]));
  facts.append(tags);
  const ufficiali = [...b.marchi.assistenzaUfficiale.map(m => `Assistenza ufficiale ${m.marca}`), ...b.marchi.rivenditaUfficiale.map(m => `Rivendita ufficiale ${m.marca}`)];
  if (ufficiali.length) facts.append(testo('p', 'result-official', ufficiali.slice(0, 2).join(' · ')));
  facts.append(testo('p', 'result-address', b.posizione.indirizzo ?? 'Recapito nella scheda'));
  main.append(identity, facts);

  const distanza = document.createElement('p');
  distanza.className = 'distance small';
  distanza.hidden = true;

  const actions = document.createElement('div');
  actions.className = 'result-actions';
  const apri = document.createElement('a');
  apri.className = 'result-primary';
  apri.href = `/orologeria/${b.slug}/`;
  apri.textContent = 'Apri la scheda ';
  const freccia = document.createElement('span');
  freccia.setAttribute('aria-hidden', 'true');
  freccia.textContent = '↗';
  apri.append(freccia);
  actions.append(apri);
  const telefono = b.contatti.telefono?.replace(/[^+\d]/g, '');
  if (telefono) {
    const chiama = document.createElement('a');
    chiama.className = 'result-secondary';
    chiama.href = `tel:${telefono}`;
    chiama.textContent = 'Chiama';
    actions.append(chiama);
  }

  li.append(top, main, distanza, actions);
  return li;
}
