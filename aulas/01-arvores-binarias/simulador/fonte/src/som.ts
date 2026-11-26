// Bipe de leitor de código de barras com a Web Audio API (sem arquivos de áudio).
// Onda quadrada perto de 1,8 kHz com rampas curtas de volume (sem estalo).
// O som começa desligado: só toca depois que o aluno liga no botão "Som".

let ctx: AudioContext | null = null;
let ligado = false;
try { ligado = localStorage.getItem('abb:som') === '1'; } catch { /* navegação privada */ }

export const somLigado = () => ligado;

export function ligarSom(sim: boolean) {
  ligado = sim;
  try { localStorage.setItem('abb:som', sim ? '1' : '0'); } catch { /* ignora */ }
  // O navegador só libera áudio a partir de um clique: criamos/retomamos o contexto aqui.
  if (sim) {
    ctx = ctx ?? new AudioContext();
    void ctx.resume();
    bipe('ok');
  }
}

type Tipo = 'leitura' | 'ok' | 'nao' | 'cadastro';
const NOTAS: Record<Tipo, [number, number][]> = {
  leitura: [[1850, 0.07]],
  ok: [[1850, 0.07], [2400, 0.11]],
  nao: [[420, 0.18]],
  cadastro: [[1320, 0.06], [1760, 0.09]],
};

export function bipe(tipo: Tipo = 'leitura') {
  if (!ligado) return;
  ctx = ctx ?? new AudioContext();
  let t = ctx.currentTime + 0.01;
  for (const [freq, dur] of NOTAS[tipo]) {
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    ganho.gain.setValueAtTime(0, t);
    ganho.gain.linearRampToValueAtTime(0.06, t + 0.008);
    ganho.gain.setValueAtTime(0.06, t + dur - 0.015);
    ganho.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(ganho).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur + 0.04;
  }
}
