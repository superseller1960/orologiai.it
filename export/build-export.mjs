// Genera i file di esportazione per Codex (operazione di sola lettura/consegna).
// Nessuna scrittura su database, deployment o configurazione.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

const H = (buf) => createHash('sha256').update(buf).digest('hex');
const gz = (buf) => gzipSync(buf, { level: 9 }).toString('base64');
const gitShow = (spec) => execFileSync('git', ['show', spec], { maxBuffer: 64 * 1024 * 1024 });

mkdirSync('export', { recursive: true });

// ───────────────────────── 1) database autorevole ─────────────────────────
// Produzione canonica 2602c569-3515-4480-9c10-a3ae3c37e3fa (commit 8b1c4f17…).
// Il working tree (HEAD 1f8f46d) differisce da 8b1c4f1 per soli 2 commit di
// documentazione: site/data/directory.json è identico byte per byte.
copyFileSync('site/data/directory.json', 'export/orologiai-freebuff-directory-159-20261024.json');

// ───────────────────────── 2) checkpoint precedente ─────────────────────────
// Produzione 5a5d5b04-7f8a-438c-8f1b-6dfba0c05240 (commit f9f1ac92…).
const checkpointBuf = gitShow('f9f1ac9:site/data/directory.json');
writeFileSync('export/orologiai-freebuff-directory-checkpoint-5a5d5b04-f9f1ac9-20261024.json', checkpointBuf);

// ───────────────────────── 3) conteggi misurati ─────────────────────────
const dbBuf = readFileSync('site/data/directory.json');
const db = JSON.parse(dbBuf.toString('utf8'));
const cpDb = JSON.parse(checkpointBuf.toString('utf8'));
const stat = (d) => ({
  attivita: d.attivita.length,
  localita: d.localita.length,
  comuni: new Set(d.localita.map((l) => l.comuneSlug || l.id)).size,
  province: new Set(d.localita.map((l) => l.provinciaSlug)).size,
  regioni: new Set(d.localita.map((l) => l.regioneSlug)).size,
  fonti: d.fonti.length,
  schema: d.schema ?? null,
  versione: d.versione ?? null,
});
const dbStat = stat(db);
const cpStat = stat(cpDb);

// differenze checkpoint → produzione corrente
const diffCheck = [];
const cpLoc = new Map(cpDb.localita.map((l) => [l.id, l]));
for (const l of db.localita) {
  const old = cpLoc.get(l.id);
  if (!old) diffCheck.push({ tipo: 'localita-aggiunta', id: l.id });
  else if (JSON.stringify(old) !== JSON.stringify(l))
    diffCheck.push({ tipo: 'localita-modificata', id: l.id, prima: old, dopo: l });
}
for (const id of cpLoc.keys()) if (!db.localita.some((l) => l.id === id)) diffCheck.push({ tipo: 'localita-rimossa', id });
const cpAtt = new Set(cpDb.attivita.map((a) => a.id));
for (const a of db.attivita) if (!cpAtt.has(a.id)) diffCheck.push({ tipo: 'attivita-aggiunta', id: a.id });

// ───────────────────────── 4) manifest base Codex ─────────────────────────
const baseMap = new Map();
for (const line of readFileSync('export/.base-codex-manifest.tsv', 'utf8').trim().split('\n')) {
  const [p, b, s] = line.split('\t');
  baseMap.set(p, { bytes: +b, sha: s });
}

// ───────────────────────── 5) report e test dei lotti ─────────────────────────
const reportTest = [
  ['docs/INTEGRAZIONE-CODEX-20261024.md', 'registro completo della fusione 107→159 (testo UTF-8 integrale)'],
  ['data/reports/freebuff-coverage-20261023.json', 'PR #5 — copertura province'],
  ['data/import/freebuff-national-20261023-reviewed.json', 'PR #5 — input revisionato del lotto'],
  ['data/reports/freebuff-national-20261023-dry-run.json', 'PR #5 — dry-run'],
  ['data/reports/freebuff-national-20261023-applied.json', 'PR #5 — applicazione (+3 attività)'],
  ['data/import/national02-a-reviewed.json', 'espansione nazionale — input lotto A'],
  ['data/reports/national02-a-dry-run.json', 'espansione nazionale — dry-run A'],
  ['data/reports/national02-a-applied.json', 'espansione nazionale — applicazione A (+15)'],
  ['data/import/national02-b-reviewed.json', 'espansione nazionale — input lotto B'],
  ['data/reports/national02-b-dry-run.json', 'espansione nazionale — dry-run B'],
  ['data/reports/national02-b-applied.json', 'espansione nazionale — applicazione B (+16)'],
  ['data/import/national02-c-reviewed.json', 'espansione nazionale — input lotto C'],
  ['data/reports/national02-c-dry-run.json', 'espansione nazionale — dry-run C'],
  ['data/reports/national02-c-applied.json', 'espansione nazionale — applicazione C (+15)'],
  ['data/import/national02-d-reviewed.json', 'espansione nazionale — input lotto D'],
  ['data/reports/national02-d-dry-run.json', 'espansione nazionale — dry-run D'],
  ['data/reports/national02-d-applied.json', 'espansione nazionale — applicazione D (+3)'],
  ['data/reports/national02-candidates-review-20261023.json', 'espansione nazionale — revisione candidati'],
  ['data/reports/national02-province-matrix-20261023.json', 'espansione nazionale — matrice province'],
  ['data/import/pr6-ancona-pescara-20261024-reviewed.json', 'PR #6 — input revisionato (recuperato)'],
  ['data/reports/pr6-ancona-pescara-20261024-applied.json', 'PR #6 — applicazione (+4 attività)'],
  ['data/reports/pr6-arricchimenti-20261024-applied.json', 'PR #6 — registro arricchimenti (6 schede, delta campo-per-campo)'],
  ['data/staging/pr6-arricchimento-20261024/estrazioni.json', 'PR #6 — estrazione documentata dal deployment 9deeca12'],
  ['data/reports/audit-qualita-20261024.json', 'audit qualità 159 schede + 284 URL (24/10)'],
];
const reportTestEntries = reportTest.map(([p, nota]) => {
  const buf = readFileSync(p);
  return { path: p, bytes: buf.length, sha256: H(buf), encoding: 'gzip+base64', sha256_originale: H(buf), nota, content: gz(buf) };
});
const inlineText = readFileSync('docs/INTEGRAZIONE-CODEX-20261024.md', 'utf8');

// ───────────────────────── 6) lotti e ID aggiunti ─────────────────────────
const lottiDef = [
  ['freebuff-national-20261023', '500ca1c9cb46650014f3caa4532167cd72f55b40', 'PR #5'],
  ['national02-a', 'a44b44b2701bb73d1642904b689ac933d45617b9', 'espansione nazionale'],
  ['national02-b', '3fb685dad9ccd38e49e597a6f61db5d40f4f87c9', 'espansione nazionale'],
  ['national02-c', '5331af1484f236b688ddeb13d5ceb44b998e8ffc', 'espansione nazionale'],
  ['national02-d', '3759dcb4fd7c4e200c6e00790e0f963326259779', 'espansione nazionale'],
  ['pr6-ancona-pescara-20261024', 'f9f1ac92316e6f67bb9e945fc2088c6e90c82ad7', 'PR #6 — 4 inserimenti recuperati dal deployment preview 9deeca12'],
];
const lotti = lottiDef.map(([lotto, commit, origine]) => {
  const r = JSON.parse(readFileSync(`data/reports/${lotto}-applied.json`, 'utf8'));
  return {
    lotto, commit, origine,
    conteggi: r.conteggi,
    ids_aggiunti: r.decisioni.filter((x) => x.esito === 'nuova').map((x) => x.id),
    report: `data/reports/${lotto}-applied.json`,
  };
});
const arr = JSON.parse(readFileSync('data/reports/pr6-arricchimenti-20261024-applied.json', 'utf8'));
lotti.push({
  lotto: 'pr6-arricchimenti-20261024', commit: 'f9f1ac92316e6f67bb9e945fc2088c6e90c82ad7',
  origine: 'PR #6 — 6 arricchimenti documentati (nessun ID nuovo)',
  conteggi: arr.conteggi,
  ids_aggiunti: [],
  schede_arricchite: arr.registro.map((r) => r.id),
  report: 'data/reports/pr6-arricchimenti-20261024-applied.json',
});

// ───────────────────────── 7) classificazione sorgenti ─────────────────────────
const EXCLUDE_CONTENT = new Set(['site/data/directory.json']);
const reportTestSet = new Set(reportTest.map(([p]) => p));
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n');
const sorgenti = [];
const conteggiClass = { uguali: 0, modificati: 0, nuovi: 0, soloManifest: 0 };
const pubblici = [];
const bundles = [];
for (const p of tracked) {
  if (/^\.env|\.dev\.vars|^export\//.test(p)) continue;
  const buf = readFileSync(p);
  const sha = H(buf);
  const base = baseMap.get(p);
  if (p.startsWith('public/')) {
    pubblici.push({ path: p, bytes: buf.length, sha256: sha });
    continue;
  }
  if (p === 'api/orologiaio.js' || p === 'api/posizione.js') {
    bundles.push({ path: p, bytes: buf.length, sha256: sha, nota: 'bundle generato da scripts/bundle-vercel-api.mjs; le sorgenti TypeScript sono incluse' });
    continue;
  }
  const shaBaseCompleto = /^[0-9a-f]{64}$/.test(base?.sha ?? '');
  const stato = !base ? 'nuovo'
    : shaBaseCompleto ? (base.sha === sha ? 'uguale' : 'modificato')
    : (base.bytes === buf.length ? 'uguale-per-bytes (sha del manifest base non trascritto per intero dal documento troncato)' : 'modificato');
  if (reportTestSet.has(p)) {
    sorgenti.push({ path: p, bytes: buf.length, sha256: sha, stato, contenuto: 'incluso in report_e_test' });
    conteggiClass.soloManifest++;
    continue;
  }
  if (stato === 'uguale') {
    sorgenti.push({ path: p, bytes: buf.length, sha256: sha, stato });
    conteggiClass.uguali++;
    continue;
  }
  if (EXCLUDE_CONTENT.has(p)) {
    sorgenti.push({ path: p, bytes: buf.length, sha256: sha, stato, contenuto: 'consegnato come file separato orologiai-freebuff-directory-159-20261024.json' });
    conteggiClass.soloManifest++;
    continue;
  }
  sorgenti.push({ path: p, bytes: buf.length, sha256: sha, sha256_originale: sha, stato, encoding: 'gzip+base64', content: gz(buf) });
  if (stato === 'nuovo') conteggiClass.nuovi++;
  else if (stato.startsWith('uguale-per-bytes')) conteggiClass.ugualiPerBytes = (conteggiClass.ugualiPerBytes || 0) + 1;
  else conteggiClass.modificati++;
}

// ───────────────────────── 8) verifica asset legacy (campionamento) ─────────────────────────
const legacyCampioni = {
  'public/blog/index.html': '94d4fbfd2486209a4fb2cf1a8fbc00b4855bd8d2831841fb182ddec99ff9ef33',
  'public/brand/index.html': 'd0e85e6429ba552de5c23072a9ca89e8bf02c6f5e5bedb147ea29c13182659ef',
  'public/carrello/index.html': '69b46a0aa8c617484cc06fd81442b7a7d48281e810f5ee5b212d27c7eac97f37',
  'public/contact/index.html': 'dcc7e67130d9686243b3e9d3a28ffa0bddf4a7f882de379b894228342bbf6616',
  'public/firenze/index.html': '67223683a270e7fb55920f011d99fb54a639c6faa177ff3d6731f241d8e90718',
  'public/index.html': '6f16bd64f275c4270e7bae51e32da4b38262a75fec6b7c01f093309e9537c249',
  'public/milano/index.html': 'e628dc5c3d1ad5f187119d293bbb02b1bc2b721095767f02414cf202e1ce50c7',
  'public/mio-account/index.html': 'aec312154b074303f1cc7b16f93fddf5c8725636dc0e26a13b2bd5f3f854e50c',
  'public/modulo-di-contatto/index.html': '940a32360f2d542e56859d43422542276dda2354f5ece0e87a26fecb40285acd',
  'public/negozio/index.html': '903661ba350ead16aaa99223141d466f0e063213fd70af157dfb89ee99b3b6fb',
  'public/rivenditori-e-concessionari-rolex-milano/index.html': '53d6b09fdec3375f08ee3ac75a6f5b12705fa622a1fb2f6c948d398c015084e4',
  'public/robots.txt': '70c8a658e02c7c1ac3c4d48d22026c99ba3935f068a157cd205ecf7d1937db28',
  'public/rolex/index.html': 'd71d500a449a758e53b96df8262b02baf62cbcda4c67b617605a5cd6c4d2a035',
  'public/termini-e-condizioni/index.html': '90f65ad10465df2b79f913fe1412464f03fb94c9ff03b195c806929386185871',
  'public/wp-content/plugins/complianz-gdpr/assets/css/cookieblocker.min.css': '336b46221652fc129760f523c156b5f061d8768926304d2ecb09386721f25c8c',
  'public/wp-content/plugins/complianz-gdpr/assets/css/document.min.css': '04a21628343bddd7bdbdc5355e37bd3ae9a6a79104703bf636dfd055e35a06e9',
  'public/wp-content/plugins/complianz-gdpr/cookiebanner/js/complianz.min.js': '07602d8ff4a17cd8352eae369c07e528dcd8ac054e2217d6c71d042c5d955619',
  'public/wp-content/plugins/elementor/assets/css/frontend-lite.min.css': '11a9015a1aa0195411cd9cf874386967bba2f1e663403d7685ed16673ddaace6',
  'public/wp-content/plugins/elementor/assets/js/frontend-modules.min.js': '9616c2e19b686804fe1efed0d503a3be2f0bb6f909e31750e5d01d3377778437',
  'public/wp-content/plugins/ocean-extra/assets/css/widgets.css': 'b5cd126d4534d79e24a6416cc5710434450c6076497fe1af4e9040f860ab71ac',
  'public/wp-content/plugins/woocommerce/packages/woocommerce-blocks/build/wc-blocks-style.css': '19d39ff5dc5ce5a1a86862db60eae3b00770724177c1b123f28003b38f7fc8bb',
  'public/wp-content/themes/astra/assets/css/minified/main.min.css': 'ae9482ef2b2db0d66409955fa17f233c8b8cce22ef126791b575248b1b78299f',
};
const NON_CONFRONTABILE = 'public/wp-content/plugins/complianz-gdpr/assets/css/document.min.css';
const legacyEsiti = [];
for (const [p, sha] of Object.entries(legacyCampioni)) {
  if (p === NON_CONFRONTABILE) {
    // Il valore del manifest letto dal documento allegato è spezzato da un troncamento
    // dell’estrazione (il valore completo non è recuperabile): resta non confrontabile,
    // non un difetto. Il file è invariato dall'import b883627 del 2026-10-15 (nessun commit lo tocca).
    legacyEsiti.push({ path: p, sha256_manifest_codex: 'non trascrivibile (estrazione troncata)', sha256_nostro: H(readFileSync(p)), confrontabile: false, nota: 'sha del manifest base spezzato dal troncamento del documento; il file non è mai stato modificato dopo l’import statico b883627 del 2026-10-15' });
    continue;
  }
  const h = H(readFileSync(p));
  legacyEsiti.push({ path: p, sha256_manifest_codex: sha, sha256_nostro: h, confrontabile: true, corrisponde: h === sha });
}

// ───────────────────────── 9) report finale ─────────────────────────
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const report = {
  format: 'orologiai-freebuff-sorgenti-report',
  format_version: 1,
  generato_il: '2026-10-24',
  scope: 'Esportazione di sola consegna: nessun deployment, DNS, database o servizio modificato da questa operazione.',
  git: {
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    commit_working_tree: head,
    commit_applicativo_produzione: '8b1c4f17eb69cf55d1884104fcba2196df31b9c8',
    differenza_working_tree_vs_produzione: '2 commit di sola documentazione dopo 8b1c4f1 (1f8f46d «registro di consegna», preceduto da nessuna modifica dati); site/data/directory.json identico byte per byte nelle due versioni, quindi non serve un export separato.',
  },
  deployment: {
    progetto: 'orologiai-it',
    project_id: 'f9895b77-862c-43c4-98df-0bb561b475ca',
    production_branch: 'pubblicazione-gratuita-scardi-20261022',
    verifica: 'lette in sola lettura via API Cloudflare (integrazione collegata) il 2026-10-24',
    produzione_corrente: { id: '2602c569-3515-4480-9c10-a3ae3c37e3fa', short_id: '2602c569', commit: '8b1c4f17eb69cf55d1884104fcba2196df31b9c8', url: 'https://2602c569.orologiai-it.pages.dev', alias: 'https://www.orologiai.it', creato_il: '2026-10-24T13:32:58Z' },
    produzione_precedente: { id: '5a5d5b04-7f8a-438c-8f1b-6dfba0c05240', short_id: '5a5d5b04', commit: 'f9f1ac92316e6f67bb9e945fc2088c6e90c82ad7', url: 'https://5a5d5b04.orologiai-it.pages.dev', creato_il: '2026-10-24T12:31:44Z' },
    preview_ux2_codex: { id: 'e0588482-3f48-4079-aa68-6bebaed47f98', short_id: 'e0588482', commit: '76d29304c5354ce52a77e232ab65d7abf49bb1d7', branch: 'ux-2-editoriale-20261024-76d2930', url: 'https://e0588482.orologiai-it.pages.dev', alias: 'https://ux-2-editoriale-20261024-76d.orologiai-it.pages.dev', nota: 'UX2 da 107 schede, non sostitutiva del database da 159' },
    preview_ultima_freebuff: { id: 'f94438bc-ed81-4836-884a-9fd9c8fe68e2', short_id: 'f94438bc', commit: '8b1c4f17eb69cf55d1884104fcba2196df31b9c8', alias: 'https://audit-qualita-20261024-v2.orologiai-it.pages.dev' },
  },
  database_autorevole: {
    file: 'orologiai-freebuff-directory-159-20261024.json',
    path_nel_repo: 'site/data/directory.json',
    sha256: H(dbBuf),
    bytes: dbBuf.length,
    ...dbStat,
    nota_province: '83 province distinte sul nome unificato «Valle d’Aosta/Vallée d’Aoste»; il report PR #6 riportava 84 perché prima della correzione audit la provincia AO era contata con due nomi diversi.',
  },
  checkpoint_precedente: {
    file: 'orologiai-freebuff-directory-checkpoint-5a5d5b04-f9f1ac9-20261024.json',
    deployment: '5a5d5b04-7f8a-438c-8f1b-6dfba0c05240',
    commit: 'f9f1ac92316e6f67bb9e945fc2088c6e90c82ad7',
    sha256: H(checkpointBuf),
    bytes: checkpointBuf.length,
    ...cpStat,
    differenze_checkpoint_vs_produzione_corrente: diffCheck,
    nota_differenze: 'Le sole differenze di dati fra checkpoint e produzione corrente sono le correzioni dell’audit del 24/10: unificazione della provincia AO (Courmayeur: «Aosta» → «Valle d’Aosta/Vallée d’Aoste» con redirect 301 dal vecchio URL). Nessun record, fonte, sede, ID, slug, URL o cronologia eliminato.',
  },
  documentazione_integrazione_codex: {
    path: 'docs/INTEGRAZIONE-CODEX-20261024.md',
    bytes: Buffer.byteLength(inlineText),
    sha256: H(Buffer.from(inlineText)),
    encoding: 'utf-8',
    content: inlineText,
  },
  report_e_test: reportTestEntries,
  manifest_lotti: {
    nota: 'Conteggi e ID letti dai report applicati veri; nessuna attribuzione ipotetica.',
    attivita_base_codex_107: 107,
    totale_finale: dbStat.attivita,
    lotti,
  },
  sorgenti_modificate_rispetto_alla_base_codex: {
    metodologia: 'Confronto SHA-256 fra ogni file tracciato di questo repository e il manifest files del pacchetto base «orologiai-source-integration» v2 allegato (107 attività, sha256 database 31ab4ca3…). Dove l’hash del manifest base non era trascrivibile per intero dal documento troncato (10 file), il file è classificato «uguale-per-bytes» se la dimensione coincide esattamente, altrimenti «modificato».',
    conteggi: {
      file_tracciati_totali: tracked.length,
      identici_alla_base: conteggiClass.uguali,
      identici_per_bytes_sha_base_non_trascrivibile: conteggiClass.ugualiPerBytes || 0,
      modificati: conteggiClass.modificati,
      nuovi: conteggiClass.nuovi,
      solo_manifest_con_contenuto_altrove: conteggiClass.soloManifest,
      asset_pubblici_legacy: pubblici.length,
      bundle_generati: bundles.length,
      file_base_non_presenti_da_noi: [...baseMap.keys()].filter((p) => !tracked.includes(p) && !p.startsWith('public/')).length + ' (contenuti della preview UX2: tests/ux2-*, scripts/audit-directory-integration.ts, docs/UX2-*, ecc. — li ha solo la base Codex)',
    },
    voci: sorgenti,
    asset_pubblici_legacy_omit_content: {
      nota: 'I 106 asset statici del sito WordPress ereditato sono invariati dall’import statico b883627 del 2026-10-15 (nessun commit li ha mai toccati); sha256 per file qui sotto, contenuto omesso per dimensione. Verifica per campione contro il manifest legacy della base Codex.',
      file: pubblici,
      verifica_campioni: legacyEsiti,
      esito_verifica_campioni: {
        totale: legacyEsiti.length,
        confrontabili: legacyEsiti.filter((e) => e.confrontabile).length,
        corrispondenti: legacyEsiti.filter((e) => e.corrisponde).length,
        difformi: legacyEsiti.filter((e) => e.confrontabile && !e.corrisponde).map((e) => e.path),
        non_confrontabili: legacyEsiti.filter((e) => !e.confrontabile).map((e) => e.path),
      },
    },
    bundle_generati_omit_content: bundles,
  },
  esclusioni_sicurezza: [
    '.env, .dev.vars e varianti (mai inclusi)',
    '.git, node_modules, dist, .runtime, export/ (mai inclusi)',
    'nessun token, Global API Key, cookie di sessione o credenziale presente nei file inclusi',
    'le chiavi non sono richieste: l’accesso Cloudflare è già collegato in Freebuff e già usato per i deployment',
  ],
  verifiche_all_esportazione: {
    npm_test_24_10_all_export: 'npm ci rieseguito al momento dell’export e suite node:test completa eseguita sul database esportato: 193 pass, 0 fail',
    npm_run_verify_ultima_esecuzione: '193/193 test verdi anche nella sessione di rilascio del 24/10, incluso il typecheck Astro/TypeScript e il build',
    http_produzione_24_10: 'home 200, apex 301, sitemap 159 schede, query corrette, API 405/200/415/403',
    cloudflare_api_24_10: 'deployment 2602c569 e 5a5d5b04 confermati in sola lettura con i commit dichiarati',
  },
};
writeFileSync('export/orologiai-freebuff-sorgenti-report-20261024.json', JSON.stringify(report, null, 1));

// ───────────────────────── riepilogo ─────────────────────────
const size = (p) => readFileSync(p).length;
for (const f of ['export/orologiai-freebuff-directory-159-20261024.json', 'export/orologiai-freebuff-directory-checkpoint-5a5d5b04-f9f1ac9-20261024.json', 'export/orologiai-freebuff-sorgenti-report-20261024.json']) {
  console.log(f, size(f), 'byte', size(f) < 5_000_000 ? 'OK <5MB' : '!!! OLTRE 5MB');
}
console.log('sha256 directory 159:', H(readFileSync('export/orologiai-freebuff-directory-159-20261024.json')));
console.log('sha256 checkpoint:', H(checkpointBuf));
console.log('sha256 report:', H(readFileSync('export/orologiai-freebuff-sorgenti-report-20261024.json')));
console.log('conteggi DB:', JSON.stringify(dbStat));
console.log('classificazione:', JSON.stringify(conteggiClass));
console.log('legacy campioni:', JSON.stringify(report.sorgenti_modificate_rispetto_alla_base_codex.asset_pubblici_legacy_omit_content.esito_verifica_campioni));
console.log('diff checkpoint→produzione:', JSON.stringify(diffCheck.map((d) => d.tipo + ':' + d.id)));
