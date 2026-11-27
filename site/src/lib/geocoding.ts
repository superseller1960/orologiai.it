export type GeocodeResult = {
 lat: string; lon: string; osm_type?: string; osm_id?: number; display_name?: string;
 type?: string; addresstype?: string; boundingbox?: string[];
 address?: { house_number?: string; road?: string; pedestrian?: string; city?: string; town?: string; village?: string; municipality?: string; postcode?: string; country_code?: string };
};
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘']/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const street = (s: string) => normalize(s).replace(/\b(dei|degli|delle|della|del|di|de|d)\b/g,'').replace(/\s+/g,' ').trim();
export function compareGeocode(indirizzo: string, comune: string, cap: string | null, result?: GeocodeResult): { esito: 'corrispondenza' | 'incerta'; motivo: string } {
 const uncertain = (motivo: string) => ({ esito: 'incerta' as const, motivo });
 if (!result?.address) return uncertain('Nessun indirizzo risolto');
 const a = result.address;
 const m = indirizzo.match(/^(.*?)[,\s]+(\d+\s*(?:[\/]?\s*[A-Za-z])?)\s*$/);
 if (!m) return uncertain('Indirizzo complesso o civico mancante: revisione manuale');
 const civic = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g,'');
 if (!a.house_number || civic(a.house_number)!==civic(m[2])) return uncertain('Civico non coincidente');
 if (street(a.road ?? a.pedestrian ?? '')!==street(m[1])) return uncertain('Strada non coincidente');
 if (![a.city,a.town,a.village,a.municipality].some(s=>s && normalize(s)===normalize(comune))) return uncertain('Comune non coincidente');
 if (a.country_code !== 'it') return uncertain('Paese non confermato');
 if (cap && a.postcode!==cap) return uncertain('CAP non coincidente o assente');
 const lat=Number(result.lat), lon=Number(result.lon);
 if (!Number.isFinite(lat)||!Number.isFinite(lon)||lat<35||lat>48||lon<6||lon>19) return uncertain('Coordinate fuori territorio');
 if (result.boundingbox?.length!==4) return uncertain('Estensione oggetto non disponibile');
 const [s,n,w,e]=result.boundingbox.map(Number);
 if (![s,n,w,e].every(Number.isFinite) || n-s>0.002 || e-w>0.003) return uncertain('Oggetto troppo esteso per un civico');
 return { esito:'corrispondenza', motivo:'Strada, civico, comune, paese e CAP disponibile corrispondenti; estensione di scala edificio. Da revisionare prima della pubblicazione.' };
}
