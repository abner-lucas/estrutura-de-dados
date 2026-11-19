import { continueRender, delayRender, registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

// Carrega as fontes do portal antes de renderizar cada quadro dos vídeos;
// sem isso o Chromium do Remotion usaria a fonte padrão do sistema.
const espera = delayRender('carregando fontes');
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=block';
const liberar = () => continueRender(espera);
link.onload = () => {
  Promise.all(['400 20px Manrope', '700 20px Manrope', '800 20px Manrope', '700 20px "Space Grotesk"', '400 20px "JetBrains Mono"', '700 20px "JetBrains Mono"']
    .map((f) => document.fonts.load(f))).then(liberar, liberar);
};
link.onerror = liberar;
document.head.appendChild(link);

registerRoot(RemotionRoot);
