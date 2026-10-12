/* Ordo Virtutum — servidor de salas do co-op.
   Faz só duas coisas: entrega os arquivos do jogo (index.html e a pasta js) e junta até quatro navegadores numa sala.
   Ele não conhece as regras do jogo: o navegador de quem cria a sala (o anfitrião) decide o mundo,
   e o servidor apenas repassa as mensagens entre eles. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORTA = process.env.PORT || 8080;
const RAIZ = __dirname;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };
const PROIBIDOS = new Set(['server.js', 'package.json', 'package-lock.json']);

/* ---------- os arquivos do jogo ---------- */
const servidor = http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent((req.url || '/').split('?')[0]); } catch (e) { res.writeHead(400); res.end(); return; }
  if (url === '/saude') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end('ok'); return; }
  if (url === '/') url = '/index.html';
  const arq = path.normalize(path.join(RAIZ, url));
  const rel = path.relative(RAIZ, arq);
  const ext = path.extname(arq).toLowerCase();
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).some(p => p.startsWith('.') || p === 'node_modules') || PROIBIDOS.has(rel) || !TIPOS[ext]) { res.writeHead(404); res.end('Não encontrado'); return; }
  fs.readFile(arq, (err, dados) => {
    if (err) { res.writeHead(404); res.end('Não encontrado'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[ext], 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300' });
    res.end(dados);
  });
});

/* ---------- as salas ---------- */
/* v25: até 4 jogadores por sala. O anfitrião ocupa a vaga 0; os convidados, as vagas 1 a 3.
   Cada mensagem repassada leva `de` (a vaga de quem mandou). Com `para`, vai só para aquela vaga;
   sem `para`, a do anfitrião vai para todos os convidados, e a de um convidado vai só para o anfitrião
   (menos o estado do personagem e os efeitos visuais, que todos veem). */
const VAGAS = 4;
const PARA_TODOS = new Set(['eu', 'fxp', 'entrega', 'barco']); // v26: a cena de entrega e o barco, todos veem
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const salas = new Map(); // código -> { ws: [anfitrião, conv1, conv2, conv3], nomes, fichas, versao, vaziaDesde, semAnfitriaoDesde }
const novoCodigo = () => { for (let n = 0; n < 200; n++) { let c = ''; for (let i = 0; i < 4; i++) c += LETRAS[Math.floor(Math.random() * LETRAS.length)]; if (!salas.has(c)) return c; } return null; };
const ficha = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const enviar = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg)); };
const online = ws => !!(ws && ws.readyState === 1);
const outros = (sala, vaga) => sala.ws.map((w, k) => [k, w]).filter(([k, w]) => k !== vaga && online(w));
const jogadores = (sala, vaga) => outros(sala, vaga).map(([k]) => ({ slot: k, nome: sala.nomes[k] }));

const wss = new WebSocketServer({ server: servidor, path: '/ws', maxPayload: 512 * 1024 });
wss.on('connection', ws => {
  ws.vivo = true; ws.sala = null; ws.papel = null; ws.vaga = -1;
  ws.on('pong', () => { ws.vivo = true; });
  ws.on('message', bruto => {
    ws.vivo = true;
    const txt = bruto.toString();
    let msg; try { msg = JSON.parse(txt); } catch (e) { return; }
    if (!msg || typeof msg.t !== 'string') return;
    if (msg.t === 'ping') { enviar(ws, { t: 'pong' }); return; }

    if (msg.t === 'criar') {
      if (ws.sala) return;
      // o anfitrião que caiu pode recriar a sala com o mesmo código, se ele ainda estiver livre
      let codigo = typeof msg.codigo === 'string' && /^[A-Z]{4}$/.test(msg.codigo) && !salas.has(msg.codigo) ? msg.codigo : novoCodigo();
      if (!codigo) { enviar(ws, { t: 'erro', msg: 'O servidor está cheio. Tente de novo em instantes.' }); return; }
      const sala = { ws: [ws, null, null, null], versao: String(msg.versao || ''), nomes: [String(msg.nome || 'Anfitrião').slice(0, 30), '', '', ''], fichas: [ficha(), null, null, null], vaziaDesde: 0, semAnfitriaoDesde: 0 };
      salas.set(codigo, sala); ws.sala = codigo; ws.papel = 'anfitriao'; ws.vaga = 0;
      enviar(ws, { t: 'sala', codigo, papel: 'anfitriao', slot: 0, ficha: sala.fichas[0], jogadores: [] });
      return;
    }
    if (msg.t === 'entrar' || msg.t === 'voltar') {
      if (ws.sala) return;
      const codigo = String(msg.codigo || '').toUpperCase().trim();
      const sala = salas.get(codigo);
      const anf = msg.t === 'voltar' && msg.papel === 'anfitriao';
      if (!sala) { enviar(ws, { t: 'erro', msg: msg.t === 'voltar' ? 'A sala não existe mais.' : 'Não existe sala com esse código.', semSala: true }); return; }
      if (String(msg.versao || '') !== sala.versao) { enviar(ws, { t: 'erro', msg: 'Vocês estão com versões diferentes do jogo. Todos precisam recarregar a página (Ctrl+F5).' }); return; }
      let vaga = -1;
      if (anf) {
        if (msg.ficha !== sala.fichas[0]) { enviar(ws, { t: 'erro', msg: 'Não foi possível voltar como anfitrião.' }); return; }
        vaga = 0;
      } else {
        // quem volta com a própria ficha reencontra a sua vaga; quem chega pega a primeira livre
        if (msg.t === 'voltar' && msg.ficha) for (let k = 1; k < VAGAS; k++) if (sala.fichas[k] === msg.ficha) vaga = k;
        if (vaga < 0) for (let k = 1; k < VAGAS; k++) if (!online(sala.ws[k])) { vaga = k; break; }
        if (vaga < 0) { enviar(ws, { t: 'erro', msg: 'Esta sala já tem quatro jogadores.' }); return; }
      }
      if (online(sala.ws[vaga])) { try { sala.ws[vaga].vaga = -1; sala.ws[vaga].terminate(); } catch (e) { /* nada */ } }
      sala.ws[vaga] = ws; ws.sala = codigo; ws.papel = vaga === 0 ? 'anfitriao' : 'convidado'; ws.vaga = vaga; sala.vaziaDesde = 0;
      if (vaga === 0) sala.semAnfitriaoDesde = 0;
      else { if (msg.t === 'entrar' || sala.fichas[vaga] !== msg.ficha) sala.fichas[vaga] = ficha(); sala.nomes[vaga] = String(msg.nome || 'Convidado').slice(0, 30); }
      enviar(ws, { t: 'sala', codigo, papel: ws.papel, slot: vaga, ficha: sala.fichas[vaga], colega: sala.nomes[0], colegaOn: vaga === 0 ? outros(sala, 0).length > 0 : online(sala.ws[0]), jogadores: jogadores(sala, vaga) });
      for (const [, w] of outros(sala, vaga)) enviar(w, { t: 'colega_entrou', slot: vaga, nome: sala.nomes[vaga], voltou: msg.t === 'voltar' });
      return;
    }
    // todo o resto é do jogo: o servidor só carimba quem mandou e entrega
    const sala = ws.sala && salas.get(ws.sala);
    if (!sala || sala.ws[ws.vaga] !== ws) return;
    msg.de = ws.vaga;
    const saida = JSON.stringify(msg);
    if (typeof msg.para === 'number') { if (msg.para !== ws.vaga) enviar(sala.ws[msg.para], saida); return; }
    if (ws.vaga === 0 || PARA_TODOS.has(msg.t)) { for (const [k, w] of outros(sala, ws.vaga)) if (ws.vaga === 0 ? k > 0 : true) enviar(w, saida); return; }
    enviar(sala.ws[0], saida);
  });
  ws.on('close', () => {
    const sala = ws.sala && salas.get(ws.sala);
    if (!sala || ws.vaga < 0 || sala.ws[ws.vaga] !== ws) return;
    sala.ws[ws.vaga] = null;
    for (const [, w] of outros(sala, ws.vaga)) enviar(w, { t: 'colega_saiu', slot: ws.vaga, papel: ws.papel });
    if (ws.vaga === 0) sala.semAnfitriaoDesde = Date.now();
    if (!sala.ws.some(online)) sala.vaziaDesde = Date.now();
  });
});

// a cada 25 s: confere quem ainda está conectado e apaga as salas abandonadas
setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.vivo) { ws.terminate(); return; } ws.vivo = false; try { ws.ping(); } catch (e) { /* nada */ } });
  const agora = Date.now();
  for (const [codigo, sala] of salas) {
    if (sala.vaziaDesde && agora - sala.vaziaDesde > 2 * 60 * 1000) salas.delete(codigo);
    else if (sala.semAnfitriaoDesde && agora - sala.semAnfitriaoDesde > 3 * 60 * 1000) { sala.ws.forEach((w, k) => { if (k > 0) enviar(w, { t: 'sala_fechada' }); }); salas.delete(codigo); }
  }
}, 25000);

servidor.listen(PORTA, () => console.log(`Ordo Virtutum no ar na porta ${PORTA}`));
