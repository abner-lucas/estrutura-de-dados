import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Gera um único index.html: basta publicar esse arquivo (ou abrir com duplo clique)
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  // O build vai direto para a pasta do simulador (um nível acima), ao lado de ./materiais.
  // emptyOutDir: false para não apagar esta pasta fonte/ nem os materiais.
  build: { outDir: '..', emptyOutDir: false },
});
