/* Ordo Virtutum — as estradas entre as regiões de Albária: placas de encruzilhada e a viagem de uma região a outra */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const ui = OV.ui, P = OV.P, I = OV.inimigos, T = OV.tempo, H = OV.habilidades, D = OV.dialogo;
  const F = () => (OV.jogo.prog && OV.jogo.prog.flags) || {};
  const C = () => OV.combate, J = () => OV.jogo;
  const V = {}; OV.viagem = V;

  // destinos, na ordem da peregrinação
  V.DEST = {
    vale: { nome: 'Vale de Santa Sabina', livre: () => true, pos: () => M.INICIO, yaw: 0,
      chegada: 'Você sobe a estrada de volta ao Vale de Santa Sabina.' },
    porto: { nome: 'Portos do Festim', livre: () => !!F().ato1_fim, pos: () => OV.porto && OV.porto.ENTRADA, yaw: Math.PI,
      chegada: 'Depois de horas de estrada, o cheiro de sal e de assado anuncia os Portos do Festim.' },
    minas: { nome: 'Minas de Mamom', livre: () => !!F().ato2_fim, pos: () => OV.regioes.minas && OV.regioes.minas.ENTRADA, yaw: 0,
      chegada: 'A estrada da serra sobe por um dia inteiro. No fim, entre as montanhas, aparecem os telhados de Valdouro e as bocas escuras das minas.' },
    corte: { nome: 'Corte das Máscaras', livre: () => !!F().ato3_fim, pos: () => OV.regioes.corte && OV.regioes.corte.ENTRADA, yaw: 0,
      chegada: 'Do alto da colina se ouve música. Lá embaixo, entre fontes e jardins, as luzes de Belmonte nunca se apagam.' },
    muros: { nome: 'Vila dos Muros', livre: () => !!F().ato4_fim, pos: () => OV.regioes.muros && OV.regioes.muros.ENTRADA, yaw: 0,
      chegada: 'A estrada do norte desce até um lago escuro. Dos dois lados, duas aldeias se olham por cima de um muro alto que corta a terra, a igreja e até a água.' },
    marca: { nome: 'Marca Ardente', livre: () => !!F().ato5_fim, pos: () => OV.regioes.marca && OV.regioes.marca.ENTRADA, yaw: 0,
      chegada: 'O cheiro de fumaça chega antes da fronteira. No vale, duas fortalezas queimadas se encaram por cima de um campo de cinzas, e os tambores não param.' },
    monte: { nome: 'Monte Santo', livre: () => !!F().ato6_fim, pos: () => OV.regioes.monte && OV.regioes.monte.ENTRADA, yaw: 0,
      chegada: 'No fim do deserto, o Monte Santo se ergue sobre um mosteiro de pedra clara. No alto, uma torre negra fura as nuvens.' }
  };
  V.livres = aqui => Object.keys(V.DEST).filter(k => k !== aqui && V.DEST[k].livre() && V.DEST[k].pos());

  V.ir = function (dest) {
    const d = V.DEST[dest], p = d && d.pos(); if (!p) return;
    if (I.vivos().some(e => Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < 10)) { ui.toast('Não é possível seguir viagem com vícios por perto.'); return; }
    ui.clarao('#000000');
    C().resetAcoes(); C().limparEfeitos();
    C().posicionar(p.x, p.z, p.facing !== undefined ? p.facing : Math.PI);
    OV.cam.yaw = d.yaw; OV.cam.pitch = 0.3; H.trazerAliados(); J().mudouLugar();
    T.definir(T.hora + 3);
    ui.toast(d.chegada);
  };

  // texto e ação das placas: com um só destino, a placa leva direto; com vários, abre a encruzilhada
  V.textoPlaca = function (aqui) {
    const l = V.livres(aqui);
    if (!l.length) return 'Ler a placa da estrada';
    if (l.length === 1) return l[0] === 'vale' ? 'Voltar ao Vale de Santa Sabina' : `Seguir a estrada para ${({ porto: 'os Portos do Festim', minas: 'as Minas de Mamom', corte: 'a Corte das Máscaras', muros: 'a Vila dos Muros', marca: 'a Marca Ardente', monte: 'o Monte Santo' })[l[0]]}`;
    return 'Ler a placa da encruzilhada e seguir viagem';
  };
  V.usarPlaca = function (aqui) {
    const l = V.livres(aqui);
    if (!l.length) { ui.fala('Placa da estrada', 'As estradas para as outras regiões ainda não são seguras. Há trabalho a fazer aqui.'); return; }
    if (l.length === 1) { V.ir(l[0]); return; }
    let escolha = null;
    D.abrir({ inicio: 'a', nos: { a: {
      quem: 'Placa da encruzilhada', txt: 'As setas apontam para as terras de Albária. Para onde você segue?',
      opc: l.map(k => ({ t: V.DEST[k].nome, ef: () => { escolha = k; } })).concat([{ t: 'Ficar por aqui' }]),
      depois: () => { if (escolha) setTimeout(() => V.ir(escolha), 150); }
    } } });
  };

  // as placas antigas do vale e do porto passam a usar a encruzilhada
  if (OV.ato2) {
    OV.ato2.viajarRegiao = V.ir;
    OV.ato2.textoEstradaSul = () => F().ato1_fim ? V.textoPlaca('vale') : 'Ler a placa da estrada';
    OV.ato2.estradaSul = function () {
      if (F().ato1_fim) { V.usarPlaca('vale'); return; }
      ui.fala('Placa da estrada', 'Para o sul: Portos do Festim. A estrada é longa, e ainda há trabalho a fazer no vale.');
    };
  }
})(window.OV);
