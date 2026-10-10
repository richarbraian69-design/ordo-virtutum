/* Ordo Virtutum — diálogos com escolhas
   Árvore: { inicio: 'a', nos: { a: { quem, txt, opc: [{ t, ir, cond, motivo, ef }], prox, ef, vai, depois } } }
   txt e t podem ser funções; ef roda ao entrar no nó; vai redireciona; depois roda ao fechar. */
(function (OV) {
  'use strict';
  const $ = id => document.getElementById(id);
  const D = { aberto: false, arv: null, no: null, opcs: [], depois: null };
  OV.dialogo = D;
  const val = v => typeof v === 'function' ? v() : v;

  D.abrir = function (arv, inicio) {
    if (!arv) return;
    D.arv = arv; D.aberto = true; D.depois = null;
    if (OV.jogo) OV.jogo.entrarDialogo();
    $('dlg').hidden = false;
    D.ir(inicio || arv.inicio || 'a');
  };
  D.ir = function (id) {
    if (!id || !D.arv) { D.fechar(); return; }
    const no = D.arv.nos[id]; if (!no) { D.fechar(); return; }
    D.no = no;
    if (no.depois) D.depois = no.depois;
    if (no.ef) no.ef();
    if (no.vai) { D.ir(val(no.vai)); return; }
    render(no);
  };
  function render(no) {
    const quem = val(no.quem) || '';
    const q = $('dlgQuem'); q.textContent = quem;
    if (OV.anjo) OV.anjo.fala(quem);
    q.className = /Anjo/.test(quem) ? 'anjo' : /^(Santo|Santa|São)\s/.test(quem) ? 'santo' : '';
    $('dlgTxt').textContent = val(no.txt) || '';
    $('dlg').classList.toggle('verso', !!no.verso);
    const box = $('dlgOpc'); box.innerHTML = '';
    D.opcs = [];
    if (no.opc) {
      no.opc.forEach(op => {
        if (op.mostrar && !op.mostrar()) return;
        const ok = !op.cond || op.cond();
        D.opcs.push({ op, ok });
        const i = D.opcs.length;
        const b = document.createElement('button'); b.type = 'button'; b.className = 'dopc' + (ok ? '' : ' off');
        b.innerHTML = `<kbd>${i}</kbd><span></span>`;
        b.querySelector('span').textContent = val(op.t) + (!ok && op.motivo ? ` (${val(op.motivo)})` : '');
        if (!ok) b.disabled = true;
        b.addEventListener('click', () => D.escolher(i - 1));
        box.appendChild(b);
      });
    } else {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dopc cont';
      b.innerHTML = `<kbd>E</kbd><span>${no.prox ? 'Continuar' : 'Encerrar'}</span>`;
      b.addEventListener('click', () => D.continuar());
      box.appendChild(b);
    }
    const f = box.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true });
  }
  D.escolher = function (i) {
    const it = D.opcs[i]; if (!it || !it.ok) return;
    if (it.op.ef) it.op.ef();
    if (!D.aberto) return;
    if (it.op.ir) D.ir(val(it.op.ir)); else D.fechar();
  };
  D.continuar = function () {
    if (!D.aberto || !D.no) return;
    if (D.no.opc) return;
    if (D.no.prox) D.ir(val(D.no.prox)); else D.fechar();
  };
  D.fechar = function () {
    $('dlg').hidden = true;
    if (OV.anjo) OV.anjo.fala(null);
    const dep = D.depois;
    D.aberto = false; D.arv = null; D.no = null; D.opcs = []; D.depois = null;
    if (OV.jogo) OV.jogo.sairDialogo();
    if (dep) dep();
  };
  D.tecla = function (code) {
    if (!D.aberto) return false;
    const m = /^Digit([1-9])$/.exec(code);
    if (m && D.no && D.no.opc) { D.escolher(+m[1] - 1); return true; }
    if (code === 'KeyE' || code === 'Enter' || code === 'Space') { if (D.no && !D.no.opc) D.continuar(); return true; }
    return true;
  };
  /* atalho: sequência de falas lineares */
  D.falas = function (linhas, depois) {
    const nos = {};
    linhas.forEach((l, i) => { nos['n' + i] = { quem: l[0], txt: l[1], prox: i < linhas.length - 1 ? 'n' + (i + 1) : null, idx: i, verso: !!(l[2] && l[2].verso) }; });
    if (depois) nos['n' + (linhas.length - 1)].depois = depois;
    D.abrir({ inicio: 'n0', nos });
  };
})(window.OV);
