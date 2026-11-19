import React, { useCallback, useEffect, useState } from 'react';
import { SLIDES, type Slide } from './deck';
import { Anim, IfLogo, StageCtx } from './components';
import { SCENES } from './remotion/catalog';

const STAGE_W = 1600, STAGE_H = 900;

const fromHash = () => {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const i = SLIDES.findIndex((s) => s.id === id);
  return i >= 0 ? i : 0;
};

const fx = (s: Slide) => (s.kind === 'divider' || s.kind === 'cover' || s.kind === 'final' ? 'zoom' : 'turn');

const SlideView: React.FC<{ s: Slide; i: number; go: (id: string) => void; next: () => void }> = ({ s, i, go, next }) => {
  if (s.kind === 'cover') {
    return (
      <div className="slide cover">
        <video className="cover-video" src="./media/abertura.mp4" autoPlay muted playsInline
          onEnded={(e) => { (e.target as HTMLVideoElement).currentTime = 6; (e.target as HTMLVideoElement).play(); }} />
        <div className="cover-title">
          <div className="cover-tag">ESTRUTURA DE DADOS · IFPA</div>
          <h1>Árvores Binárias de Busca</h1>
          <p>A jornada do dado: da força bruta ao O(log n)</p>
        </div>
        <div className="cover-top"><IfLogo light /></div>
        <div className="cover-panel">
          <div className="cover-kicker rv" style={{ ['--d' as string]: '1.6s' }}>Prof. Ábner Lucas · Estrutura de Dados</div>
          <button className="cover-start rv" style={{ ['--d' as string]: '2s' }} onClick={next}>Começar a jornada →</button>
          <div className="cover-help rv" style={{ ['--d' as string]: '2.3s' }}>← → navegar · M mapa · F tela cheia</div>
        </div>
      </div>
    );
  }
  if (s.kind === 'divider') {
    return (
      <div className="slide divider" style={{ backgroundImage: `url(./media/${s.art}.png)` }}>
        <div className="divider-shade" />
        <div className="divider-num">{s.num}</div>
        <div className="divider-text">
          <div className="divider-kicker">PARTE {s.num}</div>
          <h1>{s.title}</h1>
          <p>{s.subtitle}</p>
        </div>
        <div className="divider-logo"><IfLogo light /></div>
      </div>
    );
  }
  if (s.kind === 'final') {
    return (
      <div className="slide final">
        <div className="final-anim"><Anim scene={{ ...SCENES.cover, props: { bare: true } }} /></div>
        <div className="final-text">
          <h1 className="rv" style={{ ['--d' as string]: '0.2s' }}>O algoritmo reflete os dados</h1>
          <p className="rv" style={{ ['--d' as string]: '0.5s' }}>Estruturas de dados não são ferramentas neutras: são o modelo mental que impomos à realidade. O melhor algoritmo é o que compreende a natureza, a mutabilidade e a escala da informação.</p>
          <p className="final-quote rv" style={{ ['--d' as string]: '0.9s' }}>Desenhe o mapa certo. O caminho se revelará.</p>
          <h2 className="rv" style={{ ['--d' as string]: '1.3s' }}>Alguma dúvida?</h2>
          <IfLogo light />
        </div>
      </div>
    );
  }
  return (
    <div className="slide content">
      <header className="hdr">
        <h2>{s.title}</h2>
        <div className="hdr-logo"><IfLogo light /></div>
      </header>
      <main className="body">{s.body?.(go)}</main>
      <footer className="ftr">
        <span>Estrutura de Dados · IFPA Campus Breves</span>
        <span className="ftr-part">{s.part}</span>
        <span>{i + 1} / {SLIDES.length}</span>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  const [cur, setCur] = useState(fromHash);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  // classe da animação de entrada, fixada no momento da navegação para não reiniciar no fim da transição
  const [enterFx, setEnterFx] = useState('first');
  const [overview, setOverview] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const goto = useCallback((n: number) => {
    setCur((c) => {
      const t = Math.max(0, Math.min(SLIDES.length - 1, n));
      if (t === c) return c;
      setDir(t > c ? 1 : -1);
      setEnterFx(fx(SLIDES[t]));
      setPrev(c);
      history.replaceState(null, '', `#/${SLIDES[t].id}`);
      return t;
    });
  }, []);
  const goId = useCallback((id: string) => { goto(SLIDES.findIndex((s) => s.id === id)); setOverview(false); }, [goto]);

  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), 750);
    return () => clearTimeout(t);
  }, [prev, cur]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goto(cur + 1); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goto(cur - 1); }
      else if (e.key === 'Home') goto(0);
      else if (e.key === 'End') goto(SLIDES.length - 1);
      else if (e.key.toLowerCase() === 'm' || e.key === 'Escape') setOverview((o) => e.key === 'Escape' ? false : !o);
      else if (e.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
      }
    };
    const onHash = () => goto(fromHash());
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onHash); };
  }, [cur, goto]);

  const parts = Array.from(new Set(SLIDES.map((s) => s.part)));

  return (
    <div className="viewport">
      <div className="stage" style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%,-50%) scale(${scale})` }}>
        {prev !== null && (
          <StageCtx.Provider value={{ scale, settled: true }}>
            <div key={`p${prev}`} className={`layer leave ${enterFx} ${dir > 0 ? 'fwd' : 'back'}`}>
              <SlideView s={SLIDES[prev]} i={prev} go={goId} next={() => goto(prev + 1)} />
            </div>
          </StageCtx.Provider>
        )}
        <StageCtx.Provider value={{ scale, settled: prev === null }}>
          <div key={`c${cur}`} className={`layer enter ${enterFx} ${dir > 0 ? 'fwd' : 'back'}`}>
            <SlideView s={SLIDES[cur]} i={cur} go={goId} next={() => goto(cur + 1)} />
          </div>
        </StageCtx.Provider>
        <div className="progress"><div style={{ width: `${((cur + 1) / SLIDES.length) * 100}%` }} /></div>
        <button className="nav nav-l" onClick={() => goto(cur - 1)} aria-label="Anterior">‹</button>
        <button className="nav nav-r" onClick={() => goto(cur + 1)} aria-label="Próximo">›</button>
        <button className="mapbtn" onClick={() => setOverview(true)}>☰ Mapa</button>
        <a className="portalbtn" href="../../index.html#atividades" title="Voltar ao portal de Estrutura de Dados">← Portal</a>
        {overview && (
          <div className="overview" onClick={() => setOverview(false)}>
            <div className="ov-inner" onClick={(e) => e.stopPropagation()}>
              <div className="ov-head"><h2>Mapa da apresentação</h2><button onClick={() => setOverview(false)}>✕</button></div>
              {parts.map((p) => (
                <div key={p} className="ov-part">
                  <h3>{p}</h3>
                  <div className="ov-grid">
                    {SLIDES.map((s, i) => s.part !== p ? null : (
                      <button key={s.id} className={`ov-item ${i === cur ? 'on' : ''} k-${s.kind}`} onClick={() => goId(s.id)}>
                        <span>{i + 1}</span>{s.title ?? (s.kind === 'cover' ? 'Capa' : 'Encerramento')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
