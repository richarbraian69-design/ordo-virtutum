/* Ordo Virtutum — missões secundárias com mais desafio:
   · as lutas de cada missão secundária ficam mais fortes e ganham um líder;
   · as missões que eram só levar e trazer ganham uma emboscada no caminho (uma vez vencida, não volta). */
(function (OV) {
  'use strict';
  const M = OV.mundo, I = OV.inimigos, MS = OV.missoes; if (!M || M.falhou || !I || !MS) return;
  const F = () => OV.jogo.prog.flags;

  // as lutas das missões secundárias (tag do inimigo → missão)
  const SEC = { acamp: 's4', mina: 's5', lobo: 's3', redes: 'a2s1', galeria: 'a3s1', labirinto: 'a4s2' };
  const SEM_LIDER = { lobo: true }; // o lobo do vale é um só
  function reforcar(e, niveis) {
    const d = e.def, nv = (d.nivel || 1) + niveis;
    e.def = Object.assign({}, d, { nivel: nv, hp: Math.round(d.hp * 1.45), dmg: Math.round(d.dmg * 1.2), xp: Math.round(d.xp * 1.3) });
    e.hp = e.def.hp;
    if (e.lab) { e.lab.nivel = nv; if (e.lab.nv) e.lab.nv.textContent = 'Nível ' + nv; }
  }
  function lider(e0, tag) {
    const a = Math.random() * Math.PI * 2;
    const l = I.spawn(e0.def.key, false, { x: e0.home.x + Math.cos(a) * 1.8, z: e0.home.z + Math.sin(a) * 1.8 }, { nivel: (e0.def.nivel || 1) + 1, variante: 'forte', semAjuste: false });
    l.tag = tag; l.reforcado = true; l.mundo = false; if (e0.sumir) l.sumir = true;
    return l;
  }

  // emboscadas: [id, condição, onde (função que devolve {x,z}), [[tipo, nível, variante], ...]]
  const VZ = () => M.LOCAIS;
  const PW = (lx, lz) => OV.porto ? OV.porto.W(lx, lz) : { x: lx, z: lz + 700 };
  const RW = (r, lx, lz) => OV.regioes && OV.regioes[r] ? OV.regioes[r].W(lx, lz) : { x: lx, z: lz };
  const EMBOSCADAS = [
    ['s1', () => MS.ativa('s1') && MS.etapa('s1') === 1 && !F().roda_solta, () => ({ x: VZ().moinho.x - 4, z: VZ().moinho.z + 2 }), [['diabrete', 3], ['diabrete', 3], ['larva', 3, 'forte']]],
    ['s6', () => MS.ativa('s6') && MS.etapa('s6') === 0, () => ({ x: VZ().capela.x + 6, z: VZ().capela.z - 4 }), [['possesso', 4], ['possesso', 4], ['diabrete', 4, 'forte']]],
    ['a2s2', () => MS.ativa('a2s2') && !F().farinha, () => PW(40, -20), [['corvo', 7], ['corvo', 7], ['glutao', 7, 'forte']]],
    ['a2s4', () => MS.ativa('a2s4') && MS.etapa('a2s4') === 1, () => PW(-30, -30), [['corvo', 8], ['corvo', 8], ['corvo', 8, 'forte']]],
    ['a3s2', () => MS.ativa('a3s2'), () => RW('minas', -86, 62), [['escaravelho', 11], ['escaravelho', 11], ['mineiro', 12, 'forte']]],
    ['a3s3', () => MS.ativa('a3s3'), () => RW('minas', 10, 30), [['escaravelho', 12], ['escaravelho', 12], ['escaravelho', 12], ['escaravelho', 13, 'forte']]],
    ['a4s1', () => MS.ativa('a4s1') && MS.etapa('a4s1') === 1, () => RW('corte', 0, 8), [['mariposa', 14], ['mariposa', 14], ['mascarado', 15, 'forte']]],
    ['a4s3', () => MS.ativa('a4s3') && MS.etapa('a4s3') === 0 && !F().sebastiao_livre, () => RW('corte', 12, -22), [['mascarado', 15], ['reflexo', 15], ['mascarado', 15, 'forte']]]
  ];
  const tagE = id => 'emb_' + id;
  function emboscar() {
    for (const [id, cond, onde, grupo] of EMBOSCADAS) {
      const tag = tagE(id);
      if (F()[tag] || !OV.FOES) continue;
      const vivos = I.porTag(tag).filter(e => e.state !== 'dead' && e.state !== 'liberto');
      if (!cond()) { if (vivos.length) MS.tagRemove(tag); continue; }
      if (I.porTag(tag).length) {
        // todos vencidos: a emboscada não volta mais
        if (!vivos.length) { F()[tag] = true; MS.tagRemove(tag); OV.ui.toast('O caminho está livre.'); }
        continue;
      }
      const c = onde(); if (!c) continue;
      grupo.forEach(([t, nv, vr], i) => {
        if (!OV.FOES[t]) return;
        const a = i / grupo.length * Math.PI * 2;
        const e = I.spawn(t, false, { x: c.x + Math.cos(a) * 2.2, z: c.z + Math.sin(a) * 2.2 }, { nivel: nv, variante: vr || null });
        e.tag = tag; e.mundo = false; if (t === 'possesso' || t === 'mascarado' || t === 'mineiro' || t === 'glutao') e.sumir = true;
        e.def = Object.assign({}, e.def, { aggro: (e.def.aggro || 14) + 4 });
      });
    }
  }

  MS.ganchos.spawn.push(() => {
    const grupos = {};
    I.lista.forEach(e => { if (!e.tag || !SEC[e.tag] || e.reforcado) return; e.reforcado = true; reforcar(e, 2); if (!grupos[e.tag]) grupos[e.tag] = e; });
    for (const tag in grupos) if (!SEM_LIDER[tag]) lider(grupos[tag], tag);
    EMBOSCADAS.forEach(([id]) => MS.tagRemove(tagE(id)));
    emboscar();
  });
  let t = 0;
  MS.ganchos.update.push(dt => { t -= dt; if (t > 0) return; t = 1.5; emboscar(); });
})(window.OV);
