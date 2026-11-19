import React from 'react';
import { Composition, Series, Still } from 'remotion';
import { FPS, W, H } from '../theme';
import { SCENES, VIDEOS, videoDuration } from './catalog';
import { ArtStill } from './Scenes';

// Vídeo = cenas do catálogo em sequência (cortes secos: fade em MP4 sem alfa vira tela branca)
const Sequence: React.FC<{ ids: string[] }> = ({ ids }) => (
  <Series>
    {ids.map((id) => {
      const S = SCENES[id];
      const Comp = S.component;
      return (
        <Series.Sequence key={id} durationInFrames={S.duration}>
          <Comp {...(S.props ?? {})} />
        </Series.Sequence>
      );
    })}
  </Series>
);

export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(VIDEOS).map(([id, ids]) => (
      <Composition key={id} id={id} component={Sequence} defaultProps={{ ids }}
        durationInFrames={videoDuration(ids)} fps={FPS} width={W} height={H} />
    ))}
    {[0, 1, 2, 3].map((v) => (
      <Still key={v} id={`arte-${v}`} component={ArtStill} defaultProps={{ variant: v }} width={W} height={H} />
    ))}
  </>
);
