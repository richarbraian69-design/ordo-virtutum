/* Ordo Virtutum — ajustes do mundo:
   · os vícios que vagam ficam longe das casas, das igrejas e do centro das vilas;
   · à noite (e debaixo da terra) o peregrino leva uma vela acesa na mão;
   · ninguém atravessa o Rio Lento a nado: só pelas pontes, ou no barco de Simeão, o barqueiro. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const P = OV.P, ui = OV.ui, A = OV.audio, I = OV.inimigos;
  const mesh = OV.mesh, sm = OV.sm, H = (x, z) => M.altura(x, z);
  const AJ = {}; OV.ajustes = AJ;

  /* ---- onde os vícios podem vagar ---- */
  AJ.pertoDeCasa = (x, z, m) => (M.RECTS || []).some(([rx, rz, w, d, rot]) => {
    if (Math.abs(x - rx) > w + d + m || Math.abs(z - rz) > w + d + m) return false;
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0), dx = x - rx, dz = z - rz, lx = dx * c - dz * s, lz = dx * s + dz * c;
    return Math.abs(lx) < w / 2 + m && Math.abs(lz) < d / 2 + m;
  });
  AJ.lugarDeVicio = (x, z) => !(I && I.distVila && I.distVila(x, z) < 52) && !AJ.pertoDeCasa(x, z, 12);
  addEventListener('DOMContentLoaded', () => {
    if (!M.spawnsMundo) return;
    const antes = M.spawnsMundo.length;
    const fica = M.spawnsMundo.filter(([t, x, z]) => AJ.lugarDeVicio(x, z));
    M.spawnsMundo.length = 0; fica.forEach(s => M.spawnsMundo.push(s));
    AJ.removidos = antes - fica.length;
  });

  /* ---- a vela na mão ---- */
  const vela = new THREE.Group();
  vela.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 8), sm(0xf2e6c8), 0, 0.12, 0));
  vela.add(mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.04, 10), sm(0x8a6a3a, { metalness: 0.5, roughness: 0.5 }), 0, -0.04, 0));
  const chamaV = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 })); chamaV.position.y = 0.33; vela.add(chamaV);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd890, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.y = 0.33; vela.add(halo);
  vela.position.set(0, -0.86, 0.1); vela.visible = false;
  const luz = new THREE.PointLight(0xffb35a, 0, 11, 2); M.scene.add(luz);
  const tmp = new THREE.Vector3();
  AJ.vela = vela;
  M.animados.push((dt, t) => {
    const J = OV.jogo, h = P.heroi;
    const jogo = J && J.modo === 'jogo' && h && !P.dead;
    // a vela acende ao entardecer (17h) e só se apaga de manhã; debaixo da terra, sempre
    const escuro = jogo && ((OV.tempo && (OV.tempo.hora >= 17 || OV.tempo.hora < 6)) || P.pos.x > 200);
    const naMao = escuro && !P.carga;
    if (h && vela.parent !== h.armL) { if (vela.parent) vela.parent.remove(vela); h.armL.add(vela); }
    vela.visible = !!naMao; P.velaMao = !!naMao;
    if (escuro) {
      const fl = 1 + Math.sin(t * 13) * 0.06 + Math.sin(t * 29 + 1) * 0.04;
      if (naMao) { chamaV.getWorldPosition(tmp); chamaV.scale.set(1, fl, 1); } else tmp.set(P.pos.x, P.pos.y + 1.6, P.pos.z);
      luz.position.copy(tmp); luz.position.y += 0.15; luz.intensity = (naMao ? 1.5 : 0.9) * fl;
    } else luz.intensity = 0;
  });

  /* ---- o Rio Lento: ninguém atravessa a nado ---- */
  const RIO = 3.3;
  const naAguaFunda = (x, z) => x < 200 && z < 400 && Math.abs(z) < 232 && !(M.regiaoEm && M.regiaoEm(x, z)) && !M.naPonte(x, z);
  const collide0 = M.collide;
  M.collide = function (p, r) {
    collide0(p, r);
    if (r > 0.08 && naAguaFunda(p.x, p.z) && !AJ.navegando) {
      const rx = M.rioX(p.z), d = p.x - rx, lim = RIO + r;
      if (Math.abs(d) < lim) p.x = rx + (d >= 0 ? lim : -lim);
    }
  };

  /* ---- o barqueiro do Rio Lento ---- */
  const ZB = 20, XR = M.rioX(ZB), MARGEM = { o: { x: XR - 6.2, z: ZB }, l: { x: XR + 6.2, z: ZB } };
  function cais(x, z, rot) {
    const g = M.grupo(x, z, rot);
    for (let i = 0; i < 4; i++) g.add(mesh(new THREE.BoxGeometry(1.6, 0.1, 0.42), M.MAT.woodL, 0, 0.32, -0.6 + i * 0.44));
    [-0.7, 0.7].forEach(s => [-0.7, 0.7].forEach(k => g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.1, 6), M.MAT.wood, s, 0, k))));
    if (OV.cenario) OV.cenario.fundir(g);
  }
  function modeloBarco() {
    const g = new THREE.Group(), mad = sm(0x5a3a22), madC = sm(0x7a5434);
    const casco = mesh(new THREE.BoxGeometry(1.5, 0.45, 3.6), mad, 0, 0.2, 0); g.add(casco);
    [-1, 1].forEach(s => { g.add(mesh(new THREE.BoxGeometry(0.1, 0.35, 3.6), madC, s * 0.75, 0.5, 0)); });
    const proa = mesh(new THREE.ConeGeometry(0.75, 1.1, 4), mad, 0, 0.25, 2.3); proa.rotation.x = Math.PI / 2; proa.rotation.y = Math.PI / 4; proa.scale.set(1, 1, 0.45); g.add(proa);
    g.add(mesh(new THREE.BoxGeometry(1.4, 0.08, 0.3), madC, 0, 0.5, -0.6));
    const remo = mesh(new THREE.BoxGeometry(0.06, 0.06, 2.6), madC, 0.9, 0.7, 0.2); remo.rotation.y = 0.4; remo.rotation.x = 0.4; g.add(remo);
    return g;
  }
  AJ.modeloBarco = modeloBarco;
  cais(MARGEM.o.x - 0.6, ZB, Math.PI / 2); cais(MARGEM.l.x + 0.6, ZB, -Math.PI / 2);
  const barco = modeloBarco(); M.scene.add(barco);
  let ladoBarco = 'o';
  const pousar = lado => { const x = lado === 'o' ? XR - 3.4 : XR + 3.4; barco.position.set(x, -0.55, ZB); barco.rotation.y = Math.PI / 2; };
  pousar('o');
  if (M.criarFigura) M.criarFigura(MARGEM.o.x - 1.2, ZB - 1.8, Math.PI / 2, { id: 'barqueiro', nome: 'Simeão, o barqueiro', cor: 0x3a3a2a, cabelo: 0x8a8070,
    fala: () => 'O rio está fundo e frio. Nadar, só os peixes. Quer atravessar? É de graça: o caminho de Deus não se cobra.' });
  let travessia = null;
  AJ.navegando = false;
  // v26: o barco leva o grupo inteiro: quem está no cais embarca junto (cada um num banco)
  AJ.aoTravessia = null;
  function atravessar(de, lugar, doColega) {
    if (travessia) return;
    const para = de === 'o' ? 'l' : 'o', x0 = de === 'o' ? XR - 3.4 : XR + 3.4, x1 = para === 'o' ? XR - 3.4 : XR + 3.4;
    if (OV.biblicas && OV.biblicas.desmontar) OV.biblicas.desmontar();
    pousar(de); AJ.navegando = true;
    travessia = { t: 0, dur: 4.2, x0, x1, para, off: lugar || 0 };
    if (!doColega && AJ.aoTravessia) AJ.aoTravessia(de);
    if (OV.cenas) OV.cenas.iniciar({ alvo: () => new THREE.Vector3(barco.position.x, 0.6, ZB), raio: 9, altura: 4, giro: 0.12, olhar: 0.8, barco: true });
    if (A.bell) A.bell(392, 0.06);
  }
  M.animados.push(dt => {
    if (!travessia) return;
    const tr = travessia; tr.t += dt;
    const k = Math.min(1, tr.t / tr.dur), e = k * k * (3 - 2 * k);
    barco.position.x = tr.x0 + (tr.x1 - tr.x0) * e; barco.position.y = -0.55 + Math.sin(tr.t * 2.2) * 0.04; barco.rotation.z = Math.sin(tr.t * 1.7) * 0.03;
    if (OV.combate) OV.combate.posicionar(barco.position.x + tr.off, ZB + 0.6 - Math.abs(tr.off) * 0.5, tr.x1 > tr.x0 ? Math.PI / 2 : -Math.PI / 2);
    P.pos.y = barco.position.y + 0.5; if (P.heroi) P.heroi.g.position.y = P.pos.y;
    P.invuln = Math.max(P.invuln || 0, 0.3);
    if (k >= 1) {
      const m = MARGEM[tr.para]; travessia = null; AJ.navegando = false; ladoBarco = tr.para;
      if (OV.combate) OV.combate.posicionar(m.x, m.z + tr.off, tr.para === 'l' ? Math.PI / 2 : -Math.PI / 2);
      if (OV.cenas && OV.cenas.ativa && OV.cenas.ativa.barco) OV.cenas.encerrar();
      if (OV.jogo) OV.jogo.mudouLugar();
    }
  });
  AJ.travado = () => !!travessia;
  const caisO = M.interativo(MARGEM.o.x, ZB, 2.2, () => travessia ? null : 'Atravessar o rio no barco de Simeão', () => { if (ladoBarco !== 'o') pousar('o'); atravessar('o'); });
  const caisL = M.interativo(MARGEM.l.x, ZB, 2.2, () => travessia ? null : 'Atravessar o rio de volta', () => { if (ladoBarco !== 'l') pousar('l'); atravessar('l'); });
  if (caisO) caisO.pessoal = true; if (caisL) caisL.pessoal = true; // no co-op, o convidado também chama o barco
  // um colega embarcou: quem está perto do mesmo cais vai junto
  AJ.colegaAtravessou = function (de, lugar) {
    const P = OV.P, m = MARGEM[de]; if (!m || travessia || P.dead || Math.hypot(P.pos.x - m.x, P.pos.z - m.z) > 25) return false;
    if (OV.ui) OV.ui.toast('Você embarca junto no barco de Simeão.');
    atravessar(de, lugar, true); return true;
  };
})(window.OV);
