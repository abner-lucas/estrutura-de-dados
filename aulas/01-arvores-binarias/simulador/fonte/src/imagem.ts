// Imagens prontas para a ficha: o aluno copia (botão) ou arrasta com o mouse, sem tirar print.
// - cupomPng: desenha o cupom de comprovante num canvas (PNG)
// - arvorePng: transforma o SVG do depósito em PNG, com uma faixa de título
import { barras } from './barras';

const MONO = "'JetBrains Mono', Consolas, monospace";

async function fontesProntas() {
  try {
    await Promise.all(['400 13px "JetBrains Mono"', '700 13px "JetBrains Mono"'].map((f) => document.fonts.load(f)));
  } catch { /* segue com a fonte reserva */ }
}

const paraBlob = (c: HTMLCanvasElement) => new Promise<Blob>((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error('falha ao gerar imagem'))), 'image/png'));

/** Quebra um texto em linhas que caibam na largura dada. */
function quebrar(ctx: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const palavras = texto.split(' ');
  const linhas: string[] = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width <= largura || !atual) atual = teste;
    else { linhas.push(atual); atual = p; }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

export interface DadosCupom { missao: string; linhas: [string, string][]; dataHora: string; codigo: string }

/** Cupom de impressora térmica em PNG (2x para ficar nítido na ficha). */
export async function cupomPng(d: DadosCupom): Promise<Blob> {
  await fontesProntas();
  const E = 2, W = 330, P = 18, util = W - 2 * P;
  const medidor = document.createElement('canvas').getContext('2d')!;
  // primeiro mede a altura total
  medidor.font = `700 13px ${MONO}`;
  const blocos = d.linhas.map(([k, v]) => {
    medidor.font = `400 13px ${MONO}`;
    const larguraRotulo = medidor.measureText(k).width + 12;
    medidor.font = `700 13px ${MONO}`;
    const cabe = medidor.measureText(v).width <= util - larguraRotulo;
    return { k, v, cabe, linhasValor: cabe ? [v] : quebrar(medidor, v, util) };
  });
  const H = 18 + 20 + 16 + 16 + 14 + 22 + blocos.reduce((s, b) => s + (b.cabe ? 20 : 20 + b.linhasValor.length * 18), 0) + 14 + 20 + 50 + 26;

  const c = document.createElement('canvas');
  c.width = W * E; c.height = H * E;
  const g = c.getContext('2d')!;
  g.scale(E, E);
  // papel com borda serrilhada embaixo
  g.fillStyle = '#FFFEF8';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H - 8);
  for (let x = W; x > 0; x -= 12) { g.lineTo(x - 6, H); g.lineTo(x - 12, H - 8); }
  g.closePath(); g.fill();
  g.strokeStyle = '#E4E0D2'; g.lineWidth = 1; g.stroke();

  let y = 18;
  const centro = (txt: string, fonte: string, cor = '#222') => { g.font = fonte; g.fillStyle = cor; g.textAlign = 'center'; g.fillText(txt, W / 2, y); };
  const tracejado = () => { g.save(); g.strokeStyle = '#999'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(P, y); g.lineTo(W - P, y); g.stroke(); g.restore(); };
  g.textBaseline = 'top';
  centro('E S T O Q U E   A B B', `700 16px ${MONO}`); y += 22;
  centro('Estrutura de Dados · IFPA Campus Breves', `400 11px ${MONO}`, '#555'); y += 16;
  centro('COMPROVANTE DE MISSÃO', `400 11px ${MONO}`, '#555'); y += 20;
  tracejado(); y += 10;
  g.textAlign = 'left'; g.font = `700 12.5px ${MONO}`; g.fillStyle = '#222'; g.fillText(d.missao.toUpperCase(), P, y); y += 22;
  for (const b of blocos) {
    g.textAlign = 'left'; g.font = `400 13px ${MONO}`; g.fillStyle = '#555'; g.fillText(b.k, P, y);
    g.textAlign = 'right'; g.font = `700 13px ${MONO}`; g.fillStyle = '#222';
    if (b.cabe) { g.fillText(b.v, W - P, y); y += 20; }
    else { y += 18; for (const l of b.linhasValor) { g.fillText(l, W - P, y); y += 18; } y += 2; }
  }
  y += 2; tracejado(); y += 10;
  g.font = `400 11.5px ${MONO}`; g.fillStyle = '#555';
  g.textAlign = 'left'; g.fillText(d.dataHora, P, y);
  g.textAlign = 'right'; g.fillText(`nº ${d.codigo}`, W - P, y); y += 22;
  // código de barras do número do cupom
  const bin = barras(d.codigo, 'CODE128');
  const bw = util / bin.length;
  g.fillStyle = '#111';
  for (let i = 0; i < bin.length; i++) if (bin[i] === '1') g.fillRect(P + i * bw, y, bw + 0.2, 44);
  return paraBlob(c);
}

const ESTILOS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity',
  'stroke-opacity', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'paint-order', 'display', 'visibility'];

/** O depósito (SVG da árvore) em PNG, com uma faixa de título e os contadores. */
export async function arvorePng(svg: SVGSVGElement, titulo: string, detalhe: string): Promise<Blob> {
  await fontesProntas();
  const r = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // copia os estilos calculados (que vêm do CSS) para dentro do SVG, que vai virar imagem sozinho
  const orig = [svg, ...svg.querySelectorAll('*')];
  const copia = [clone, ...clone.querySelectorAll('*')];
  orig.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const alvo = copia[i] as SVGElement;
    for (const p of ESTILOS) alvo.style.setProperty(p, cs.getPropertyValue(p));
    alvo.style.setProperty('font-family', MONO);
    alvo.style.setProperty('animation', 'none');
    alvo.style.setProperty('transition', 'none');
  });
  clone.setAttribute('width', String(r.width));
  clone.setAttribute('height', String(r.height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  const img = new Image();
  await new Promise((ok, erro) => { img.onload = ok; img.onerror = erro; img.src = url; });

  const E = 2, faixa = 40;
  const c = document.createElement('canvas');
  c.width = r.width * E; c.height = (r.height + faixa) * E;
  const g = c.getContext('2d')!;
  g.scale(E, E);
  g.fillStyle = '#E9EDF1'; g.fillRect(0, 0, r.width, r.height + faixa);
  g.drawImage(img, 0, faixa, r.width, r.height);
  URL.revokeObjectURL(url);
  // faixa de título: placa amarela do depósito + o que a árvore é + contadores
  g.fillStyle = '#F2C230'; g.fillRect(12, 9, 92, 22);
  g.fillStyle = '#1B1B1B'; g.font = `700 12px ${MONO}`; g.textBaseline = 'middle'; g.fillText('DEPÓSITO', 20, 20);
  g.fillStyle = '#0F1B2D'; g.font = `600 12px ${MONO}`; g.fillText(titulo, 116, 20);
  g.textAlign = 'right'; g.fillText(detalhe, r.width - 12, 20);
  return paraBlob(c);
}

/** Copia a imagem para a área de transferência. Devolve false se o navegador não deixar. */
export async function copiarImagem(blob: Blob): Promise<boolean> {
  try {
    if (!('ClipboardItem' in window) || !navigator.clipboard?.write) return false;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

export function baixarImagem(blob: Blob, nome: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
