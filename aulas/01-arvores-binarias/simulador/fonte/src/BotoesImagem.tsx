import React, { useState } from 'react';
import { baixarImagem, copiarImagem } from './imagem';

// Botões "Copiar imagem" e "Baixar" para levar uma imagem do simulador à ficha.
// gerar() produz o PNG na hora do clique (assim a imagem é sempre a do momento).
export function BotoesImagem({ gerar, nome, compacto = false }: { gerar: () => Promise<Blob>; nome: string; compacto?: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const avisar = (ok: boolean, texto: string) => { setMsg({ ok, texto }); setTimeout(() => setMsg(null), 5000); };
  const copiar = async () => {
    try {
      const blob = await gerar();
      if (await copiarImagem(blob)) avisar(true, 'Imagem copiada. Na ficha, clique no espaço e aperte Ctrl + V.');
      else { baixarImagem(blob, nome); avisar(false, 'O navegador não deixou copiar: a imagem foi baixada. Arraste o arquivo para a ficha.'); }
    } catch { avisar(false, 'Não foi possível gerar a imagem. Tente de novo.'); }
  };
  const baixar = async () => {
    try { baixarImagem(await gerar(), nome); avisar(true, 'Imagem baixada. Arraste o arquivo para a ficha.'); }
    catch { avisar(false, 'Não foi possível gerar a imagem. Tente de novo.'); }
  };
  return (
    <span className={`img-botoes ${compacto ? 'compacto' : ''}`}>
      <button type="button" className="btn img-copiar" onClick={copiar}>Copiar imagem</button>
      <button type="button" className="btn ghost img-baixar" onClick={baixar}>Baixar</button>
      {msg && <span className={`img-msg ${msg.ok ? 'ok' : 'bad'}`} role="status">{msg.texto}</span>}
    </span>
  );
}
