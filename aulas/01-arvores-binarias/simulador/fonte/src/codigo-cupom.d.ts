// Tipos do módulo compartilhado com a página de conferência (arquivo .mjs fora de src/)
declare module '*/codigo-cupom.mjs' {
  export function codigoCupom(dados: { missao: 1 | 2 | 3; percurso?: string; campos: string[]; dataHora: Date | string }): string;
}
