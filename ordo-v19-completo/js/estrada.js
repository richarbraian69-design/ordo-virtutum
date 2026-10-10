/* Ordo Virtutum — «A Portaria do Mosteiro»: a missão principal entre a chegada ao vale e o Claustro Tomado.
   Antes do primeiro chefão, o peregrino enfrenta vícios comuns na portaria da estrada de pedras,
   liberta um leigo possesso e ouve do Irmão Porteiro o que espera no claustro. */
(function (OV) {
  'use strict';
  const M = OV.mundo, MS = OV.missoes; if (!M || M.falhou || !MS) return;
  const I = OV.inimigos, ui = OV.ui, D = OV.dialogo, P = OV.P, A = OV.audio;
  const mesh = OV.mesh, sm = OV.sm, H = (x, z) => M.altura(x, z);
  const prog = () => OV.jogo && OV.jogo.prog;
  const F = () => (prog() && prog().flags) || {};
  const st = id => prog() && prog().missoes && prog().missoes[id];
  const g = (m, f) => (P.pers && P.pers.sexo === 'f') ? f : m;

  const PORTARIA = { x: 0, z: 44 };
  const TAG = 'portaria';

  /* ---- a portaria: um arco de pedra sobre a estrada, com telhado, sino pequeno e um banco ---- */
  {
    const gr = M.grupo(PORTARIA.x, PORTARIA.z, 0), pedra = M.MAT.rock, mad = M.MAT.wood;
    [-1, 1].forEach(s => {
      gr.add(mesh(new THREE.BoxGeometry(1.1, 3.6, 1.4), pedra, s * 3.1, 1.8, 0));
      gr.add(mesh(new THREE.BoxGeometry(1.4, 0.3, 1.7), pedra, s * 3.1, 3.75, 0));
      M.obstacles.push({ x: PORTARIA.x + s * 3.1, z: PORTARIA.z, r: 0.9 });
    });
    gr.add(mesh(new THREE.BoxGeometry(7.6, 0.6, 1.8), pedra, 0, 4.1, 0));
    const tl = mesh(new THREE.ConeGeometry(4.6, 1.5, 4), M.MAT.roofTile || mad, 0, 5.15, 0); tl.rotation.y = Math.PI / 4; tl.scale.set(1, 1, 0.42); gr.add(tl);
    // o sininho da portaria, calado como os outros
    gr.add(mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), mad, 0, 3.55, 0));
    const sino = mesh(new THREE.CylinderGeometry(0.16, 0.3, 0.42, 10), sm(0xa87722, { metalness: 0.6, roughness: 0.4 }), 0, 3.1, 0); gr.add(sino);
    // o banco do porteiro e uma carroça tombada
    gr.add(mesh(new THREE.BoxGeometry(1.8, 0.12, 0.5), M.MAT.woodL, 5.2, 0.5, 1.6)); [-0.7, 0.7].forEach(s => gr.add(mesh(new THREE.BoxGeometry(0.12, 0.5, 0.4), mad, 5.2 + s, 0.25, 1.6)));
    const car = mesh(new THREE.BoxGeometry(1.6, 0.5, 2.4), mad, -5.6, 0.5, -2.2); car.rotation.z = 0.9; gr.add(car);
    const roda = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 12), mad, -4.6, 0.55, -3.4); roda.rotation.z = Math.PI / 2; gr.add(roda);
    if (OV.cenario) OV.cenario.fundir(gr);
    M.obstacles.push({ x: PORTARIA.x - 5.6, z: PORTARIA.z - 2.2, r: 1.3 });
    M.emissor(PORTARIA.x + 2.4, H(PORTARIA.x, PORTARIA.z) + 3.2, PORTARIA.z + 0.9, 0.6, 7, 0xd9822e);
    if (M.LOCAIS) M.LOCAIS.portaria = { nome: 'Portaria do Mosteiro', x: PORTARIA.x, z: PORTARIA.z, oy: -12 };
  }
  // o Irmão Porteiro, que se escondeu atrás do arco
  if (M.criarFigura) M.criarFigura(PORTARIA.x + 4.6, PORTARIA.z + 2.4, -Math.PI * 0.6, { id: 'porteiro', nome: 'Irmão Bernardo, o porteiro', cor: 0x2a2220, capuz: true,
    fala: 'Paz e bem. A portaria está livre, graças a Deus e a você.' });

  /* ---- a missão ---- */
  const vivoDe = e => e && !e.removed && e.state !== 'dead' && e.state !== 'liberto';
  MS.MIS.m1b = { nome: 'A Portaria do Mosteiro', tipo: 'p', xp: 90,
    etapas: ['Vá à portaria do mosteiro, na estrada de pedras ao norte da vila: o Irmão Porteiro pediu socorro.',
      () => `Vença os vícios que cercam a portaria (${Math.max(0, I.porTag(TAG).filter(vivoDe).length)} restantes). O homem possesso não é inimigo: liberte-o.`,
      'Fale com o Irmão Porteiro.'],
    alvos: [() => PORTARIA, () => PORTARIA, () => { const f = M.figuras.porteiro; return f ? { x: f.x, z: f.z } : PORTARIA; }] };
  if (OV.historia && OV.historia.CARTAS) OV.historia.CARTAS.m1b = ['Bilhete do Irmão Bernardo, o porteiro', 'Quem ler isto, pelo amor de Deus: os vícios desceram do mosteiro e cercaram a portaria. Um dos nossos leigos está possesso e não me reconhece. Estou escondido atrás do arco. Não suba ao claustro sem antes passar por aqui.'];

  // quem chegou da vila vai primeiro à portaria (as gravações antigas, já no claustro, seguem como estavam)
  MS.irParaPortaria = function () { if (!st('m1b') && !st('m2')) MS.iniciar('m1b'); else if (MS.feita('m1b') && !st('m2')) MS.iniciar('m2'); };

  function spawnGrupo() {
    MS.tagRemove(TAG);
    if (!MS.ativa('m1b') || MS.etapa('m1b') >= 2) return;
    const y = (x, z) => ({ x: PORTARIA.x + x, z: PORTARIA.z + z });
    [['larva', 2, -4, -6], ['larva', 2, 5, -7], ['diabrete', 2, -6, 4], ['diabrete', 3, 6, 5], ['possesso', 3, 0, -9]].forEach(([t, nivel, dx, dz]) => {
      const e = I.spawn(t, false, y(dx, dz), { nivel }); e.tag = TAG; e.mundo = false;
      if (t === 'possesso') { e.sumir = true; if (e.lab && e.lab.el.firstChild) e.lab.el.firstChild.textContent = 'Leigo Anselmo, possesso'; }
    });
  }
  MS.ganchos.spawn.push(spawnGrupo);
  let checarT = 0, grupoVisto = false;
  MS.ganchos.update.push(dt => {
    if (!MS.ativa('m1b')) return;
    checarT -= dt; if (checarT > 0) return; checarT = 0.4;
    const e = MS.etapa('m1b'), d = Math.hypot(P.pos.x - PORTARIA.x, P.pos.z - PORTARIA.z);
    if (e === 0 && d < 22) {
      MS.avancar('m1b', 1);
      if (!I.porTag(TAG).some(vivoDe)) spawnGrupo();
      D.falas([['Anjo da Guarda', 'São vícios pequenos: larvas do tédio e diabretes. Use o Sinal da Cruz (Q) quando eles erguerem o braço, e reze (segure R) longe da luta para recuperar a Fé.'],
        ['Anjo da Guarda', 'Aquele homem não é um vício: é um irmão possesso. Vença-o sem medo; quando ele cair, ficará livre.']]);
    }
    if (MS.etapa('m1b') === 1) {
      const grupo = I.porTag(TAG);
      if (grupo.length) grupoVisto = true;
      if (grupoVisto && !grupo.some(vivoDe)) { MS.avancar('m1b', 2); grupoVisto = false; setTimeout(() => ui.toast('A portaria está livre. Fale com o Irmão Porteiro, atrás do arco.'), 1200); if (A.bell) A.bell(523, 0.12); }
    }
  });
  MS.ARV.porteiro = function () {
    const q = 'Irmão Bernardo, o porteiro';
    if (MS.ativa('m1b') && MS.etapa('m1b') < 2) return { inicio: 'a', nos: { a: { quem: q, txt: 'Psiu! Eles ainda estão aí. Enquanto houver vícios na estrada, eu não saio daqui de trás.' } } };
    if (MS.ativa('m1b')) return { inicio: 'a', nos: {
      a: { quem: q, txt: () => `Deus seja louvado! Pensei que ninguém viria. Eu sou Bernardo, porteiro de Santa Sabina há trinta anos. E o leigo Anselmo, que você libertou, cuidava da horta.`, prox: 'b' },
      b: { quem: q, txt: 'Lá em cima é pior. No claustro estão a Ira e a Preguiça, vícios grandes, e um terceiro que ainda não mostrou o rosto: os irmãos o chamam de Arauto da Soberba. E o Irmão Afonso está possesso, perdido na ira.', prox: 'c' },
      c: { quem: q, txt: () => `Não suba sem estar pronto, ${g('filho', 'filha')}. Fique de olho no braço deles: quando sobe, é a hora do Sinal da Cruz. E se a vida faltar, recue, reze e volte. Tome a chave da porta do claustro.`, opc: [
        { t: 'Vou ao claustro.', ir: 'd' }, { t: 'Quem é o Arauto da Soberba?', ir: 'e' }] },
      d: { quem: q, txt: 'Vá com Deus. Eu fico aqui guardando a estrada, como sempre fiz.', ef: concluir },
      e: { quem: q, txt: 'Dizem que é um servo de um príncipe maior, que manda no tédio deste vale. Ele espera que a Ira e a Preguiça caiam para aparecer. Mais do que isso, só o Padre Tomé saberia.', prox: 'd' }
    } };
    if (MS.ativa('m2')) return { inicio: 'a', nos: { a: { quem: q, txt: 'O claustro fica logo adiante, depois do mosteiro. Lembre: quando o braço sobe, o Sinal da Cruz.' } } };
    return { inicio: 'a', nos: { a: { quem: q, txt: 'Paz e bem. A portaria está livre, graças a Deus e a você.' } } };
  };
  function concluir() {
    if (MS.feita('m1b')) return;
    F().chave_claustro = true;
    MS.concluir('m1b');
    setTimeout(() => { MS.iniciar('m2'); ui.toast('Recebido: a chave do claustro.'); }, 1500);
  }
  if (OV.vida && OV.vida.SINAL) { const s0 = OV.vida.SINAL.porteiro; OV.vida.SINAL.porteiro = () => (MS.ativa('m1b') && MS.etapa('m1b') === 2) ? '!' : (s0 ? s0() : null); }
  // o Padre Tomé manda primeiro à portaria
  const tome0 = MS.ARV.tome;
  MS.ARV.tome = function () {
    if (MS.ativa('m1b')) return { inicio: 'a', nos: { a: { quem: 'Padre Tomé', txt: 'O Irmão Bernardo, porteiro do mosteiro, mandou um bilhete pedindo socorro. A portaria fica na estrada de pedras, ao norte. Vá primeiro até lá.' } } };
    return tome0 ? tome0() : null;
  };
  if (OV.aventura && OV.aventura.ligarNpcs) OV.aventura.ligarNpcs();
})(window.OV);
