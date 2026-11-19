import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Gera um único index.html (abre direto com duplo clique, sem servidor);
// vídeos e imagens ficam ao lado, em ./media
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  // O build vai direto para a pasta da aula (um nível acima), ao lado de ./media.
  // emptyOutDir: false para não apagar esta pasta fonte/ nem os vídeos.
  publicDir: false,
  build: { outDir: '..', emptyOutDir: false },
});
