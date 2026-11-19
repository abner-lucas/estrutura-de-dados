// Catálogo único de cenas: usado tanto pelo Player no navegador quanto pela renderização dos vídeos
import type React from 'react';
import { StepScene, stepDuration } from './StepScene';
import { AnatomyScene, BinaryScene, Cover, GraphScene, GrowthChart, HashScene, NodeAnatomy, SequentialScene, ShiftScene } from './Scenes';
import {
  CODE_BUSCA, CODE_INSERIR, CODE_PERCURSO, CODE_REMOVER,
  growSteps, insertSteps, removeSteps, searchSteps, traversalSteps,
} from '../bst';

export const ABB = [50, 30, 10, 40, 80, 60, 90];
export const ABB_REM = [50, 25, 10, 30, 75, 55, 85];
export const ABB_PERC = [50, 25, 10, 30, 75, 60, 90];

export interface SceneDef {
  component: React.FC<any>;
  props?: Record<string, unknown>;
  duration: number;
}

const step = (steps: ReturnType<typeof searchSteps>, code?: string[], title?: string, codeTitle?: string): SceneDef => ({
  component: StepScene, props: { steps, code, title, codeTitle }, duration: stepDuration(steps),
});

export const SCENES: Record<string, SceneDef> = {
  cover: { component: Cover, props: { bare: true }, duration: 240 },
  growth: { component: GrowthChart, duration: 270 },
  sequential: { component: SequentialScene, duration: 230 },
  binary: { component: BinaryScene, duration: 300 },
  shift: { component: ShiftScene, duration: 200 },
  anatomy: { component: AnatomyScene, duration: 300 },
  node: { component: NodeAnatomy, duration: 240 },
  busca40: step(searchSteps(ABB, 40), CODE_BUSCA, 'Busca do valor 40'),
  busca35: step(searchSteps(ABB, 35), CODE_BUSCA, 'Busca de um valor inexistente (35)'),
  inserir45: step(insertSteps(ABB, 45), CODE_INSERIR, 'Inserção do 45: uma busca que "falhou"'),
  pre: step(traversalSteps(ABB_PERC, 'pre'), CODE_PERCURSO.pre, 'Percurso Pré-Ordem'),
  em: step(traversalSteps(ABB_PERC, 'em'), CODE_PERCURSO.em, 'Percurso Em-Ordem'),
  pos: step(traversalSteps(ABB_PERC, 'pos'), CODE_PERCURSO.pos, 'Percurso Pós-Ordem'),
  rem1: step(removeSteps(ABB_REM, 10), CODE_REMOVER, 'Remoção · Caso 1: nó folha'),
  rem2: step(removeSteps([50, 25, 10, 75, 55, 85], 25), CODE_REMOVER, 'Remoção · Caso 2: nó com 1 filho'),
  rem3: step(removeSteps(ABB_REM, 50), CODE_REMOVER, 'Remoção · Caso 3: nó com 2 filhos'),
  saudavel: step(growSteps([40, 20, 60, 10, 30, 50, 70], 'Aleatórios'), undefined, 'Dados aleatórios → árvore saudável'),
  degenerada: step(growSteps([10, 20, 30, 40, 50, 60, 70], 'Ordenados'), undefined, 'Dados ordenados → árvore degenerada'),
  hash: { component: HashScene, props: { mode: 'basico' }, duration: 120 },
  colisao: { component: HashScene, props: { mode: 'colisao' }, duration: 200 },
  encadeamento: { component: HashScene, props: { mode: 'encadeamento' }, duration: 200 },
  sondagem: { component: HashScene, props: { mode: 'sondagem' }, duration: 200 },
  bfs: { component: GraphScene, props: { kind: 'bfs' }, duration: 8 * 40 + 30 },
  dfs: { component: GraphScene, props: { kind: 'dfs' }, duration: 8 * 40 + 30 },
};

// Vídeos renderizados em MP4: sequências de cenas
export const VIDEOS: Record<string, string[]> = {
  'abertura': ['cover'],
  'abb-em-acao': ['busca40', 'inserir45', 'em', 'rem3'],
  'cartografia-dos-dados': ['growth', 'sequential', 'binary', 'shift', 'hash', 'colisao', 'bfs'],
};

export const videoDuration = (ids: string[]) => ids.reduce((a, id) => a + SCENES[id].duration, 0);
