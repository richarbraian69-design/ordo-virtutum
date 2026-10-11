/* Ordo Virtutum — o motor das aventuras de fora das vilas:
   · a carga: o que o peregrino leva na mão (o carvão, a rede, o cordeiro) aparece com ele, nos braços;
   · as entregas: quem recebe usa a coisa de verdade (a ferreira põe o carvão na forja, a cozinheira mexe a panela);
   · coletas e achados das missões; baús com tesouro; masmorras de três salas com grades e um guardião;
   · guildas e confrarias, com três contratos cada; e missões com personagens novos, ditas por dados. */
(function (OV) {
  'use strict';
  const M = OV.mundo, MS = OV.missoes, I = OV.inimigos; if (!M || M.falhou || !MS || !I) return;
  const ui = OV.ui, A = OV.audio, D = OV.dialogo, P = OV.P, IT = OV.itens;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, H = M.altura, MAT = M.MAT;
  const AV = {}; OV.aventura = AV;
  const prog = () => OV.jogo && OV.jogo.prog;
  const F = () => (prog() && prog().flags) || {};
  const st = id => prog() && prog().missoes[id];
  const val = v => typeof v === 'function' ? v() : v;
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  const regiaoDe = (x, z) => x > 200 && z < 400 && !M.regiaoEm(x, z) ? 'cripta' : M.regiao(x, z);
  AV.regiaoDe = regiaoDe;
  const C = () => OV.combate;
  function grupo(x, z, rot, y) { const g = new THREE.Group(); g.position.set(x, y === undefined ? H(x, z) : y, z); g.rotation.y = rot || 0; scene.add(g); return g; }
  const B = (g, w, h, d, x, y, z, mat) => { const m = mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); g.add(m); return m; };
  const fundir = g => { if (OV.cenario) OV.cenario.fundir(g); };
  AV.grupo = grupo; AV.B = B;

  /* ================= FIGURAS NOVAS ================= */
  AV.npc = function (id, nome, x, z, rot, op) {
    M.criarFigura(x, z, rot, Object.assign({ id, nome }, op || {}));
    return M.figuras[id];
  };
  const virar = (x, z, a) => Math.atan2(a.x - x, a.z - z);
  AV.virar = virar;

  /* ================= A CARGA NAS MÃOS ================= */
  const CORES = { saco: sm(0x8a7a5a), sacoE: sm(0x5a4a34), carvao: sm(0x1a1816), madeira: sm(0x6a4a2a), madeiraE: sm(0x3a2a1a), ferro: sm(0x3a3a3e, { metalness: 0.6, roughness: 0.5 }), ouro: sm(0xd8b048, { metalness: 0.85, roughness: 0.3 }), la: sm(0xece6d6), pele: sm(0x2a2420), papel: sm(0xeee2c0), verde: sm(0x4a7a3a), branco: sm(0xf4f0e6), agua: sm(0x4a7aa8, { roughness: 0.2, metalness: 0.2 }) };
  const PROPS = {
    carvao: () => { const g = new THREE.Group(); const s = mesh(new THREE.SphereGeometry(0.26, 8, 6), CORES.saco, 0, 0, 0); s.scale.set(1, 1.15, 0.9); g.add(s); for (let i = 0; i < 4; i++) g.add(mesh(new THREE.DodecahedronGeometry(0.07, 0), CORES.carvao, (i - 1.5) * 0.07, 0.28, (i % 2) * 0.05)); return g; },
    farinha: () => { const g = new THREE.Group(); const s = mesh(new THREE.SphereGeometry(0.27, 8, 6), CORES.branco, 0, 0, 0); s.scale.set(1, 1.2, 0.85); g.add(s); g.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.12, 6), CORES.sacoE, 0, 0.32, 0)); return g; },
    cesto: () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.24, 10), CORES.madeira, 0, 0, 0)); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; g.add(mesh(new THREE.SphereGeometry(0.09, 5, 4), CORES.verde, Math.cos(a) * 0.15, 0.16, Math.sin(a) * 0.15)); } const al = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 4, 12, Math.PI), CORES.madeiraE); al.position.y = 0.1; g.add(al); return g; },
    flores: () => { const g = new THREE.Group(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), CORES.verde, Math.cos(a) * 0.04, 0.12, Math.sin(a) * 0.04)); g.add(mesh(new THREE.ConeGeometry(0.06, 0.12, 6, 1, true), CORES.branco, Math.cos(a) * 0.08, 0.4, Math.sin(a) * 0.08)); } g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6), sm(0x8a1a1a), 0, 0.05, 0)); return g; },
    cordeiro: () => { const g = new THREE.Group(); const c = mesh(new THREE.SphereGeometry(0.28, 8, 6), CORES.la, 0, 0, 0); c.scale.set(1, 0.85, 1.35); g.add(c); g.add(mesh(new THREE.SphereGeometry(0.13, 6, 5), CORES.pele, 0, 0.12, 0.38)); [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.1, 0.05, 0.04), CORES.pele, 0.12 * s, 0.18, 0.36))); [[-0.12, 0.2], [0.12, 0.2], [-0.12, -0.2], [0.12, -0.2]].forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), CORES.pele, x, -0.25, z))); return g; },
    rede: () => { const g = new THREE.Group(); const r = mesh(new THREE.SphereGeometry(0.3, 6, 5), sm(0x9a8a6a, { wireframe: true }), 0, 0, 0); r.scale.set(1.2, 0.8, 1); g.add(r); g.add(mesh(new THREE.SphereGeometry(0.22, 6, 5), sm(0x7a6a4a), 0, -0.02, 0)); for (let i = 0; i < 3; i++) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), sm(0xd8c87a), (i - 1) * 0.16, 0.2, 0.15)); return g; },
    gaiola: () => { const g = new THREE.Group(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 3), CORES.ouro, Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.14)); } g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 10), CORES.madeiraE, 0, -0.13, 0)); g.add(mesh(new THREE.ConeGeometry(0.16, 0.12, 10), CORES.ouro, 0, 0.29, 0)); const ave = mesh(new THREE.SphereGeometry(0.06, 6, 5), sm(0xf0d040), 0, -0.02, 0); g.add(ave); g.userData.ave = ave; return g; },
    balde: () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.32, 10), CORES.madeira, 0, 0, 0)); g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 10), CORES.agua, 0, 0.14, 0)); const al = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 4, 12, Math.PI), CORES.ferro); al.position.y = 0.16; g.add(al); return g; },
    alaude: () => { const g = new THREE.Group(); const c = mesh(new THREE.SphereGeometry(0.22, 10, 8), CORES.madeira, 0, 0, 0); c.scale.set(1, 1.3, 0.45); g.add(c); g.add(mesh(new THREE.BoxGeometry(0.06, 0.5, 0.04), CORES.madeiraE, 0, 0.45, 0)); const cab = mesh(new THREE.BoxGeometry(0.08, 0.14, 0.05), CORES.madeiraE, 0, 0.74, -0.04); cab.rotation.x = -0.6; g.add(cab); { const b = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 10), CORES.carvao, 0, 0.05, 0.1); b.rotation.x = Math.PI / 2; g.add(b); } return g; },
    lamparina: () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.2, 8), CORES.ferro, 0, 0, 0)); g.add(mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd27a }), 0, 0.14, 0)); g.add(mesh(new THREE.ConeGeometry(0.1, 0.1, 8), CORES.ferro, 0, 0.25, 0)); return g; },
    paes: () => { const g = PROPS.cesto(); g.children.slice(1, 8).forEach(c => c.material = sm(0xc8904a)); return g; },
    reliquia: () => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), CORES.ouro, 0, 0, 0)); g.add(mesh(new THREE.ConeGeometry(0.12, 0.16, 4), CORES.ouro, 0, 0.18, 0)); g.add(mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), CORES.ouro, 0, 0.32, 0)); return g; },
    carta: () => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.24, 0.02, 0.16), CORES.papel, 0, 0, 0)); g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), sm(0x9a1a1a), 0, 0.015, 0)); return g; },
    terco: () => { const g = new THREE.Group(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; g.add(mesh(new THREE.SphereGeometry(0.02, 4, 3), sm(0x6a4a2a), Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08)); } g.add(mesh(new THREE.BoxGeometry(0.02, 0.08, 0.01), CORES.madeiraE, 0, -0.12, 0.08)); return g; },
    mascaras: () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = mesh(new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI), sm(0xf0ece4), (i - 1) * 0.08, i * 0.03, -i * 0.03); m.rotation.y = Math.PI; g.add(m); } return g; },
    moedas: () => { const g = new THREE.Group(); const s = mesh(new THREE.SphereGeometry(0.15, 7, 5), sm(0x6a4a2a), 0, 0, 0); s.scale.set(1, 1.15, 1); g.add(s); g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), CORES.ouro, 0, 0.17, 0.05)); return g; },
    badalo: () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), CORES.ferro, 0, 0.1, 0)); g.add(mesh(new THREE.SphereGeometry(0.08, 7, 6), CORES.ferro, 0, -0.04, 0)); return g; },
    lenha: () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const t = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.62, 6), i % 2 ? CORES.madeira : CORES.madeiraE, ((i % 3) - 1) * 0.1, Math.floor(i / 3) * 0.1, 0); t.rotation.z = Math.PI / 2; g.add(t); } g.add(mesh(new THREE.BoxGeometry(0.03, 0.24, 0.24), sm(0x5a4a2a), 0, 0.05, 0)); return g; }
  };
  const DOIS = { cordeiro: true, balde: true, lenha: true, cesto: true, paes: true, rede: true };
  AV.PROPS = PROPS;
  const cargas = []; // { prop, cond, missao }
  AV.carga = (prop, cond, missao) => cargas.push({ prop, cond, missao });
  let travaCarga = false, tCarga = 0;
  function cargaDesejada() {
    const rast = OV.rumo ? OV.rumo.rastreada() : null;
    let melhor = null;
    for (const c of cargas) { let ok = false; try { ok = c.cond(); } catch (e) { ok = false; } if (!ok) continue; if (c.missao && c.missao === rast) return c.prop; if (!melhor) melhor = c.prop; }
    return melhor;
  }
  function soltarDaMao() { if (!P.carga) return null; const m = P.carga.mesh; if (m.parent) m.parent.remove(m); const p = P.carga; P.carga = null; return p; }
  // como cada coisa é levada: de modo que se veja também de costas (o cordeiro nos ombros, a lenha no ombro, o cesto no braço)
  const POSE = {
    cordeiro: { pai: 'body', pos: [0, 1.9, -0.2], rot: [0, Math.PI / 2, 0], lx: -2.6, lz: 0.35, rx: -2.6, rz: -0.35 },
    lenha: { pai: 'body', pos: [0.08, 1.84, -0.32], rot: [0.15, 0, -0.35], esc: 1.35, rx: -2.75, rz: 0.15 },
    rede: { pai: 'body', pos: [-0.4, 1.74, -0.18], rot: [0.2, 0, 0], esc: 1.2, lx: -2.7, lz: 0.12 },
    cesto: { pai: 'armL', pos: [0, -0.62, 0.16], lx: -0.35, lz: -0.5 },
    paes: { pai: 'armL', pos: [0, -0.62, 0.16], lx: -0.35, lz: -0.5 },
    balde: { pai: 'armL', pos: [0, -0.94, 0.02], lx: 0.05, lz: -0.4 },
    gaiola: { pai: 'armL', pos: [0, -0.9, 0.05], lx: -0.2, lz: -0.42 },
    alaude: { pai: 'armL', pos: [0, -0.7, 0.12], rot: [0.3, 0, 0.5], lx: -0.6, lz: -0.35 }
  };
  const POSE0 = { pai: 'armL', pos: [0, -0.84, 0.1], lx: -0.75, lz: -0.38 };
  function porNaMao(prop) {
    const h = P.heroi; if (!h || !PROPS[prop]) return;
    const m = PROPS[prop](), q = POSE[prop] || POSE0;
    m.position.set(q.pos[0], q.pos[1], q.pos[2]); if (q.rot) m.rotation.set(q.rot[0], q.rot[1], q.rot[2]); if (q.esc) m.scale.setScalar(q.esc);
    (q.pai === 'body' ? h.body : h.armL).add(m);
    P.carga = { prop, mesh: m, dois: !!DOIS[prop], pose: q };
  }
  // o colega do co-op também leva as coisas nas mãos (só a imagem)
  AV.soltarDe = function (Q) { if (!Q || !Q.carga) return; const m = Q.carga.mesh; if (m.parent) m.parent.remove(m); Q.carga = null; };
  AV.porNaMaoDe = function (Q, prop) {
    if (!Q || (Q.carga ? Q.carga.prop : null) === (prop || null)) return;
    AV.soltarDe(Q); const h = Q.heroi; if (!prop || !h || !PROPS[prop]) return;
    const m = PROPS[prop](), q = POSE[prop] || POSE0;
    m.position.set(q.pos[0], q.pos[1], q.pos[2]); if (q.rot) m.rotation.set(q.rot[0], q.rot[1], q.rot[2]); if (q.esc) m.scale.setScalar(q.esc);
    (q.pai === 'body' ? h.body : h.armL).add(m);
    Q.carga = { prop, mesh: m, dois: !!DOIS[prop], pose: q };
  };
  function atualizarCarga(dt) {
    tCarga -= dt; if (tCarga > 0 || travaCarga) return; tCarga = 0.3;
    const quer = OV.jogo && OV.jogo.modo === 'jogo' ? cargaDesejada() : null;
    if ((P.carga ? P.carga.prop : null) === quer) return;
    soltarDaMao(); if (quer) porNaMao(quer);
  }
  AV.limparCarga = () => { soltarDaMao(); };
  AV._teste = { por: p => { soltarDaMao(); porNaMao(p); }, trava: b => { travaCarga = b; }, estado: () => ({ cena: cena && { fase: cena.fase, t: cena.t, npc: cena.cfg.npc }, fila: fila.length }) };
  // posição da mão (no mundo) de quem carrega
  const tmpV = new THREE.Vector3();
  const maoMundo = obj => { obj.updateMatrixWorld(true); return obj.getWorldPosition(new THREE.Vector3()); };
  const maoDe = braco => { braco.updateMatrixWorld(true); return braco.localToWorld(new THREE.Vector3(0, -0.7, 0.12)); };

  /* ================= EFEITOS ================= */
  function chamas(x, y, z, dur, esc) {
    const ms = [];
    for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.12 * esc, 0.5 * esc, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffa030 : 0xff5a1a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); f.position.set(x + (Math.random() - 0.5) * 0.4 * esc, y, z + (Math.random() - 0.5) * 0.4 * esc); f.userData.ph = Math.random() * 6; ms.push(f); }
    const luz = M.emissor(x, y + 0.6, z, 0, 9, 0xff8a3a);
    C().efeito(ms, dur, p => {
      const k = Math.sin(Math.min(1, p * 1.4) * Math.PI) ;
      ms.forEach(f => { f.scale.setScalar(0.6 + k * 1.4 + Math.sin(performance.now() / 90 + f.userData.ph) * 0.15); f.material.opacity = 0.9 * (1 - p * 0.6); });
      luz.int = 2.4 * k; if (p >= 0.99 && luz.ativo) { luz.ativo = false; const i = M.emissores.indexOf(luz); if (i >= 0) M.emissores.splice(i, 1); }
    });
    for (let i = 0; i < 5; i++) setTimeout(() => C().faisca(x, y + 0.3, z, 0xffb040), 150 + i * 320);
  }
  function vapor(x, y, z, dur, cor) {
    const ms = [];
    for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshBasicMaterial({ color: cor || 0xf0f0f0, transparent: true, opacity: 0, depthWrite: false })); s.position.set(x, y, z); s.userData = { d: i / 10, dx: (Math.random() - 0.5) * 0.5, dz: (Math.random() - 0.5) * 0.5 }; ms.push(s); }
    C().efeito(ms, dur, p => ms.forEach(s => { const q = ((p * 3) + s.userData.d) % 1; s.position.set(x + s.userData.dx * q, y + q * 1.6, z + s.userData.dz * q); s.scale.setScalar(0.6 + q * 1.6); s.material.opacity = 0.45 * Math.sin(q * Math.PI) * (1 - p * 0.3); }));
  }
  let texNota = null;
  function notas(x, y, z, dur) {
    if (!texNota) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#2a1a10'; g.font = 'bold 52px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', 32, 34); texNota = new THREE.CanvasTexture(c); }
    const ms = [];
    for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texNota, transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.4); s.userData = { d: i / 7, dx: (Math.random() - 0.5) * 1.2 }; ms.push(s); }
    C().efeito(ms, dur, p => ms.forEach(s => { const q = ((p * 2.5) + s.userData.d) % 1; s.position.set(x + s.userData.dx * q + Math.sin(q * 8) * 0.15, y + q * 1.8, z); s.material.opacity = Math.sin(q * Math.PI); }));
    const esc = [523, 587, 659, 784, 880, 784, 659, 587, 523, 659, 784, 1046];
    esc.forEach((f, i) => setTimeout(() => A.bell && A.bell(f, 0.06), i * 260));
  }
  function brilho(x, y, z, dur, cor) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 7, 14, 1, true), new THREE.MeshBasicMaterial({ color: cor || 0xffe0a0, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    col.position.set(x, y + 3.5, z);
    C().efeito([col], dur, p => { col.material.opacity = 0.45 * Math.sin(p * Math.PI); col.scale.set(1 + p * 0.5, 1, 1 + p * 0.5); });
    C().anel(cor || 0xffe0a0, 2.6, 0.9, 0.7);
    A.bell && A.bell(523, 0.16); setTimeout(() => A.bell && A.bell(784, 0.12), 300);
  }
  AV.efeitos = { chamas, vapor, notas, brilho };

  /* ================= ENTREGAS ANIMADAS =================
     cfg: { npc, prop, acao: 'dar' | 'forja' | 'panela' | 'lareira' | 'pendurar' | 'altar' | 'curral' | 'tocar' | 'beber' | 'colocar',
            alvo: {x,y,z} ou função, fica: deixa a coisa no lugar, falas: [[quem, txt]] depois da cena } */
  const fila = []; let cena = null;
  AV.entregar = (cfg, fim) => { fila.push({ cfg, fim, x: P.pos.x, z: P.pos.z }); travaCarga = true; };
  AV.aoEntrega = null; // o co-op avisa o colega
  // no convidado: a entrega que o anfitrião fez, só para ver (sem efeito, sem falas)
  AV.espelharEntrega = function (m) {
    const cfg = { npc: m.npc || null, prop: m.prop, acao: m.acao, alvo: m.alvo ? { x: m.alvo[0], y: m.alvo[1], z: m.alvo[2] } : null, dur: m.dur || 0, fica: !!m.fica, semVolta: !!m.semVolta };
    if (cfg.npc && !M.figuras[cfg.npc]) cfg.npc = null;
    fila.push({ cfg, fim: null, x: P.pos.x, z: P.pos.z, espelho: true, de: new THREE.Vector3(m.de[0], m.de[1], m.de[2]), quem: m.quem || null });
  };
  // o convidado não roda as missões; a cena espelhada anda por aqui
  AV.atualizarEspelho = dt => { if (cena || fila.length) atualizarCena(dt); };
  AV.travado = () => !!cena;
  AV.emCena = () => !!cena || fila.length > 0;
  const arco = (a, b, t, h) => new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * h, a.z + (b.z - a.z) * t);
  const dentroDe = (c, x, z) => { const dx = x - c.x, dz = z - c.z, lx = dx * c.cs - dz * c.sn, lz = dx * c.sn + dz * c.cs; return Math.abs(lx) < c.hw && Math.abs(lz) < c.hd; };
  function iniciarCena(job) {
    const { cfg } = job;
    const f = cfg.npc ? M.figuras[cfg.npc] : null;
    // quem recebe está dentro de casa: o peregrino entra junto (a casa se abre para a câmera)
    const casaNpc = f ? (M.interiores || []).find(c => dentroDe(c, f.x, f.z)) : null;
    if (casaNpc && !job.espelho && !dentroDe(casaNpc, P.pos.x, P.pos.z)) { const q = casaNpc.W(0, casaNpc.hd - 0.9); OV.combate.posicionar(q.x, q.z, Math.atan2(f.x - q.x, f.z - q.z)); }
    const alvo = cfg.alvo ? val(cfg.alvo) : null;
    // a coisa sai da mão do peregrino (ou aparece nela)
    travaCarga = true;
    let pr = !job.espelho && P.carga && (!cfg.prop || P.carga.prop === cfg.prop) ? P.carga : null;
    let obj;
    if (job.espelho) { obj = PROPS[cfg.prop || 'carvao'](); obj.position.copy(job.de); scene.add(obj); if (AV.soltarDe) AV.soltarDe(job.quem); }
    else if (pr) { const w = maoMundo(pr.mesh); soltarDaMao(); obj = pr.mesh; obj.position.copy(w); obj.rotation.set(0, 0, 0); scene.add(obj); }
    else { obj = PROPS[cfg.prop || 'carvao'](); const h = P.heroi; obj.position.copy(h ? maoMundo(h.armL) : new THREE.Vector3(P.pos.x, P.pos.y + 1, P.pos.z)); scene.add(obj); }
    const casa = f ? { x: f.x, z: f.z, rot: f.rot } : null;
    const meio = () => { const q = f ? new THREE.Vector3(f.x, H(f.x, f.z), f.z) : (alvo ? new THREE.Vector3(alvo.x, alvo.y, alvo.z) : new THREE.Vector3(P.pos.x, P.pos.y, P.pos.z)); if (alvo && f) q.lerp(new THREE.Vector3(alvo.x, alvo.y, alvo.z), 0.5); return q.lerp(new THREE.Vector3(P.pos.x, P.pos.y, P.pos.z), 0.35); };
    if (OV.cenas) {
      const m0 = meio(), casa = casaNpc;
      // dentro de casa: a câmera fica no alto, do lado da porta, sem sair pelas paredes
      if (casa) OV.cenas.iniciar({ entrega: true, espelhoHost: !!job.espelho, alvo: meio, raio: Math.max(2.2, Math.min(3.2, Math.min(casa.hw, casa.hd) - 0.5)), altura: 3.3, giro: 0, olhar: 0.8, ang0: Math.atan2(casa.porta.x - m0.x, casa.porta.z - m0.z) });
      else OV.cenas.iniciar({ entrega: true, espelhoHost: !!job.espelho, alvo: meio, raio: 5.2, altura: 2.5, giro: 0.03, olhar: 0.9, ang0: anguloLivre(m0, Math.atan2(P.pos.x - m0.x, P.pos.z - m0.z) + 0.9, 5.2) });
    }
    // o peregrino se vira para quem recebe
    if (f && !job.espelho) OV.combate.posicionar(P.pos.x, P.pos.z, Math.atan2(f.x - P.pos.x, f.z - P.pos.z));
    cena = { cfg, fim: job.fim, f, alvo, obj, casa, t: 0, fase: 'voo', de: obj.position.clone(), estacao: null, espelho: !!job.espelho };
    // no co-op, o colega vê a mesma entrega
    if (!job.espelho && AV.aoEntrega) AV.aoEntrega({ npc: cfg.npc || 0, prop: cfg.prop || 'carvao', acao: cfg.acao || 'dar', alvo: alvo ? [alvo.x, alvo.y, alvo.z] : 0, dur: cfg.dur || 0, fica: cfg.fica ? 1 : 0, semVolta: cfg.semVolta ? 1 : 0, de: [obj.position.x, obj.position.y, obj.position.z] });
    if (f) f.gesto = gestoPadrao(cena);
  }
  // o ângulo da câmera da cena com menos árvores e paredes no caminho
  function anguloLivre(m, base, R) {
    const perto = M.obstacles.filter(o => o.r > 0 && Math.abs(o.x - m.x) < R + 5 && Math.abs(o.z - m.z) < R + 5);
    const muros = M.caixas.filter(b => b.ativa && Math.abs(b.x - m.x) < R + 12 && Math.abs(b.z - m.z) < R + 12);
    const livre = a => {
      let min = 4;
      for (let i = 2; i <= 9; i++) {
        const t = i / 8, x = m.x + Math.sin(a) * R * t, z = m.z + Math.cos(a) * R * t;
        for (const o of perto) { const d = Math.hypot(o.x - x, o.z - z) - o.r * (o.r < 0.8 ? 4 : 1); if (d < min) min = d; }
        for (const b of muros) { const dx = x - b.x, dz = z - b.z, lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c, d = Math.hypot(Math.max(0, Math.abs(lx) - b.hw), Math.max(0, Math.abs(lz) - b.hd)) - 0.6; if (d < min) min = d; }
      }
      return min;
    };
    let best = base, bs = -1e9;
    for (let k = 0; k < 24; k++) { const j = k < 12 ? k : k - 24, a = base + j / 24 * Math.PI * 2, s = Math.min(2.6, livre(a)) - Math.abs(j) * 0.03; if (s > bs) { bs = s; best = a; } }
    return best;
  }
  function gestoPadrao(c) {
    return (dt) => {
      const f = c.f; if (!f.bracos) return;
      const [L, R] = f.bracos, t = c.t, ac = c.cfg.acao;
      let l = 0, r = 0;
      if (c.fase === 'voo') { l = -0.9; r = -0.9; }
      else if (c.fase === 'andar') { l = -0.9; r = -0.9; }
      else if (c.fase === 'usar') {
        if (ac === 'forja') {
          // v24: o martelo sobe devagar e desce num golpe seco, a cada 0,9 s; a outra mão segura a tenaz
          const p = (t % 0.9) / 0.9; r = p < 0.62 ? -0.8 - 1.9 * (p / 0.62) : p < 0.74 ? -2.7 + 2.0 * ((p - 0.62) / 0.12) : -0.7; l = -1.1;
          L.rotation.x = l; R.rotation.x = r; return;
        }
        else if (ac === 'panela') { r = -1.2 + Math.sin(t * 1.9) * 0.35; l = -1.0 + Math.cos(t * 1.9) * 0.2; }
        else if (ac === 'tocar') { l = -1.2; r = -0.9 + Math.sin(t * 4.2) * 0.25; }
        else if (ac === 'beber') { r = -2.4; l = -2.3; }
        else if (ac === 'dar' || ac === 'ler') { r = -1.8; l = -1.6; }
        else { r = -1.6; l = -0.8; }
      }
      const kk = 1 - Math.exp(-7 * (dt || 0.016)); // segue o tempo, não os quadros
      L.rotation.x += (l - L.rotation.x) * kk; R.rotation.x += (r - R.rotation.x) * kk;
    };
  }
  const ESTACAO = { forja: 1.75, panela: 1.1, lareira: 1.3, pendurar: 0.9, altar: 1.1, tocar: 0, dar: 0, beber: 0, ler: 0, curral: 0, colocar: 0 };
  function atualizarCena(dt) {
    if (!cena) {
      if (fila.length && !D.aberto && !(OV.cenas && OV.cenas.ativa) && (OV.jogo.ativo() || fila[0].espelho)) {
        const job = fila.shift();
        // o peregrino já foi para longe (viajou, renasceu): a cena não acontece, só o efeito dela
        if (Math.hypot(P.pos.x - job.x, P.pos.z - job.z) > 10) { if (!fila.length) { travaCarga = false; tCarga = 0; } if (job.fim) job.fim(); return; }
        iniciarCena(job);
      }
      return;
    }
    const c = cena, f = c.f, ac = c.cfg.acao || 'dar'; c.t += dt;
    if (!c.espelho) P.invuln = Math.max(P.invuln || 0, 0.3);
    const maoNpc = () => f && f.bracos ? maoDe(f.bracos[1]) : f ? new THREE.Vector3(f.x, H(f.x, f.z) + 1.3, f.z) : null;
    if (c.fase === 'voo') {
      const destino = (ac === 'curral' || ac === 'colocar' || !f) && c.alvo ? new THREE.Vector3(c.alvo.x, c.alvo.y, c.alvo.z) : maoNpc();
      const k = Math.min(1, c.t / 1.7); // o objeto voa devagar, para dar tempo de ver
      c.obj.position.copy(arco(c.de, destino, k * k * (3 - 2 * k), 0.8)); c.obj.rotation.y += dt * 2.5;
      if (k >= 1) {
        if (f && c.alvo && ESTACAO[ac]) {
          // quem recebe vai até a forja, a panela, o altar
          const d = Math.hypot(c.alvo.x - f.x, c.alvo.z - f.z), a = Math.atan2(c.alvo.x - f.x, c.alvo.z - f.z), fica = Math.max(0, d - ESTACAO[ac]);
          if (fica > 0.4 && f.pernas) f.ir(f.x + Math.sin(a) * fica, f.z + Math.cos(a) * fica, a); else f.mover(f.x, f.z, a);
          c.fase = 'andar'; c.t = 0;
        } else { c.fase = 'usar'; c.t = 0; comecarUso(c); }
      }
    } else if (c.fase === 'andar') {
      c.obj.position.copy(maoNpc());
      // quem anda e não sai do lugar (a bigorna, o peregrino no caminho) já chegou
      const dd = f.destino ? Math.hypot(f.destino.x - f.x, f.destino.z - f.z) : 0;
      if (c.melhor === undefined || dd < c.melhor - 0.02) { c.melhor = dd; c.parado = 0; } else c.parado = (c.parado || 0) + dt;
      if (!f.destino || c.t > 6 || c.parado > 0.5) { if (f.destino) { const d = f.destino; f.destino = null; f.mover(d.x, d.z, d.rot); } c.fase = 'usar'; c.t = 0; comecarUso(c); }
    } else if (c.fase === 'usar') {
      // cada cena dura de 3 a 5 segundos (as durações de missão mais curtas que 3 s sobem para 3)
      const dur = Math.min(5, Math.max(3.5, c.cfg.dur || (ac === 'tocar' ? 4.6 : ac === 'forja' ? 5 : ac === 'panela' ? 4.6 : ac === 'dar' || ac === 'beber' || ac === 'ler' ? 3.6 : 4.2)));
      usar(c, dt);
      if (c.t >= dur) { c.fase = 'fim'; c.t = 0; }
    } else if (c.fase === 'fim') {
      if (c.martelo && c.martelo.parent) c.martelo.parent.remove(c.martelo);
      if (!c.cfg.fica && c.obj.parent) scene.remove(c.obj);
      if (f) { f.gesto = null; if (c.casa && f.pernas && !c.cfg.semVolta) f.ir(c.casa.x, c.casa.z, c.casa.rot); }
      if (OV.cenas) OV.cenas.encerrar();
      const fim = c.fim; cena = null; travaCarga = false; tCarga = 0;
      if (c.espelho) return; // no convidado, a cena é só para ver: o efeito e as falas são do anfitrião
      const depois = () => { if (fim) fim(); };
      if (c.cfg.falas && c.cfg.falas.length) D.falas(c.cfg.falas, depois); else depois();
    }
  }
  function comecarUso(c) {
    const ac = c.cfg.acao || 'dar', a = c.alvo;
    if (ac === 'forja' && a) chamas(a.x, a.y, a.z, 3, 1.3);
    else if (ac === 'lareira' && a) chamas(a.x, a.y, a.z, 2.6, 1.0);
    else if (ac === 'panela' && a) { vapor(a.x, a.y + 0.3, a.z, 2.8); chamas(a.x, a.y - 0.45, a.z, 2.6, 0.6); }
    else if (ac === 'altar' && a) brilho(a.x, a.y - 1, a.z, 2.4);
    else if (ac === 'colocar' && a) brilho(a.x, a.y - 0.6, a.z, 2.4);
    else if (ac === 'tocar') { const m = c.f ? c.f : null; if (m) notas(m.x, H(m.x, m.z) + 2.1, m.z, 3.3); }
    else if (ac === 'pendurar') { if (c.obj.userData.ave) for (let i = 0; i < 6; i++) setTimeout(() => A.bell && A.bell(1700 + Math.random() * 600, 0.04), 300 + i * 210); A.bell && A.bell(660, 0.08); }
    else if (ac === 'curral') { A.bell && A.bell(440, 0.08); }
    else if (ac === 'beber' || ac === 'dar' || ac === 'ler') A.bell && A.bell(587, 0.08);

  }
  function usar(c, dt) {
    const ac = c.cfg.acao || 'dar', a = c.alvo, f = c.f;
    if (ac === 'forja' && f && f.bracos) {
      // v24: o martelo na mão de quem forja, e faíscas a cada golpe
      if (!c.martelo) { const m = new THREE.Group(); m.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), CORES.madeira, 0, -0.62, 0.12)); m.add(mesh(new THREE.BoxGeometry(0.2, 0.11, 0.11), CORES.ferro, 0, -0.86, 0.12)); f.bracos[1].add(m); c.martelo = m; }
      const fase = c.t % 0.9, ant = (c.t - dt) % 0.9;
      if (ant < 0.68 && fase >= 0.68 && a) { const fx = f.x + Math.sin(f.rot) * 0.9, fz = f.z + Math.cos(f.rot) * 0.9; for (let k = 0; k < 3; k++) OV.combate.faisca(fx + (Math.random() - 0.5) * 0.3, a.y + 0.1, fz + (Math.random() - 0.5) * 0.3, 0xffa040); if (A.bell) A.bell(1250 + Math.random() * 120, 0.05); }
    }
    const mao = f && f.bracos ? maoDe(f.bracos[1]) : null;
    if (ac === 'forja' || ac === 'lareira' || ac === 'panela') {
      // a coisa vai para dentro do fogo ou da panela
      if (a) { const k = Math.min(1, c.t / 2.2); c.obj.position.lerp(new THREE.Vector3(a.x, a.y, a.z), 1 - Math.exp(-2 * dt)); c.obj.scale.setScalar(Math.max(0.01, 1 - k)); }
    } else if (ac === 'pendurar' || ac === 'altar') {
      if (a) { c.obj.position.lerp(new THREE.Vector3(a.x, a.y, a.z), 1 - Math.exp(-4 * dt)); c.obj.rotation.y = 0; if (c.obj.userData.ave) c.obj.userData.ave.position.y = -0.02 + Math.abs(Math.sin(c.t * 5)) * 0.05; }
    } else if (ac === 'curral') {
      if (a) { c.obj.position.lerp(new THREE.Vector3(a.x, a.y, a.z), 1 - Math.exp(-3.5 * dt)); c.obj.rotation.y += dt * 1.2; }
    } else if (ac === 'colocar') {
      if (a) c.obj.position.lerp(new THREE.Vector3(a.x, a.y, a.z), 1 - Math.exp(-4 * dt));
    } else if (mao) {
      // dar, beber, ler, tocar: fica na mão de quem recebeu
      c.obj.position.copy(mao); if (ac === 'beber') c.obj.position.y += 0.1;
      if (ac === 'tocar' && f) c.obj.rotation.set(0.3, f.rot + Math.PI / 2, 0.9);
    }
  }

  /* ================= GUARDAS QUE SÓ APARECEM QUANDO O PEREGRINO CHEGA PERTO =================
     (assim o mundo não carrega centenas de inimigos ao mesmo tempo) */
  const guardas = new Map(); // tag -> { x, z, fn, on }
  function preparar(tag, x, z, fn) { MS.tagRemove(tag); guardas.set(tag, { x, z, fn, on: false }); }
  function soltarGuarda(tag) { MS.tagRemove(tag); guardas.delete(tag); }
  let guardaT = 0;
  function atualizarGuardas(dt) {
    guardaT -= dt; if (guardaT > 0) return; guardaT = 0.5;
    guardas.forEach((g, tag) => {
      const d = Math.hypot(P.pos.x - g.x, P.pos.z - g.z);
      // quem já foi vencido no grupo só volta depois do amanhecer seguinte
      const dia = OV.jogo.dia ? OV.jogo.dia() : 0;
      if (g.mortos) I.porTag(tag).forEach(e => { if (e.guardaIdx !== undefined && (e.state === 'dead' || e.state === 'liberto')) g.mortos.set(e.guardaIdx, dia); });
      if (!g.on && d < 85) {
        g.mortos = g.mortos || new Map();
        for (const [k, dd] of g.mortos) if (dia > dd) g.mortos.delete(k);
        g.on = true; g.fn();
        const membros = I.porTag(tag);
        membros.forEach((e, k) => { e.guardaIdx = k; if (g.mortos.has(k) && !e.removed) { M.scene.remove(e.g); if (e.lab) e.lab.el.remove(); e.removed = true; } });
        I.lista = I.lista.filter(e => !(e.tag === tag && e.removed && e.state !== 'dead'));
      }
      else if (g.on && d > 125) {
        if (I.porTag(tag).some(e => vivo(e) && e.state !== 'idle' && e.state !== 'voltar')) return; // ainda na luta
        g.on = false; MS.tagRemove(tag);
      }
    });
  }
  AV._guardas = guardas;

  /* ================= COLETAS E ACHADOS =================
     cfg: { id, missao, etapa, pontos: [[x,z]], modelo, texto, guarda: [[tipo, nivel, variante]], um: levar um de cada vez,
            destino: { x, z, texto, alvo, acao } (para 'um'), aoCompletar } */
  const coletas = [];
  const MODELOS = {
    erva: () => { const g = new THREE.Group(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const f = mesh(new THREE.ConeGeometry(0.09, 0.5, 4), sm(0x6a9a5a), Math.cos(a) * 0.14, 0.25, Math.sin(a) * 0.14); f.rotation.z = Math.cos(a) * 0.4; f.rotation.x = Math.sin(a) * 0.4; g.add(f); } for (let i = 0; i < 4; i++) g.add(mesh(new THREE.SphereGeometry(0.04, 4, 3), sm(0x8a6ac8), (i - 1.5) * 0.08, 0.5, 0)); return g; },
    flor: () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; g.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 3), sm(0x4a7a3a), Math.cos(a) * 0.12, 0.2, Math.sin(a) * 0.12)); g.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), sm(0xf4f0d0), Math.cos(a) * 0.12, 0.42, Math.sin(a) * 0.12)); g.add(mesh(new THREE.SphereGeometry(0.03, 4, 3), sm(0xe8c030), Math.cos(a) * 0.12, 0.45, Math.sin(a) * 0.12 + 0.02)); } return g; },
    lirio: () => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28; g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 3), sm(0x4a7a3a), Math.cos(a) * 0.1, 0.35, Math.sin(a) * 0.1)); const fl = mesh(new THREE.ConeGeometry(0.09, 0.18, 6, 1, true), sm(0xfafaf0, { side: THREE.DoubleSide }), Math.cos(a) * 0.1, 0.72, Math.sin(a) * 0.1); fl.rotation.x = Math.PI; g.add(fl); } return g; },
    cordeiro: () => { const g = PROPS.cordeiro(); g.position.y = 0.45; const w = new THREE.Group(); w.add(g); return w; },
    rede: () => { const g = PROPS.rede(); g.position.y = 0.25; g.scale.setScalar(1.6); const w = new THREE.Group(); w.add(g); return w; },
    gaiola: () => { const g = PROPS.gaiola(); g.position.y = 0.2; const w = new THREE.Group(); w.add(g); return w; },
    alaude: () => { const g = PROPS.alaude(); g.position.y = 0.15; g.rotation.z = 1.4; const w = new THREE.Group(); w.add(g); return w; }
  };
  AV.MODELOS = MODELOS; // v23: os atos novos somam os seus achados
  AV.coleta = function (cfg) {
    cfg.objs = [];
    cfg.pontos.forEach(([x, z], i) => {
      const g = MODELOS[cfg.modelo || 'erva'](); g.position.set(x, H(x, z), z); scene.add(g);
      const luz = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 20), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      luz.rotation.x = -Math.PI / 2; luz.position.set(x, H(x, z) + 0.06, z); scene.add(luz);
      cfg.objs.push({ g, luz, x, z });
      M.interativo(x, z, 1.9, () => podeColher(cfg, i) ? cfg.texto : null, () => colher(cfg, i));
    });
    if (cfg.destino) M.interativo(cfg.destino.x, cfg.destino.z, 2.6, () => (F()[cfg.id + '_mao'] !== undefined && F()[cfg.id + '_mao'] !== null) ? cfg.destino.texto : null, () => deixarUm(cfg));
    coletas.push(cfg);
    AV.carga(cfg.carga || 'cesto', () => {
      if (!MS.ativa(cfg.missao)) return false;
      if (cfg.um) return F()[cfg.id + '_mao'] !== undefined && F()[cfg.id + '_mao'] !== null;
      return colhidos(cfg).length > 0;
    }, cfg.missao);
  };
  const colhidos = cfg => F()[cfg.id] || [];
  function podeColher(cfg, i) {
    if (!MS.ativa(cfg.missao) || MS.etapa(cfg.missao) !== cfg.etapa) return false;
    if (colhidos(cfg).includes(i)) return false;
    if (cfg.um && F()[cfg.id + '_mao'] !== undefined && F()[cfg.id + '_mao'] !== null) return false;
    return true;
  }
  function colher(cfg, i) {
    const gd = I.porTag(`col_${cfg.id}_${i}`).filter(vivo);
    if (gd.some(e => Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < 16)) { ui.toast('Os vícios ainda rondam este lugar.'); return; }
    const o = cfg.objs[i]; o.g.visible = false; o.luz.visible = false;
    A.bell && A.bell(784, 0.08);
    if (cfg.um) { F()[cfg.id + '_mao'] = i; ui.toast(cfg.pegou || 'Você pega com cuidado.'); OV.jogo.salvar(); return; }
    const l = colhidos(cfg).concat([i]); F()[cfg.id] = l;
    ui.toast(`${cfg.nome || 'Colhido'} (${l.length}/${cfg.pontos.length})`);
    if (l.length >= cfg.pontos.length) { MS.avancar(cfg.missao, cfg.etapa + 1); if (cfg.aoCompletar) cfg.aoCompletar(); }
    OV.jogo.salvar();
  }
  function deixarUm(cfg) {
    const i = F()[cfg.id + '_mao'];
    const d = cfg.destino, alvo = val(d.alvo);
    F()[cfg.id + '_mao'] = null;
    const l = colhidos(cfg).concat([i]); F()[cfg.id] = l;
    AV.entregar({ prop: cfg.carga, acao: d.acao || 'curral', alvo, fica: false }, () => {
      if (d.aoDeixar) d.aoDeixar(l.length);
      ui.toast(`${cfg.nome || 'Entregue'} (${l.length}/${cfg.pontos.length})`);
      if (l.length >= cfg.pontos.length) { MS.avancar(cfg.missao, cfg.etapa + 1); if (cfg.aoCompletar) cfg.aoCompletar(); }
      OV.jogo.salvar();
    });
  }
  AV.colhidos = colhidos;
  function aplicarColetas() {
    coletas.forEach(cfg => {
      const l = colhidos(cfg), mao = F()[cfg.id + '_mao'];
      cfg.objs.forEach((o, i) => { const vis = !l.includes(i) && mao !== i && !MS.feita(cfg.missao); o.g.visible = vis; o.luz.visible = vis && MS.ativa(cfg.missao); });
      (cfg.guarda || []).forEach((grp, i) => {
        const tag = `col_${cfg.id}_${i}`;
        if (!grp || !grp.length || MS.feita(cfg.missao) || l.includes(i) || mao === i || (st(cfg.missao) && MS.etapa(cfg.missao) > cfg.etapa)) { soltarGuarda(tag); return; }
        const [x, z] = cfg.pontos[i];
        preparar(tag, x, z, () => grp.forEach(([t, nv, vr], k) => { const a = k / grp.length * 6.28; const e = I.spawn(t, false, { x: x + Math.cos(a) * 4, z: z + Math.sin(a) * 4 }, { nivel: nv, variante: vr || null }); e.tag = tag; e.mundo = false; if (e.def.liberta) e.sumir = true; }));
      });
    });
  }

  /* ================= BAÚS ================= */
  const baus = [];
  function modeloBau(rico) {
    const g = new THREE.Group();
    const madeira = sm(rico ? 0x5a2a1a : 0x5a3a22), banda = rico ? CORES.ouro : CORES.ferro;
    B(g, 1.1, 0.55, 0.7, 0, 0.3, 0, madeira);
    [-0.4, 0, 0.4].forEach(x => B(g, 0.08, 0.57, 0.72, x, 0.3, 0, banda));
    const tampa = new THREE.Group(); tampa.position.set(0, 0.58, -0.35); g.add(tampa);
    const t = mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 10, 1, false, 0, Math.PI), madeira, 0, 0, 0.35); t.rotation.z = Math.PI / 2; t.rotation.y = 0; tampa.add(t);
    [-0.4, 0, 0.4].forEach(x => { const b = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 10, 1, false, 0, Math.PI), banda, x, 0, 0.35); b.rotation.z = Math.PI / 2; tampa.add(b); });
    B(g, 0.14, 0.18, 0.06, 0, 0.5, 0.37, banda);
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); luz.position.y = 0.6; g.add(luz);
    return { g, tampa, luz };
  }
  // cfg: { id, x, z, rot, regiao, rico, conteudo: { den: [a,b], itens: [[id, n]], equip: bool, raro: chance }, guarda: [[tipo, nivel, variante]], cond }
  AV.bau = function (cfg) {
    const m = modeloBau(cfg.rico); m.g.position.set(cfg.x, H(cfg.x, cfg.z) + (cfg.y || 0), cfg.z); m.g.rotation.y = cfg.rot || 0; scene.add(m.g);
    cfg.m = m; cfg.regiao = cfg.regiao || regiaoDe(cfg.x, cfg.z);
    M.obstacles.push({ x: cfg.x, z: cfg.z, r: 0.6 });
    const frente = { x: cfg.x + Math.sin(cfg.rot || 0) * 1.1, z: cfg.z + Math.cos(cfg.rot || 0) * 1.1 };
    M.interativo(frente.x, frente.z, 2.0, () => aberto(cfg) ? null : (cfg.cond && !cfg.cond()) ? null : 'Abrir o baú', () => abrirBau(cfg));
    baus.push(cfg);
  };
  const aberto = cfg => !!(prog() && (prog().baus || {})[cfg.id]);
  AV.bausAbertos = regiao => baus.filter(b => (!regiao || b.regiao === regiao) && aberto(b)).length;
  AV.bausTotal = regiao => baus.filter(b => !regiao || b.regiao === regiao).length;
  function abrirBau(cfg) {
    const gd = I.porTag('bau_' + cfg.id).filter(vivo);
    if (gd.some(e => Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < 18)) { ui.toast('Os vícios guardam o baú. Vença-os primeiro.'); return; }
    const p = prog(); p.baus = p.baus || {}; p.baus[cfg.id] = true;
    // a tampa se abre e sobe um brilho dourado
    const m = cfg.m; let t = 0;
    C().efeito([], 1.4, q => { m.tampa.rotation.x = -1.9 * Math.min(1, q * 1.6); m.luz.material.opacity = 0.6 * Math.sin(Math.min(1, q) * Math.PI); m.luz.scale.setScalar(1 + q * 2); });
    for (let i = 0; i < 4; i++) setTimeout(() => C().faisca(cfg.x, H(cfg.x, cfg.z) + 0.9, cfg.z, 0xffd27a), 200 + i * 180);
    A.bell && A.bell(659, 0.14); setTimeout(() => A.bell && A.bell(880, 0.12), 220);
    const ct = cfg.conteudo || {}, out = [];
    if (ct.den) { const n = Math.round((ct.den[0] + Math.floor(Math.random() * (ct.den[1] - ct.den[0] + 1))) * (OV.ECON ? OV.ECON.baus : 1)); P.pers.denarios = (P.pers.denarios || 0) + n; out.push(`${n} denários`); }
    (ct.itens || []).forEach(([id, n, chance]) => { if (chance !== undefined && Math.random() >= chance) return; if (IT.dar(id, n, true)) out.push(`${OV.ITENS[id].nome}${n > 1 ? ' ×' + n : ''}`); else { P.pers.bau[id] = (P.pers.bau[id] || 0) + n; out.push(`${OV.ITENS[id].nome} (guardado no baú do peregrino)`); } });
    if (ct.equip) {
      const mo = IT.mochila(), tem = id => (mo.itens[id] || 0) > 0 || Object.values(mo.equip).includes(id) || (P.pers.bau[id] || 0) > 0;
      const novos = (ct.equipLista || Object.keys(OV.ITENS).filter(k => OV.ITENS[k].slot && !OV.ITENS[k].guilda && !OV.ITENS[k].unico)).filter(id => !tem(id));
      if (novos.length) { const id = novos[(Math.random() * novos.length) | 0]; if (!IT.dar(id, 1, true)) P.pers.bau[id] = (P.pers.bau[id] || 0) + 1; out.push(OV.ITENS[id].nome); }
    }
    // os baús raros guardam uma peça para a Casa do Peregrino (a Vela do Exame nunca vem de baú)
    if (ct.raro && Math.random() < ct.raro && OV.casa) { const dk = OV.casa.sortearNova('bau'); if (dk && OV.casa.ganhar(dk, true)) out.push(`${OV.casa.DECOR[dk].nome} (para a Casa do Peregrino)`); }
    setTimeout(() => ui.toast(out.length ? 'No baú: ' + out.join(', ') + '.' : 'O baú estava vazio... alguém chegou antes.'), 600);
    MS.evento('bau', cfg);
    OV.jogo.salvar();
  }
  function aplicarBaus() {
    baus.forEach(cfg => {
      const ab = aberto(cfg); cfg.m.tampa.rotation.x = ab ? -1.9 : 0;
      const tag = 'bau_' + cfg.id;
      if (ab || !cfg.guarda || !cfg.guarda.length) { soltarGuarda(tag); return; }
      preparar(tag, cfg.x, cfg.z, () => cfg.guarda.forEach(([t, nv, vr], k) => { const a = k / cfg.guarda.length * 6.28 + 0.4; const e = I.spawn(t, false, { x: cfg.x + Math.cos(a) * 4.5, z: cfg.z + Math.sin(a) * 4.5 }, { nivel: nv, variante: vr || null }); e.tag = tag; e.mundo = false; if (e.def.liberta) e.sumir = true; }));
    });
  }
  AV.baus = baus;

  /* ================= MASMORRAS =================
     Um recinto em ruínas com três salas em fila. A entrada fica no lado +z local; as grades se abrem
     quando a sala de antes fica livre; na última, o guardião (com o seu poema) e o baú do tesouro. */
  const masmorras = [];
  const ESTILOS = {
    ruina: { parede: () => MAT.wall, col: () => MAT.col, piso: () => MAT.stone, alt: [2.6, 4.6] },
    rocha: { parede: () => sm(0x6a625a, { roughness: 1 }), col: () => sm(0x4a443e), piso: () => sm(0xa8946a, { roughness: 1 }), alt: [3.4, 5.4], rocha: true },
    mina: { parede: () => sm(0x4a4038, { roughness: 1 }), col: () => MAT.woodL, piso: () => sm(0x3a322a, { roughness: 1 }), alt: [3.6, 4.4], vigas: true },
    marmore: { parede: () => sm(0xd8d2c4, { roughness: 0.6 }), col: () => sm(0xb8b0a0, { roughness: 0.7 }), piso: () => sm(0xe8e2d4, { roughness: 0.4 }), alt: [4.4, 5.2], estatuas: true }
  };
  AV.masmorra = function (cfg) {
    const { x, z } = cfg, rot = cfg.rot || 0, E = ESTILOS[cfg.estilo || 'ruina'], y0 = H(x, z);
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const W = (lx, lz) => ({ x: x + lx * cs + lz * sn, z: z - lx * sn + lz * cs });
    cfg.W = W; cfg.y0 = y0;
    // v21: as masmorras ficaram bem mais amplas (38 x 72 m, três salas de 24 m)
    const HW = 19, HD = 36, T = 1, ZS = 12;
    cfg.HW = HW; cfg.HD = HD; cfg.ZS = ZS;
    if (M.patamar) M.patamar(x, z, rot, HW + 2, HD + 2, y0);
    const g = grupo(x, z, rot, y0);
    const parede = E.parede(), coluna = E.col(), r = OV.cenario ? OV.cenario.sorte('mas-' + cfg.id) : Math.random;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HD * 2), E.piso()); piso.rotation.x = -Math.PI / 2; piso.position.y = 0.06; piso.receiveShadow = true; g.add(piso);
    // um trecho de muro, com altura irregular (ruína) e colisão
    const muro = (lx0, lz0, lx1, lz1, abertura) => {
      const len = Math.hypot(lx1 - lx0, lz1 - lz0), n = Math.max(1, Math.round(len / 3)), dx = (lx1 - lx0) / n, dz = (lz1 - lz0) / n, horiz = Math.abs(dx) > Math.abs(dz);
      for (let i = 0; i < n; i++) {
        const cx = lx0 + dx * (i + 0.5), cz = lz0 + dz * (i + 0.5);
        if (abertura && Math.abs(horiz ? cx : cz) < abertura) continue;
        const h = E.alt[0] + r() * (E.alt[1] - E.alt[0]);
        if (E.rocha) { const p = mesh(new THREE.DodecahedronGeometry(1.7, 0), parede, cx, h * 0.35, cz); p.scale.set(horiz ? 1.1 : 0.7, h / 3, horiz ? 0.7 : 1.1); p.rotation.y = r() * 3; g.add(p); }
        else B(g, horiz ? Math.abs(dx) + 0.02 : T, h, horiz ? T : Math.abs(dz) + 0.02, cx, h / 2, cz, parede);
        if (E.vigas && i % 2 === 0) { B(g, horiz ? 0.25 : 1.3, 4.2, horiz ? 1.3 : 0.25, cx, 2.1, cz, coluna); }
        const w = W(cx, cz); M.caixa(w.x, w.z, (horiz ? Math.abs(dx) : T) / 2 + 0.05, (horiz ? T : Math.abs(dz)) / 2 + 0.05, rot);
      }
    };
    muro(-HW, -HD, HW, -HD); muro(-HW, -HD, -HW, HD); muro(HW, -HD, HW, HD); muro(-HW, HD, HW, HD, 3.2);
    // paredes internas (com o vão da grade)
    muro(-HW, ZS, HW, ZS, 3.2); muro(-HW, -ZS, HW, -ZS, 3.2);
    // colunas partidas, entulho, braseiros (as colunas ficam junto das paredes: o meio da sala é para lutar)
    const salas = [{ z0: ZS, z1: HD }, { z0: -ZS, z1: ZS }, { z0: -HD, z1: -ZS }];
    const CX = HW - 5;
    salas.forEach((s, i) => {
      [-1, 1].forEach(sx => [s.z0 + 5, s.z1 - 5].forEach(lz => {
        const h = 2 + r() * 3;
        if (E.estatuas && i === 2) { B(g, 1.1, 0.5, 1.1, sx * CX, 0.25, lz, coluna); g.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8), parede, sx * CX, 1.6, lz)); g.add(mesh(new THREE.SphereGeometry(0.3, 8, 6), parede, sx * CX, 2.95, lz)); }
        else g.add(mesh(new THREE.CylinderGeometry(0.42, 0.5, h, 8), coluna, sx * CX, h / 2, lz));
        const w = W(sx * CX, lz); M.obstacles.push({ x: w.x, z: w.z, r: 0.6 });
      }));
      for (let k = 0; k < 5; k++) { const p = mesh(new THREE.DodecahedronGeometry(0.3 + r() * 0.45, 0), MAT.rock, (r() - 0.5) * (HW * 2 - 6), 0.2, s.z0 + 1 + r() * (s.z1 - s.z0 - 2)); p.rotation.set(r() * 3, r() * 3, 0); g.add(p); }
      // braseiros nos cantos de cada sala
      [-1, 1].forEach(sx => {
        const lz = (s.z0 + s.z1) / 2, lx = sx * (HW - 1.4);
        g.add(mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.3, 6), MAT.iron, lx, 0.65, lz));
        g.add(mesh(new THREE.CylinderGeometry(0.42, 0.25, 0.3, 8), MAT.iron, lx, 1.4, lz));
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), MAT.flame); fl.position.set(lx, 1.85, lz); g.add(fl); M.flames.push(fl);
        const w = W(lx, lz); M.emissor(w.x, y0 + 2.2, w.z, 1.2, 12, i === 2 ? 0xc87aff : 0xff9a3c);
        M.obstacles.push({ x: w.x, z: w.z, r: 0.5 });
      });
    });
    // o altar do fundo
    B(g, 4, 1.1, 1.6, 0, 0.55, -HD + 2.4, coluna); B(g, 4.2, 0.1, 1.7, 0, 1.15, -HD + 2.4, MAT.gold);
    g.add(mesh(new THREE.BoxGeometry(0.14, 1.4, 0.14), MAT.gold, 0, 1.9, -HD + 2.2)); g.add(mesh(new THREE.BoxGeometry(0.7, 0.14, 0.14), MAT.gold, 0, 2.2, -HD + 2.2));
    { const w = W(0, -HD + 2.4); M.caixa(w.x, w.z, 2.1, 0.85, rot); }
    // a sala do guardião é mais alta e solene: paredes que sobem, um arco imenso atrás do altar e dois colossos
    { const AH = E.alt[1] + 3.4;
      const LG = HD - ZS, ZC = -(HD + ZS) / 2, CLX = HW - 3, CLZ = -HD + 2.7;
      [-1, 1].forEach(sx => {
        B(g, T + 0.16, AH, LG, sx * HW, AH / 2, ZC, parede);
        const cl = new THREE.Group(); cl.position.set(sx * CLX, 0, CLZ); g.add(cl);
        B(cl, 2.2, 1.4, 2.2, 0, 0.7, 0, coluna); g.add(mesh(new THREE.ConeGeometry(1.0, 5.6, 8), parede, sx * CLX, 4.2, CLZ));
        g.add(mesh(new THREE.SphereGeometry(0.55, 8, 6), parede, sx * CLX, 7.3, CLZ)); B(cl, 1.8, 0.4, 0.8, 0, 6.2, 0.2, MAT.gold);
        const w = W(sx * CLX, CLZ); M.obstacles.push({ x: w.x, z: w.z, r: 1.3 });
      });
      B(g, HW * 2, 1.2, 1.2, 0, AH - 0.6, -HD + 0.4, parede);
      const arco = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.45, 6, 18, Math.PI), coluna); arco.position.set(0, 3.0, -HD + 0.7); g.add(arco);
      [-1, 1].forEach(sx => B(g, 0.9, 3.0, 0.9, sx * 4.2, 1.5, -HD + 0.7, coluna));
      const sol = new THREE.Mesh(new THREE.CircleGeometry(1.6, 18), MAT.gold); sol.position.set(0, 4.6, -HD + 0.62); g.add(sol); }
    // o pórtico de entrada
    [-1, 1].forEach(sx => { B(g, 1.4, 6.2, 1.4, sx * 4.0, 3.1, HD, coluna); const w = W(sx * 4.0, HD); M.caixa(w.x, w.z, 0.75, 0.75, rot); });
    B(g, 9.6, 1.1, 1.6, 0, 6.6, HD, coluna);
    if (cfg.teto) { const tt = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 + 4, HD * 2 + 4), sm(0x1a1612, { side: THREE.DoubleSide, roughness: 1 })); tt.rotation.x = Math.PI / 2; tt.position.y = cfg.teto; g.add(tt); }
    fundir(g);
    // as grades
    cfg.grades = [ZS, -ZS].map(lz => {
      const gr = new THREE.Group(); gr.position.set(0, 0, lz); g.add(gr);
      for (let i = -7; i <= 7; i++) gr.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 5), MAT.iron, i * 0.42, 1.8, 0));
      [0.5, 1.8, 3.2].forEach(h => gr.add(mesh(new THREE.BoxGeometry(6.2, 0.08, 0.08), MAT.iron, 0, h, 0)));
      const w = W(0, lz); const cx = M.caixa(w.x, w.z, 3.25, 0.5, rot);
      return { gr, cx, abrindo: 0, aberta: false };
    });
    // o baú do tesouro, atrás do guardião
    const bw = W(0, -HD + 5.2);
    AV.bau({ id: 'mas_' + cfg.id, x: bw.x, z: bw.z, rot, rico: true, regiao: cfg.regiao, conteudo: cfg.tesouro, cond: () => !!F()['mas_' + cfg.id + '_fim'] });
    // nome no mapa e faixa ao entrar
    M.LOCAIS['mas_' + cfg.id] = { nome: cfg.nome, x: W(0, 0).x, z: W(0, 0).z, oy: -30 };
    M.zonasExtra.push(['mas_' + cfg.id, W(0, 0).x, W(0, 0).z, HD + 2]);
    if (A.LUGAR) A.LUGAR['mas_' + cfg.id] = cfg.tema || 'cripta';
    cfg.salas = salas.map((s, i) => Object.assign(s, cfg.salasDef[i]));
    masmorras.push(cfg);
    return cfg;
  };
  const tagSala = (cfg, i) => `mas_${cfg.id}_${i}`;
  const salaLivre = (cfg, i) => !!F()[`mas_${cfg.id}_s${i}`];
  AV.salasLivres = id => { const c = masmorras.find(m => m.id === id); if (!c) return 0; let n = 0; for (let i = 0; i < 3; i++) if (salaLivre(c, i)) n++; return n; };
  AV.masmorraFeita = id => !!F()['mas_' + id + '_fim'];
  function dentroSala(cfg, i) {
    const dx = P.pos.x - cfg.x, dz = P.pos.z - cfg.z, cs = Math.cos(cfg.rot || 0), sn = Math.sin(cfg.rot || 0);
    const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs, s = cfg.salas[i];
    return Math.abs(lx) < cfg.HW - 0.5 && lz > s.z0 + 0.5 && lz < s.z1 - 0.5;
  }
  function spawnSala(cfg, i) {
    const s = cfg.salas[i], tag = tagSala(cfg, i); MS.tagRemove(tag);
    const lista = s.inimigos || [];
    lista.forEach(([t, nv, vr], k) => {
      const lx = ((k % 3) - 1) * 7 + (Math.random() - 0.5) * 2, lz = s.z0 + 4 + Math.floor(k / 3) * 6 + Math.random() * 2;
      const w = cfg.W(lx, Math.min(s.z1 - 2, lz)); const e = I.spawn(t, false, w, { nivel: nv, variante: vr || null }); e.tag = tag; e.mundo = false; if (e.def.liberta) e.sumir = true;
      e.masmorra = cfg; // persegue até a saída da masmorra, que é uma barreira para ele
    });
  }
  function aplicarMasmorras() {
    masmorras.forEach(cfg => {
      for (let i = 0; i < 3; i++) {
        const livre = salaLivre(cfg, i);
        if (i < 2) { const gr = cfg.grades[i]; gr.aberta = livre; gr.abrindo = 0; gr.gr.position.y = livre ? 3.6 : 0; gr.gr.visible = !livre; gr.cx.ativa = !livre; }
        if (i < 2 && !livre) { const c = cfg.W(0, (cfg.salas[i].z0 + cfg.salas[i].z1) / 2); preparar(tagSala(cfg, i), c.x, c.z, () => spawnSala(cfg, i)); } else soltarGuarda(tagSala(cfg, i));
      }
      cfg.chefeVivo = false; MS.tagRemove(tagSala(cfg, 2));
    });
  }
  function atualizarMasmorras(dt) {
    masmorras.forEach(cfg => {
      if (Math.hypot(P.pos.x - cfg.x, P.pos.z - cfg.z) > 60) return;
      // grades subindo
      cfg.grades.forEach(gr => { if (gr.abrindo > 0) { gr.abrindo -= dt; gr.gr.position.y = Math.min(3.6, gr.gr.position.y + dt * 3); if (gr.abrindo <= 0) gr.gr.visible = false; } });
      for (let i = 0; i < 2; i++) {
        if (salaLivre(cfg, i)) continue;
        const v = I.porTag(tagSala(cfg, i));
        if (v.length && !v.some(vivo)) {
          F()[`mas_${cfg.id}_s${i}`] = true;
          const gr = cfg.grades[i]; gr.abrindo = 1.4; gr.cx.ativa = false;
          OV.jogo.shake(0.25); A.bell && A.bell(196, 0.2);
          ui.toast(i === 0 ? 'A primeira grade range e sobe.' : 'A segunda grade se abre. Algo espera no fundo.');
          MS.evento('masmorra_sala', { id: cfg.id, n: AV.salasLivres(cfg.id) }); OV.jogo.salvar();
        }
      }
      // o guardião
      if (!AV.masmorraFeita(cfg.id) && salaLivre(cfg, 1) && !cfg.chefeVivo && dentroSala(cfg, 2) && !(OV.cenas && OV.cenas.ativa) && !D.aberto) {
        cfg.chefeVivo = true;
        const s = cfg.salasDef[2], w = cfg.W(0, -(cfg.HD + cfg.ZS) / 2 - 2), tag = tagSala(cfg, 2); MS.tagRemove(tag);
        const b = I.spawn(s.chefe[0], false, w, { nivel: s.chefe[1], variante: s.chefe[2] || null }); b.tag = tag; b.mundo = false; b.chefeMasmorra = cfg.id; b.masmorra = cfg;
        b.g.rotation.y = Math.atan2(P.pos.x - w.x, P.pos.z - w.z);
        (s.inimigos || []).forEach(([t, nv, vr], k) => { const ww = cfg.W((k % 2 ? 1 : -1) * 8, -cfg.ZS - 6); const e = I.spawn(t, true, ww, { nivel: nv, variante: vr || null }); e.tag = tag; e.mundo = false; e.masmorra = cfg; });
        if (OV.cenas) OV.cenas.poema(s.chefe[0], { e: b, raio: 7.5, altura: 2.8 }, () => ui.toast(`${b.def.name}!`));
      }
      if (cfg.chefeVivo && !AV.masmorraFeita(cfg.id)) {
        const b = I.porTag(tagSala(cfg, 2)).find(e => e.chefeMasmorra === cfg.id);
        if (b && !vivo(b)) {
          F()[`mas_${cfg.id}_s2`] = true; F()['mas_' + cfg.id + '_fim'] = true; cfg.chefeVivo = false;
          setTimeout(() => ui.toast(`${cfg.nome}: o guardião caiu. O baú do altar pode ser aberto.`), 1800);
          MS.evento('masmorra', { id: cfg.id }); OV.jogo.salvar();
        }
      }
    });
  }
  AV.masmorras = masmorras;
  // um ponto está dentro da masmorra? (coordenadas locais; margem negativa = mais para dentro)
  AV.dentroMasmorra = function (cfg, x, z, margem) {
    const dx = x - cfg.x, dz = z - cfg.z, cs = Math.cos(cfg.rot || 0), sn = Math.sin(cfg.rot || 0);
    const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs, m = margem || 0;
    return Math.abs(lx) < cfg.HW + m && lz > -cfg.HD - m && lz < cfg.HD + m;
  };
  // o vício da masmorra não passa da porta: a saída é uma barreira para ele
  AV.prenderNaMasmorra = function (cfg, p) {
    const dx = p.x - cfg.x, dz = p.z - cfg.z, cs = Math.cos(cfg.rot || 0), sn = Math.sin(cfg.rot || 0);
    let lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
    const lim = cfg.HW - 1, limz = cfg.HD - 1.2;
    if (Math.abs(lx) <= lim && Math.abs(lz) <= limz) return;
    lx = Math.max(-lim, Math.min(lim, lx)); lz = Math.max(-limz, Math.min(limz, lz));
    p.x = cfg.x + lx * cs + lz * sn; p.z = cfg.z - lx * sn + lz * cs;
  };

  /* ================= MISSÕES COM PERSONAGENS =================
     q: { id, ato, nome, npc, receptor, etapas, alvos, xp, den, itens, convite, aceitar, aceito, lembrete, pronto, agradece,
          entrega: { acao, prop, alvo }, depois, aoAceitar, aoConcluir, requer } */
  const QUESTS = {};
  const porNpc = {};
  AV.missao = function (q) {
    QUESTS[q.id] = q;
    MS.MIS[q.id] = { ato: q.ato, nome: q.nome, tipo: q.tipo || 's', xp: q.xp || 80, etapas: q.etapas, alvos: q.alvos };
    [q.npc, q.receptor || q.npc].forEach(n => { porNpc[n] = porNpc[n] || []; if (!porNpc[n].includes(q)) porNpc[n].push(q); });
    return q;
  };
  const linha = (quem, txt) => ({ inicio: 'a', nos: { a: { quem, txt } } });
  const nomeDe = id => (M.figuras[id] && M.figuras[id].op.nome) || id;
  function concluirQ(q) {
    MS.concluir(q.id);
    const out = [];
    if (q.den) { const n = Math.round(q.den * (OV.ECON ? OV.ECON.missoes : 1)); P.pers.denarios = (P.pers.denarios || 0) + n; out.push(`${n} denários`); }
    (q.itens || []).forEach(([id, n]) => { if (!IT.dar(id, n, true)) P.pers.bau[id] = (P.pers.bau[id] || 0) + n; out.push(`${OV.ITENS[id].nome}${n > 1 ? ' ×' + n : ''}`); });
    if (out.length) setTimeout(() => ui.toast('Recebido: ' + out.join(', ') + '.'), 1600);
    if (q.aoConcluir) q.aoConcluir();
    OV.jogo.salvar();
  }
  AV.concluirQ = concluirQ;
  function dialogoNpc(id, original) {
    const qs = porNpc[id] || [], nome = nomeDe(id);
    // entregar (a quem recebe)
    for (const q of qs) {
      if ((q.receptor || q.npc) !== id || !MS.ativa(q.id) || !(q.pronto ? q.pronto() : MS.etapa(q.id) === q.etapas.length - 1)) continue;
      const quem = nomeDe(id);
      return { inicio: 'a', nos: { a: { quem, txt: val(q.agradece), depois: () => {
        const fim = () => concluirQ(q);
        if (q.entrega) AV.entregar(Object.assign({ npc: id }, q.entrega, { alvo: q.entrega.alvo, falas: q.entrega.falas }), fim); else fim();
      } } } };
    }
    // oferecer ou lembrar (quem pede)
    for (const q of qs) {
      if (q.npc !== id || MS.feita(q.id)) continue;
      if (q.requer && !q.requer()) continue;
      if (!st(q.id)) {
        return { inicio: 'a', nos: {
          a: { quem: nome, txt: val(q.convite), opc: [{ t: q.aceitar || 'Eu ajudo.', ef: () => { MS.iniciar(q.id); if (q.aoAceitar) q.aoAceitar(); }, ir: 'b' }, { t: q.recusar || 'Agora não posso.' }] },
          b: { quem: nome, txt: val(q.aceito) }
        } };
      }
      return linha(nome, val(q.lembrete) || 'Que Deus o acompanhe no caminho.');
    }
    if (original) return original();
    const ultima = qs.filter(q => q.npc === id && MS.feita(q.id)).pop();
    return linha(nome, ultima && ultima.depois ? val(ultima.depois) : 'A paz esteja com você, peregrino.');
  }
  const ligados = new Set();
  AV.ligarNpcs = function () {
    const novos = Object.keys(porNpc).filter(id => !ligados.has(id)); novos.forEach(id => ligados.add(id));
    for (const id of novos) { const orig = MS.ARV[id]; MS.ARV[id] = () => dialogoNpc(id, orig); }
    if (OV.vida && OV.vida.SINAL) for (const id of novos) {
      const orig = OV.vida.SINAL[id];
      OV.vida.SINAL[id] = () => {
        const qs = porNpc[id];
        if (qs.some(q => (q.receptor || q.npc) === id && MS.ativa(q.id) && (q.pronto ? q.pronto() : MS.etapa(q.id) === q.etapas.length - 1))) return '?';
        if (qs.some(q => q.npc === id && !st(q.id) && (!q.requer || q.requer()))) return '!';
        return orig ? orig() : null;
      };
    }
  };

  /* ================= GUILDAS E CONFRARIAS =================
     cfg: { id, nome, regiao, ato, mestre: npc id, quadro: {x, z, rot}, titulos: [3], contratos: [{ nome, tipo: 'vencer'|'baus'|'masmorra', n, masmorra, xp, den, itens, fala }] } */
  const guildas = [];
  AV.guilda = function (cfg) {
    guildas.push(cfg);
    const { x, z, rot } = cfg.quadro;
    // o quadro de avisos, com o estandarte da confraria
    const g = grupo(x, z, rot || 0);
    [-0.9, 0.9].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), CORES.madeiraE, s, 1.1, 0)));
    g.add(mesh(new THREE.BoxGeometry(2.1, 1.2, 0.1), CORES.madeira, 0, 1.55, 0));
    g.add(mesh(new THREE.BoxGeometry(2.3, 0.12, 0.3), CORES.madeiraE, 0, 2.22, 0.05));
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.BoxGeometry(0.34, 0.44, 0.02), CORES.papel, -0.7 + i * 0.35, 1.55 + (i % 2 ? 0.12 : -0.1), 0.06));
    g.add(mesh(new THREE.BoxGeometry(0.08, 3.2, 0.08), CORES.madeiraE, 1.5, 1.6, 0));
    const est = mesh(new THREE.BoxGeometry(0.7, 1.0, 0.03), sm(cfg.cor || 0x7a1414), 1.88, 2.55, 0); g.add(est);
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.5, 0.04), MAT.gold, 1.88, 2.6, 0.02)); g.add(mesh(new THREE.BoxGeometry(0.3, 0.06, 0.04), MAT.gold, 1.88, 2.7, 0.02));
    fundir(g);
    M.obstacles.push({ x, z, r: 1.2 });
    cfg.contratos.forEach((c, i) => {
      c.id = `${cfg.id}_c${i + 1}`;
      const prog0 = () => F()['gldb_' + c.id] || 0;
      // v24: os baús que o peregrino já abriu antes de aceitar o contrato também contam
      const feito = () => c.tipo === 'vencer' ? (F()['gldn_' + c.id] || 0) : c.tipo === 'baus' ? AV.bausAbertos(cfg.regiao) : AV.masmorraFeita(c.masmorra) ? 1 : 0;
      c.feito = feito;
      MS.MIS[c.id] = { ato: cfg.ato, nome: `${cfg.curto}: ${c.nome}`, tipo: 's', xp: c.xp || 100, etapas: [
        () => c.tipo === 'masmorra' ? c.txt : `${c.txt} (${Math.min(c.n, feito())}/${c.n})`, `Volte a ${nomeDe(cfg.mestre)}, ${cfg.ondeMestre}.`],
        alvos: [() => c.tipo === 'masmorra' ? (masmorras.find(m => m.id === c.masmorra) || {}).W ? masmorras.find(m => m.id === c.masmorra).W(0, 20) : null : c.tipo === 'baus' ? bauMaisPerto(cfg.regiao) : null, () => { const f = M.figuras[cfg.mestre]; return f ? { x: f.x, z: f.z } : null; }] };
    });
    // o mestre da confraria
    MS.ARV[cfg.mestre] = () => dialogoGuilda(cfg);
    if (OV.vida && OV.vida.SINAL) OV.vida.SINAL[cfg.mestre] = () => { const c = contratoAtual(cfg); if (!c) return null; if (MS.ativa(c.id) && MS.etapa(c.id) === 1) return '?'; if (!st(c.id)) return '!'; return null; };
    return cfg;
  };
  function bauMaisPerto(regiao) {
    let best = null, bd = 1e9;
    baus.forEach(b => { if (b.regiao !== regiao || aberto(b) || b.id.startsWith('mas_')) return; if (!OV.rumo || !OV.rumo.explorado(b.x, b.z)) return; const d = Math.hypot(b.x - P.pos.x, b.z - P.pos.z); if (d < bd) { bd = d; best = b; } });
    return best ? { x: best.x, z: best.z } : null;
  }
  const rank = cfg => F()['gld_' + cfg.id] || 0;
  const contratoAtual = cfg => cfg.contratos[Math.min(cfg.contratos.length - 1, rank(cfg))] && rank(cfg) < cfg.contratos.length ? cfg.contratos[rank(cfg)] : null;
  AV.titulo = cfg => rank(cfg) ? cfg.titulos[rank(cfg) - 1] : null;
  function dialogoGuilda(cfg) {
    const nome = nomeDe(cfg.mestre), c = contratoAtual(cfg);
    if (!c) return linha(nome, cfg.falaMestre || `Você é ${cfg.titulos[cfg.titulos.length - 1]} da ${cfg.nome}. Seu nome está no livro da confraria, e as nossas portas estão sempre abertas.`);
    const pagar = () => {
      MS.concluir(c.id);
      F()['gld_' + cfg.id] = rank(cfg) + 1;
      const out = [];
      if (c.den) { const n = Math.round(c.den * (OV.ECON ? OV.ECON.contratos : 1)); P.pers.denarios = (P.pers.denarios || 0) + n; out.push(`${n} denários`); }
      (c.itens || []).forEach(([id, n]) => { if (!IT.dar(id, n, true)) P.pers.bau[id] = (P.pers.bau[id] || 0) + n; out.push(OV.ITENS[id].nome); });
      setTimeout(() => ui.toast(`${cfg.curto}: agora você é ${cfg.titulos[rank(cfg) - 1]}.`), 1500);
      if (out.length) setTimeout(() => ui.toast('Recebido: ' + out.join(', ') + '.'), 3200);
      A.bell && A.bell(523, 0.16); OV.jogo.salvar();
    };
    // v24: contrato já cumprido antes (ou durante) — o mestre confere e paga na hora
    if (MS.ativa(c.id) && MS.etapa(c.id) === 0 && c.tipo !== 'vencer' && (c.tipo === 'baus' ? c.feito() >= c.n : c.feito())) MS.avancar(c.id, 1);
    if (MS.ativa(c.id) && MS.etapa(c.id) === 1) return { inicio: 'a', nos: { a: { quem: nome, txt: c.fala || 'Contrato cumprido. A confraria agradece, e paga o que prometeu.', depois: pagar } } };
    if (MS.ativa(c.id)) return linha(nome, `O contrato continua de pé: ${c.txt.charAt(0).toLowerCase() + c.txt.slice(1)}`);
    const jaFeito = () => c.tipo === 'baus' ? c.feito() >= c.n : c.tipo === 'masmorra' ? !!c.feito() : false;
    return { inicio: 'a', nos: {
      a: { quem: nome, txt: rank(cfg) === 0 ? cfg.convite : `Há mais um contrato no quadro, se você quiser: ${c.txt.charAt(0).toLowerCase() + c.txt.slice(1)}`, opc: [
        { t: 'Aceito o contrato.', ef: () => { F()['gldn_' + c.id] = 0; MS.iniciar(c.id); if (jaFeito()) MS.avancar(c.id, 1); }, ir: () => jaFeito() ? 'p' : 'b' },
        { t: 'Agora não.' }] },
      b: { quem: nome, txt: 'Está escrito no livro. Volte quando estiver feito.' },
      p: { quem: nome, txt: () => `Espere... isso você já fez antes mesmo de assinar! ${c.fala || 'Contrato cumprido. A confraria agradece, e paga o que prometeu.'}`, depois: pagar }
    } };
  }
  // contagem dos contratos
  MS.ganchos.evento.push((tipo, x) => {
    if (tipo === 'vencido' || tipo === 'liberto') {
      if (!x || !x.g || (x.def && x.def.fixo)) return false;
      const r = regiaoDe(x.g.position.x, x.g.position.z);
      guildas.forEach(cfg => cfg.contratos.forEach(c => {
        if (c.tipo !== 'vencer' || !MS.ativa(c.id) || MS.etapa(c.id) !== 0 || cfg.regiao !== r) return;
        const n = (F()['gldn_' + c.id] || 0) + 1; F()['gldn_' + c.id] = n;
        if (n >= c.n) { MS.avancar(c.id, 1); ui.toast(`Contrato cumprido: volte a ${nomeDe(cfg.mestre)}.`); }
      }));
    }
    if (tipo === 'bau' || tipo === 'masmorra') {
      guildas.forEach(cfg => cfg.contratos.forEach(c => {
        if (!MS.ativa(c.id) || MS.etapa(c.id) !== 0) return;
        if ((c.tipo === 'baus' && c.feito() >= c.n) || (c.tipo === 'masmorra' && c.feito())) { MS.avancar(c.id, 1); setTimeout(() => ui.toast(`Contrato cumprido: volte a ${nomeDe(cfg.mestre)}.`), 1400); }
      }));
    }
    return false;
  });
  AV.guildas = guildas;

  /* ================= O QUE O MAPA MOSTRA ================= */
  AV.marcas = function (regiao) {
    const out = [];
    baus.forEach(b => { if (b.regiao === regiao && !b.id.startsWith('mas_')) out.push({ tipo: 'bau', x: b.x, z: b.z, aberto: aberto(b) }); });
    masmorras.forEach(m => { if (m.regiao === regiao) { const w = m.W(0, 27); out.push({ tipo: 'masmorra', x: w.x, z: w.z, feita: AV.masmorraFeita(m.id), nome: m.nome }); } });
    guildas.forEach(g => { if (g.regiao === regiao) out.push({ tipo: 'guilda', x: g.quadro.x, z: g.quadro.z, nome: g.nome }); });
    return out;
  };

  /* ================= GANCHOS ================= */
  MS.ganchos.spawn.push(() => { aplicarColetas(); aplicarBaus(); aplicarMasmorras(); });
  MS.ganchos.update.push(dt => { atualizarCarga(dt); atualizarCena(dt); atualizarMasmorras(dt); atualizarGuardas(dt); });
  MS.ganchos.evento.push(tipo => { if (tipo === 'renascer') { if (cena) { cena.fase = 'fim'; } } return false; });
  MS.ganchos.inventario.push(inv => {
    guildas.forEach(g => { const t = AV.titulo(g); if (t) inv.push(`${g.nome}: ${t}`); });
    const n = AV.bausAbertos(), tot = baus.length; if (n) inv.push(`Baús abertos: ${n} de ${tot}`);
    masmorras.forEach(m => { if (AV.masmorraFeita(m.id)) inv.push(`${m.nome}: purificada`); });
  });
  // na volta ao menu, a carga sai das mãos
  const irMenu0 = () => { soltarDaMao(); cena = null; fila.length = 0; travaCarga = false; };
  AV.reiniciar = irMenu0;
})(window.OV);
