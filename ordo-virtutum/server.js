/* Ordo Virtutum — servidor de salas do co-op.
   Faz só duas coisas: entrega os arquivos do jogo (index.html e a pasta js) e junta dois navegadores numa sala.
   Ele não conhece as regras do jogo: o navegador de quem cria a sala (o anfitrião) decide o mundo,
   e o servidor apenas repassa as mensagens de um para o outro. */
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
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const salas = new Map(); // código -> { anfitriao, convidado, versao, nomes, fichas, vaziaDesde, semAnfitriaoDesde }
const novoCodigo = () => { for (let n = 0; n < 200; n++) { let c = ''; for (let i = 0; i < 4; i++) c += LETRAS[Math.floor(Math.random() * LETRAS.length)]; if (!salas.has(c)) return c; } return null; };
const ficha = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const enviar = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg)); };
const outro = (sala, papel) => (papel === 'anfitriao' ? sala.convidado : sala.anfitriao);

const wss = new WebSocketServer({ server: servidor, path: '/ws', maxPayload: 512 * 1024 });
wss.on('connection', ws => {
  ws.vivo = true; ws.sala = null; ws.papel = null;
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
      const sala = { anfitriao: ws, convidado: null, versao: String(msg.versao || ''), nomes: { anfitriao: String(msg.nome || 'Anfitrião').slice(0, 30), convidado: '' }, fichas: { anfitriao: ficha(), convidado: null }, vaziaDesde: 0, semAnfitriaoDesde: 0 };
      salas.set(codigo, sala); ws.sala = codigo; ws.papel = 'anfitriao';
      enviar(ws, { t: 'sala', codigo, papel: 'anfitriao', ficha: sala.fichas.anfitriao });
      return;
    }
    if (msg.t === 'entrar' || msg.t === 'voltar') {
      if (ws.sala) return;
      const codigo = String(msg.codigo || '').toUpperCase().trim();
      const sala = salas.get(codigo);
      const papel = msg.t === 'voltar' && msg.papel === 'anfitriao' ? 'anfitriao' : 'convidado';
      if (!sala) { enviar(ws, { t: 'erro', msg: msg.t === 'voltar' ? 'A sala não existe mais.' : 'Não existe sala com esse código.', semSala: true }); return; }
      if (String(msg.versao || '') !== sala.versao) { enviar(ws, { t: 'erro', msg: 'Vocês estão com versões diferentes do jogo. Os dois precisam recarregar a página (Ctrl+F5).' }); return; }
      if (papel === 'anfitriao' && msg.ficha !== sala.fichas.anfitriao) { enviar(ws, { t: 'erro', msg: 'Não foi possível voltar como anfitrião.' }); return; }
      if (sala[papel] && sala[papel].readyState === 1) {
        if (papel === 'convidado' && msg.t === 'voltar' && msg.ficha && msg.ficha === sala.fichas.convidado) { try { sala[papel].terminate(); } catch (e) { /* nada */ } }
        else { enviar(ws, { t: 'erro', msg: 'Esta sala já tem dois jogadores.' }); return; }
      }
      sala[papel] = ws; ws.sala = codigo; ws.papel = papel; sala.vaziaDesde = 0;
      if (papel === 'anfitriao') sala.semAnfitriaoDesde = 0;
      if (papel === 'convidado') { if (msg.t === 'entrar' || !sala.fichas.convidado) sala.fichas.convidado = ficha(); sala.nomes.convidado = String(msg.nome || 'Convidado').slice(0, 30); }
      enviar(ws, { t: 'sala', codigo, papel, ficha: sala.fichas[papel], colega: sala.nomes[papel === 'anfitriao' ? 'convidado' : 'anfitriao'], colegaOn: !!(outro(sala, papel) && outro(sala, papel).readyState === 1) });
      enviar(outro(sala, papel), { t: 'colega_entrou', nome: sala.nomes[papel], voltou: msg.t === 'voltar' });
      return;
    }
    // todo o resto é do jogo: vai para o outro jogador da sala, sem mudar nada
    const sala = ws.sala && salas.get(ws.sala);
    if (!sala) return;
    enviar(outro(sala, ws.papel), txt);
  });
  ws.on('close', () => {
    const sala = ws.sala && salas.get(ws.sala);
    if (!sala || sala[ws.papel] !== ws) return;
    sala[ws.papel] = null;
    enviar(outro(sala, ws.papel), { t: 'colega_saiu', papel: ws.papel });
    if (ws.papel === 'anfitriao') sala.semAnfitriaoDesde = Date.now();
    if (!sala.anfitriao && !sala.convidado) sala.vaziaDesde = Date.now();
  });
});

// a cada 25 s: confere quem ainda está conectado e apaga as salas abandonadas
setInterval(() => {
  wss.clients.forEach(ws => { if (!ws.vivo) { ws.terminate(); return; } ws.vivo = false; try { ws.ping(); } catch (e) { /* nada */ } });
  const agora = Date.now();
  for (const [codigo, sala] of salas) {
    if (sala.vaziaDesde && agora - sala.vaziaDesde > 2 * 60 * 1000) salas.delete(codigo);
    else if (sala.semAnfitriaoDesde && agora - sala.semAnfitriaoDesde > 3 * 60 * 1000) { enviar(sala.convidado, { t: 'sala_fechada' }); salas.delete(codigo); }
  }
}, 25000);

servidor.listen(PORTA, () => console.log(`Ordo Virtutum no ar na porta ${PORTA}`));
