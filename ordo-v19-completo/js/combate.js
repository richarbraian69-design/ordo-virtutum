/* Ordo Virtutum — o personagem em ação: movimento, golpes, esquiva, Sinal da Cruz, orações e progressão */
(function (OV) {
  'use strict';
  const { clamp, lerp, angWrap, turnTo } = OV.util;
  const M = OV.mundo, A = OV.audio, ui = OV.ui;

  const P = {
    pos: new THREE.Vector3(), facing: Math.PI, hp: 0, sta: 0, fe: 0,
    atkT: 0, atkDur: 0, atkPesado: false, atkHit: false,
    dodgeT: 0, dodgeDir: new THREE.Vector3(), invuln: 0,
    praying: false, prayT: 0, prayLock: 0, castT: 0, castKind: null,
    parryT: 0, signT: 0, parryFlash: 0, oratT: 0,
    status: {}, cd: {}, dead: false, walkPh: 0, moveAmt: 0, flash: 0,
    alvo: null, pers: null, D: null, arma: null, heroi: null
  };
  OV.P = P;
  const C = {};
  OV.combate = C;
  const ativo = () => OV.jogo && OV.jogo.ativo();
  let firstStatus = true;

  /* ---- personagem ---- */
  C.trocarModelo = function (sexo, ordem) {
    if (P.heroi) M.scene.remove(P.heroi.g);
    P.heroi = OV.criarHeroi(sexo, ordem); M.scene.add(P.heroi.g);
    P.heroi.g.position.copy(P.pos); P.heroi.g.rotation.y = P.facing;
  };
  C.definirPersonagem = function (pers) {
    P.pers = pers; C.recalcular(); C.trocarModelo(pers.sexo, pers.ordem);
  };
  const HB = () => OV.habilidades;
  C.recalcular = function () {
    const o = OV.ORDENS[P.pers.ordem];
    P.D = OV.derivados(P.pers.virt, o.arma); P.arma = OV.ARMAS[o.arma]; P.armaId = o.arma;
    if (C.flag('arma_afiada')) P.D.dano += 3;
    if (C.flag('sopa_lucia')) P.D.maxHp += 15;
    if (HB() && HB().tem('castelo')) P.D.maxFe += 30;
    const IT = OV.itens;
    if (IT && P.pers) { P.D.maxHp += IT.mod('hp'); P.D.maxFe += IT.mod('fe'); P.D.maxSta += IT.mod('sta'); P.D.staRegen *= IT.mod('staRegen'); }
  };
  C.flag = k => !!(OV.jogo && OV.jogo.prog && OV.jogo.prog.flags && OV.jogo.prog.flags[k]);
  C.custoOracao = c => Math.max(5, c - (C.flag('rosario') ? 5 : 0) - (HB() && HB().tem('cantar') ? 5 : 0) - (OV.itens && P.pers ? OV.itens.mod('custo') : 0));
  C.restaurar = function () { P.hp = P.D.maxHp; P.sta = P.D.maxSta; P.fe = P.D.maxFe; P.status = {}; P.cd = {}; };
  C.resetAcoes = function () {
    Object.assign(P, { atkT: 0, dodgeT: 0, invuln: 0, praying: false, prayT: 0, prayLock: 0, castT: 0, castKind: null, parryT: 0, signT: 0, parryFlash: 0, oratT: 0, dead: false, moveAmt: 0, flash: 0, alvo: null });
    if (P.heroi) { P.heroi.body.rotation.x = 0; P.heroi.body.position.y = 0; }
  };
  C.posicionar = function (x, z, facing) { P.pos.set(x, M.altura(x, z), z); P.facing = facing; if (P.heroi) { P.heroi.g.position.copy(P.pos); P.heroi.g.rotation.y = facing; } };

  /* ---- mira ---- */
  function inputDir() {
    const keys = OV.input.keys, yaw = OV.cam.yaw;
    let ix = 0, iz = 0;
    if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1;
    if (keys.KeyD || keys.ArrowRight) ix += 1; if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    const s = Math.sin(yaw), c = Math.cos(yaw);
    const v = new THREE.Vector3(-s * iz + c * ix, 0, -c * iz - s * ix); if (v.lengthSq() > 0) v.normalize(); return v;
  }
  const vivos = () => OV.inimigos.vivos();
  const distTo = e => Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) - e.def.r;
  const angTo = e => Math.atan2(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z);
  function nearestFoe(maxD) { let best = null, bd = maxD; vivos().forEach(e => { const d = distTo(e); if (d < bd) { bd = d; best = e; } }); return best; }
  function mirarDistante() {
    const camAng = Math.atan2(-Math.sin(OV.cam.yaw), -Math.cos(OV.cam.yaw));
    let best = null, bs = 1e9;
    vivos().forEach(e => {
      const d = distTo(e); if (d > 18) return;
      const a = Math.abs(angWrap(angTo(e) - camAng)); if (a > 0.7) return;
      const s = a + d * 0.02; if (s < bs) { bs = s; best = e; }
    });
    return best || nearestFoe(6);
  }
  C.lockToggle = function () {
    if (!ativo() || P.dead) return;
    if (P.alvo) { P.alvo = null; return; }
    const camAng = Math.atan2(-Math.sin(OV.cam.yaw), -Math.cos(OV.cam.yaw));
    let best = null, bs = 1e9;
    vivos().forEach(e => {
      const d = distTo(e); if (d > 22) return;
      const a = Math.abs(angWrap(angTo(e) - camAng)); if (a > 1.3) return;
      const s = a + d * 0.03; if (s < bs) { bs = s; best = e; }
    });
    if (best) P.alvo = best; else ui.toast('Nenhum vício à vista.');
  };

  /* ---- ações ---- */
  const ocupado = () => P.atkT > 0 || P.dodgeT > 0 || P.praying || P.castT > 0 || P.oratT > 0 || P.signT > 0.15;
  C.atacar = function (pesado) {
    if (!ativo() || P.dead || ocupado()) return;
    const W = P.arma, custo = Math.round((W.folego + (pesado ? 12 : 0)) * (HB() ? HB().multFolego() : 1));
    if (P.sta < custo) { ui.toast('Sem fôlego.'); return; }
    P.sta -= custo; P.atkPesado = pesado; P.atkDur = pesado ? W.pesado : W.tempo; P.atkT = P.atkDur; P.atkHit = false;
    const t = (P.alvo && P.alvo.state !== 'dead') ? P.alvo : (W.projetil ? mirarDistante() : nearestFoe(4.5));
    if (t) P.facing = angTo(t);
    P.mira = t || null;
    if (pesado) A.heavy(); else if (W.projetil) A.cast(); else A.swish();
  };
  C.esquivar = function () {
    if (!ativo() || P.dead) return;
    if (P.dodgeT > 0 || P.praying || P.castT > 0 || P.oratT > 0) return;
    const custoEsq = HB() && HB().tem('mao') ? 11 : 22;
    if (P.sta < custoEsq) { ui.toast('Sem fôlego.'); return; }
    P.sta -= custoEsq; P.dodgeT = 0.32; P.invuln = P.D.iframe; P.atkT = 0;
    const d = inputDir();
    if (d.lengthSq() === 0) d.set(-Math.sin(P.facing), 0, -Math.cos(P.facing)); else if (!P.alvo) P.facing = Math.atan2(d.x, d.z);
    P.dodgeDir.copy(d); A.dodge();
  };
  C.sinal = function () {
    if (!ativo() || P.dead) return;
    if ((P.cd.sinal || 0) > 0 || P.dodgeT > 0 || P.praying || P.oratT > 0) return;
    const custoSinal = HB() && HB().tem('disputatio') ? 0 : OV.SINAL.custo;
    if (P.fe < custoSinal) { ui.toast('Fé insuficiente para o Sinal da Cruz.'); return; }
    P.fe -= custoSinal; P.cd.sinal = OV.SINAL.recarga; P.parryT = OV.SINAL.janela; P.signT = 0.45; P.atkT = 0;
    const t = (P.alvo && P.alvo.state !== 'dead') ? P.alvo : nearestFoe(4);
    if (t) P.facing = angTo(t);
  };
  C.orar = function (slot) {
    if (!ativo() || P.dead) return;
    const o = OV.ORACOES.find(x => x.slot === slot); if (!o) return;
    if (!o.id) { ui.toast(o.bloq); return; }
    if (P.status.soberba) { ui.toast('A Soberba impede a oração.'); return; }
    if ((P.cd[o.id] || 0) > 0 || P.castT > 0 || P.dodgeT > 0 || P.oratT > 0) return;
    if (o.id === 'ave' && OV.ato2 && OV.ato2.jejum) { ui.toast('Em jejum, você renunciou à Ave-Maria até o fim da vigília.'); return; }
    const custo = C.custoOracao(o.custo);
    if (P.fe < custo) { ui.toast('Fé insuficiente. Segure R para rezar.'); return; }
    P.fe -= custo; P.cd[o.id] = o.recarga; P.castT = 0.75; P.castKind = o.id; P.atkT = 0; P.praying = false;
    if (o.id === 'miguel') burst();
    else if (o.id === 'ave') {
      const ganho = Math.min(P.D.maxHp - P.hp, Math.round(P.D.cura * (P.status.gula ? 0.5 : 1) * (HB() ? HB().multCura() : 1) * (OV.itens ? OV.itens.mod('cura') : 1))); P.hp += ganho;
      if (P.status.gula) ui.toast('A Gula pesa: a cura vem pela metade.');
      anel(0xcfe0ff, 2.2, 0.9, 0.6); A.heal();
    }
  };

  /* ---- efeitos visuais ---- */
  const efeitos = [], projs = [];
  // C.aoFx: o co-op escuta os efeitos do jogador local para mostrá-los também no navegador do colega
  const avisarFx = m => { if (C.aoFx) try { C.aoFx(m); } catch (e) { /* o efeito local segue */ } };
  function anel(cor, escala, dur, op, onde) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.0, 40), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    const pp = onde || P.pos, y0 = pp.y;
    if (!onde) avisarFx({ k: 'anel', cor, escala, dur, op });
    ring.rotation.x = -Math.PI / 2; ring.position.set(pp.x, y0 + 0.1, pp.z); M.scene.add(ring);
    efeitos.push({ meshes: [ring], t: 0, dur, upd: (p) => { ring.scale.setScalar(1 + p * escala); ring.position.y = y0 + 0.1 + p * 1.6; ring.material.opacity = op * (1 - p); } });
  }
  function burst() {
    burstVisual(P.pos); avisarFx({ k: 'burst' });
    A.bell(392, 0.28); OV.jogo.shake(0.15);
    vivos().forEach(e => {
      const d = distTo(e);
      if (d < 6.5 && !M.paredeEntre(P.pos.x, P.pos.z, e.g.position.x, e.g.position.z)) { const f = 1 - 0.5 * Math.max(0, d) / 6.5; C.danoInimigo(e, Math.round(P.D.miguel * f), 7 * f, angTo(e), { jogador: true }); }
    });
  }
  function burstVisual(Q) { // a luz de São Miguel, onde quer que o orante esteja
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.05, 40), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(Q.x, Q.y + 0.08, Q.z); M.scene.add(ring);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 9, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    col.position.set(Q.x, Q.y + 4.5, Q.z); M.scene.add(col);
    efeitos.push({ meshes: [ring, col], t: 0, dur: 0.7, upd: p => { ring.scale.setScalar(1 + p * 6.5); ring.material.opacity = Math.max(0, 0.9 * (1 - p)); col.material.opacity = Math.max(0, 0.5 * (1 - p * 1.3)); col.scale.x = col.scale.z = 1 + p * 0.6; } });
    M.burstLight.position.set(Q.x, Q.y + 2.5, Q.z); M.burstLight.intensity = 5;
  }
  C.burstVisual = burstVisual;
  function faisca(x, y, z, cor) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: cor || 0xffe2a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set(x, y, z); M.scene.add(s);
    efeitos.push({ meshes: [s], t: 0, dur: 0.25, upd: p => { s.scale.setScalar(1 + p * 3); s.material.opacity = 0.9 * (1 - p); } });
  }
  /* projéteis: a arma do jogador e as habilidades usam o mesmo lançador */
  C.lancar = function (o) {
    const W = P.arma || {};
    if (!o.visual) avisarFx({ k: 'proj', o: [o.origem.x, o.origem.y, o.origem.z].map(v => Math.round(v * 100) / 100), d: [o.dir.x, o.dir.y, o.dir.z].map(v => Math.round(v * 1000) / 1000), p: o.pesado ? 1 : 0, cor: o.cor || 0, brilho: o.brilho || 0, fl: o.flecha ? 1 : 0, r: o.raio, v: o.vel, al: o.alcance || W.alcance || 14 });
    const r = o.raio !== undefined ? o.raio : (o.pesado ? 0.3 : 0.15);
    let core;
    if (o.flecha) {
      core = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, o.pesado ? 1.0 : 0.75), new THREE.MeshBasicMaterial({ color: o.cor || 0xfff4d0 }));
      core.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.9), new THREE.MeshBasicMaterial({ color: o.brilho || 0xffe0a0, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })));
    } else {
      core = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: o.cor || 0xfff1c8 }));
      core.add(new THREE.Mesh(new THREE.SphereGeometry(r * 2.2, 10, 8), new THREE.MeshBasicMaterial({ color: o.brilho || 0xffc860, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })));
    }
    core.position.copy(o.origem); M.scene.add(core);
    if (o.flecha) core.lookAt(o.origem.clone().add(o.dir));
    const speed = o.vel || (o.pesado ? 15 : 22);
    projs.push({ mesh: core, vel: o.dir.clone().normalize().multiplyScalar(speed), life: ((o.alcance || W.alcance || 14) + 2) / speed, raio: o.raioHit || (o.pesado ? 0.65 : 0.38),
      dano: o.dano, pesado: !!o.pesado, perfura: o.perfura || 0, atingidos: new Set(), cor: o.brilho || 0xffe2a0, atordoa: o.atordoa || 0, explode: o.explode !== undefined ? o.explode : !!o.pesado, visual: !!o.visual });
  };
  C.origemMao = function () {
    const h = P.heroi; const o = new THREE.Vector3();
    if (h && h.orb) h.orb.getWorldPosition(o); else o.set(P.pos.x, P.pos.y + 1.4, P.pos.z);
    return o;
  };
  function lancarProjetil(pesado, desvio) {
    const W = P.arma, o = C.origemMao();
    let dir;
    if (P.mira && P.mira.state !== 'dead') {
      const t = P.mira.g.position; dir = new THREE.Vector3(t.x - o.x, (t.y + 1.2) - o.y, t.z - o.z).normalize();
    } else dir = new THREE.Vector3(Math.sin(P.facing), 0, Math.cos(P.facing));
    if (desvio) dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), desvio);
    const Hb = HB();
    C.lancar({ origem: o, dir, pesado, dano: Math.round(P.D.dano * (pesado ? 1.8 : 1)), cor: W.cor, brilho: W.brilho, flecha: W.flecha,
      perfura: Hb && Hb.tem('harmonia') ? 1 : 0, atordoa: Hb && Hb.buff('tentacoes') ? 0.6 : 0 });
  }
  function updateProjs(dt) {
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i]; p.life -= dt; p.mesh.position.addScaledVector(p.vel, dt);
      let hit = null;
      for (const e of vivos()) {
        if (p.atingidos.has(e)) continue;
        const dx = e.g.position.x - p.mesh.position.x, dz = e.g.position.z - p.mesh.position.z;
        if (Math.hypot(dx, dz) < e.def.r + p.raio && p.mesh.position.y < e.g.position.y + e.def.height + 0.3) { hit = e; break; }
      }
      let bloqueio = false;
      const solo = M.altura(p.mesh.position.x, p.mesh.position.z);
      for (const o of M.obstacles) if (Math.abs(p.mesh.position.x - o.x) < o.r && Math.abs(p.mesh.position.z - o.z) < o.r && Math.hypot(p.mesh.position.x - o.x, p.mesh.position.z - o.z) < o.r && p.mesh.position.y - solo < 3.2) { bloqueio = true; break; }
      if (p.mesh.position.y < solo) bloqueio = true;
      const q = { x: p.mesh.position.x, z: p.mesh.position.z }; M.collide(q, 0.05); if (Math.abs(q.x - p.mesh.position.x) + Math.abs(q.z - p.mesh.position.z) > 0.01 && !M.naPonte(p.mesh.position.x, p.mesh.position.z) && Math.abs(p.mesh.position.x - M.rioX(p.mesh.position.z)) > 3.4) bloqueio = true;
      const pos = p.mesh.position;
      if (hit && p.visual) { faisca(pos.x, pos.y, pos.z, p.cor); M.scene.remove(p.mesh); projs.splice(i, 1); continue; } // o tiro do colega: só a imagem
      if (hit) {
        p.atingidos.add(hit);
        const ang = Math.atan2(hit.g.position.x - P.pos.x, hit.g.position.z - P.pos.z);
        C.danoInimigo(hit, p.dano, p.pesado ? 6 : 3, ang, { pesado: p.pesado, jogador: true, projetil: true });
        if (p.atordoa && hit.state !== 'dead' && hit.state !== 'liberto') OV.inimigos.atordoar(hit, p.atordoa);
        if (p.explode) vivos().forEach(e => { if (e !== hit && Math.hypot(e.g.position.x - pos.x, e.g.position.z - pos.z) < 2.5 + e.def.r) C.danoInimigo(e, Math.round(p.dano * 0.6), 4, Math.atan2(e.g.position.x - pos.x, e.g.position.z - pos.z), { jogador: true }); });
        faisca(pos.x, pos.y, pos.z, p.cor);
        if (p.perfura > 0) { p.perfura--; hit = null; continue; }
      }
      if (hit || bloqueio || p.life <= 0) {
        if (!hit) faisca(pos.x, pos.y, pos.z, p.cor);
        M.scene.remove(p.mesh); projs.splice(i, 1);
      }
    }
  }
  function updateEfeitos(dt) {
    for (let i = efeitos.length - 1; i >= 0; i--) {
      const f = efeitos[i]; f.t += dt; const p = Math.min(1, f.t / f.dur); f.upd(p);
      if (p >= 1) { f.meshes.forEach(m => { M.scene.remove(m); if (m.geometry) m.geometry.dispose(); }); efeitos.splice(i, 1); }
    }
    M.burstLight.intensity = Math.max(0, M.burstLight.intensity - dt * 8);
  }
  C.anel = anel; C.faisca = faisca;
  C.efeito = function (meshes, dur, upd) { meshes.forEach(m => M.scene.add(m)); efeitos.push({ meshes, t: 0, dur, upd }); if (meshes.length) avisarFx({ k: 'ef', meshes, dur }); };
  C.limparEfeitos = function () {
    efeitos.forEach(f => f.meshes.forEach(m => M.scene.remove(m))); efeitos.length = 0;
    projs.forEach(p => M.scene.remove(p.mesh)); projs.length = 0; M.burstLight.intensity = 0;
  };

  /* ---- dano ---- */
  C.danoInimigo = function (e, dmg, knock, ang, opts) {
    if (e.state === 'dead') return;
    let d = dmg;
    if (opts && opts.jogador && HB()) d = HB().modDano(e, d, opts);
    if (opts && opts.jogador && OV.itens) d = Math.round(d * OV.itens.danoContra(e));
    if (e.state === 'stun') d = Math.round(d * 1.5);
    if (e.marca > 0) d = Math.round(d * (1 + (e.marcaF || 0.15)));
    if (e.def.quebra && e.def.quebra()) d = Math.max(d, e.hp);
    if (e.def.reduz) d = Math.max(1, Math.round(d * e.def.reduz(e)));
    e.hp -= d; e.flash = 0.12; e.provocado = true;
    e.vel.x += Math.sin(ang) * knock * e.def.knock; e.vel.z += Math.cos(ang) * knock * e.def.knock;
    const firme = (OV.inimigos.CHEFES && OV.inimigos.CHEFES.has(e.def.key)) || e.def.chefe || e.def.chefeMenor || e.def.variante === 'elite';
    if (opts && opts.pesado && !firme && Math.random() < 0.25) OV.inimigos.atordoar(e, 0.9);
    else if (e.state === 'windup' && e.def.stagger) { e.state = 'recover'; e.t = 0.5; }
    OV.jogo.shake(0.12); A.hit();
    if (opts && opts.jogador && HB()) HB().aoAcertar(e, d, opts);
    if (e.hp <= 0) {
      e.hp = 0; e.lab.el.style.display = 'none';
      if (P.alvo === e) P.alvo = null;
      if (e.def.moedas && P.pers) { const n = Math.round((e.def.moedas[0] + Math.floor(Math.random() * (e.def.moedas[1] - e.def.moedas[0] + 1))) * (HB() && HB().tem('mao') ? 2 : 1) * (OV.itens ? OV.itens.mod('denarios') : 1)); P.pers.denarios = (P.pers.denarios || 0) + n; }
      if (HB()) HB().aoVencer(e);
      if (OV.itens) OV.itens.aoVencer(e);
      if (e.def.liberta) { e.state = 'liberto'; e.t = 0; C.ganharXp(C.xpDe(e)); if (OV.missoes) OV.missoes.evento('liberto', e); return; }
      e.state = 'dead'; e.deadT = 0;
      if (e.def.fall) ui.toast(e.def.fall); C.ganharXp(C.xpDe(e)); OV.jogo.vicioVencido(e);
      if (OV.missoes) OV.missoes.evento('vencido', e);
    }
  };
  C.aparouCerto = () => { P.cd.sinal = Math.min(P.cd.sinal || 0, OV.SINAL.recargaAcerto || 0.8); };
  C.receberGolpe = function (e) {
    if (P.dead) return;
    if (P.parryT > 0 && Math.abs(angWrap(angTo(e) - P.facing)) < 1.6) {
      OV.inimigos.atordoar(e, (e.def.key === 'soberba' ? 1.0 : 1.5) + (HB() && HB().tem('estabilidade') ? 1 : 0)); e.flash = 0.12;
      if (HB() && HB().tem('disputatio')) P.fe = Math.min(P.D.maxFe, P.fe + 10);
      A.parry(); P.parryFlash = 0.45; OV.jogo.shake(0.15); C.aparouCerto();
      ui.toast('Sinal da Cruz! O vício cambaleia.');
      return;
    }
    if (e.def.aoGolpear) e.def.aoGolpear(e);
    C.ferirJogador(Math.round(e.def.dmg * (e.multDano || 1)), e.def.status !== undefined ? e.def.status : e.def.key, e);
  };
  C.ferirJogador = function (dmg, status, fonte) {
    if (P.invuln > 0 || P.dead) return;
    const H = OV.habilidades;
    if (H) { dmg = H.modFerido(dmg, fonte); if (dmg <= 0) return; }
    if (OV.itens) dmg = Math.max(1, Math.round(dmg * OV.itens.mod('defesa')));
    if (H && P.hp - dmg <= 0 && dmg < 9000 && !P.morteUsada) {
      const rv = H.reviver();
      if (rv) {
        P.morteUsada = true; P.hp = Math.max(1, Math.round(P.D.maxHp * rv.hp)); if (rv.fe) P.fe = P.D.maxFe; P.invuln = 1.5; P.flash = 0.3; A.bell(330, 0.3);
        ui.toast(rv.msg); return;
      }
    }
    P.hp -= dmg; P.flash = 0.15; OV.jogo.shake(0.35); A.hurt();
    const h = document.getElementById('hurt'); h.style.transition = 'none'; h.style.opacity = '1';
    requestAnimationFrame(() => { h.style.transition = ''; h.style.opacity = '0'; });
    if (H) H.aoFerido(dmg);
    if (P.praying && !(H && H.recolhimentoFirme())) { P.praying = false; P.prayT = 0; P.prayLock = 1; }
    if (P.oratT > 0) { P.oratT = 0; ui.toast('A oração foi interrompida.'); }
    const durStatus = status && OV.STATUS[status] ? (H ? H.durStatus(status, OV.STATUS[status].dur) : OV.STATUS[status].dur) : 0;
    if (durStatus > 0) {
      P.status[status] = Math.max(P.status[status] || 0, durStatus);
      if (firstStatus && status !== 'soberba' && status !== 'avareza') { firstStatus = false; setTimeout(() => ui.toast('Segure R no Recolhimento para purificar o vício.'), 900); }
    }
    if (P.hp <= 0) { P.hp = 0; P.dead = true; P.praying = false; P.alvo = null; OV.jogo.morreu(); }
  };

  /* ---- progressão ---- */
  // experiência de um vício vencido: cai muito quando ele está bem abaixo do seu nível (farmar rende pouco)
  C.xpDe = function (e) {
    const dif = (e.def.nivel || 1) - (P.pers ? P.pers.nivel : 1);
    const f = dif >= 0 ? 1 + 0.08 * Math.min(dif, 5) : Math.max(0.02, 1 + 0.3 * dif);
    return Math.max(1, Math.round(e.def.xp * 0.62 * f));
  };
  C.ganharXp = function (n) {
    const pers = P.pers; if (pers.nivel >= OV.NIVEL_MAX) return;
    pers.xp += n; let subiu = false;
    while (pers.nivel < OV.NIVEL_MAX && pers.xp >= OV.xpParaProximo(pers.nivel)) { pers.xp -= OV.xpParaProximo(pers.nivel); pers.nivel++; pers.pontos += 2; subiu = true; }
    if (pers.nivel >= OV.NIVEL_MAX) pers.xp = 0;
    if (subiu) {
      const novas = OV.habilidades ? OV.habilidades.aoSubirNivel(pers.nivel) : [];
      C.recalcular();
      setTimeout(() => { A.level(); ui.toast(`Nível ${pers.nivel}! Abra a ficha com C para distribuir os pontos de virtude.`); }, 2700);
      if (novas.length) setTimeout(() => ui.toast(novas.join(' · ')), 5400);
    }
  };
  /* pontos de virtude: quanto de cada virtude veio de pontos distribuídos (os que podem ser tirados de volta) */
  function distrib() {
    const pers = P.pers; if (!pers) return {};
    if (!pers.distrib) {
      // progresso de antes: estima o que foi distribuído (o que passa da base da ordem), sem passar do total ganho
      const base = OV.ORDENS[pers.ordem].virt, d = {};
      let resta = Math.max(0, (pers.nivel - 1) * 2 - (pers.pontos || 0));
      OV.VIRTUDES.forEach(v => { const n = Math.min(resta, Math.max(0, pers.virt[v.k] - base[v.k])); d[v.k] = n; resta -= n; });
      pers.distrib = d;
    }
    return pers.distrib;
  }
  let naFicha = {}, exame = false;
  C.abrirFicha = function (aberta) { naFicha = {}; exame = false; };
  C.exameAtivo = () => exame;
  C.gastosNaFicha = () => Object.values(naFicha).reduce((a, b) => a + b, 0);
  C.pontosDistribuidos = () => Object.values(distrib()).reduce((a, b) => a + b, 0);
  C.podeTirar = k => !!P.pers && ((naFicha[k] || 0) > 0 || (exame && (distrib()[k] || 0) > 0));
  function ajustar(old) {
    P.hp = Math.min(P.D.maxHp, P.hp + Math.max(0, P.D.maxHp - old.maxHp));
    P.sta = Math.min(P.D.maxSta, P.sta + Math.max(0, P.D.maxSta - old.maxSta));
    P.fe = Math.min(P.D.maxFe, P.fe + Math.max(0, P.D.maxFe - old.maxFe));
  }
  C.distribuir = function (k) {
    const pers = P.pers; if (pers.pontos <= 0 || pers.virt[k] >= OV.MAX_VIRTUDE) return;
    const d = distrib();
    const old = P.D; pers.virt[k]++; pers.pontos--; d[k] = (d[k] || 0) + 1; naFicha[k] = (naFicha[k] || 0) + 1; C.recalcular();
    ajustar(old);
  };
  C.tirar = function (k) {
    if (!C.podeTirar(k)) return;
    const pers = P.pers, d = distrib();
    pers.virt[k]--; pers.pontos++; d[k] = Math.max(0, (d[k] || 0) - 1);
    if ((naFicha[k] || 0) > 0) naFicha[k]--;
    C.recalcular();
    P.hp = Math.min(P.hp, P.D.maxHp); P.sta = Math.min(P.sta, P.D.maxSta); P.fe = Math.min(P.fe, P.D.maxFe);
  };
  // um sacrifício: o peregrino volta n níveis e perde os pontos de virtude que vieram com eles
  C.perderNiveis = function (n) {
    const pers = P.pers; if (!pers) return 0;
    const alvo = Math.max(1, pers.nivel - n), perdidos = pers.nivel - alvo;
    pers.nivel = alvo; pers.xp = 0;
    let pts = perdidos * 2;
    const livres = Math.min(pers.pontos || 0, pts); pers.pontos -= livres; pts -= livres;
    const d = distrib();
    while (pts > 0) {
      const k = Object.keys(d).filter(v => d[v] > 0).sort((a, b) => d[b] - d[a])[0];
      if (!k) break;
      d[k]--; pers.virt[k] = Math.max(1, pers.virt[k] - 1); pts--;
    }
    C.recalcular();
    P.hp = Math.min(P.hp, P.D.maxHp); P.sta = Math.min(P.sta, P.D.maxSta); P.fe = Math.min(P.fe, P.D.maxFe);
    return perdidos;
  };
  C.acenderExame = function () {
    if (exame || !OV.itens || !OV.itens.qtd('exame')) return;
    OV.itens.tirar('exame'); exame = true; A.bell(440, 0.16);
    ui.toast('A vela do exame de consciência está acesa. Você pode redistribuir as virtudes.');
    if (OV.jogo) OV.jogo.salvar();
  };

  /* ---- atualização por quadro ---- */
  C.update = function (dt) {
    updateProjs(dt); updateEfeitos(dt);
    if (OV.itens) OV.itens.update(dt);
    if (OV.habilidades) OV.habilidades.update(dt);
    if (P.dead) return;
    if (C.flag('reliquia_guardada')) P.fe = Math.min(P.D.maxFe, P.fe + dt);
    for (const k in P.status) { P.status[k] -= dt; if (P.status[k] <= 0) delete P.status[k]; }
    for (const k in P.cd) P.cd[k] = Math.max(0, P.cd[k] - dt);
    P.invuln = Math.max(0, P.invuln - dt); P.prayLock = Math.max(0, P.prayLock - dt);
    P.castT = Math.max(0, P.castT - dt); P.parryT = Math.max(0, P.parryT - dt); P.signT = Math.max(0, P.signT - dt);
    P.parryFlash = Math.max(0, P.parryFlash - dt); P.flash = Math.max(0, P.flash - dt);
    if (P.alvo && (P.alvo.state === 'dead' || distTo(P.alvo) > 24)) P.alvo = null;

    if (P.oratT > 0) { P.oratT -= dt; if (P.oratT <= 0) { P.oratT = 0; OV.jogo.oratorioConcluido(); } }

    const keys = OV.input.keys;
    const dir = inputDir(); if ((OV.aventura && OV.aventura.travado()) || (OV.ajustes && OV.ajustes.travado()) || P.travado) dir.set(0, 0, 0); // durante uma entrega, o peregrino só olha
    const moving = dir.lengthSq() > 0;
    const wantPray = keys.KeyR && P.dodgeT <= 0 && P.atkT <= 0 && P.castT <= 0 && P.prayLock <= 0 && P.oratT <= 0;
    if (wantPray) {
      if (P.status.soberba) { P.praying = false; ui.toast('A Soberba impede a oração.'); }
      else if (!P.praying) { P.praying = true; P.prayT = 0; }
    } else { P.praying = false; P.prayT = 0; }
    if (P.praying) {
      const Hm = HB();
      P.prayT += dt; P.fe = Math.min(P.D.maxFe, P.fe + P.D.prayFe * dt * (Hm ? Hm.multPrayFe() : 1) * (OV.itens ? OV.itens.mod('prayFe') : 1)); P.hp = Math.min(P.D.maxHp, P.hp + P.D.prayHp * dt * (Hm ? Hm.multPrayHp() : 1));
      if (P.prayT >= (Hm && Hm.tem('confessionario') ? 1 : 2) && (P.status.ira || P.status.preguica || P.status.gula || P.status.luxuria)) {
        const n = []; if (P.status.ira) { delete P.status.ira; n.push('a Mansidão'); } if (P.status.preguica) { delete P.status.preguica; n.push('a Diligência'); } if (P.status.gula) { delete P.status.gula; n.push('a Temperança'); } if (P.status.luxuria) { delete P.status.luxuria; n.push('a Castidade'); }
        ui.toast('A oração restaurou ' + n.join(' e ') + '.'); A.bell(523, 0.12);
      }
    }

    let speed = 4.6, sprinting = false;
    if (P.status.preguica) speed *= 0.5;
    if (C.flag('concha')) speed *= 1.1;
    if (HB()) speed *= HB().multVel();
    if (OV.itens) speed *= OV.itens.mod('vel');
    if (OV.biblicas && OV.biblicas.velMontaria) speed *= OV.biblicas.velMontaria();
    if (P.status.gula) P.sta = Math.max(0, P.sta - 4 * dt);
    // correr gasta fôlego (3 por segundo); com o fôlego no fim, o peregrino volta a andar até recuperar um pouco
    if (P.sta <= 0.5) P.semFolego = true; else if (P.semFolego && P.sta > 15) P.semFolego = false;
    P.correndo = !!((keys.ShiftLeft || keys.ShiftRight) || P.autoCorrer) && moving && !P.praying && P.atkT <= 0 && !P.semFolego;
    if (P.correndo) P.sta = Math.max(0, P.sta - 3 * dt);
    if (P.correndo) { speed *= 1.75; sprinting = true; }
    P.naAgua = M.naAgua ? M.naAgua(P.pos.x, P.pos.z) : false;
    if (P.naAgua) speed *= 0.62;
    const enraizado = P.praying || P.castT > 0.25 || P.oratT > 0 || P.signT > 0.2;
    if (P.dodgeT > 0) { P.dodgeT -= dt; P.pos.addScaledVector(P.dodgeDir, 13 * dt * (P.status.preguica ? 0.6 : 1)); }
    else if (!enraizado && moving) {
      P.pos.addScaledVector(dir, (P.atkT > 0 ? speed * 0.3 : speed) * dt);
      if (P.atkT <= 0 && !P.alvo) P.facing = turnTo(P.facing, Math.atan2(dir.x, dir.z), 12 * dt);
    }
    if (P.alvo && P.dodgeT <= 0 && P.oratT <= 0) P.facing = turnTo(P.facing, angTo(P.alvo), 10 * dt);
    P.moveAmt = lerp(P.moveAmt, (moving && !enraizado && P.dodgeT <= 0) ? (sprinting ? 1.4 : 1) : 0, 1 - Math.exp(-10 * dt));

    if (P.atkT > 0) {
      P.atkT -= dt; const p = 1 - P.atkT / P.atkDur;
      const hitAt = P.atkPesado ? 0.55 : 0.45;
      if (!P.arma.projetil && p > 0.3 && p < 0.65) { P.pos.x += Math.sin(P.facing) * 2.2 * dt; P.pos.z += Math.cos(P.facing) * 2.2 * dt; }
      if (!P.atkHit && p >= hitAt) {
        P.atkHit = true;
        if (P.arma.projetil) {
          lancarProjetil(P.atkPesado);
          if (HB() && HB().multiProjetil()) { lancarProjetil(P.atkPesado, 0.22); lancarProjetil(P.atkPesado, -0.22); }
        } else {
          const W = P.arma, alcance = W.alcance * (P.atkPesado ? 1.1 : 1) * (HB() ? HB().multAlcance() : 1);
          vivos().forEach(e => {
            const d = distTo(e);
            if (d < alcance && Math.abs(angWrap(angTo(e) - P.facing)) < W.arco && !M.paredeEntre(P.pos.x, P.pos.z, e.g.position.x, e.g.position.z)) C.danoInimigo(e, Math.round(P.D.dano * (P.atkPesado ? 1.8 : 1)), P.atkPesado ? 7 : 4.5, angTo(e), { pesado: P.atkPesado, jogador: true });
          });
        }
      }
    }
    if (P.atkT <= 0 && P.dodgeT <= 0 && !P.correndo && !P.status.ira && !P.status.gula) P.sta = Math.min(P.D.maxSta, P.sta + P.D.staRegen * dt * (HB() ? HB().multSta() : 1));
    M.collide(P.pos, 0.45);
    P.pos.y = M.altura(P.pos.x, P.pos.z);
  };

  /* ---- animação ---- */
  // Q = quem se anima: o próprio peregrino, ou (no co-op) o colega, com o mesmo estado vindo pela rede
  C.animarHeroi = function (dt, preview, Q) {
    Q = Q || P;
    const H = Q.heroi; if (!H) return;
    const k = 1 - Math.exp(-14 * dt);
    H.g.position.copy(Q.pos); if (!preview) H.g.rotation.y = Q.facing;
    // a marcha segue a distância realmente andada: passos curtos ao andar, largos e altos ao correr
    const AN = OV.andar, mc = H.marcha;
    let dist = 0;
    if (H.ult && !preview) dist = Math.hypot(Q.pos.x - H.ult.x, Q.pos.z - H.ult.z);
    H.ult = { x: Q.pos.x, z: Q.pos.z };
    if (Q.dodgeT > 0 || Q.dead || Q.praying || Q.oratT > 0) dist = 0;
    AN.ciclo(mc, dist, dt, Q.correndo ? 1.25 : 0.74, 4.6);
    const r = AN.alvos(mc.ph, mc.amp, { A: 0.44, K: 0.82 });
    Q.walkPh = mc.ph;
    const dom = !!(Q.arma && Q.arma.projetil);
    let armLx = dom ? -0.75 : -0.12 + r.braco * 0.9, armLz = 0, armRx = -0.25 - r.braco * (dom ? 0.6 : 0.45), armRz = 0;
    if (r.corrida > 0 && !dom) armLx -= 0.35 * r.corrida;
    let bodyY = r.bob + (mc.amp < 0.2 ? Math.sin(performance.now() / 700) * 0.012 : 0), tilt = r.lean, sway = r.sway;
    if (Q.atkT > 0 && !preview) {
      const p = 1 - Q.atkT / Q.atkDur;
      if (dom) {
        armRx = p < 0.4 ? lerp(-0.25, 0.4, p / 0.4) : p < 0.55 ? lerp(0.4, -1.55, (p - 0.4) / 0.15) : lerp(-1.55, -0.25, (p - 0.55) / 0.45);
      } else {
        const w = Q.atkPesado ? 0.5 : 0.35, s = Q.atkPesado ? 0.65 : 0.55;
        armRx = p < w ? lerp(-0.25, -2.9, p / w) : p < s ? lerp(-2.9, -0.35, (p - w) / (s - w)) : lerp(-0.35, -0.25, (p - s) / (1 - s));
        tilt = p > w && p < s + 0.05 ? (Q.atkPesado ? 0.3 : 0.18) : tilt;
      }
      // parado, o golpe vem com um passo à frente
      if (mc.amp < 0.3) { const q = Math.sin(Math.min(1, p * 1.6) * Math.PI) * (Q.atkPesado ? 1 : 0.6); r.hL = -0.45 * q; r.kL = 0.35 * q; r.fL = 0.1 * q; r.hR = 0.35 * q; r.kR = 0.2 * q; r.fR = -0.4 * q; bodyY -= 0.05 * q; }
    }
    // levando alguma coisa: a mão esquerda segura à frente; as cargas grandes vão nos dois braços
    if (!Q.carga && Q.velaMao && !Q.dead) { armLx = -0.72; armLz = -0.28; }
    if (Q.carga && !Q.dead) { const q = Q.carga.pose || {}; armLx = q.lx !== undefined ? q.lx : -0.95; armLz = q.lz !== undefined ? q.lz : 0.18; if (q.rx !== undefined && Q.atkT <= 0) { armRx = q.rx; armRz = q.rz || 0; } }
    if (Q.signT > 0) { armRx = -2.2; armRz = -0.25; }
    if (Q.castT > 0) {
      if (Q.castKind === 'ave') { armLx = -1.25; armLz = 0.42; armRx = -1.25; armRz = -0.42; }
      else { armRx = -2.9; armLx = -2.6; }
    }
    if (Q.dodgeT > 0) { tilt = 0.45; bodyY = -0.25; r.hL = -1.0; r.kL = 1.6; r.fL = 0; r.hR = -0.6; r.kR = 1.4; r.fR = 0; sway = 0; }
    // de joelhos: uma perna à frente, o outro joelho no chão
    if (Q.praying || Q.oratT > 0) { bodyY = -0.45; r.hL = -1.45; r.kL = 1.45; r.fL = 0; r.hR = 0.1; r.kR = 1.5; r.fR = -0.5; tilt = 0; sway = 0; armLx = -1.25; armLz = 0.42; armRx = -1.25; armRz = -0.42; }
    if (Q.dead) { tilt = 1.45; bodyY = -0.6; r.hL = r.hR = r.kL = r.kR = r.fL = r.fR = 0; sway = 0; }
    AN.aplicar(H.pernas, r, Q.praying || Q.oratT > 0 || Q.dodgeT > 0 ? k : 1 - Math.exp(-30 * dt));
    H.armL.rotation.x = lerp(H.armL.rotation.x, armLx, k); H.armL.rotation.z = lerp(H.armL.rotation.z, armLz, k);
    H.armR.rotation.x = lerp(H.armR.rotation.x, armRx, Q.atkT > 0 ? 1 - Math.exp(-40 * dt) : k); H.armR.rotation.z = lerp(H.armR.rotation.z, armRz, k);
    H.body.position.y = lerp(H.body.position.y, bodyY, 1 - Math.exp(-20 * dt));
    H.body.rotation.z = lerp(H.body.rotation.z, sway, k);
    H.body.rotation.x = lerp(H.body.rotation.x, tilt, Q.dead ? 1 - Math.exp(-3 * dt) : k);
    const haloAlvo = Q.praying ? Math.min(1, Q.prayT / 1.2) : Q.oratT > 0 ? 1 : 0;
    H.halo.material.opacity = lerp(H.halo.material.opacity, haloAlvo, 1 - Math.exp(-6 * dt)); H.halo.rotation.z += dt;
    const crossOp = Q.parryFlash > 0 ? Math.min(1, Q.parryFlash / 0.3) : Q.signT > 0 ? (Q.signT / 0.45) * 0.7 : 0;
    H.crossMat.opacity = crossOp; H.cross.scale.setScalar(Q.parryFlash > 0 ? 1.4 : 1);
    if (H.orb) H.orb.scale.setScalar(1 + Math.sin(performance.now() / 180) * 0.12);
    const fl = Q.flash > 0; H.mats.forEach(m => m.emissive.setRGB(fl ? 0.6 : 0, 0, 0));
  };
})(window.OV);
