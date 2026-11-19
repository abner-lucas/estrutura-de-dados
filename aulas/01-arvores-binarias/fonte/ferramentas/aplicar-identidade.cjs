// Aplica a identidade visual do portal de Estrutura de Dados à apresentação.
// Troca a paleta verde do modelo IFPA/Canva pela paleta do portal (azul-marinho,
// petróleo, ciano e coral). Rode uma vez: node ferramentas/aplicar-identidade.cjs
// Ele é idempotente: rodar de novo não muda nada.
const fs = require('fs');
const path = require('path');

const PALETA = {
    // verdes institucionais → azul-marinho e petróleo
    '#385724': '#0F1B2D', '#4E7A33': '#0A7A72', '#70AD47': '#35D0C0', '#E2EBDA': '#D5EFEC',
    // laranja de destaque → coral do portal
    '#F7A21B': '#FF6A45', '#9B5B00': '#B23A1C', '#B26B00': '#B23A1C', '#D26A00': '#C2410C',
    '#FFF7E8': '#FFEDE7', '#FFF6E3': '#FFEDE7', '#FFFBF2': '#FFF6F2', '#FFF1D6': '#FFE3DA',
    // vermelho e azul ajustados para não brigar com o coral
    '#D9534F': '#E0475B', '#FBE3E2': '#FCE4E8', '#1F3864': '#15223A',
    // fundos e tintas esverdeados → neutros azulados
    '#0E170A': '#070C15', '#15201A': '#0D1626', '#22322A': '#15223A', '#1E3313': '#0F1828',
    '#12210B': '#0A101B', '#1E2B23': '#15223A', '#CFE3D3': '#E6EDF7', '#DDEFD0': '#DCE6F2',
    '#E9F7DC': '#E3F4F2', '#BFE3A5': '#9FDCD4', '#CDE8B5': '#BFE8E2', '#B8D99E': '#9DB0C9',
    '#EEF3EA': '#EEF2F6', '#F4F8F1': '#F1F5F9', '#F1F4EF': '#EEF2F6', '#FBFCFA': '#F8FAFC',
    '#4A5547': '#46566C', '#98A393': '#7E8EA5', '#9AA59A': '#7E8EA5', '#7C8B78': '#6B7A8F',
    '#9AA39A': '#8A97A8', '#C9D1C6': '#D2DAE5', '#DDE3DA': '#D2DAE5', '#9FB7A6': '#9DB0C9',
    '#1FA54A': '#1F8A4C', '#138A42': '#1F8A4C',
};
const RGBA = [
    [/rgba\(\s*56\s*,\s*87\s*,\s*36\s*,/g, 'rgba(15,27,45,'],
    [/rgba\(\s*12\s*,\s*24\s*,\s*8\s*,/g, 'rgba(7,12,21,'],
    [/rgba\(\s*20\s*,\s*34\s*,\s*12\s*,/g, 'rgba(10,16,27,'],
    [/rgba\(\s*10\s*,\s*20\s*,\s*6\s*,/g, 'rgba(7,12,21,'],
    [/rgba\(\s*247\s*,\s*162\s*,\s*27\s*,/g, 'rgba(255,106,69,'],
];

const raiz = path.join(__dirname, '..', 'src');
const arquivos = [];
(function varrer(d) {
    for (const n of fs.readdirSync(d)) {
        const p = path.join(d, n);
        if (fs.statSync(p).isDirectory()) varrer(p);
        else if (/\.(tsx?|css)$/.test(n)) arquivos.push(p);
    }
})(raiz);

const mapa = Object.fromEntries(Object.entries(PALETA).map(([k, v]) => [k.toLowerCase(), v]));
let total = 0;
for (const arq of arquivos) {
    let s = fs.readFileSync(arq, 'utf8');
    const antes = s;
    s = s.replace(/#[0-9a-fA-F]{6}\b/g, (h) => mapa[h.toLowerCase()] || h);
    for (const [re, novo] of RGBA) s = s.replace(re, novo);
    if (s !== antes) { fs.writeFileSync(arq, s); total++; console.log('✔', path.relative(raiz, arq)); }
}
console.log(`${total} arquivo(s) atualizados.`);
