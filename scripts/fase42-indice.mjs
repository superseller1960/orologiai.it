// Fase 42 — invoca la generazione tipizzata dell'indice compatto (scripts/fase42-indice.ts).
import { execFileSync } from 'node:child_process';

execFileSync('npx', ['tsx', 'scripts/fase42-indice.ts'], { stdio: 'inherit' });
