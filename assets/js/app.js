/* =========================================================================
   Controlador principal: interfaz, enrutador, acciones
   ========================================================================= */
'use strict';

/* ------------------------------ UI helpers ------------------------------ */
const UI = {
  toast(msg, type = 'ok') {
    const root = document.getElementById('toast-root');
    const t = document.createElement('div');
    t.className = 'toast t-' + type; t.innerHTML = msg;
    root.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3400);
    setTimeout(() => t.remove(), 3900);
  },
  modal({ title, body, actions = [], wide = false, onOpen }) {
    const root = document.getElementById('modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-bg';
    wrap.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close aria-label="Cerrar">✕</button></div>
      <div class="modal-body">${body}</div>
      ${actions.length ? `<div class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-mi="${i}">${a.label}</button>`).join('')}</div>` : ''}</div>`;
    root.appendChild(wrap);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', async e => {
      if (e.target === wrap || e.target.closest('[data-close]')) return close();
      const b = e.target.closest('[data-mi]');
      if (b) { const a = actions[b.dataset.mi]; const r = a.onClick ? await a.onClick(wrap) : true; if (r !== false) close(); }
    });
    const first = wrap.querySelector('input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea, select');
    if (first) setTimeout(() => first.focus(), 30);
    if (onOpen) onOpen(wrap);
    return { root: wrap, close };
  },
  confirm(text, { ok = 'Confirmar', danger = false, title = 'Confirmar' } = {}) {
    return new Promise(res => {
      UI.modal({ title, body: `<p>${text}</p>`, actions: [{ label: 'Cancelar', onClick: () => res(false) }, { label: ok, cls: danger ? 'btn-danger' : 'btn-primary', onClick: () => res(true) }] });
    });
  },
  prompt(title, label, { value = '', required = false, multiline = true } = {}) {
    return new Promise(res => {
      UI.modal({ title, body: `<label>${label}${multiline ? `<textarea rows="4" id="pr-in">${esc(value)}</textarea>` : `<input id="pr-in" value="${esc(value)}">`}</label>`,
        actions: [{ label: 'Cancelar', onClick: () => res(null) }, { label: 'Aceptar', cls: 'btn-primary', onClick: m => { const v = m.querySelector('#pr-in').value.trim(); if (required && !v) { UI.toast('Este campo es obligatorio.', 'error'); return false; } res(v); } }] });
    });
  },
  form(root) {
    const o = {};
    root.querySelectorAll('[name]').forEach(el => {
      if (el.type === 'checkbox') { (o[el.name] = o[el.name] || []); if (el.checked) o[el.name].push(el.value); }
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value.trim();
    });
    return o;
  }
};

/* ------------------------------ Navegación ------------------------------ */
const ICONS = {
  dashboard: '<path d="M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"/>',
  ciclo: '<path d="M12 4V1L8 5l4 4V6a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/>',
  fase: '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/>',
  artefactos: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5z"/>',
  plantillas: '<path d="M5 20h14v-2H5zm7-18-5.5 5.5 1.4 1.4L11 6.8V16h2V6.8l3.1 3.1 1.4-1.4z" transform="rotate(180 12 11)"/>',
  equipo: '<path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0h-1a4.2 4.2 0 0 1 2 3.5V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/>',
  requisitos: '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>',
  trazabilidad: '<path d="M17 7h-4v2h4a3 3 0 0 1 0 6h-4v2h4a5 5 0 0 0 0-10zm-6 8H7a3 3 0 0 1 0-6h4V7H7a5 5 0 0 0 0 10h4zm-3-4h8v2H8z"/>',
  decisiones: '<path d="M12 2 2 12l10 10 10-10zm0 3.8L18.2 12 12 18.2 5.8 12z"/>',
  iteraciones: '<path d="M12 6v3l4-4-4-4v3a8 8 0 0 0-6.8 12.2l1.5-1.5A6 6 0 0 1 12 6zm6.8 1.8-1.5 1.5A6 6 0 0 1 12 18v-3l-4 4 4 4v-3a8 8 0 0 0 6.8-12.2z"/>',
  riesgos: '<path d="M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z"/>',
  archivos: '<path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z"/>',
  cronograma: '<path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14zM7 11h5v2H7zm0 4h8v2H7z"/>',
  bitacora: '<path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2 4.9l-1.4 1.4A9 9 0 1 0 13 3zm-1 5v5l4.3 2.5.7-1.2-3.5-2.1V8z"/>',
  reportes: '<path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-7h2zm4 0h-2V7h2zm4 0h-2v-4h2z"/>',
  guia: '<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 4h5v8l-2.5-1.5L6 12z"/>',
  proyecto: '<path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3h-4l-.4 2.7a7.3 7.3 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.3 7.3 0 0 0 1.7 1L11 21h4l.4-2.7a7.3 7.3 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5z"/>'
};
const NAV = [
  ['Seguimiento', [['dashboard', 'Panel de control'], ['ciclo', 'Ciclo de vida'], ['cronograma', 'Cronograma']]],
  ['Fases', MODEL.phases.map(ph => ['fase/' + ph.n, ph.name, ph.n])],
  ['Documentación', [['artefactos', 'Artefactos'], ['plantillas', 'Plantillas'], ['archivos', 'Repositorio de evidencias']]],
  ['Control', [['equipo', 'Equipo y roles'], ['requisitos', 'Requisitos'], ['trazabilidad', 'Trazabilidad'], ['decisiones', 'Puntos de decisión'], ['iteraciones', 'Iteraciones'], ['riesgos', 'Riesgos'], ['bitacora', 'Bitácora']]],
  ['Proyecto', [['reportes', 'Reportes y respaldo'], ['guia', 'Guía del ciclo'], ['proyecto', 'Configuración']]]
];
const icon = k => `<svg viewBox="0 0 24 24" class="ico" aria-hidden="true">${ICONS[k] || ICONS.fase}</svg>`;

function renderSidebar(route) {
  const p = Store.project();
  document.getElementById('nav').innerHTML = NAV.map(([g, items]) => `<div class="nav-group"><div class="nav-title">${g}</div>
    ${items.map(([href, label, n]) => {
      const active = route === href || (route.startsWith('artefacto/') && href === 'artefactos');
      if (n) { const st = p ? p.phases[n].status : 'no_iniciada'; return `<a href="#/${href}" class="nav-item phase ${active ? 'active' : ''}"><span class="nav-n ${MODEL.phaseStatus[st].cls}">${n}</span><span class="nav-l">${esc(label)}</span>${MODEL.phase(n).dp ? `<span class="nav-dp">${MODEL.phase(n).dp}</span>` : ''}</a>`; }
      return `<a href="#/${href}" class="nav-item ${active ? 'active' : ''}">${icon(href)}<span class="nav-l">${label}</span></a>`;
    }).join('')}</div>`).join('');
}

function renderTopbar() {
  const p = Store.project();
  const projects = Object.values(Store.state.projects);
  document.getElementById('top-project').innerHTML = projects.map(x => `<option value="${x.id}" ${p && x.id === p.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
  document.getElementById('top-user').innerHTML = p ? `<option value="">— Sin usuario —</option>` + p.team.map(m => `<option value="${m.id}" ${m.id === p.currentUserId ? 'selected' : ''}>${esc(m.name)} ${(m.roles || []).map(r => MODEL.role(r).symbol).join('')}</option>`).join('') : '';
  document.getElementById('top-cycle').textContent = p ? `Recorrido ${p.cycle} · ${Store.overallProgress()}%` : '';
}

/* ------------------------------ Router ------------------------------ */
let lastRoute = '';
function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'dashboard';
  const [path, qs] = h.split('?');
  const parts = path.split('/');
  return { path, name: parts[0], arg: parts[1], query: Object.fromEntries(new URLSearchParams(qs || '')) };
}
function render(keepScroll = false) {
  const r = parseHash();
  const view = document.getElementById('view');
  const p = Store.project();
  document.body.classList.toggle('no-project', !p);
  renderTopbar();
  renderSidebar(r.path);
  const y = window.scrollY;
  if (!p && r.name !== 'guia') view.innerHTML = Views.welcome();
  else {
    const fn = Views[r.name];
    view.innerHTML = fn ? fn(r.arg, r.query) : H.empty('Página no encontrada. <a href="#/dashboard">Volver al panel</a>');
  }
  if (keepScroll || r.path === lastRoute) window.scrollTo(0, y); else window.scrollTo(0, 0);
  lastRoute = r.path;
  document.body.classList.remove('nav-open');
  afterRender();
}
function rerender() { render(true); }

function afterRender() {
  hydrateFiles();
  document.querySelectorAll('textarea.autogrow, .edit-tbl textarea').forEach(autogrow);
  const dpf = document.getElementById('dp-form');
  if (dpf) updateDpHints(dpf);
  const si = document.getElementById('storage-info') || document.getElementById('storage-info2');
  if (si && navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(e => { si.innerHTML = `Espacio utilizado por el sitio: <b>${H.size(e.usage || 0)}</b> de ${H.size(e.quota || 0)} disponibles.`; });
  const awf = document.getElementById('art-with-files');
  if (awf) Store.files().then(fs => { awf.textContent = `${new Set(fs.filter(f => f.artifact).map(f => f.artifact)).size}/${MODEL.internalArtifacts().length}`; }).catch(() => { awf.textContent = '—'; });
}
function autogrow(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 600) + 'px'; }

/* ------------------------------ Archivos ------------------------------ */
const FILE_ICON = f => /^image\//.test(f.type) ? '🖼' : /pdf/.test(f.type) ? '📕' : /(word|document)/.test(f.type) || /\.docx?$/i.test(f.name) ? '📘' : /(sheet|excel|csv)/.test(f.type) || /\.(xlsx?|csv)$/i.test(f.name) ? '📗' : /\.(py|ipynb|qasm|js|json|q)$/i.test(f.name) ? '⌨' : /zip/.test(f.type) ? '🗜' : '📄';
async function hydrateFiles() {
  const slots = document.querySelectorAll('[data-files]');
  if (!slots.length) return;
  let files = [];
  try { files = await Store.files(); } catch (e) { slots.forEach(s => { s.innerHTML = '<p class="small muted">El almacenamiento de archivos (IndexedDB) no está disponible en este navegador.</p>'; }); return; }
  slots.forEach(slot => {
    const o = JSON.parse(slot.dataset.files);
    let list = files;
    if (o.artifact) list = files.filter(f => f.artifact === o.artifact);
    if (o.phaseAll) list = files.filter(f => Number(f.phase) === o.phaseAll || (f.artifact && MODEL.artifact(f.artifact).phase === o.phaseAll));
    if (o.all) {
      const ff = UIState.fileFilter;
      list = files.filter(f => (!ff.phase || String(f.phase || (f.artifact ? MODEL.artifact(f.artifact).phase : '')) === ff.phase) && (!ff.cat || f.category === ff.cat) && (!ff.q || (f.name + ' ' + f.note + ' ' + (f.tags || []).join(' ') + ' ' + (f.artifact || '')).toLowerCase().includes(ff.q.toLowerCase())));
    }
    if (!list.length) { slot.innerHTML = o.compact ? '<p class="small muted">Sin archivos adjuntos.</p>' : H.empty('No hay archivos.'); return; }
    slot.innerHTML = `<ul class="files ${o.compact ? 'compact' : ''}">${list.map(f => `<li>
      <span class="f-ico">${FILE_ICON(f)}</span>
      <div class="f-body"><a href="#" data-action="file-preview" data-id="${f.id}" class="f-name">${esc(f.name)}</a>
        <small class="muted">${H.size(f.size)} · ${H.dt(f.date)} · ${esc(f.uploadedBy)}${f.artifact ? ` · <code>${f.artifact}</code> v${f.artifactVersion}` : ''}${f.phase ? ` · fase ${f.phase}` : ''} · recorrido ${f.cycle || 1}</small>
        ${!o.compact ? `<small><span class="tag">${esc(f.category)}</span> ${esc(f.note || '')}</small>` : f.note ? `<small class="muted">${esc(f.note)}</small>` : ''}</div>
      <div class="f-act"><button class="icon-btn" title="Descargar" data-action="file-download" data-id="${f.id}">⬇</button><button class="icon-btn" title="Editar" data-action="file-edit" data-id="${f.id}">✎</button><button class="icon-btn" title="Eliminar" data-action="file-del" data-id="${f.id}">🗑</button></div></li>`).join('')}</ul>`;
  });
}

function openUpload(target = {}) {
  const arts = MODEL.internalArtifacts();
  const sel = target.artifact ? 'a:' + target.artifact : target.phase ? 'p:' + target.phase : '';
  let picked = [];
  const m = UI.modal({
    title: 'Subir archivos', wide: false,
    body: `<div class="dropzone" id="dz"><input type="file" multiple id="up-files"><div><b>Arrastre archivos aquí</b> o haga clic para seleccionarlos</div><small class="muted">PDF, Word, imágenes, notebooks, código, resultados (máx. recomendado 50 MB por archivo)</small></div>
      <ul class="files compact" id="up-list"></ul>
      <label>Asociar a<select name="target"><option value="">— Proyecto (general) —</option>
        <optgroup label="Artefactos">${arts.map(a => `<option value="a:${a.id}" ${sel === 'a:' + a.id ? 'selected' : ''}>F${a.phase} · ${a.id}</option>`).join('')}</optgroup>
        <optgroup label="Fases">${MODEL.phases.map(ph => `<option value="p:${ph.n}" ${sel === 'p:' + ph.n ? 'selected' : ''}>Fase ${ph.n}. ${esc(ph.name)}</option>`).join('')}</optgroup></select></label>
      <label>Categoría<select name="category">${FILE_CATEGORIES.map(c => `<option ${target.artifact && c === 'Artefacto (documento)' ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label>Descripción / nota<input name="note" placeholder="p. ej. Plantilla llenada y firmada, resultados del job…"></label>
      <label>Etiquetas (separadas por coma)<input name="tags" placeholder="simulación, v2, DP1"></label>`,
    actions: [{ label: 'Cancelar' }, { label: 'Subir', cls: 'btn-primary', onClick: async root => {
      if (!picked.length) { UI.toast('Seleccione al menos un archivo.', 'error'); return false; }
      const f = UI.form(root);
      const meta = { category: f.category, note: f.note, tags: f.tags ? f.tags.split(',').map(s => s.trim()).filter(Boolean) : [] };
      if (f.target.startsWith('a:')) meta.artifact = f.target.slice(2);
      if (f.target.startsWith('p:')) meta.phase = Number(f.target.slice(2));
      try { for (const file of picked) await Store.addFile(file, meta); UI.toast(`${picked.length} archivo(s) subido(s).`); rerender(); }
      catch (e) { UI.toast('No se pudo guardar el archivo: ' + e.message, 'error'); return false; }
    } }]
  });
  const input = m.root.querySelector('#up-files'), dz = m.root.querySelector('#dz'), ul = m.root.querySelector('#up-list');
  const show = () => { ul.innerHTML = picked.map(f => `<li><span class="f-ico">${FILE_ICON(f)}</span><div class="f-body">${esc(f.name)}<small class="muted">${H.size(f.size)}${f.size > 50 * 1048576 ? ' · <b class="hi">archivo grande</b>' : ''}</small></div></li>`).join(''); };
  input.addEventListener('change', () => { picked = [...picked, ...input.files]; show(); });
  ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => { picked = [...picked, ...e.dataTransfer.files]; show(); });
}

async function previewFile(id) {
  const f = await FileDB.get(id); if (!f) return;
  const url = URL.createObjectURL(f.blob);
  let body;
  if (/^image\//.test(f.type)) body = `<img src="${url}" class="pv-img" alt="${esc(f.name)}">`;
  else if (/pdf/.test(f.type)) body = `<iframe src="${url}" class="pv-frame" title="${esc(f.name)}"></iframe>`;
  else if (/^text\/|json|csv|xml|markdown/.test(f.type) || /\.(md|txt|py|qasm|csv|json|js|ipynb|tex)$/i.test(f.name)) body = `<pre class="pv-pre">${esc((await f.blob.text()).slice(0, 200000))}</pre>`;
  else body = `<div class="empty"><div class="empty-ico">${FILE_ICON(f)}</div><p>No hay vista previa para este tipo de archivo.</p></div>`;
  body += `<div class="pv-meta small muted">${esc(f.name)} · ${H.size(f.size)} · subido por ${esc(f.uploadedBy)} el ${H.dt(f.date)}${f.artifact ? ` · ${f.artifact} v${f.artifactVersion}` : ''}${f.note ? ' · ' + esc(f.note) : ''}</div>`;
  const m = UI.modal({ title: esc(f.name), body, wide: true, actions: [{ label: 'Descargar', cls: 'btn-primary', onClick: () => { download(f.name, f.blob); return false; } }, { label: 'Cerrar' }] });
  const obs = new MutationObserver(() => { if (!document.body.contains(m.root)) { URL.revokeObjectURL(url); obs.disconnect(); } });
  obs.observe(document.getElementById('modal-root'), { childList: true });
}

/* ------------------------------ Formularios de entidades ------------------------------ */
function memberForm(m = {}) {
  return `<div class="form-col"><label>Nombre completo *<input name="name" value="${esc(m.name || '')}"></label>
    <div class="form-row"><label>Correo<input name="email" type="email" value="${esc(m.email || '')}"></label><label>Área / afiliación<input name="affiliation" value="${esc(m.affiliation || '')}"></label></div>
    <div><b class="small">Roles en el ciclo</b><div class="role-pick">${MODEL.roles.map(r => `<label class="chk role-opt" style="--c:${r.color}"><input type="checkbox" name="roles" value="${r.id}" ${(m.roles || []).includes(r.id) ? 'checked' : ''}><span class="rsym">${r.symbol}</span><span><b>${esc(r.name)}</b><small class="muted">${esc(r.resp)}</small></span></label>`).join('')}</div></div></div>`;
}
function riskForm(r = {}) {
  const p = Store.project();
  return `<div class="form-col"><label>Riesgo *<input name="title" value="${esc(r.title || '')}"></label>
    <label>Descripción<textarea name="description" rows="2">${esc(r.description || '')}</textarea></label>
    <div class="form-row"><label>Fase<select name="phase">${MODEL.phases.map(ph => `<option value="${ph.n}" ${Number(r.phase) === ph.n ? 'selected' : ''}>${ph.n}. ${esc(ph.name)}</option>`).join('')}</select></label>
    <label>Categoría<select name="category">${MODEL.riskCategories.map(c => `<option ${r.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
    <div class="form-row"><label>Probabilidad (1–5)<input type="range" min="1" max="5" name="probability" value="${r.probability || 3}" oninput="this.nextElementSibling.textContent=this.value"><output>${r.probability || 3}</output></label>
    <label>Impacto (1–5)<input type="range" min="1" max="5" name="impact" value="${r.impact || 3}" oninput="this.nextElementSibling.textContent=this.value"><output>${r.impact || 3}</output></label></div>
    <label>Estrategia de mitigación<textarea name="mitigation" rows="2">${esc(r.mitigation || '')}</textarea></label>
    <div class="form-row"><label>Responsable<select name="ownerId"><option value="">—</option>${p.team.map(m => `<option value="${m.id}" ${r.ownerId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>
    <label>Estado<select name="status">${Object.entries(MODEL.riskStatus).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div></div>`;
}
function openRisk(r, defaults = {}) {
  const p = Store.project(); const isNew = !r;
  r = r || { ...defaults };
  if (isNew && defaults.phase && !defaults.category) r.category = MODEL.phaseRiskCategory[defaults.phase];
  UI.modal({ title: isNew ? 'Nuevo riesgo' : 'Editar riesgo ' + r.code, body: riskForm(r), actions: [{ label: 'Cancelar' }, { label: 'Guardar', cls: 'btn-primary', onClick: root => {
    const f = UI.form(root); if (!f.title) { UI.toast('Indique el riesgo.', 'error'); return false; }
    f.phase = Number(f.phase); f.probability = Number(f.probability); f.impact = Number(f.impact);
    if (isNew) {
      const n = p.risks.filter(x => Number(x.phase) === f.phase).length + 1;
      const rec = { id: uid('risk'), code: `R${f.phase}.${n}`, createdAt: nowISO(), modelRef: defaults.modelRef, ...f };
      p.risks.push(rec); Store.log('riesgo', `Riesgo registrado ${rec.code}: ${rec.title} (P${rec.probability}×I${rec.impact})`, { phase: f.phase });
    } else { const old = r.status; Object.assign(r, f); Store.log('riesgo', `Riesgo ${r.code} actualizado${old !== r.status ? `: ${MODEL.riskStatus[old]} → ${MODEL.riskStatus[r.status]}` : ''}`, { phase: r.phase }); }
    Store.save(); rerender();
  } }] });
}

/* ------------------------------ Reporte ------------------------------ */
const Report = {
  build({ content = true, log = false } = {}) {
    const p = Store.project();
    const sec = (t, h) => `<h2>${t}</h2>${h}`;
    const tbl = (head, rows) => `<table><tr>${head.map(x => `<th>${x}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
    let h = `<div class="cover"><p class="muted">Reporte de trazabilidad · ${today()}</p><h1>${esc(p.name)}</h1><p><b>Componente cuántico:</b> ${esc(p.component)}<br><b>Sistema clásico:</b> ${esc(p.system)}<br><b>Institución:</b> ${esc(p.institution)}<br><b>Responsable:</b> ${esc(p.leader)}<br><b>Recorrido del ciclo:</b> ${p.cycle} · <b>Avance global:</b> ${Store.overallProgress()}%</p><p>${esc(p.description)}</p></div>`;
    h += sec('1. Resumen de fases', tbl(['N.', 'Fase', 'Estado', 'Avance', 'Inicio', 'Cierre', 'Actividades'], MODEL.phases.map(ph => { const s = p.phases[ph.n]; const a = Store.activityProgress(ph.n); return [ph.n, esc(ph.name), MODEL.phaseStatus[s.status].label, Store.phaseProgress(ph.n) + '%', H.date(s.startedAt), H.date(s.completedAt), `${a.done}/${a.total}`]; })));
    h += sec('2. Equipo y roles', tbl(['Integrante', 'Correo', 'Roles'], p.team.map(m => [esc(m.name), esc(m.email || ''), (m.roles || []).map(r => MODEL.role(r).name).join(', ')])) +
      '<h3>Responsables por fase</h3>' + tbl(['Fase', ...MODEL.roles.map(r => r.symbol + ' ' + r.name)], MODEL.phases.map(ph => [ph.n + '. ' + esc(ph.name), ...MODEL.roles.map(r => { const id = p.phases[ph.n].responsible[r.id]; return id ? esc((Store.member(id) || {}).name || '') : ph.roles.includes(r.id) ? '<i>sin asignar</i>' : ''; })])));
    h += sec('3. Requisitos de entrada', p.requirements.length ? tbl(['Código', 'Requisito', 'Tipo', 'Prioridad', 'Artefactos'], p.requirements.map(r => [esc(r.code), esc(r.title) + '<br><small>' + esc(r.description || '') + '</small>', esc(r.type), esc(r.priority), MODEL.internalArtifacts().filter(a => p.artifacts[a.id].trace.includes(r.id)).map(a => a.id).join(', ') || '<i>sin trazar</i>'])) : '<p>Sin requisitos registrados.</p>');
    h += '<h2>4. Detalle por fase</h2>';
    MODEL.phases.forEach(ph => {
      const s = p.phases[ph.n];
      h += `<h3>Fase ${ph.n}. ${esc(ph.name)} — ${MODEL.phaseStatus[s.status].label}</h3><p><b>Propósito:</b> ${esc(ph.purpose)}</p>`;
      h += tbl(['#', 'Actividad', 'Estado', 'Realizó', 'Fecha', 'Nota'], ph.activities.map((a, i) => { const st = s.activities[i] || {}; return [i + 1, esc(a), st.done ? '✓' : '—', esc(st.by || ''), st.done ? H.date(st.date) : '', esc(st.note || '')]; }));
      h += `<p><b>Criterio de salida:</b> ${esc(ph.exit)}<br><b>Cumplido:</b> ${s.exit.met ? 'Sí — ' + esc(s.exit.by || '') + ' (' + H.date(s.exit.date) + ')' : 'No'}${s.exit.justification ? '<br><b>Justificación:</b> ' + esc(s.exit.justification) : ''}</p>`;
      if (s.notes) h += `<p><b>Notas:</b> ${esc(s.notes).replace(/\n/g, '<br>')}</p>`;
    });
    h += sec('5. Artefactos', tbl(['Fase', 'Artefacto', 'Estado', 'Versión', 'Completitud', 'Aprobó'], MODEL.internalArtifacts().map(a => { const s = p.artifacts[a.id]; return [a.phase, a.id, MODEL.artifactStatus[s.status].label, 'v' + s.version, Store.artifactCompleteness(a.id) + '%', s.status === 'aprobado' ? esc(s.approvedBy || '') + ' · ' + H.date(s.approvedAt) : '']; })));
    if (content) MODEL.internalArtifacts().forEach(a => { if (Store.artifactCompleteness(a.id) > 0) h += `<div class="pb"></div>` + Templates.artifactHTML(a.id, { project: p, state: p.artifacts[a.id], reqs: p.artifacts[a.id].trace.map(id => (p.requirements.find(r => r.id === id) || {}).code).filter(Boolean) }); });
    h += sec('6. Puntos de decisión', p.decisions.length ? tbl(['Fecha', 'DP', 'Recorrido', 'Decisión', 'Motivo', 'Cambio a evaluar', 'Registró'], p.decisions.map(d => [H.dt(d.date), d.dp, d.cycle, d.decision === 'avanzar' ? 'Avanzar' : 'Iterar → F' + d.target + ' (' + MODEL.iterationKinds[d.kind].label + ')', esc(d.reason), esc(d.change || ''), esc(d.by)])) : '<p>Sin decisiones.</p>');
    h += sec('7. Iteraciones', p.iterations.length ? tbl(['Fecha', 'Retorno', 'Tipo', 'Motivo', 'Cambio', 'Estado'], p.iterations.map(i => [H.dt(i.date), `F${i.from} → F${i.to}`, MODEL.iterationKinds[i.kind].label, esc(i.reason), esc(i.change || ''), i.status])) : '<p>Sin iteraciones.</p>');
    h += sec('8. Registro de riesgos', p.risks.length ? tbl(['ID', 'Fase', 'Riesgo', 'P', 'I', 'Exp.', 'Mitigación', 'Responsable', 'Estado'], p.risks.map(r => [r.code, r.phase, esc(r.title), r.probability, r.impact, r.probability * r.impact, esc(r.mitigation || ''), esc((Store.member(r.ownerId) || {}).name || ''), MODEL.riskStatus[r.status]])) : '<p>Sin riesgos.</p>');
    if (log) h += sec('9. Bitácora', tbl(['Fecha', 'Usuario', 'Tipo', 'Evento'], p.log.map(l => [H.dt(l.date), esc(l.user), l.type, esc(l.message)])));
    return h;
  },
  printHTML(body, title) {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
      body{font-family:Georgia,'Times New Roman',serif;color:#1e293b;max-width:960px;margin:24px auto;padding:0 24px;font-size:11pt;line-height:1.45}
      h1{color:#1e3a8a;font-size:24pt;margin:.2em 0} h2{color:#1e3a8a;border-bottom:2px solid #1e3a8a;padding-bottom:3px;margin-top:28px;font-size:15pt} h3{color:#334155;font-size:12pt;margin-top:18px}
      table{border-collapse:collapse;width:100%;margin:8px 0;font-family:Arial,sans-serif;font-size:9pt} th,td{border:1px solid #cbd5e1;padding:4px 6px;vertical-align:top;text-align:left} th{background:#e2e8f0}
      .muted{color:#64748b}.hint{color:#64748b;font-style:italic;font-size:9pt}.box{border:1px dashed #cbd5e1;min-height:30px} blockquote{border-left:3px solid #1e3a8a;margin:0;padding-left:10px;color:#475569}
      .cover{border:1px solid #cbd5e1;padding:24px;border-radius:8px;background:#f8fafc} .pb{page-break-before:always}
      @media print{body{margin:0} .noprint{display:none}}
    </style></head><body><p class="noprint" style="text-align:right"><button onclick="print()">Imprimir / Guardar como PDF</button></p>${body}</body></html>`;
  }
};

/* ------------------------------ CSV ------------------------------ */
function csvDownload(name, rows) { download(name, toCSV(rows), 'text/csv;charset=utf-8'); }
const slug = s => (s || 'proyecto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 40);

/* ------------------------------ Acciones ------------------------------ */
const save = () => Store.save();
const saveDebounced = (() => { let t; return () => { clearTimeout(t); const ind = document.getElementById('save-ind'); if (ind) ind.textContent = 'Guardando…'; t = setTimeout(() => { Store.save(); if (ind) ind.textContent = 'Guardado ✓ ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }, 500); }; })();

function newProjectModal() {
  UI.modal({ title: 'Nuevo proyecto', body: `<div class="form-col"><p class="small muted">Un proyecto corresponde a un componente cuántico que recorrerá el ciclo de vida.</p>
    <label>Nombre del proyecto *<input name="name" placeholder="p. ej. Optimización de portafolio con VQE"></label>
    <label>Componente cuántico (función asignada)<input name="component"></label>
    <label>Sistema clásico anfitrión<input name="system"></label>
    <div class="form-row"><label>Institución<input name="institution" value="CENIDET"></label><label>Responsable<input name="leader"></label></div>
    <div class="form-row"><label>Fecha de inicio<input type="date" name="startDate" value="${new Date().toISOString().slice(0, 10)}"></label><label>Fecha objetivo<input type="date" name="dueDate"></label></div>
    <label>Descripción<textarea name="description" rows="3"></textarea></label></div>`,
    actions: [{ label: 'Cancelar' }, { label: 'Crear proyecto', cls: 'btn-primary', onClick: root => { const f = UI.form(root); if (!f.name) { UI.toast('Indique un nombre.', 'error'); return false; } Store.newProject(f); location.hash = '#/equipo'; render(); UI.toast('Proyecto creado. Comience registrando al equipo.'); } }] });
}

function updateDpHints(form) {
  const mode = (form.querySelector('[name=dec]:checked') || {}).value;
  form.querySelector('.dp-iter').classList.toggle('hidden', mode !== 'iterar');
  const adv = form.querySelector('.dp-adv'); if (adv) adv.classList.toggle('hidden', mode === 'iterar');
  const i = form.querySelector('[name=target]').value;
  form.querySelectorAll('.rh').forEach(x => x.classList.toggle('on', x.dataset.i === i));
}

const Actions = {
  'menu-toggle': () => document.body.classList.toggle('nav-open'),
  'new-project': newProjectModal,
  'load-demo': () => { Demo.create(); location.hash = '#/dashboard'; render(); UI.toast('Proyecto de ejemplo cargado.'); },
  tab: el => { UIState.phaseTab[el.dataset.n] = el.dataset.tab; if (location.hash.includes('?')) history.replaceState(null, '', '#/fase/' + el.dataset.n); rerender(); },

  /* Fases */
  'phase-start': async el => {
    const n = Number(el.dataset.n);
    if (!Store.isPhaseUnlocked(n) && !(await UI.confirm(`La fase ${n - 1} no está completada. ¿Iniciar la fase ${n} de todos modos?`))) return;
    const s = Store.phaseState(n), p = Store.project();
    MODEL.phase(n).roles.forEach(r => { if (!s.responsible[r]) { const ms = Store.membersForRole(r); if (ms.length === 1) s.responsible[r] = ms[0].id; } });
    Store.setPhaseStatus(n, 'en_progreso');
    MODEL.phase(n).outputs.forEach(id => { if (p.artifacts[id].status === 'pendiente') { p.artifacts[id].status = 'en_elaboracion'; } });
    save(); rerender(); UI.toast(`Fase ${n} iniciada.`);
  },
  'phase-review': el => { Store.setPhaseStatus(Number(el.dataset.n), 'en_revision'); save(); rerender(); },
  'phase-back': el => { Store.setPhaseStatus(Number(el.dataset.n), 'en_progreso'); save(); rerender(); },
  'phase-close': async el => {
    const n = Number(el.dataset.n);
    const checks = Store.closeChecks(n);
    const errors = checks.filter(c => c.level === 'error');
    if (errors.length) {
      UI.modal({ title: `No es posible cerrar la fase ${n}`, body: `<p>Resuelva lo siguiente antes de cerrar la fase:</p><ul class="checks">${checks.map(c => `<li class="lvl-${c.level}">${c.level === 'error' ? '✕' : '!'} ${esc(c.text)}</li>`).join('')}</ul>`, actions: [{ label: 'Entendido', cls: 'btn-primary' }, { label: 'Ver criterio de salida', onClick: () => { UIState.phaseTab[n] = 'salida'; rerender(); } }] });
      return;
    }
    if (checks.length && !(await UI.confirm(`Advertencias:<ul class="checks">${checks.map(c => `<li class="lvl-warn">! ${esc(c.text)}</li>`).join('')}</ul>¿Cerrar la fase de todos modos?`, { ok: 'Cerrar fase' }))) return;
    Store.setPhaseStatus(n, 'completada');
    save(); UI.toast(`Fase ${n} completada ✓`);
    if (n < 11) location.hash = '#/fase/' + (n + 1); else rerender();
  },
  'phase-reopen': async el => {
    const n = Number(el.dataset.n);
    const why = await UI.prompt('Reabrir fase ' + n, 'Motivo de la reapertura', { required: true }); if (!why) return;
    Store.phaseState(n).exit.met = false;
    Store.setPhaseStatus(n, 'en_progreso', why); save(); rerender();
  },

  /* Decisiones */
  'dp-submit': async el => {
    const n = Number(el.dataset.n), ph = MODEL.phase(n), dp = MODEL.decisionPoints[ph.dp], p = Store.project();
    const form = document.getElementById('dp-form');
    const f = UI.form(form);
    if (!f.reason) return UI.toast('Indique el motivo o fundamento de la decisión.', 'error');
    const rec = { dp: dp.id, decision: f.dec, reason: f.reason, participants: f.part || [] };
    if (f.dec === 'iterar') {
      const r = dp.returns[Number(f.target)];
      if (!f.change) return UI.toast('Especifique el cambio que se evaluará.', 'error');
      if (r.sub === 'evolutivo' && !(await UI.confirm('El mantenimiento evolutivo requiere que los requisitos nuevos o modificados se hayan definido previamente en el proceso clásico externo. ¿Confirma que ya están definidos?'))) return;
      Object.assign(rec, { target: r.to, kind: r.kind, sub: r.sub, change: f.change });
      if (!(await UI.confirm(`Se reabrirá la fase ${r.to} y se crearán nuevas versiones de los artefactos producidos desde esa fase. Las validaciones posteriores deberán recorrerse nuevamente.`, { ok: 'Registrar iteración' }))) return;
    } else {
      const warn = [];
      if (p.phases[n - 1] && p.phases[n - 1].status !== 'completada') warn.push(`La fase ${n - 1} no está completada.`);
      ph.outputs.concat(dp.evidence).filter((v, i, a) => a.indexOf(v) === i).forEach(id => { if (p.artifacts[id].status !== 'aprobado') warn.push(`${id} no está aprobado.`); });
      const pend = dp.checks.filter((_, i) => !p.phases[n].dpChecks[i]).length;
      if (pend) warn.push(`${pend} elemento(s) de la lista de verificación sin marcar.`);
      const a = Store.activityProgress(n); if (a.done < a.total) warn.push(`Actividades de la fase: ${a.done}/${a.total}.`);
      if (warn.length && !(await UI.confirm(`La evidencia está incompleta:<ul class="checks">${warn.map(w => `<li class="lvl-warn">! ${esc(w)}</li>`).join('')}</ul>¿Autorizar el avance de todos modos? La decisión quedará registrada.`, { ok: 'Autorizar avance' }))) return;
      if (f.maint) rec.maintenanceNote = f.maint;
    }
    Store.registerDecision(rec); save();
    UI.toast(`${dp.id} registrado: ${rec.decision === 'avanzar' ? 'avanzar a la fase ' + dp.next : 'iterar hacia la fase ' + rec.target}.`);
    location.hash = '#/fase/' + (rec.decision === 'avanzar' ? dp.next : rec.target);
  },
  'maint-new': () => {
    const p = Store.project();
    UI.modal({ title: 'Nuevo recorrido por mantenimiento', body: `<div class="form-col"><p class="small">Los retornos de mantenimiento se limitan al componente cuántico y no presuponen que lo validado esté mal.</p>
      <div class="seg col"><label><input type="radio" name="type" value="1" checked> <b>Evolutivo → Fase 1.</b> Modificar o ampliar la funcionalidad, nuevas restricciones del problema.</label><label><input type="radio" name="type" value="6"> <b>Adaptativo → Fase 6.</b> Cambio de dispositivo/backend o de sus condiciones.</label></div>
      <label class="chk"><input type="checkbox" name="ok" value="1"> Los requisitos nuevos o modificados ya fueron definidos en el proceso clásico externo (solo evolutivo).</label>
      <label>Motivo *<textarea name="reason" rows="2"></textarea></label><label>Cambio que se evaluará *<textarea name="change" rows="2"></textarea></label></div>`,
      actions: [{ label: 'Cancelar' }, { label: 'Iniciar recorrido', cls: 'btn-primary', onClick: root => {
        const f = UI.form(root); const to = Number(f.type);
        if (!f.reason || !f.change) { UI.toast('Complete motivo y cambio.', 'error'); return false; }
        if (to === 1 && !(f.ok || []).length) { UI.toast('Confirme que los requisitos fueron definidos externamente.', 'error'); return false; }
        const from = p.phases[11].status === 'completada' ? 11 : 9;
        Store.startIteration({ from, to, kind: 'mantenimiento', sub: to === 1 ? 'evolutivo' : 'adaptativo', reason: f.reason, change: f.change });
        save(); location.hash = '#/fase/' + to; UI.toast(`Recorrido ${p.cycle} iniciado.`);
      } }] });
  },

  /* Artefactos */
  'art-status': async el => {
    const id = el.dataset.id, st = el.dataset.st;
    let note = '';
    if (st === 'requiere_cambios') { note = await UI.prompt('Solicitar cambios', 'Describa los cambios requeridos', { required: true }); if (!note) return; }
    if (st === 'aprobado') {
      const c = Store.artifactCompleteness(id);
      const files = (await Store.files().catch(() => [])).filter(f => f.artifact === id).length;
      if (c < 60 && !files && !(await UI.confirm(`El artefacto tiene ${c}% de completitud y no tiene archivos adjuntos. ¿Aprobarlo de todos modos?`, { ok: 'Aprobar' }))) return;
      note = (await UI.prompt('Aprobar ' + id, 'Comentario de aprobación (opcional)')) || '';
    }
    Store.setArtifactStatus(id, st, note); save(); rerender(); UI.toast(`${id}: ${MODEL.artifactStatus[st].label}`);
  },
  'art-bump': async el => {
    const why = await UI.prompt('Nueva versión de ' + el.dataset.id, 'Motivo de la nueva versión', { required: true }); if (!why) return;
    Store.bumpArtifact(el.dataset.id, why); save(); rerender();
  },
  'art-export': el => { const p = Store.project(); const a = p.artifacts[el.dataset.id]; Templates.downloadArtifact(el.dataset.id, el.dataset.fmt, { project: p, state: a, reqs: a.trace.map(id => (p.requirements.find(r => r.id === id) || {}).code).filter(Boolean) }); },
  'art-snapshot': el => {
    const id = el.dataset.id, h = Store.project().artifacts[id].history[Number(el.dataset.i)];
    const def = MODEL.artifact(id);
    UI.modal({ title: `${id} — instantánea v${h.version}`, wide: true, body: `<div class="doc-preview">${def.fields.map(f => { const v = h.snapshot[f.id]; return `<h4>${esc(f.label)}</h4>${f.type === 'table' ? (Array.isArray(v) ? `<table class="tbl small"><tr>${f.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${v.map(r => `<tr>${f.columns.map((_, j) => `<td>${esc(r[j] || '')}</td>`).join('')}</tr>`).join('')}</table>` : '<p class="muted">—</p>') : `<p>${esc(v || '—').replace(/\n/g, '<br>')}</p>`}`; }).join('')}</div>` });
  },
  'row-add': el => { const a = Store.project().artifacts[el.dataset.art]; const f = MODEL.artifact(el.dataset.art).fields.find(x => x.id === el.dataset.field); ensureTable(a, f).push(f.columns.map(() => '')); touchArtifact(el.dataset.art); save(); rerender(); },
  'row-del': el => { const a = Store.project().artifacts[el.dataset.art]; const f = MODEL.artifact(el.dataset.art).fields.find(x => x.id === el.dataset.field); const t = ensureTable(a, f); t.splice(Number(el.dataset.r), 1); if (!t.length) t.push(f.columns.map(() => '')); save(); rerender(); },
  'trace-toggle': el => { toggleTrace(el.dataset.id, el.dataset.req); save(); rerender(); },

  /* Plantillas */
  'tpl-art': el => Templates.downloadArtifact(el.dataset.id, el.dataset.fmt, { project: Store.project() }),
  'tpl-extra': el => Templates.downloadExtra(el.dataset.key),
  'tpl-zip': () => Templates.downloadAllZip(),
  'tpl-risk-csv': () => download('Registro_de_Riesgos_plantilla.csv', Templates.riskCSV(), 'text/csv;charset=utf-8'),
  'tpl-risk-csv-proj': () => { const p = Store.project(); download(`Riesgos_${slug(p.name)}.csv`, Templates.riskCSV(p.risks.map(r => ({ ...r, ownerName: (Store.member(r.ownerId) || {}).name }))), 'text/csv;charset=utf-8'); },
  'tpl-preview': el => UI.modal({ title: 'Vista previa — ' + el.dataset.id, wide: true, body: `<div class="doc-preview">${Templates.artifactHTML(el.dataset.id, { project: Store.project() })}</div>`, actions: [{ label: 'Descargar Word', cls: 'btn-primary', onClick: () => { Templates.downloadArtifact(el.dataset.id, 'doc', { project: Store.project() }); return false; } }, { label: 'Cerrar' }] }),

  /* Archivos */
  upload: el => openUpload({ artifact: el.dataset.artifact, phase: el.dataset.phase ? Number(el.dataset.phase) : null }),
  'file-preview': (el, e) => { e.preventDefault(); previewFile(el.dataset.id); },
  'file-download': async el => { const f = await FileDB.get(el.dataset.id); if (f) download(f.name, f.blob); },
  'file-del': async el => {
    const f = await FileDB.get(el.dataset.id); if (!f) return;
    if (!(await UI.confirm(`¿Eliminar el archivo «${esc(f.name)}»? Esta acción no se puede deshacer.`, { ok: 'Eliminar', danger: true }))) return;
    await FileDB.del(f.id); Store.log('archivo', `Archivo eliminado: ${f.name}`, { phase: f.phase }); save(); rerender();
  },
  'file-edit': async el => {
    const f = await FileDB.get(el.dataset.id); if (!f) return;
    UI.modal({ title: 'Editar archivo', body: `<div class="form-col"><p><b>${esc(f.name)}</b></p><label>Categoría<select name="category">${FILE_CATEGORIES.map(c => `<option ${f.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>Nota<input name="note" value="${esc(f.note || '')}"></label><label>Etiquetas<input name="tags" value="${esc((f.tags || []).join(', '))}"></label></div>`,
      actions: [{ label: 'Cancelar' }, { label: 'Guardar', cls: 'btn-primary', onClick: async root => { const v = UI.form(root); f.category = v.category; f.note = v.note; f.tags = v.tags.split(',').map(s => s.trim()).filter(Boolean); await FileDB.put(f); rerender(); } }] });
  },

  /* Equipo */
  'member-edit': el => {
    const p = Store.project(); const m = el.dataset.id ? Store.member(el.dataset.id) : null;
    UI.modal({ title: m ? 'Editar integrante' : 'Agregar integrante', body: memberForm(m || {}), actions: [{ label: 'Cancelar' }, { label: 'Guardar', cls: 'btn-primary', onClick: root => {
      const f = UI.form(root); if (!f.name) { UI.toast('Indique el nombre.', 'error'); return false; }
      f.roles = f.roles || [];
      if (m) { Object.assign(m, f); Store.log('equipo', `Integrante actualizado: ${m.name} (${f.roles.map(r => MODEL.role(r).symbol).join('') || 'sin rol'})`); }
      else { const nm = { id: uid('mem'), ...f }; p.team.push(nm); if (!p.currentUserId) p.currentUserId = nm.id; Store.log('equipo', `Integrante agregado: ${nm.name} — ${f.roles.map(r => MODEL.role(r).name).join(', ') || 'sin rol'}`); }
      save(); rerender();
    } }] });
  },
  'member-del': async el => {
    const p = Store.project(), m = Store.member(el.dataset.id);
    if (!(await UI.confirm(`¿Eliminar a ${esc(m.name)} del equipo? Se quitará de las responsabilidades asignadas.`, { ok: 'Eliminar', danger: true }))) return;
    p.team = p.team.filter(x => x.id !== m.id);
    MODEL.phases.forEach(ph => { const r = p.phases[ph.n].responsible; Object.keys(r).forEach(k => { if (r[k] === m.id) delete r[k]; }); });
    if (p.currentUserId === m.id) p.currentUserId = null;
    Store.log('equipo', `Integrante eliminado: ${m.name}`); save(); rerender();
  },
  'set-user': el => { Store.project().currentUserId = el.dataset.id; save(); rerender(); UI.toast('Integrante activo: ' + esc(Store.currentUser().name)); },
  'auto-assign': () => {
    const p = Store.project(); let c = 0;
    MODEL.phases.forEach(ph => ph.roles.forEach(r => { const s = p.phases[ph.n]; if (!s.responsible[r]) { const ms = Store.membersForRole(r); if (ms.length) { s.responsible[r] = ms[0].id; c++; } } }));
    Store.log('equipo', `Asignación automática de responsables: ${c} asignaciones`); save(); rerender(); UI.toast(`${c} responsabilidades asignadas.`);
  },

  /* Requisitos */
  'req-edit': el => {
    const p = Store.project(); const r = el.dataset.id ? p.requirements.find(x => x.id === el.dataset.id) : null;
    const code = r ? r.code : 'RQ-' + String(p.requirements.length + 1).padStart(2, '0');
    UI.modal({ title: r ? 'Editar requisito' : 'Nuevo requisito', body: `<div class="form-col"><div class="form-row"><label>Código *<input name="code" value="${esc(code)}"></label><label>Tipo<select name="type">${['Funcional', 'No funcional', 'Restricción', 'Interfaz', 'Rendimiento', 'Calidad'].map(t => `<option ${r && r.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label>Prioridad<select name="priority">${['Alta', 'Media', 'Baja'].map(t => `<option ${r && r.priority === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <label>Título *<input name="title" value="${esc(r ? r.title : '')}"></label><label>Descripción<textarea name="description" rows="3">${esc(r ? r.description : '')}</textarea></label>
      <label>Origen (documento de requisitos, acta…)<input name="source" value="${esc(r ? r.source : '')}"></label></div>`,
      actions: [{ label: 'Cancelar' }, { label: 'Guardar', cls: 'btn-primary', onClick: root => {
        const f = UI.form(root); if (!f.code || !f.title) { UI.toast('Código y título son obligatorios.', 'error'); return false; }
        if (r) Object.assign(r, f); else p.requirements.push({ id: uid('req'), ...f });
        Store.log('requisito', `${r ? 'Requisito actualizado' : 'Requisito registrado'}: ${f.code} ${f.title}`, { phase: 1 }); save(); rerender();
      } }] });
  },
  'req-del': async el => {
    const p = Store.project(); const r = p.requirements.find(x => x.id === el.dataset.id);
    if (!(await UI.confirm(`¿Eliminar el requisito ${esc(r.code)}? Se eliminarán sus vínculos de trazabilidad.`, { ok: 'Eliminar', danger: true }))) return;
    p.requirements = p.requirements.filter(x => x.id !== r.id);
    Object.values(p.artifacts).forEach(a => { a.trace = a.trace.filter(t => t !== r.id); });
    Store.log('requisito', `Requisito eliminado: ${r.code}`); save(); rerender();
  },

  /* Riesgos */
  'risk-edit': el => { const p = Store.project(); openRisk(el.dataset.id ? p.risks.find(r => r.id === el.dataset.id) : null, { phase: Number(el.dataset.phase) || Store.currentPhase() || 1, probability: 3, impact: 3, status: 'abierto' }); },
  'risk-from-model': el => { const n = Number(el.dataset.n), i = Number(el.dataset.i); openRisk(null, { phase: n, title: MODEL.phase(n).risks[i], modelRef: `${n}.${i}`, probability: 3, impact: 3, status: 'abierto' }); },
  'risk-del': async el => {
    const p = Store.project(); const r = p.risks.find(x => x.id === el.dataset.id);
    if (!(await UI.confirm(`¿Eliminar el riesgo ${esc(r.code)}?`, { ok: 'Eliminar', danger: true }))) return;
    p.risks = p.risks.filter(x => x.id !== r.id); Store.log('riesgo', `Riesgo eliminado: ${r.code}`, { phase: r.phase }); save(); rerender();
  },
  'risk-seed': () => {
    const p = Store.project(); let c = 0;
    MODEL.phases.forEach(ph => ph.risks.forEach((t, i) => {
      if (p.risks.some(r => r.modelRef === `${ph.n}.${i}`)) return;
      const n = p.risks.filter(x => Number(x.phase) === ph.n).length + 1;
      p.risks.push({ id: uid('risk'), code: `R${ph.n}.${n}`, phase: ph.n, title: t, description: '', category: MODEL.phaseRiskCategory[ph.n], probability: 3, impact: 3, mitigation: '', ownerId: '', status: 'abierto', createdAt: nowISO(), modelRef: `${ph.n}.${i}` }); c++;
    }));
    Store.log('riesgo', `${c} riesgos importados desde el modelo del ciclo`); save(); rerender(); UI.toast(`${c} riesgos importados. Ajuste probabilidad e impacto.`);
  },

  /* Exportaciones */
  'export-trace': () => {
    const p = Store.project(); const arts = MODEL.internalArtifacts();
    csvDownload(`Trazabilidad_${slug(p.name)}.csv`, [['Requisito', 'Título', ...arts.map(a => a.id)], ...p.requirements.map(r => [r.code, r.title, ...arts.map(a => p.artifacts[a.id].trace.includes(r.id) ? 'X' : '')])]);
  },
  'export-decisions': () => {
    const p = Store.project();
    csvDownload(`Decisiones_${slug(p.name)}.csv`, [['Tipo', 'Fecha', 'DP/Origen', 'Recorrido', 'Decisión/Destino', 'Clase', 'Motivo', 'Cambio', 'Registró'],
      ...p.decisions.map(d => ['Decisión', d.date, d.dp, d.cycle, d.decision === 'avanzar' ? 'Avanzar' : 'Iterar → F' + d.target, d.kind || '', d.reason, d.change || '', d.by]),
      ...p.iterations.map(i => ['Iteración', i.date, 'F' + i.from, i.cycle, 'F' + i.to, i.kind + (i.sub ? ' ' + i.sub : ''), i.reason, i.change || '', i.by])]);
  },
  'export-log': () => { const p = Store.project(); csvDownload(`Bitacora_${slug(p.name)}.csv`, [['Fecha', 'Usuario', 'Tipo', 'Fase', 'Recorrido', 'Evento'], ...p.log.map(l => [l.date, l.user, l.type, l.phase || '', l.cycle || 1, l.message])]); },
  report: el => {
    const p = Store.project();
    const opts = { content: document.getElementById('rep-content').checked, log: document.getElementById('rep-log').checked };
    const body = Report.build(opts);
    const name = `Reporte_${slug(p.name)}_${new Date().toISOString().slice(0, 10)}`;
    if (el.dataset.fmt === 'doc') download(name + '.doc', Templates.wordHTML('Reporte ' + p.name, body), 'application/msword');
    else if (el.dataset.fmt === 'html') download(name + '.html', Report.printHTML(body, p.name), 'text/html;charset=utf-8');
    else { const w = window.open('', '_blank'); if (!w) return UI.toast('Permita ventanas emergentes para ver el reporte.', 'error'); w.document.write(Report.printHTML(body, p.name)); w.document.close(); }
    Store.log('reporte', `Reporte generado (${el.dataset.fmt})`); save();
  },
  'export-json': async el => {
    const p = Store.project();
    try { const data = await Store.exportProject(el.dataset.files === '1'); download(`Respaldo_${slug(p.name)}_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data), 'application/json'); Store.log('respaldo', 'Respaldo exportado' + (el.dataset.files === '1' ? ' con archivos' : '')); save(); }
    catch (e) { UI.toast('Error al exportar: ' + e.message, 'error'); }
  },

  /* Proyecto */
  'project-save': () => { const p = Store.project(); Object.assign(p, UI.form(document.getElementById('proj-form'))); Store.log('proyecto', 'Datos generales actualizados'); save(); rerender(); UI.toast('Cambios guardados.'); },
  'project-open': el => { Store.state.currentProjectId = el.dataset.id; save(); location.hash = '#/dashboard'; render(); },
  'project-del': async el => {
    const x = Store.state.projects[el.dataset.id];
    const v = await UI.prompt('Eliminar proyecto', `Esta acción elimina el proyecto y sus archivos de este navegador. Escriba <b>ELIMINAR</b> para confirmar el borrado de «${esc(x.name)}».`, { multiline: false });
    if (v !== 'ELIMINAR') { if (v !== null) UI.toast('Confirmación incorrecta.', 'error'); return; }
    await Store.deleteProject(x.id); location.hash = '#/dashboard'; render(); UI.toast('Proyecto eliminado.');
  },
  'project-dup': async () => { const data = await Store.exportProject(true); data.project = JSON.parse(JSON.stringify(data.project)); data.project.name += ' (copia)'; data.project.id = uid('prj'); data.files = data.files.map(f => ({ ...f, id: uid('file') })); await Store.importProject(data); render(); UI.toast('Proyecto duplicado.'); }
};

function ensureTable(a, f) {
  if (!Array.isArray(a.fields[f.id]) || !a.fields[f.id].length) a.fields[f.id] = f.seed ? f.seed.map(r => [...r]) : [f.columns.map(() => '')];
  return a.fields[f.id];
}
function touchArtifact(id) {
  const a = Store.project().artifacts[id];
  if (a.status === 'pendiente') { a.status = 'en_elaboracion'; Store.log('artefacto', `${id} v${a.version}: Pendiente → En elaboración`, { phase: MODEL.artifact(id).phase, artifact: id }); }
  if (!a.ownerId && Store.currentUser()) { a.ownerId = Store.currentUser().id; a.owner = Store.currentUser().name; }
}
function toggleTrace(artId, reqId) {
  const p = Store.project(), a = p.artifacts[artId];
  const on = a.trace.includes(reqId);
  a.trace = on ? a.trace.filter(x => x !== reqId) : [...a.trace, reqId];
  const r = p.requirements.find(x => x.id === reqId);
  Store.log('trazabilidad', `${on ? 'Desvinculado' : 'Vinculado'} ${r ? r.code : reqId} ↔ ${artId}`, { artifact: artId });
}

/* ------------------------------ Cambios (inputs) ------------------------------ */
const Changes = {
  'import-json': async el => {
    const file = el.files[0]; if (!file) return;
    try { const json = JSON.parse(await file.text()); const p = await Store.importProject(json); location.hash = '#/dashboard'; render(); UI.toast(`Proyecto «${esc(p.name)}» importado.`); }
    catch (e) { UI.toast('No se pudo importar: ' + e.message, 'error'); }
    el.value = '';
  },
  layer: el => { UIState.diagramLayers[el.dataset.layer] = el.checked; rerender(); },
  'phase-field': el => { Store.phaseState(el.dataset.n)[el.dataset.key] = el.value; save(); if (el.type === 'date') rerender(); },
  activity: el => {
    const n = Number(el.dataset.n), i = el.dataset.i, s = Store.phaseState(n), u = Store.currentUser();
    s.activities[i] = { ...(s.activities[i] || {}), done: el.checked, by: u ? u.name : 'Sin usuario', byId: u ? u.id : null, date: nowISO() };
    if (el.checked && (s.status === 'no_iniciada' || s.status === 'reabierta')) Store.setPhaseStatus(n, 'en_progreso');
    Store.log('actividad', `Fase ${n}, actividad ${Number(i) + 1} ${el.checked ? 'completada' : 'desmarcada'}: ${MODEL.phase(n).activities[i]}`, { phase: n });
    save(); rerender();
  },
  'activity-note': el => { const s = Store.phaseState(el.dataset.n); s.activities[el.dataset.i] = { ...(s.activities[el.dataset.i] || {}), note: el.value }; save(); },
  'phase-resp': el => {
    const n = Number(el.dataset.n), s = Store.phaseState(n);
    if (el.value) s.responsible[el.dataset.role] = el.value; else delete s.responsible[el.dataset.role];
    Store.log('equipo', `Fase ${n}: ${MODEL.role(el.dataset.role).name} → ${el.value ? Store.member(el.value).name : 'sin asignar'}`, { phase: n }); save(); rerender();
  },
  'exit-met': el => {
    const n = Number(el.dataset.n), s = Store.phaseState(n), u = Store.currentUser();
    s.exit = { ...s.exit, met: el.checked, by: u ? u.name : 'Sin usuario', date: nowISO() };
    Store.log('fase', `Fase ${n}: criterio de salida ${el.checked ? 'confirmado' : 'desmarcado'}`, { phase: n }); save(); rerender();
  },
  'exit-just': el => { Store.phaseState(el.dataset.n).exit.justification = el.value; save(); },
  'dp-check': el => { Store.phaseState(el.dataset.n).dpChecks[el.dataset.i] = el.checked; save(); rerender(); },
  'dp-mode': () => updateDpHints(document.getElementById('dp-form')),
  'art-owner': el => { const a = Store.project().artifacts[el.dataset.id]; a.ownerId = el.value; a.owner = el.value ? Store.member(el.value).name : ''; save(); },
  'art-trace': el => { toggleTrace(el.dataset.id, el.dataset.req); save(); },
  'impact-art': el => { UIState.impactArt = el.value; rerender(); },
  'risk-filter': el => { UIState.riskFilter[el.dataset.key] = el.value; rerender(); },
  'risk-status': el => { const r = Store.project().risks.find(x => x.id === el.dataset.id); const old = r.status; r.status = el.value; Store.log('riesgo', `Riesgo ${r.code}: ${MODEL.riskStatus[old]} → ${MODEL.riskStatus[r.status]}`, { phase: r.phase }); save(); rerender(); },
  'file-filter': el => { UIState.fileFilter[el.dataset.key] = el.value; hydrateFiles(); },
  'log-filter': el => { UIState.logFilter[el.dataset.key] = el.value; rerender(); },
  theme: el => { Store.state.theme = el.value; applyTheme(); save(); },
  'project-switch': el => { Store.state.currentProjectId = el.value; save(); render(); },
  'current-user': el => { Store.project().currentUserId = el.value || null; save(); rerender(); }
};

function applyTheme() {
  const t = Store.state.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
}

/* ------------------------------ Eventos globales ------------------------------ */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = Actions[el.dataset.action];
  if (fn) { if (el.tagName === 'A' || el.tagName === 'TD') e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el && Changes[el.dataset.change]) Changes[el.dataset.change](el, e);
  if (e.target.matches('#dp-form [name=target]')) updateDpHints(document.getElementById('dp-form'));
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('[data-art][data-field]')) {
    const id = el.dataset.art, a = Store.project().artifacts[id];
    if (el.hasAttribute('data-cell')) {
      const f = MODEL.artifact(id).fields.find(x => x.id === el.dataset.field);
      const t = ensureTable(a, f);
      while (t.length <= Number(el.dataset.r)) t.push(f.columns.map(() => ''));
      t[el.dataset.r][el.dataset.c] = el.value;
    } else a.fields[el.dataset.field] = el.value;
    touchArtifact(id);
    if (el.tagName === 'TEXTAREA') autogrow(el);
    const ci = document.getElementById('art-comp'); if (ci) ci.textContent = `Completitud ${Store.artifactCompleteness(id)}%`;
    saveDebounced();
  }
  if (el.matches('[data-change="file-filter"][type=search]')) { UIState.fileFilter.q = el.value; hydrateFiles(); }
});
window.addEventListener('hashchange', () => render());
window.addEventListener('storage', e => { if (e.key === STORE_KEY) { Store.load(); render(true); } });

/* ------------------------------ Inicio ------------------------------ */
Store.load();
if (new URLSearchParams(location.search).has('demo')) {
  const ex = Object.values(Store.state.projects).find(x => x.name.startsWith('Ejemplo'));
  if (ex) Store.state.currentProjectId = ex.id; else Demo.create();
  history.replaceState(null, '', location.pathname + (location.hash || '#/dashboard'));
}
applyTheme();
document.getElementById('theme-toggle').addEventListener('click', () => {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
  Store.state.theme = dark ? 'light' : 'dark'; applyTheme(); Store.save();
});
render();
