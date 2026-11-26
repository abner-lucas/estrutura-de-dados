import React from 'react';
import JsBarcode from 'jsbarcode';

// Códigos de barras reais (JsBarcode) desenhados dentro do SVG da árvore.
// Cada produto do "estoque" ganha um EAN-13 de verdade: 789 (Brasil) + 0001 + código com 5 dígitos;
// o JsBarcode calcula o dígito verificador. Assim a etiqueta parece a de uma loja.

const cache = new Map<string, string>();

/** Sequência binária de barras (1 = barra escura) para o valor e o formato pedidos. */
export function barras(valor: string, formato: 'EAN13' | 'CODE128' = 'EAN13'): string {
  const chave = `${formato}:${valor}`;
  const salvo = cache.get(chave);
  if (salvo) return salvo;
  // Passando um objeto comum, o JsBarcode só codifica (não desenha nada na página).
  const dados: { encodings?: { data: string }[] } = {};
  try {
    JsBarcode(dados, valor, { format: formato });
  } catch {
    return barras(valor, 'CODE128');
  }
  const bin = (dados.encodings ?? []).map((e) => e.data).join('');
  cache.set(chave, bin);
  return bin;
}

export const eanDoCodigo = (codigo: number) => `7890001${String(Math.abs(Math.trunc(codigo)) % 100000).padStart(5, '0')}`;

/** Barras como retângulos SVG (barras vizinhas viram um retângulo só). */
export function Barras({ bin, x, y, w, h, className = 'barras' }: { bin: string; x: number; y: number; w: number; h: number; className?: string }) {
  const bw = w / Math.max(bin.length, 1);
  const rects: React.ReactElement[] = [];
  for (let i = 0; i < bin.length;) {
    if (bin[i] === '1') {
      let j = i;
      while (j < bin.length && bin[j] === '1') j++;
      rects.push(<rect key={i} x={x + i * bw} y={y} width={(j - i) * bw} height={h} />);
      i = j;
    } else i++;
  }
  return <g className={className}>{rects}</g>;
}

/** Barras em HTML (para o cupom das missões). */
export function BarrasSvg({ valor, formato = 'CODE128', altura = 42 }: { valor: string; formato?: 'EAN13' | 'CODE128'; altura?: number }) {
  const bin = barras(valor, formato);
  return (
    <svg className="cupom-barras" viewBox={`0 0 ${bin.length} ${altura}`} preserveAspectRatio="none" aria-hidden="true">
      <Barras bin={bin} x={0} y={0} w={bin.length} h={altura} className="" />
    </svg>
  );
}
