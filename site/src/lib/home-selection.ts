import { directory, placeOf } from './directory';

type Placement = {
  businessId: string;
  type: 'editorial' | 'sponsored';
  order: number;
  display: 'featured' | 'compact';
  text: string;
  image: { src: string; alt: string; credit: string; source: string; license: string } | null;
  visibleFrom: string | null;
  visibleUntil: string | null;
};

// Le date sono inclusive e valutate alla build: ripubblicare per applicare cambi di periodo.
// Immagini delle attività solo se approvate e corredate di provenienza e licenza.
export const placements: Placement[] = [
  { businessId: 'fontana-bologna', type: 'editorial', order: 1, display: 'featured', text: 'Sotto i portici bolognesi, una tradizione di riparazione e restauro.', image: null, visibleFrom: null, visibleUntil: null },
  { businessId: 'casa-cronometro-roma', type: 'editorial', order: 2, display: 'featured', text: 'Nel quartiere Prati, il mestiere di prendersi cura del tempo.', image: null, visibleFrom: null, visibleUntil: null },
  { businessId: 'soprana-vicenza', type: 'editorial', order: 3, display: 'featured', text: 'All’ombra della Basilica Palladiana, orologeria e arte del restauro.', image: null, visibleFrom: null, visibleUntil: null },
  { businessId: 'gioielleria-rabino-cuneo', type: 'editorial', order: 4, display: 'compact', text: 'Quattro generazioni e un laboratorio di orologeria.', image: null, visibleFrom: null, visibleUntil: null },
  { businessId: 'clivio-1879-verbania', type: 'editorial', order: 5, display: 'compact', text: 'Una storia di famiglia sulle rive del Lago Maggiore.', image: null, visibleFrom: null, visibleUntil: null },
  { businessId: 'gioielleria-galdi-salerno', type: 'editorial', order: 6, display: 'compact', text: 'Una tradizione di orologeria nel cuore di Salerno.', image: null, visibleFrom: null, visibleUntil: null },
  { businessId: 'gioielleria-ciletti-foggia', type: 'editorial', order: 7, display: 'compact', text: 'Orologeria e laboratorio tecnico dal 1950.', image: null, visibleFrom: null, visibleUntil: null },
  { businessId: 'feni-gioielli-taranto', type: 'editorial', order: 8, display: 'compact', text: 'Una storia di famiglia legata all’orologeria tarantina.', image: null, visibleFrom: null, visibleUntil: null },
];

export function homePlacements(today = new Date().toISOString().slice(0, 10)) {
  const seen = new Set<string>();
  return placements.map(p => {
    const business = directory.attivita.find(b => b.id === p.businessId);
    if (!business || business.attendibilita.stato === 'chiusa') throw new Error(`Posizione homepage: attività non disponibile ${p.businessId}`);
    if (seen.has(p.businessId)) throw new Error(`Posizione homepage duplicata: ${p.businessId}`);
    seen.add(p.businessId);
    if (!p.text.trim() || !Number.isInteger(p.order) || p.order < 1) throw new Error(`Posizione homepage non valida: ${p.businessId}`);
    for (const date of [p.visibleFrom, p.visibleUntil]) if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) throw new Error(`Data non valida: ${date}`);
    if (p.visibleFrom && p.visibleUntil && p.visibleFrom > p.visibleUntil) throw new Error(`Periodo non valido: ${p.businessId}`);
    if (p.image && (!p.image.src.startsWith('/images/') || !p.image.alt || !p.image.credit || !p.image.source.startsWith('https://') || !p.image.license.startsWith('https://'))) throw new Error(`Immagine non documentata: ${p.businessId}`);
    return { ...p, business, place: placeOf(business) };
  }).filter(p => (!p.visibleFrom || p.visibleFrom <= today) && (!p.visibleUntil || p.visibleUntil >= today)).sort((a, b) => a.order - b.order);
}
