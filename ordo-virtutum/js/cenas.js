/* Ordo Virtutum — cenas: a câmera deixa o herói e mostra o acontecimento (a roda que volta a girar, os sinos,
   o cofre, o espelho), com faixas de cinema; e, antes de cada chefão, o demônio declama um poema do seu vício.
   As falas correm pela caixa de diálogo (cada estrofe é uma fala), e a câmera gira devagar em volta do que importa. */
(function (OV) {
  'use strict';
  const M = OV.mundo, D = OV.dialogo; if (!M || M.falhou || !D) return;
  const CE = { ativa: null }; OV.cenas = CE;
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const pos = a => typeof a === 'function' ? a() : a;
  const corpo = document.body;

  /* cfg: { alvo: Vector3|fn, raio, altura, giro (rad/s), olhar (altura extra do ponto olhado), alvos: [por fala], anim(dt, t) } */
  CE.iniciar = function (cfg) {
    const P = OV.P, a0 = pos(cfg.alvo);
    const ang0 = cfg.ang0 !== undefined ? cfg.ang0 : Math.atan2(P.pos.x - a0.x, P.pos.z - a0.z) + 0.35;
    CE.ativa = Object.assign({ raio: 7, altura: 3, giro: 0.12, olhar: 1.4, t: 0, ang: ang0, cam: new THREE.Vector3(), alvoAtual: a0.clone() }, cfg);
    corpo.classList.add('cinema');
    if (OV.jogo) OV.jogo.cortarCam = false;
  };
  CE.encerrar = function () {
    if (!CE.ativa) return;
    corpo.classList.remove('cinema');
    if (CE.ativa.fim) CE.ativa.fim();
    CE.ativa = null;
    if (OV.jogo) OV.jogo.cortarCam = true;
  };
  // chamado pela câmera do jogo a cada quadro; devolve true se a cena manda na câmera
  CE.camera = function (camera, dt) {
    const c = CE.ativa; if (!c) return false;
    c.t += dt; c.ang += c.giro * dt;
    let alvo = pos(c.alvo), raio = c.raio, altura = c.altura, olhar = c.olhar;
    const no = D.no;
    if (c.alvos && no && no.idx !== undefined && c.alvos[no.idx]) { const k = c.alvos[no.idx]; alvo = pos(k.alvo || alvo); if (k.raio) raio = k.raio; if (k.altura) altura = k.altura; if (k.olhar !== undefined) olhar = k.olhar; }
    c.alvoAtual.lerp(alvo, 1 - Math.exp(-2.5 * dt));
    const a = c.alvoAtual;
    const desejo = v3(a.x + Math.sin(c.ang) * raio, a.y + altura, a.z + Math.cos(c.ang) * raio);
    const chao = M.altura(desejo.x, desejo.z) + 0.8; if (desejo.y < chao) desejo.y = chao;
    if (c.t < dt * 1.5) camera.position.lerp(desejo, 0.35); else camera.position.lerp(desejo, 1 - Math.exp(-2.2 * dt));
    camera.lookAt(a.x, a.y + olhar, a.z);
    if (c.anim) c.anim(dt, c.t);
    return true;
  };
  // uma cena narrada: as falas correm e a câmera mostra o acontecimento
  CE.contar = function (linhas, cfg, depois) {
    CE.iniciar(cfg);
    D.falas(linhas, () => { CE.encerrar(); if (depois) depois(); });
  };

  /* ================= OS POEMAS DOS VÍCIOS ================= */
  const POEMAS = {
    ira: ['Ira', [
      'Arde! Que a ofensa não se esquece:\no fogo é justo quando é meu.\nQuem perdoa, enfraquece;\nquem fere primeiro, venceu.',
      'Fecha o punho, cospe a palavra,\ndeixa o rancor criar raiz:\nna terra que a raiva lavra\nsó nasce aquilo que eu quis.']],
    preguica: ['Preguiça', [
      'Por que lutar, se a tarde é mansa?\nDeita a espada: o sono é bom conselheiro.\nQuem nada faz, de nada se cansa,\ne a alma adormece, poço sem ribeiro.',
      'O sino calou, e ninguém o chora;\na oração espera: amanhã, depois...\nFica comigo, ainda não é hora.\nNunca é hora. E somos dois.']],
    soberba: ['Arauto da Soberba', [
      'Ajoelhai-vos, não diante do altar,\nmas do espelho onde eu brilho sozinho.\nQuem precisa de um Deus para adorar,\nse eu mesmo sou o meu caminho?',
      'Subi mais alto que os vitrais,\ncoroei-me com a minha glória.\nNão sirvo, não me curvo jamais:\ncaio, mas caio com a minha história.']],
    meiodia: ['Demônio do Meio-Dia', [
      'Ao meio-dia o sol para no céu,\ne a cela fica longa como um ano.\nO monge olha a porta, olha o véu,\ne cada salmo pesa como um dano.',
      'Vai embora, peregrino: é tarde, é cedo,\ntua vocação foi um engano bonito.\nEu sou o tédio, eu sou o medo\nde que o amor não seja infinito.']],
    senhor: ['Senhor do Banquete', [
      'Mais um prato, mais um copo, mais um dia!\nA fome é a única prece que eu ouço.\nEnche a boca, que a alma fica vazia,\ne o teu vazio, convidado, é o meu almoço.',
      'Não te levantes, a mesa é farta;\no pobre à porta pode esperar.\nCome, bebe, até que a carne se parta\ne não reste ninguém para sentar.']],
    mamom: ['Mamom, o Senhor dos Cofres', [
      'Conta comigo: um, dois, mil moedas,\ne o coração encolhe a cada ouro.\nFecha a mão, que a mão aberta é queda;\nquem dá, perde; quem guarda, tem tesouro.',
      'Cavei a terra até perder o céu,\ntranquei o pão, tranquei o irmão.\nTudo o que brilha é meu, é meu, é meu,\ne o meu é sempre menos que a mão.']],
    asmodeu: ['Asmodeu, o Senhor das Máscaras', [
      'Olha para mim; não, não nos olhos:\nolha a máscara, o brilho, a dança.\nO amor é longo; o desejo, um sopro\nque queima depressa e nada alcança.',
      'Promessas? Votos? Correntes antigas.\nAqui ninguém pertence a ninguém.\nDança comigo entre as cantigas,\naté esquecer o nome de alguém.']]
  };
  CE.POEMAS = POEMAS;
  const F = () => (OV.jogo && OV.jogo.prog ? OV.jogo.prog.flags : {});
  const modelos = {};
  // o demônio que declama: ou um vício que já está na cena (op.e), ou um modelo posto no lugar onde ele vai surgir (op.pos)
  CE.poema = function (key, op, depois) {
    op = op || {};
    const p = POEMAS[key];
    if (!p || F()['poema_' + key]) { if (depois) depois(); return; } // só na primeira vez
    F()['poema_' + key] = true;
    const def = OV.FOES[key];
    let b = op.e || null, g;
    if (!b) {
      b = def.build(); g = b.g;
      const esc = def.escala || 1; g.scale.setScalar(esc);
      const P = OV.P, y = M.altura(op.pos.x, op.pos.z);
      g.position.set(op.pos.x, y + (def.y0 || 0), op.pos.z);
      g.rotation.y = Math.atan2(P.pos.x - op.pos.x, P.pos.z - op.pos.z);
      M.scene.add(g); modelos[key] = b;
    } else g = b.g;
    const h = (def.height || 2.4) * (b.escala || def.escala || 1);
    const alvo = () => g.position.clone();
    const raio = op.raio || Math.max(4.5, h * 1.5 + 2), altura = op.altura !== undefined ? op.altura : h * 0.55 + 0.6;
    const braco0 = [b.armL.rotation.x, b.armR.rotation.x];
    if (OV.audio) { OV.audio.bell(98, 0.3); setTimeout(() => OV.audio.bell(92, 0.25), 600); }
    if (OV.audio && OV.audio.tema) OV.audio.tema('chefe');
    CE.iniciar({
      alvo, raio, altura, giro: 0.1, olhar: h * 0.62,
      anim: (dt, t) => {
        // gestos de quem declama: os braços se abrem e se erguem, os olhos ardem
        const k = 0.5 + 0.5 * Math.sin(t * 1.3);
        b.armL.rotation.x = -0.4 - 1.6 * k; b.armR.rotation.x = -0.2 - 1.9 * (1 - k * 0.6);
        b.armL.rotation.z = -0.35 * k; b.armR.rotation.z = 0.35 * k;
        if (b.eye) b.eye.color.setHex(Math.sin(t * 6) > 0 ? 0xff3b2f : (b.eyeBase || 0xffd23a));
      },
      fim: () => { b.armL.rotation.set(braco0[0], 0, 0); b.armR.rotation.set(braco0[1], 0, 0); if (b.eye) b.eye.color.setHex(b.eyeBase || 0xffd23a); }
    });
    const linhas = p[1].map(v => [p[0], v, { verso: true }]);
    D.falas(linhas, () => { CE.encerrar(); if (depois) depois(); });
  };
  // o chefão de verdade toma o lugar do modelo do poema (sem surgir do chão de novo)
  CE.trocar = function (key) {
    const b = modelos[key]; if (!b) return false;
    M.scene.remove(b.g); delete modelos[key]; return true;
  };
  CE.limpar = function () { for (const k in modelos) CE.trocar(k); CE.encerrar(); };

  /* ================= ACONTECIMENTOS ================= */
  CE.acontecimentos = {
    roda(depois) {
      const r = M.RODA ? M.RODA.clone() : v3(M.LOCAIS.moinho.x, M.altura(M.LOCAIS.moinho.x, M.LOCAIS.moinho.z) + 1.2, M.LOCAIS.moinho.z);
      CE.contar([
        ['', 'Você firma os pés na margem e puxa a trava com toda a força. A madeira geme... e cede com um estalo.'],
        ['', 'A roda estremece. Uma pá mergulha, depois outra, e o rio volta a empurrar o moinho.'],
        ['', 'Lá dentro, as mós começam a cantar. Pela primeira vez em meses, a Vila de São Roque vai ter farinha.']
      ], { alvo: r, raio: 8, altura: 2.2, olhar: 0, giro: 0.14 }, depois);
    },
    sinos(depois) {
      const t = v3(11.5, M.altura(11.5, -20.5) + 17, -20.5);
      CE.contar([
        ['', 'Um a um, os três badalos voltam ao seu lugar na torre de Santa Sabina.'],
        ['', 'O primeiro sino desperta, grave. O segundo responde. O terceiro canta por cima dos dois.'],
        ['', 'Pelo vale inteiro, as portas se abrem. Há meses ninguém ouvia as horas.']
      ], { alvo: t, raio: 16, altura: 4, olhar: 0, giro: 0.12, alvos: [{ raio: 10, altura: 1 }, { raio: 14 }, { alvo: v3(0, 3, 70), raio: 60, altura: 30, olhar: 0 }] }, depois);
    }
  };
})(window.OV);
