/* Ordo Virtutum — salvamento no navegador (guardado nos Oratórios)
   v22: os mundos ficam em espaços separados — até 3 mundos individuais e até 3 mundos de co-op.
   Cada mundo guarda o seu personagem e o seu progresso, sem tocar nos outros. */
(function (OV) {
  'use strict';
  const ANTIGO = 'ordo-virtutum-save-v1', PREF = 'ordo-virtutum-mundo-', ULT = 'ordo-virtutum-ultimo';
  const LIMITE = 3, TIPOS = ['solo', 'coop'];
  const memoria = {}; // reserva quando o navegador bloqueia o armazenamento
  const S = { LIMITE, TIPOS, tipo: 'solo', slot: 0, padrao: 'solo' }; // padrao: o tipo usado quando ainda não há mundo escolhido (no co-op, 'coop')
  const chave = (t, n) => PREF + t + '-' + n;
  const valido = (t, n) => TIPOS.includes(t) && n >= 1 && n <= LIMITE;

  function lerChave(k) {
    try { const raw = localStorage.getItem(k); if (raw) return JSON.parse(raw); } catch (e) { /* armazenamento indisponível */ }
    return memoria[k] ? JSON.parse(memoria[k]) : null;
  }
  function gravarChave(k, dados) {
    const txt = JSON.stringify(dados); memoria[k] = txt;
    try { localStorage.setItem(k, txt); return true; } catch (e) { return false; }
  }
  function apagarChave(k) { delete memoria[k]; try { localStorage.removeItem(k); } catch (e) { /* nada */ } }

  // o jogo salvo antes da v22 (um só) vira o primeiro mundo individual livre
  (function migrar() {
    const velho = lerChave(ANTIGO); if (!velho) return;
    const livre = [1, 2, 3].find(n => !lerChave(chave('solo', n)));
    if (livre) { velho.tipo = 'solo'; gravarChave(chave('solo', livre), velho); }
    apagarChave(ANTIGO);
  })();

  S.lerSlot = (t, n) => (valido(t, n) ? lerChave(chave(t, n)) : null);
  S.lista = t => [1, 2, 3].map(n => { const s = S.lerSlot(t, n); return s && s.pers ? s : null; });
  S.livre = t => { const i = S.lista(t).findIndex(s => !s); return i < 0 ? 0 : i + 1; };
  S.cheio = t => !S.livre(t);
  S.apagarSlot = (t, n) => { if (valido(t, n)) apagarChave(chave(t, n)); };

  // o mundo em uso agora
  S.usar = function (t, n) {
    if (!valido(t, n)) return false;
    S.tipo = t; S.slot = n;
    const u = S.ultimos(); u[t] = n; gravarChave(ULT, u);
    return true;
  };
  S.ultimos = () => lerChave(ULT) || {};
  S.ultimo = t => { const n = S.ultimos()[t]; return n && S.lista(t)[n - 1] ? n : 0; };
  S.emUso = () => (S.slot ? { tipo: S.tipo, slot: S.slot } : null);

  S.ler = function () { return S.slot ? S.lerSlot(S.tipo, S.slot) : null; };
  S.gravar = function (dados) {
    if (!S.slot) { const t = S.padrao; S.usar(t, S.livre(t) || S.ultimo(t) || 1); } // sem mundo escolhido: o primeiro livre do tipo em uso
    dados.salvoEm = Date.now(); dados.tipo = S.tipo;
    return gravarChave(chave(S.tipo, S.slot), dados);
  };
  S.apagar = function () { if (S.slot) S.apagarSlot(S.tipo, S.slot); };
  S.existe = () => !!S.ler();
  OV.save = S;
})(window.OV);
