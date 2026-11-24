/* Osito English · Words: repaso espaciado de vocabulario con audio.
   Las palabras y los audios salen de words.json y audio/N.mp3 (N es la posición en words.json).
   Usa lo que define index.html: est, guardar, app, I, esc, decir, inicio, dia, vista, UNIDADES, LECCIONES, pendiente.
   Por palabra se guarda [día en que toca, intervalo en días, facilidad x100]. */
const W = { datos: null, cargando: null, cola: [], hechas: 0, nuevas: 0, total: 0, extra: 0, audio: null, enLecciones: null };
const HOY = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
const GRUPOS = { 1: 'Basic', 2: 'Intermediate', p: 'Phrasal verb', i: 'Idiom', k: 'Connector', t: 'Technology', l: 'Legal', m: 'Medicine', c: 'Science', n: 'Business' };
const PAQUETES = ['t', 'l', 'm', 'c', 'n'];
const RANGO = { 1: 1, 2: 2, p: 3, i: 3, k: 3 };
const POR_DIA = [5, 10, 15, 20, 30];

(function estilos() {
  const s = document.createElement('style');
  s.textContent = `
.dos-botones { display: flex; gap: 10px; }
.inicio .dos-botones .boton { flex: 1; margin-top: 0; min-width: 0; }
.insignia { background: var(--nieve); color: var(--cielo-osc); border-radius: 99px; padding: 1px 9px; font-size: .85rem; font-variant-numeric: tabular-nums; }
.palabra { display: flex; align-items: center; gap: 14px; margin: 6px 0 18px; }
.palabra b { font-family: var(--titulo); font-size: clamp(1.8rem, 9vw, 2.6rem); line-height: 1.05; overflow-wrap: anywhere; }
.ejemplo { border: 2px solid var(--borde); border-radius: 16px; padding: 12px 14px; font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 10px; overflow-wrap: anywhere; }
.significado { margin-top: 16px; background: var(--hielo); border-radius: 16px; padding: 14px 16px; }
.significado b { display: block; font-size: 1.25rem; overflow-wrap: anywhere; }
.significado span { display: block; margin-top: 4px; color: var(--tinta-suave); font-weight: 700; overflow-wrap: anywhere; }
.notas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.notas .boton { flex-direction: column; gap: 0; padding: 8px 4px; min-height: 58px; }
.notas .boton small { font-weight: 700; font-size: .75rem; opacity: .85; }
.ajuste { margin: 0 0 20px; }
.ajuste h3 { font-family: var(--titulo); font-size: 1.1rem; margin: 0 0 8px; }
.fichas-ajuste { display: flex; flex-wrap: wrap; gap: 8px; }`;
  document.head.appendChild(s);
})();

function wEstado() {
  if (!est.w || typeof est.w !== 'object') est.w = {};
  const w = est.w;
  if (!w.c || typeof w.c !== 'object') w.c = {};
  if (!w.packs || typeof w.packs !== 'object') w.packs = {};
  if (!POR_DIA.includes(w.n)) w.n = 10;
  if (![1, 2, 3].includes(w.desde)) {
    // Punto de partida según el nivel de las lecciones: A1 y A2 básicas, B1 intermedias, B2 y C1 avanzadas.
    const u = UNIDADES.find((x) => x.lecciones && x.lecciones.includes(LECCIONES[Math.min(pendiente(), LECCIONES.length - 1)]));
    w.desde = !u || u.nivel[0] === 'A' ? 1 : u.nivel === 'B1' ? 2 : 3;
  }
  if (!Array.isArray(w.hoy) || w.hoy[0] !== HOY()) w.hoy = [HOY(), 0];
  return w;
}

/* Cuántas palabras tocan hoy (repasos + nuevas que quedan). Sirve para el botón del inicio sin cargar el archivo. */
function wPendientes() {
  const w = wEstado(), hoy = HOY();
  let n = 0;
  for (const k in w.c) if (w.c[k][0] <= hoy) n++;
  return n + Math.max(0, w.n - w.hoy[1]);
}

function wCargar() {
  if (W.datos) return Promise.resolve(W.datos);
  if (!W.cargando) {
    W.cargando = fetch('words.json').then((r) => { if (!r.ok) throw new Error('words'); return r.json(); })
      .then((d) => { W.datos = d; W.enLecciones = new Set(LECCIONES.flatMap((l) => l.palabras.map((x) => x.toLowerCase()))); return d; })
      .catch((e) => { W.cargando = null; throw e; });
  }
  return W.cargando;
}

/* Palabras nuevas que tocan: desde el grupo elegido en adelante; con paquetes de tema activos, una de cada tres sale de ellos. */
function wNuevas(cuantas) {
  const w = wEstado(), base = [], tema = [];
  for (let id = 0; id < W.datos.length && (base.length < cuantas || tema.length < cuantas); id++) {
    if (w.c[id]) continue;
    const g = W.datos[id][4];
    if (RANGO[g]) { if (RANGO[g] >= w.desde) base.push(id); } else if (w.packs[g]) tema.push(id);
  }
  const out = [];
  while (out.length < cuantas && (base.length || tema.length)) {
    if (tema.length && (out.length % 3 === 2 || !base.length)) out.push(tema.shift()); else if (base.length) out.push(base.shift()); else break;
  }
  return out;
}

function wArmar() {
  const w = wEstado(), hoy = HOY();
  const repasos = Object.keys(w.c).map(Number).filter((id) => w.c[id][0] <= hoy && W.datos[id]).sort((a, b) => w.c[a][0] - w.c[b][0]).slice(0, 150);
  const nuevas = wNuevas(Math.max(0, w.n - w.hoy[1]) + W.extra);
  W.extra = 0;
  W.cola = repasos.map((id) => ({ id })).concat(nuevas.map((id) => ({ id, nueva: true })));
  W.total = W.cola.length; W.hechas = 0; W.nuevas = 0;
}

function wSonar(id, texto) {
  try {
    if (W.audio) W.audio.pause();
    const a = new Audio('audio/' + id + '.mp3'); W.audio = a;
    a.onerror = () => decir(texto);
    a.play().catch(() => decir(texto));
  } catch (e) { decir(texto); }
}

const wTope = (titulo, derecha) => `<div class="tope">
    <button class="cerrar" id="salir" aria-label="Back to home">${I.x}</button>
    ${titulo}${derecha || ''}
  </div>`;

function palabras() {
  ses = null; vista = 'palabras';
  app.innerHTML = wTope('<h1 class="titulo-chat">Words</h1>') + '<main class="cuerpo final"><p style="margin-top:30%">Loading your words…</p></main>';
  app.querySelector('#salir').onclick = inicio;
  wCargar().then(() => { if (vista !== 'palabras') return; wArmar(); wTarjeta(false); },
    () => { if (vista !== 'palabras') return; app.querySelector('.cuerpo').innerHTML = '<div class="aviso">The words did not load. Check your internet and try again.</div>'; });
}

function wIntervalos(c) {
  const facil = c[2] / 100;
  return [0, c[1] === 0 ? 1 : Math.max(c[1] + 1, Math.round(c[1] * facil)), c[1] === 0 ? 4 : Math.max(c[1] + 2, Math.round(c[1] * facil * 1.3))];
}
const wDias = (n) => (n === 0 ? 'again today' : n === 1 ? '1 day' : n < 30 ? n + ' days' : n < 365 ? Math.round(n / 30) + ' mo' : Math.round(n / 365) + ' yr');

function wTarjeta(vuelta) {
  const item = W.cola[0];
  if (!item) return wFin();
  vista = 'palabras';
  const w = wEstado(), d = W.datos[item.id], c = w.c[item.id] || [HOY(), 0, 250], ints = wIntervalos(c);
  app.innerHTML = wTope(`<div class="barra"><i style="width:${Math.max(4, W.hechas / Math.max(1, W.total) * 100)}%;background:var(--verde)"></i></div>`, `<span class="dato" style="color:var(--tinta-suave)">${W.cola.length}</span>`) + `
    <main class="cuerpo">
      <span class="etiqueta">${GRUPOS[d[4]] || 'Word'} · ${item.nueva && !item.vista ? 'New word' : 'Review'}</span>
      <div class="palabra"><button class="altavoz grande" id="oir" aria-label="Listen to the word">${I.voz}</button><b>${esc(d[0])}</b></div>
      <div class="ejemplo">${hayVoz() ? `<button class="altavoz" id="oir-ej" aria-label="Listen to the example">${I.voz}</button>` : ''}<span>${esc(d[2])}</span></div>
      ${vuelta ? `<div class="significado"><b>${esc(d[1])}</b><span>${esc(d[3])}</span></div>` : ''}
    </main>
    <footer class="pie">${vuelta
      ? `<div class="notas">
          <button class="boton peligro" data-k="0">Again<small>${wDias(ints[0])}</small></button>
          <button class="boton verde" data-k="1">Good<small>${wDias(ints[1])}</small></button>
          <button class="boton" data-k="2">Easy<small>${wDias(ints[2])}</small></button>
        </div>`
      : '<button class="boton" id="ver">Show meaning</button>'}</footer>`;
  app.querySelector('#salir').onclick = () => { if (W.audio) W.audio.pause(); wCerrarDia(); inicio(); };
  app.querySelector('#oir').onclick = () => wSonar(item.id, d[0]);
  const ej = app.querySelector('#oir-ej'); if (ej) ej.onclick = () => decir(d[2]);
  if (vuelta) app.querySelectorAll('.notas .boton').forEach((b) => b.onclick = () => wCalificar(+b.dataset.k));
  else { app.querySelector('#ver').onclick = () => wTarjeta(true); wSonar(item.id, d[0]); app.querySelector('#ver').focus(); }
}

function wCalificar(k) {
  const w = wEstado(), item = W.cola.shift(), hoy = HOY();
  const c = w.c[item.id] || [hoy, 0, 250], ints = wIntervalos(c);
  if (item.nueva && !item.vista) { item.vista = true; w.hoy[1]++; W.nuevas++; }
  if (k === 0) {
    w.c[item.id] = [hoy, 0, Math.max(130, c[2] - 20)];
    W.cola.splice(Math.min(3, W.cola.length), 0, item); // vuelve a salir en un momento
  } else {
    w.c[item.id] = [hoy + ints[k], ints[k], k === 2 ? Math.min(300, c[2] + 15) : c[2]];
    W.hechas++; est.xp += 1;
  }
  guardar();
  wTarjeta(false);
}

/* Cuenta para la racha y actualiza cuántas palabras del mazo (que no están en las lecciones) ya se aprendieron. */
function wCerrarDia() {
  const w = wEstado();
  if (W.datos) { let n = 0; for (const k in w.c) if (w.c[k][1] > 0 && W.datos[k] && !W.enLecciones.has(W.datos[k][0].toLowerCase())) n++; w.x = n; }
  if (W.hechas > 0 && est.ultimo !== dia(0)) { est.racha = est.ultimo === dia(1) ? est.racha + 1 : 1; est.ultimo = dia(0); }
  guardar();
}

function wFin() {
  wCerrarDia();
  const w = wEstado(), total = Object.keys(w.c).length, quedan = wNuevas(1).length > 0;
  app.innerHTML = wTope('<h1 class="titulo-chat">Words</h1>') + `<main class="cuerpo final">
      <img src="${OSO}" alt="Osito celebra" style="width:min(48%,190px)">
      <h2>${W.hechas ? 'Done for today!' : 'Nothing to review now'}</h2>
      <p>${W.hechas ? `You practiced ${W.hechas} ${W.hechas === 1 ? 'word' : 'words'}, ${W.nuevas} of them new.` : 'Come back tomorrow, or learn a few new words now.'}</p>
      <div class="premios">
        <div class="premio">Today<div>${W.hechas}</div></div>
        <div class="premio">My words<div>${total}</div></div>
        <div class="premio">Streak<div>${est.racha} ${est.racha === 1 ? 'day' : 'days'}</div></div>
      </div>
    </main>
    <footer class="pie">
      <button class="boton" id="listo">Back to home</button>
      ${quedan ? '<button class="boton claro" id="mas" style="margin-top:12px">Learn 5 more words</button>' : ''}
      <button class="enlace" id="ajustes" style="margin-top:8px">Words settings</button>
    </footer>`;
  app.querySelector('#salir').onclick = inicio;
  app.querySelector('#listo').onclick = inicio;
  app.querySelector('#ajustes').onclick = wAjustes;
  const mas = app.querySelector('#mas'); if (mas) mas.onclick = () => { W.extra = 5; wArmar(); wTarjeta(false); };
}

function wAjustes() {
  vista = 'palabras';
  const w = wEstado();
  const ficha = (activo, attrs, texto) => `<button class="tema ${activo ? 'activo' : ''}" ${attrs}>${texto}</button>`;
  app.innerHTML = wTope('<h1 class="titulo-chat">Words settings</h1>') + `<main class="cuerpo">
      <section class="ajuste"><h3>New words per day</h3>
        <div class="fichas-ajuste">${POR_DIA.map((n) => ficha(w.n === n, `data-n="${n}"`, n)).join('')}</div></section>
      <section class="ajuste"><h3>Start from</h3>
        <div class="fichas-ajuste">${[[1, 'Basic'], [2, 'Intermediate'], [3, 'Advanced']].map((x) => ficha(w.desde === x[0], `data-desde="${x[0]}"`, x[1])).join('')}</div></section>
      <section class="ajuste"><h3>Topic packs</h3>
        <div class="fichas-ajuste">${PAQUETES.map((p) => ficha(!!w.packs[p], `data-pack="${p}"`, GRUPOS[p])).join('')}</div></section>
    </main>
    <footer class="pie"><button class="boton" id="listo">Save</button></footer>`;
  app.querySelector('#salir').onclick = inicio;
  app.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => { w.n = +b.dataset.n; guardar(); wAjustes(); });
  app.querySelectorAll('[data-desde]').forEach((b) => b.onclick = () => { w.desde = +b.dataset.desde; guardar(); wAjustes(); });
  app.querySelectorAll('[data-pack]').forEach((b) => b.onclick = () => { w.packs[b.dataset.pack] = !w.packs[b.dataset.pack]; guardar(); wAjustes(); });
  app.querySelector('#listo').onclick = () => { guardar(); palabras(); };
}
