/* =========================================================================
   Vistas de la aplicación (render a HTML)
   ========================================================================= */
'use strict';

const UIState = { phaseTab: {}, fileFilter: { q: '', phase: '', cat: '' }, logFilter: { q: '', type: '', phase: '' }, riskFilter: { phase: '', status: '' }, impactArt: 'ProblemAnalysisDocument', diagramLayers: { DP1: true, DP2: true, DP3e: true, DP3m: true } };

const H = {
  date: iso => iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  dt: iso => iso ? new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
  size: b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB',
  badge: o => `<span class="badge ${o.cls}">${o.label}</span>`,
  phaseBadge: n => H.badge(MODEL.phaseStatus[Store.phaseState(n).status]),
  artBadge: id => H.badge(MODEL.artifactStatus[Store.project().artifacts[id].status]),
  bar: (pct, cls = '') => `<div class="bar ${cls}" title="${pct}%"><span style="width:${pct}%"></span></div>`,
  ring(pct, size = 120, stroke = 10, label) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${pct}%">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" class="ring-bg"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="${label ? '46%' : '50%'}" dominant-baseline="middle" text-anchor="middle" class="ring-txt">${pct}%</text>
      ${label ? `<text x="50%" y="64%" dominant-baseline="middle" text-anchor="middle" class="ring-lbl">${label}</text>` : ''}</svg>`;
  },
  role: (id, short) => { const r = MODEL.role(id); return `<span class="role-chip" style="--c:${r.color}" title="${esc(r.name)}">${r.symbol}${short ? '' : ' ' + esc(r.name)}</span>`; },
  initials: n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(),
  avatar(m, size = '') { if (!m) return ''; const hue = [...m.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360; return `<span class="avatar ${size}" style="--h:${hue}" title="${esc(m.name)}">${H.initials(m.name)}</span>`; },
  member(id) { const m = Store.member(id); return m ? `<span class="member">${H.avatar(m, 'sm')} ${esc(m.name)}</span>` : '<span class="muted">Sin asignar</span>'; },
  empty: (msg, extra = '') => `<div class="empty"><div class="empty-ico">◌</div><p>${msg}</p>${extra}</div>`,
  phaseLink: n => `<a href="#/fase/${n}" class="plink"><b>${n}</b> ${esc(MODEL.phase(n).name)}</a>`,
  artLink: id => MODEL.artifact(id).external ? `<span class="alink ext">${esc(MODEL.artifact(id).name)}</span>` : `<a href="#/artefacto/${id}" class="alink"><code>${id}</code></a>`,
  typeDot: t => `<span class="type-dot t-${t}" title="${MODEL.phaseTypes[t].label}"></span>`,
  kind: k => `<span class="kind" style="--c:${MODEL.iterationKinds[k].color}">${MODEL.iterationKinds[k].label}</span>`,
  sev(e) { return e >= 15 ? 'sev-hi' : e >= 8 ? 'sev-md' : 'sev-lo'; },
  memberOptions(sel, roleId) {
    const p = Store.project();
    const pref = roleId ? p.team.filter(m => (m.roles || []).includes(roleId)) : p.team;
    const rest = roleId ? p.team.filter(m => !(m.roles || []).includes(roleId)) : [];
    let o = `<option value="">— Sin asignar —</option>`;
    o += pref.map(m => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
    if (rest.length) o += `<optgroup label="Otros miembros">${rest.map(m => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</optgroup>`;
    return o;
  },
  pageHead: (title, sub, actions = '') => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div><div class="page-actions">${actions}</div></div>`
};

const Views = {};

/* ============================ Bienvenida ============================ */
Views.welcome = () => `
<div class="welcome">
  <div class="welcome-card">
    <div class="logo-big">${LOGO_SVG}</div>
    <h1>Sistema de Trazabilidad del Ciclo de Vida<br><span>para el Desarrollo de Software Cuántico</span></h1>
    <p class="lead">Guíe paso a paso las once fases del ciclo propuesto, documente cada artefacto, asigne roles, registre los puntos de decisión (DP1–DP3), las iteraciones y los riesgos, y conserve la evidencia de todo el proceso.</p>
    <div class="welcome-actions">
      <button class="btn btn-primary btn-lg" data-action="new-project">＋ Crear nuevo proyecto</button>
      <button class="btn btn-lg" data-action="load-demo">Cargar proyecto de ejemplo</button>
      <label class="btn btn-ghost btn-lg">Importar respaldo (.json)<input type="file" accept=".json,application/json" data-change="import-json" hidden></label>
    </div>
    <div class="welcome-feats">
      ${[['◎', 'Seguimiento por fase', 'Actividades, criterios de salida y estado de las 11 fases.'], ['⇄', 'Trazabilidad total', 'Requisitos ↔ artefactos ↔ fases, análisis de impacto.'], ['◆', 'Puntos de decisión', 'DP1, DP2 y DP3 con evidencia y retornos justificados.'], ['⬆', 'Repositorio de evidencias', 'Suba archivos versionados por artefacto o fase.'], ['☰', 'Plantillas', 'Descargue plantillas Word y Markdown de cada artefacto.'], ['♠', 'Roles y equipo', 'Asigne personas a los seis roles del ciclo.']].map(f => `<div class="feat"><span>${f[0]}</span><b>${f[1]}</b><small>${f[2]}</small></div>`).join('')}
    </div>
    <p class="muted small">Los datos se guardan localmente en su navegador (localStorage + IndexedDB). Use <b>Reportes → Exportar respaldo</b> para compartirlos o moverlos a otro equipo.</p>
  </div>
</div>`;

/* ============================ Dashboard ============================ */
Views.dashboard = () => {
  const p = Store.project();
  const overall = Store.overallProgress();
  const done = MODEL.phases.filter(ph => p.phases[ph.n].status === 'completada').length;
  const arts = MODEL.internalArtifacts();
  const approved = arts.filter(a => p.artifacts[a.id].status === 'aprobado').length;
  const openRisks = p.risks.filter(r => !['cerrado', 'mitigado'].includes(r.status));
  const hiRisks = openRisks.filter(r => r.probability * r.impact >= 15).length;
  const cur = Store.currentPhase();
  const openIts = p.iterations.filter(i => i.status === 'abierta').length;
  const actions = Views.nextActions();

  return `
  ${H.pageHead('Panel de control', `${esc(p.component || 'Componente cuántico')}${p.system ? ' · Sistema: ' + esc(p.system) : ''}`, `<a class="btn" href="#/reportes">Generar reporte</a><a class="btn btn-primary" href="#/fase/${cur || 11}">Ir a la fase actual →</a>`)}
  <div class="grid g-dash">
    <section class="card hero">
      <div class="hero-ring">${H.ring(overall, 150, 12, 'avance global')}</div>
      <div class="hero-info">
        <div class="eyebrow">Proyecto · Recorrido ${p.cycle}</div>
        <h2>${esc(p.name)}</h2>
        <p class="muted">${esc(p.description || 'Sin descripción.')}</p>
        <div class="hero-meta">
          <div><small>Fase actual</small><b>${cur ? `${cur}. ${esc(MODEL.phase(cur).name)}` : 'Ciclo completado ✓'}</b></div>
          <div><small>Inicio</small><b>${H.date(p.startDate)}</b></div>
          <div><small>Fecha objetivo</small><b>${p.dueDate ? H.date(p.dueDate) : '—'}</b></div>
          <div><small>Trabajando como</small><b>${Store.currentUser() ? esc(Store.currentUser().name) : '<a href="#/equipo">Definir usuario</a>'}</b></div>
        </div>
      </div>
    </section>
    <section class="kpis">
      ${[['Fases completadas', `${done}<small>/11</small>`, 'kpi-blue', '#/ciclo'], ['Artefactos aprobados', `${approved}<small>/${arts.length}</small>`, 'kpi-green', '#/artefactos'], ['Riesgos abiertos', `${openRisks.length}${hiRisks ? `<small class="hi"> · ${hiRisks} altos</small>` : ''}`, 'kpi-red', '#/riesgos'], ['Iteraciones', `${p.iterations.length}${openIts ? `<small> · ${openIts} abiertas</small>` : ''}`, 'kpi-violet', '#/iteraciones'], ['Decisiones', p.decisions.length, 'kpi-amber', '#/decisiones'], ['Requisitos', p.requirements.length, 'kpi-cyan', '#/requisitos']]
        .map(k => `<a class="kpi ${k[2]}" href="${k[3]}"><small>${k[0]}</small><b>${k[1]}</b></a>`).join('')}
    </section>
  </div>

  <section class="card">
    <div class="card-head"><h3>Avance por fase</h3><a href="#/ciclo" class="link">Ver diagrama del ciclo →</a></div>
    <div class="phase-strip">
      ${MODEL.phases.map(ph => { const s = p.phases[ph.n]; const pr = Store.phaseProgress(ph.n); return `
        <a class="pstep ${MODEL.phaseStatus[s.status].cls} ${cur === ph.n ? 'current' : ''}" href="#/fase/${ph.n}" title="${esc(ph.name)} — ${MODEL.phaseStatus[s.status].label}">
          <span class="pnum">${ph.n}</span><span class="pname">${esc(ph.name)}</span>${H.bar(pr)}<span class="pct">${pr}%</span>
          ${ph.dp ? `<span class="dp-flag">${ph.dp}</span>` : ''}
        </a>`; }).join('')}
    </div>
  </section>

  <div class="grid g-2">
    <section class="card">
      <div class="card-head"><h3>Próximas acciones</h3><span class="muted small">${actions.length} pendientes</span></div>
      ${actions.length ? `<ul class="todo">${actions.slice(0, 9).map(a => `<li class="lvl-${a.level}"><span class="todo-ico">${a.level === 'error' ? '!' : a.level === 'warn' ? '•' : '›'}</span><a href="${a.href}">${a.text}</a></li>`).join('')}</ul>` : H.empty('No hay acciones pendientes. ¡Excelente!')}
    </section>
    <section class="card">
      <div class="card-head"><h3>Cobertura de roles</h3><a href="#/equipo" class="link">Gestionar equipo →</a></div>
      <div class="role-cov">
        ${MODEL.roles.map(r => { const ms = Store.membersForRole(r.id); return `<div class="rc-row">${H.role(r.id)}<div class="rc-people">${ms.length ? ms.map(m => H.avatar(m, 'sm')).join('') : '<span class="badge st-reopen">Sin asignar</span>'}</div></div>`; }).join('')}
      </div>
    </section>
  </div>

  <div class="grid g-2">
    <section class="card">
      <div class="card-head"><h3>Mapa de calor de riesgos</h3><a href="#/riesgos" class="link">Registro →</a></div>
      ${Views.heatmap(openRisks, true)}
    </section>
    <section class="card">
      <div class="card-head"><h3>Actividad reciente</h3><a href="#/bitacora" class="link">Bitácora completa →</a></div>
      ${p.log.length ? `<ul class="timeline">${p.log.slice(0, 7).map(l => `<li><span class="tl-dot t-${l.type}"></span><div><p>${esc(l.message)}</p><small>${H.dt(l.date)} · ${esc(l.user)}</small></div></li>`).join('')}</ul>` : H.empty('Sin actividad registrada.')}
    </section>
  </div>`;
};

Views.nextActions = () => {
  const p = Store.project(); const out = [];
  if (!p.team.length) out.push({ level: 'error', text: 'Registre a los integrantes del equipo y asigne los seis roles.', href: '#/equipo' });
  else {
    MODEL.roles.forEach(r => { if (!Store.membersForRole(r.id).length) out.push({ level: 'warn', text: `Asigne al menos una persona al rol «${r.name}».`, href: '#/equipo' }); });
    if (!p.currentUserId) out.push({ level: 'warn', text: 'Seleccione con qué integrante está trabajando (barra superior) para atribuir la bitácora.', href: '#/equipo' });
  }
  if (!p.requirements.length) out.push({ level: 'warn', text: 'Registre los requisitos del sistema clásico relevantes (entrada de la fase 1).', href: '#/requisitos' });
  const cur = Store.currentPhase();
  if (cur) {
    const ph = MODEL.phase(cur), s = p.phases[cur];
    if (s.status === 'no_iniciada') out.push({ level: 'info', text: `Inicie la fase ${cur}: ${ph.name}.`, href: `#/fase/${cur}` });
    const a = Store.activityProgress(cur);
    if (a.done < a.total && s.status !== 'no_iniciada') out.push({ level: 'info', text: `Complete las actividades de la fase ${cur} (${a.done}/${a.total}).`, href: `#/fase/${cur}` });
    ph.outputs.forEach(id => { const st = p.artifacts[id].status; if (st !== 'aprobado') out.push({ level: st === 'en_revision' ? 'warn' : 'info', text: st === 'en_revision' ? `Revise y apruebe ${id}.` : `Elabore el artefacto ${id}.`, href: `#/artefacto/${id}` }); });
    ph.roles.forEach(r => { if (!s.responsible[r]) out.push({ level: 'warn', text: `Fase ${cur}: designe responsable para «${MODEL.role(r).name}».`, href: `#/fase/${cur}` }); });
    if (ph.dp && ph.outputs.every(id => p.artifacts[id].status === 'aprobado')) out.push({ level: 'error', text: `Registre la decisión del ${ph.dp}.`, href: `#/fase/${cur}?tab=dp` });
  }
  p.risks.filter(r => r.status === 'abierto' && r.probability * r.impact >= 15).forEach(r => out.push({ level: 'error', text: `Riesgo alto sin mitigar: ${esc(r.title)}`, href: '#/riesgos' }));
  return out;
};

Views.heatmap = (risks, compact) => {
  let h = `<div class="heat ${compact ? 'compact' : ''}"><div class="heat-y">Probabilidad →</div><div class="heat-grid">`;
  for (let pr = 5; pr >= 1; pr--) {
    for (let im = 1; im <= 5; im++) {
      const c = risks.filter(r => Number(r.probability) === pr && Number(r.impact) === im);
      const e = pr * im;
      h += `<div class="hcell ${H.sev(e)}" title="P${pr} × I${im} = ${e}${c.length ? '\n' + c.map(r => '• ' + r.title).join('\n') : ''}">${c.length || ''}</div>`;
    }
  }
  return h + '</div><div class="heat-x">Impacto →</div></div>';
};

/* ============================ Diagrama del ciclo ============================ */
Views.diagramSVG = (opts = {}) => {
  const p = Store.project();
  const W = 104, Hh = 62, DX = 112, DY = 42, X0 = 14, Y0 = 34;
  const pos = n => n <= 10 ? { x: X0 + (n - 1) * DX, y: Y0 + (n - 1) * DY } : { x: X0 + 9 * DX, y: Y0 + 9 * DY + 132 };
  const wrap = (t, max = 15) => { const w = t.split(' '); const lines = []; let cur = ''; w.forEach(x => { if ((cur + ' ' + x).trim().length > max) { lines.push(cur.trim()); cur = x; } else cur += ' ' + x; }); lines.push(cur.trim()); return lines; };
  const L = UIState.diagramLayers;
  let s = `<svg class="cycle-svg" viewBox="0 0 1150 640" role="img" aria-label="Diagrama del ciclo de vida">
  <defs>${['main', 'dp1', 'dp2', 'dp3e', 'dp3m'].map(k => `<marker id="ar-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-${k}"/></marker>`).join('')}</defs>`;
  // Retornos
  const arcs = [];
  if (L.DP1) [2, 3, 4].forEach((t, i) => arcs.push({ from: 5, to: t, cls: 'dp1', lvl: i, off: -16 }));
  if (L.DP2) arcs.push({ from: 7, to: 6, cls: 'dp2', lvl: 0, off: 0 });
  if (L.DP3e) [2, 3, 4, 8].forEach((t, i) => arcs.push({ from: 9, to: t, cls: 'dp3e', lvl: i + 1, off: 14 }));
  if (L.DP3m) [1, 6].forEach((t, i) => arcs.push({ from: 9, to: t, cls: 'dp3m', lvl: i + 5, off: 26, dash: true }));
  arcs.forEach(a => {
    const s1 = pos(a.from), t1 = pos(a.to);
    const sx = s1.x + W / 2 + a.off, sy = s1.y + Hh;
    const tx = t1.x + W / 2 + a.off, ty = t1.y + Hh;
    const ly = sy + 16 + a.lvl * 11;
    s += `<path d="M${sx},${sy} V${ly} H${tx} V${ty + 2}" class="arc arc-${a.cls}" ${a.dash ? 'stroke-dasharray="5 4"' : ''} marker-end="url(#ar-${a.cls})"/>`;
  });
  // Flujo principal
  for (let n = 1; n < 10; n++) { const a = pos(n), b = pos(n + 1); s += `<path d="M${a.x + W},${a.y + Hh / 2} H${b.x + W / 2 - 22} V${b.y}" class="flow" marker-end="url(#ar-main)"/>`; }
  { const a = pos(10), b = pos(11); s += `<path d="M${a.x + W / 2},${a.y + Hh} V${b.y}" class="flow dashed" stroke-dasharray="4 4" marker-end="url(#ar-main)"/>`; }
  // Cajas
  MODEL.phases.forEach(ph => {
    const { x, y } = pos(ph.n); const st = p.phases[ph.n].status; const pr = Store.phaseProgress(ph.n);
    const cur = Store.currentPhase() === ph.n;
    s += `<a href="#/fase/${ph.n}" class="pbox ${MODEL.phaseStatus[st].cls} ty-${ph.type} ${cur ? 'cur' : ''}"><title>${ph.n}. ${esc(ph.name)} — ${MODEL.phaseStatus[st].label} (${pr}%)</title>
      <rect x="${x}" y="${y}" width="${W}" height="${Hh}" rx="7" class="pbox-r" ${ph.type === 'integration' ? 'stroke-dasharray="4 3"' : ''}/>
      <rect x="${x + 4}" y="${y + Hh - 6}" width="${(W - 8) * pr / 100}" height="3" rx="1.5" class="pbox-pr"/>
      <circle cx="${x + 11}" cy="${y + 11}" r="8" class="pbox-n"/><text x="${x + 11}" y="${y + 11.5}" class="pbox-nt" dominant-baseline="middle" text-anchor="middle">${ph.n}</text>`;
    wrap(ph.name).slice(0, 3).forEach((ln, i) => { s += `<text x="${x + W / 2 + 6}" y="${y + 15 + i * 11}" class="pbox-t" text-anchor="middle">${esc(ln)}</text>`; });
    s += `<text x="${x + W / 2}" y="${y + Hh - 11}" class="pbox-roles" text-anchor="middle">${ph.roles.map(r => MODEL.role(r).symbol).join(' ')}</text></a>`;
    if (ph.dp) s += `<g class="dpd"><rect x="${x + W - 8}" y="${y - 9}" width="16" height="16" transform="rotate(45 ${x + W} ${y - 1})" /><text x="${x + W + 12}" y="${y - 1}" dominant-baseline="middle">${ph.dp}</text></g>`;
  });
  // Leyenda
  s += `<g class="legend" transform="translate(14,530)">
    ${Object.entries(MODEL.phaseTypes).map(([k, t], i) => `<rect x="0" y="${i * 20}" width="22" height="13" rx="3" class="lg-${k}" ${k === 'integration' ? 'stroke-dasharray="3 2"' : ''}/><text x="30" y="${i * 20 + 10}">${t.label}</text>`).join('')}
    ${MODEL.roles.map((r, i) => `<text x="${240 + Math.floor(i / 3) * 230}" y="${(i % 3) * 20 + 10}"><tspan class="lg-sym">${r.symbol}</tspan> ${esc(r.en)}</text>`).join('')}
  </g></svg>`;
  return s;
};

Views.ciclo = () => {
  const L = UIState.diagramLayers;
  return `${H.pageHead('Ciclo de vida', 'Secuencia principal de 11 fases, puntos de decisión y retornos. Haga clic en una fase para abrirla.')}
  <section class="card">
    <div class="layer-toggles">
      <span class="muted small">Mostrar retornos:</span>
      ${[['DP1', 'DP1 → fases 2, 3, 4', 'dp1'], ['DP2', 'DP2 → fase 6', 'dp2'], ['DP3e', 'DP3 ajustes experimentales → 2, 3, 4, 8', 'dp3e'], ['DP3m', 'DP3 mantenimiento → 1, 6', 'dp3m']].map(([k, l, c]) => `<label class="chk lt-${c}"><input type="checkbox" data-change="layer" data-layer="${k}" ${L[k] ? 'checked' : ''}> ${l}</label>`).join('')}
    </div>
    <div class="svg-wrap">${Views.diagramSVG()}</div>
    <div class="status-legend">${Object.values(MODEL.phaseStatus).map(s => H.badge(s)).join(' ')}</div>
  </section>
  <div class="grid g-3">
    ${Object.values(MODEL.decisionPoints).map(dp => { const last = Store.project().decisions.find(d => d.dp === dp.id); return `
      <a class="card dp-card" href="#/fase/${dp.phase}?tab=dp"><div class="dp-badge">${dp.id}</div><h3>${esc(dp.name)}</h3>
      <p class="muted small">Al cierre de la fase ${dp.phase} · revisa el bloque de fases ${dp.block[0]}–${dp.block[1]}</p>
      <p>${last ? `Última decisión: <b>${last.decision === 'avanzar' ? 'Avanzar' : 'Iterar → fase ' + last.target}</b> (${H.date(last.date)})` : '<span class="muted">Sin decisiones registradas</span>'}</p></a>`; }).join('')}
  </div>
  <section class="card"><div class="card-head"><h3>Resumen operativo de las once fases</h3></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>N.</th><th>Fase</th><th>Objetivo inmediato</th><th>Salida principal</th><th>Condición para avanzar</th><th>Roles</th><th>Estado</th></tr></thead><tbody>
    ${MODEL.phases.map(ph => `<tr><td class="nowrap">${H.typeDot(ph.type)} ${ph.n}</td><td><a href="#/fase/${ph.n}">${esc(ph.name)}</a></td><td>${esc(ph.goal)}</td><td>${ph.outputs.map(H.artLink).join('<br>')}</td><td>${esc(ph.advance)}</td><td class="nowrap">${ph.roles.map(r => H.role(r, true)).join(' ')}</td><td>${H.phaseBadge(ph.n)}</td></tr>`).join('')}
    </tbody></table></div></section>`;
};

/* ============================ Fase ============================ */
Views.fase = (n, query) => {
  n = Number(n);
  const ph = MODEL.phase(n); if (!ph) return H.empty('Fase no encontrada.');
  const p = Store.project(), s = p.phases[n];
  if (query && query.tab) UIState.phaseTab[n] = query.tab;
  const tab = UIState.phaseTab[n] || 'resumen';
  const unlocked = Store.isPhaseUnlocked(n);
  const pr = Store.phaseProgress(n);
  const tabs = [['resumen', 'Resumen'], ['actividades', `Actividades <em>${Store.activityProgress(n).done}/${ph.activities.length}</em>`], ['artefactos', 'Artefactos'], ['roles', 'Responsables'], ['riesgos', 'Riesgos'], ['evidencias', 'Evidencias'], ...(ph.dp ? [['dp', `◆ ${ph.dp}`]] : []), ['salida', 'Criterio de salida'], ['iteraciones', 'Iteraciones']];

  let btns = '';
  if (s.status === 'no_iniciada' || s.status === 'reabierta') btns += `<button class="btn btn-primary" data-action="phase-start" data-n="${n}" ${unlocked ? '' : 'disabled title="La fase anterior no está completada"'}>▶ Iniciar fase</button>`;
  if (s.status === 'en_progreso') btns += `<button class="btn" data-action="phase-review" data-n="${n}">Enviar a revisión</button>`;
  if (s.status === 'en_revision') btns += `<button class="btn" data-action="phase-back" data-n="${n}">Regresar a progreso</button>`;
  if (['en_progreso', 'en_revision'].includes(s.status)) btns += ph.dp ? `<button class="btn btn-primary" data-action="tab" data-n="${n}" data-tab="dp">◆ Registrar ${ph.dp}</button>` : `<button class="btn btn-primary" data-action="phase-close" data-n="${n}">✓ Cerrar fase</button>`;

  return `
  <div class="phase-nav">${n > 1 ? `<a href="#/fase/${n - 1}" class="btn btn-ghost btn-sm">← Fase ${n - 1}</a>` : '<span></span>'}
    <div class="mini-steps">${MODEL.phases.map(x => `<a href="#/fase/${x.n}" class="ms ${MODEL.phaseStatus[p.phases[x.n].status].cls} ${x.n === n ? 'on' : ''}" title="${esc(x.name)}">${x.n}</a>`).join('')}</div>
    ${n < 11 ? `<a href="#/fase/${n + 1}" class="btn btn-ghost btn-sm">Fase ${n + 1} →</a>` : '<span></span>'}</div>
  <section class="card phase-head ty-${ph.type}">
    <div class="ph-num">${n}</div>
    <div class="ph-main">
      <div class="eyebrow">${H.typeDot(ph.type)} ${MODEL.phaseTypes[ph.type].label}${ph.dp ? ` · <span class="dp-inline">◆ ${ph.dp}</span>` : ''}${s.visits > 1 ? ` · Recorrida ${s.visits} veces` : ''}</div>
      <h1>${esc(ph.name)}</h1>
      <p class="muted">${esc(ph.purpose)}</p>
      <div class="ph-meta">${H.phaseBadge(n)} <span class="muted small">Inicio: ${H.date(s.startedAt)} · Cierre: ${H.date(s.completedAt)}</span> <span class="ph-roles">${ph.roles.map(r => H.role(r, true)).join('')}</span></div>
      ${!unlocked ? `<div class="alert warn">La fase ${n - 1} aún no se ha completado. Puede consultar y preparar documentación, pero se recomienda respetar la secuencia.</div>` : ''}
    </div>
    <div class="ph-side">${H.ring(pr, 96, 9)}<div class="ph-btns">${btns}</div></div>
  </section>
  <nav class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-action="tab" data-n="${n}" data-tab="${k}">${l}</button>`).join('')}</nav>
  <div class="tab-body">${Views['phaseTab_' + tab](n)}</div>`;
};

Views.phaseTab_resumen = n => {
  const ph = MODEL.phase(n), p = Store.project(), s = p.phases[n];
  return `<div class="grid g-2">
    <section class="card"><h3>Entradas</h3><ul class="io-list">
      ${ph.inputs.map(id => { const ext = MODEL.artifact(id).external; return `<li><div>${H.artLink(id)} ${ext ? '<span class="badge st-none">Externa</span>' : H.artBadge(id) + ` <small class="muted">v${p.artifacts[id].version}</small>`}</div><small class="muted">${esc(ph.inputWhy[id] || '')}</small></li>`; }).join('')}
    </ul>${n === 1 ? `<p class="small"><a href="#/requisitos">Gestionar requisitos registrados (${p.requirements.length}) →</a></p>` : ''}</section>
    <section class="card"><h3>Artefactos producidos</h3><ul class="io-list">
      ${ph.outputs.map(id => `<li><div>${H.artLink(id)} ${H.artBadge(id)} <small class="muted">v${p.artifacts[id].version} · ${Store.artifactCompleteness(id)}% completo</small></div><small class="muted">${esc(MODEL.artifact(id).desc)}</small></li>`).join('')}
    </ul></section>
  </div>
  ${ph.note ? `<div class="alert info">${esc(ph.note)}</div>` : ''}
  <div class="grid g-2">
    <section class="card"><h3>Planeación</h3>
      <div class="form-row"><label>Inicio planeado<input type="date" value="${s.plannedStart}" data-change="phase-field" data-n="${n}" data-key="plannedStart"></label>
      <label>Fin planeado<input type="date" value="${s.plannedEnd}" data-change="phase-field" data-n="${n}" data-key="plannedEnd"></label></div>
      <h4>Criterio de salida</h4><p class="small">${esc(ph.exit)}</p>
      ${ph.dp ? `<h4>Punto de decisión</h4><p class="small">${esc(MODEL.decisionPoints[ph.dp].desc)}</p>` : '<p class="small muted">Sin punto de decisión principal: el avance depende del cumplimiento del criterio de salida.</p>'}
    </section>
    <section class="card"><h3>Notas de la fase</h3>
      <textarea rows="9" placeholder="Observaciones, acuerdos, enlaces relevantes…" data-change="phase-field" data-n="${n}" data-key="notes">${esc(s.notes)}</textarea>
    </section>
  </div>`;
};

Views.phaseTab_actividades = n => {
  const ph = MODEL.phase(n), s = Store.phaseState(n);
  return `<section class="card"><div class="card-head"><h3>Actividades de la fase</h3><span class="muted small">Marque cada actividad al completarla; se registra quién y cuándo.</span></div>
  <ol class="activities">${ph.activities.map((a, i) => { const st = s.activities[i] || {}; return `
    <li class="${st.done ? 'done' : ''}">
      <label class="act-chk"><input type="checkbox" ${st.done ? 'checked' : ''} data-change="activity" data-n="${n}" data-i="${i}"><span class="act-num">${i + 1}</span><span class="act-txt">${esc(a)}</span></label>
      <div class="act-meta">${st.done ? `<small>✓ ${esc(st.by || '')} · ${H.dt(st.date)}</small>` : ''}
        <input class="act-note" placeholder="Nota / evidencia…" value="${esc(st.note || '')}" data-change="activity-note" data-n="${n}" data-i="${i}"></div>
    </li>`; }).join('')}</ol></section>`;
};

Views.phaseTab_artefactos = n => {
  const ph = MODEL.phase(n), p = Store.project();
  return `<div class="grid g-2">${ph.outputs.map(id => { const a = p.artifacts[id], def = MODEL.artifact(id), c = Store.artifactCompleteness(id); return `
    <section class="card art-card">
      <div class="art-top"><span class="art-short">${def.short}</span><div><h3><a href="#/artefacto/${id}">${id}</a></h3><div>${H.artBadge(id)} <small class="muted">v${a.version} · ${def.fields.length} secciones</small></div></div></div>
      <p class="small muted">${esc(def.desc)}</p>
      <div class="art-prog"><small>Completitud ${c}%</small>${H.bar(c)}</div>
      <div class="btn-row">
        <a class="btn btn-primary btn-sm" href="#/artefacto/${id}">✎ Documentar</a>
        <button class="btn btn-sm" data-action="tpl-art" data-id="${id}" data-fmt="doc">⬇ Plantilla Word</button>
        <button class="btn btn-sm" data-action="tpl-art" data-id="${id}" data-fmt="md">⬇ Markdown</button>
        <button class="btn btn-sm" data-action="upload" data-artifact="${id}">⬆ Subir archivo</button>
      </div>
      <div data-files='${JSON.stringify({ artifact: id, compact: true })}'></div>
    </section>`; }).join('')}</div>
    <section class="card"><h3>Entradas requeridas</h3><div class="chips">${ph.inputs.map(id => `${H.artLink(id)} ${MODEL.artifact(id).external ? '' : H.artBadge(id)}`).join(' &nbsp; ')}</div></section>`;
};

Views.phaseTab_roles = n => {
  const ph = MODEL.phase(n), s = Store.phaseState(n), p = Store.project();
  const others = MODEL.roles.filter(r => !ph.roles.includes(r.id));
  return `<section class="card"><div class="card-head"><h3>Responsables por rol</h3><a href="#/equipo" class="link">Gestionar equipo →</a></div>
    ${!p.team.length ? `<div class="alert warn">No hay integrantes registrados. <a href="#/equipo">Agregue el equipo</a> para poder asignar responsables.</div>` : ''}
    <div class="resp-grid">${ph.roles.map(r => { const role = MODEL.role(r); return `
      <div class="resp-card" style="--c:${role.color}"><div class="resp-sym">${role.symbol}</div><div><b>${esc(role.name)}</b><small class="muted">${esc(role.resp)}</small>
      <select data-change="phase-resp" data-n="${n}" data-role="${r}">${H.memberOptions(s.responsible[r], r)}</select></div></div>`; }).join('')}</div>
    <h4>Participación opcional de otros roles</h4>
    <div class="resp-grid">${others.map(role => `
      <div class="resp-card opt" style="--c:${role.color}"><div class="resp-sym">${role.symbol}</div><div><b>${esc(role.name)}</b>
      <select data-change="phase-resp" data-n="${n}" data-role="${role.id}">${H.memberOptions(s.responsible[role.id], role.id)}</select></div></div>`).join('')}</div>
  </section>`;
};

Views.phaseTab_riesgos = n => {
  const ph = MODEL.phase(n), p = Store.project();
  const risks = p.risks.filter(r => Number(r.phase) === n);
  return `<section class="card"><div class="card-head"><h3>Riesgos identificados por el modelo</h3></div>
    <ul class="risk-model">${ph.risks.map((r, i) => { const reg = p.risks.find(x => x.modelRef === `${n}.${i}`); return `<li><span>⚠ ${esc(r)}</span>${reg ? `<span class="badge st-done">Registrado (${reg.code})</span>` : `<button class="btn btn-sm" data-action="risk-from-model" data-n="${n}" data-i="${i}">＋ Registrar</button>`}</li>`; }).join('')}</ul></section>
  <section class="card"><div class="card-head"><h3>Riesgos registrados en esta fase (${risks.length})</h3><button class="btn btn-primary btn-sm" data-action="risk-edit" data-phase="${n}">＋ Nuevo riesgo</button></div>
    ${risks.length ? Views.riskTable(risks) : H.empty('Sin riesgos registrados para esta fase.')}</section>`;
};

Views.phaseTab_evidencias = n => `<section class="card"><div class="card-head"><h3>Evidencias de la fase</h3><button class="btn btn-primary btn-sm" data-action="upload" data-phase="${n}">⬆ Subir evidencia</button></div>
  <p class="small muted">Archivos de soporte (capturas, notebooks, resultados, minutas). Los archivos asociados a artefactos se muestran también aquí.</p>
  <div data-files='${JSON.stringify({ phaseAll: n })}'></div></section>`;

Views.phaseTab_salida = n => {
  const ph = MODEL.phase(n), s = Store.phaseState(n);
  const checks = Store.closeChecks(n);
  return `<div class="grid g-2">
    <section class="card"><h3>Criterio de salida</h3><blockquote class="quote">${esc(ph.exit)}</blockquote>
      <label class="chk big"><input type="checkbox" ${s.exit.met ? 'checked' : ''} data-change="exit-met" data-n="${n}"> Confirmo que el criterio de salida se cumple</label>
      <label>Justificación / evidencia<textarea rows="4" data-change="exit-just" data-n="${n}" placeholder="Describa por qué se cumple el criterio y qué evidencia lo respalda">${esc(s.exit.justification || '')}</textarea></label>
      ${s.exit.met ? `<p class="small muted">Confirmado por ${esc(s.exit.by || '')} · ${H.dt(s.exit.date)}</p>` : ''}
    </section>
    <section class="card"><h3>Verificación para el cierre</h3>
      ${checks.length ? `<ul class="checks">${checks.map(c => `<li class="lvl-${c.level}">${c.level === 'error' ? '✕' : '!'} ${esc(c.text)}</li>`).join('')}</ul>` : '<div class="alert ok">Todo listo para cerrar la fase.</div>'}
      ${ph.dp ? `<p class="small">Esta fase se cierra mediante el <a href="#/fase/${n}?tab=dp" data-action="tab" data-n="${n}" data-tab="dp">punto de decisión ${ph.dp}</a>.</p>` :
        (s.status !== 'completada' ? `<button class="btn btn-primary" data-action="phase-close" data-n="${n}">✓ Cerrar fase ${n}</button>` : `<div class="alert ok">Fase completada el ${H.dt(s.completedAt)}.</div><button class="btn btn-sm" data-action="phase-reopen" data-n="${n}">Reabrir fase</button>`)}
    </section></div>`;
};

Views.phaseTab_dp = n => {
  const ph = MODEL.phase(n), dp = MODEL.decisionPoints[ph.dp], p = Store.project(), s = p.phases[n];
  const hist = p.decisions.filter(d => d.dp === dp.id);
  const checksDone = dp.checks.filter((_, i) => s.dpChecks[i]).length;
  return `<div class="grid g-2">
  <section class="card dp-panel"><div class="dp-badge">${dp.id}</div><h3>${esc(dp.name)}</h3>
    <p class="small">${esc(dp.desc)}</p>
    <p class="small muted">Revisa el bloque de fases <b>${dp.block[0]}–${dp.block[1]}</b>. Evalúa la preparación del componente, no la viabilidad global del proyecto.</p>
    <h4>Evidencia a revisar</h4>
    <ul class="io-list">${dp.evidence.map(id => `<li><div>${H.artLink(id)} ${H.artBadge(id)} <small class="muted">v${p.artifacts[id].version} · ${Store.artifactCompleteness(id)}%</small></div></li>`).join('')}
      <li><div><a href="#/riesgos">Riesgos pendientes del bloque</a>: <b>${p.risks.filter(r => r.phase >= dp.block[0] && r.phase <= dp.block[1] && !['cerrado', 'mitigado'].includes(r.status)).length}</b></div></li></ul>
    <h4>Lista de verificación (${checksDone}/${dp.checks.length})</h4>
    <ul class="dp-checks">${dp.checks.map((c, i) => `<li><label class="chk"><input type="checkbox" ${s.dpChecks[i] ? 'checked' : ''} data-change="dp-check" data-n="${n}" data-i="${i}"> ${esc(c)}</label></li>`).join('')}</ul>
  </section>
  <section class="card"><h3>Registrar decisión</h3>
    ${s.status === 'completada' ? `<div class="alert ok">La fase ya fue autorizada para avanzar. Si surge un nuevo hallazgo, puede registrar una nueva decisión de iterar.</div>` : ''}
    <div class="decision-form" id="dp-form">
      <div class="seg"><label><input type="radio" name="dec" value="avanzar" checked data-change="dp-mode"> ✓ Avanzar a la fase ${dp.next}</label><label><input type="radio" name="dec" value="iterar" data-change="dp-mode"> ↺ Iterar</label></div>
      <div class="dp-iter hidden">
        <label>Destino del retorno<select name="target">${dp.returns.map((r, i) => `<option value="${i}">Fase ${r.to}. ${esc(MODEL.phase(r.to).name)} — ${MODEL.iterationKinds[r.kind].label}${r.sub ? ' ' + r.sub : ''}</option>`).join('')}</select></label>
        <div class="return-hints">${dp.returns.map((r, i) => `<p class="small rh" data-i="${i}">${esc(r.label)}</p>`).join('')}</div>
        <label>Cambio que se evaluará<textarea name="change" rows="2" placeholder="Qué se modificará y cómo se comprobará la mejora"></textarea></label>
      </div>
      <label>Motivo / fundamento de la decisión<textarea name="reason" rows="3" placeholder="Resuma la evidencia y su contraste con los criterios"></textarea></label>
      ${dp.id === 'DP3' ? `<label class="dp-adv">Necesidad de mantenimiento futuro (opcional)<input name="maint" placeholder="Mejora futura documentada sin invalidar la aceptación actual"></label>` : ''}
      <label>Participantes<div class="chips sel-members">${p.team.map(m => `<label class="chip-chk"><input type="checkbox" name="part" value="${m.id}" ${Object.values(s.responsible).includes(m.id) ? 'checked' : ''}> ${esc(m.name)}</label>`).join('') || '<span class="muted small">Registre al equipo para seleccionar participantes.</span>'}</div></label>
      <button class="btn btn-primary" data-action="dp-submit" data-n="${n}">Registrar decisión ${dp.id}</button>
    </div>
  </section></div>
  <section class="card"><h3>Historial de ${dp.id}</h3>${hist.length ? Views.decisionTable(hist) : H.empty('Aún no se han registrado decisiones en este punto.')}</section>`;
};

Views.phaseTab_iteraciones = n => {
  const ph = MODEL.phase(n), p = Store.project();
  const its = p.iterations.filter(i => i.from === n || i.to === n);
  const def = ph.dp ? MODEL.decisionPoints[ph.dp].returns : [];
  return `<section class="card"><h3>Retornos definidos desde esta fase</h3>
    ${def.length ? `<ul class="returns">${def.map(r => `<li>${H.kind(r.kind)} <b>→ Fase ${r.to}. ${esc(MODEL.phase(r.to).name)}</b><p class="small muted">${esc(r.label)}</p></li>`).join('')}</ul>` : '<p class="muted"><b>N/A.</b> No se define un retorno desde esta fase; una vez satisfecho el criterio de salida, el flujo continúa. Puede recibir retroalimentación de una fase posterior.</p>'}
  </section>
  <section class="card"><h3>Historial de iteraciones que involucran esta fase</h3>${its.length ? Views.iterationTable(its) : H.empty('Sin iteraciones.')}</section>`;
};

/* ============================ Artefacto (editor) ============================ */
Views.artefacto = id => {
  const def = MODEL.artifact(id); if (!def || def.external) return H.empty('Artefacto no encontrado.');
  const p = Store.project(), a = p.artifacts[id], ph = MODEL.phase(def.phase);
  const c = Store.artifactCompleteness(id);
  const consumers = MODEL.consumers(id);
  let actions = '';
  if (a.status === 'pendiente' || a.status === 'requiere_cambios') actions += `<button class="btn" data-action="art-status" data-id="${id}" data-st="en_elaboracion">Marcar en elaboración</button>`;
  if (['en_elaboracion', 'pendiente', 'requiere_cambios'].includes(a.status)) actions += `<button class="btn btn-primary" data-action="art-status" data-id="${id}" data-st="en_revision">Enviar a revisión</button>`;
  if (a.status === 'en_revision') actions += `<button class="btn btn-danger-soft" data-action="art-status" data-id="${id}" data-st="requiere_cambios">Solicitar cambios</button><button class="btn btn-success" data-action="art-status" data-id="${id}" data-st="aprobado">✓ Aprobar</button>`;
  if (a.status === 'aprobado') actions += `<button class="btn" data-action="art-bump" data-id="${id}">Crear nueva versión</button>`;

  return `
  <div class="crumbs"><a href="#/artefactos">Artefactos</a> / <a href="#/fase/${ph.n}">Fase ${ph.n}</a> / <b>${id}</b></div>
  <section class="card art-head">
    <div class="art-short big">${def.short}</div>
    <div class="ph-main"><div class="eyebrow">Fase ${ph.n} · ${esc(ph.name)}</div><h1><code>${id}</code></h1><p class="muted">${esc(def.desc)}</p>
      <div class="ph-meta">${H.artBadge(id)} <span class="badge st-none">v${a.version}</span> <span class="muted small" id="art-comp">Completitud ${c}%</span>
      ${a.approvedAt && a.status === 'aprobado' ? `<span class="muted small">Aprobado por ${esc(a.approvedBy || '—')} · ${H.dt(a.approvedAt)}</span>` : ''}</div></div>
    <div class="ph-side"><div class="ph-btns">${actions}</div>
      <div class="btn-row"><button class="btn btn-sm" data-action="art-export" data-id="${id}" data-fmt="doc">⬇ Word (con contenido)</button><button class="btn btn-sm" data-action="art-export" data-id="${id}" data-fmt="md">⬇ Markdown</button><button class="btn btn-sm btn-ghost" data-action="tpl-art" data-id="${id}" data-fmt="doc">Plantilla en blanco</button></div></div>
  </section>
  <div class="grid g-art">
    <div>
      <section class="card"><div class="card-head"><h3>Contenido del artefacto</h3><span class="save-ind muted small" id="save-ind">Guardado automático</span></div>
        <label>Elaborado por<select data-change="art-owner" data-id="${id}">${H.memberOptions(a.ownerId, ph.roles[0])}</select></label>
        ${a.status === 'aprobado' ? '<div class="alert info">Este artefacto está aprobado. Para modificarlo cree una nueva versión (se conserva una instantánea de la anterior).</div>' : ''}
        <div class="art-form ${a.status === 'aprobado' ? 'locked' : ''}">${def.fields.map((f, i) => Views.field(id, f, a.fields[f.id], i, a.status === 'aprobado')).join('')}</div>
      </section>
    </div>
    <aside>
      <section class="card"><h3>Trazabilidad</h3>
        <h4>Se deriva de</h4><ul class="mini-list">${ph.inputs.map(x => `<li>${H.artLink(x)}</li>`).join('')}</ul>
        <h4>Alimenta a</h4><ul class="mini-list">${consumers.length ? consumers.map(c => `<li>${H.phaseLink(c)}</li>`).join('') : '<li class="muted">Fin del ciclo</li>'}</ul>
        <h4>Requisitos vinculados</h4>
        ${p.requirements.length ? `<div class="req-pick">${p.requirements.map(r => `<label class="chk"><input type="checkbox" ${a.trace.includes(r.id) ? 'checked' : ''} data-change="art-trace" data-id="${id}" data-req="${r.id}"> <b>${esc(r.code)}</b> ${esc(r.title)}</label>`).join('')}</div>` : '<p class="small muted">No hay requisitos. <a href="#/requisitos">Registrar requisitos</a>.</p>'}
      </section>
      <section class="card"><div class="card-head"><h3>Archivos</h3><button class="btn btn-sm btn-primary" data-action="upload" data-artifact="${id}">⬆ Subir</button></div>
        <div data-files='${JSON.stringify({ artifact: id, compact: true })}'></div></section>
      <section class="card"><h3>Historial de versiones</h3>
        ${a.history.length ? `<ul class="timeline">${a.history.slice(0, 15).map((h, i) => `<li><span class="tl-dot t-artefacto"></span><div><p><b>v${h.version}</b> · ${esc(h.action)}${h.note ? ' — ' + esc(h.note) : ''}</p><small>${H.dt(h.date)} · ${esc(h.by)}${h.snapshot ? ` · <a href="#" data-action="art-snapshot" data-id="${id}" data-i="${i}">ver instantánea</a>` : ''}</small></div></li>`).join('')}</ul>` : '<p class="muted small">Sin cambios registrados.</p>'}
      </section>
    </aside>
  </div>`;
};

Views.field = (artId, f, val, i, locked) => {
  const dis = locked ? 'disabled' : '';
  let inner;
  if (f.type === 'table') {
    const rows = Array.isArray(val) && val.length ? val : (f.seed ? f.seed.map(r => [...r]) : [f.columns.map(() => '')]);
    inner = `<div class="table-wrap"><table class="tbl edit-tbl"><thead><tr>${f.columns.map(c => `<th>${esc(c)}</th>`).join('')}<th></th></tr></thead><tbody>
      ${rows.map((r, ri) => `<tr>${f.columns.map((_, ci) => `<td><textarea rows="1" ${dis} data-cell data-art="${artId}" data-field="${f.id}" data-r="${ri}" data-c="${ci}">${esc(r[ci] || '')}</textarea></td>`).join('')}<td>${locked ? '' : `<button class="icon-btn" title="Eliminar fila" data-action="row-del" data-art="${artId}" data-field="${f.id}" data-r="${ri}">✕</button>`}</td></tr>`).join('')}
    </tbody></table></div>${locked ? '' : `<button class="btn btn-sm btn-ghost" data-action="row-add" data-art="${artId}" data-field="${f.id}">＋ Agregar fila</button>`}`;
  } else if (f.type === 'text') {
    inner = `<input ${dis} data-art="${artId}" data-field="${f.id}" value="${esc(val || '')}">`;
  } else {
    inner = `<textarea ${dis} rows="4" data-art="${artId}" data-field="${f.id}" class="autogrow">${esc(val || '')}</textarea>`;
  }
  return `<div class="field"><div class="field-lbl"><span class="fnum">${i + 1}</span>${esc(f.label)}</div>${f.hint ? `<small class="muted">${esc(f.hint)}</small>` : ''}${inner}</div>`;
};

/* ============================ Artefactos (lista) ============================ */
Views.artefactos = () => {
  const p = Store.project();
  const arts = MODEL.internalArtifacts();
  return `${H.pageHead('Artefactos', 'Los 15 artefactos del ciclo con su estado, versión y completitud.', `<a class="btn" href="#/plantillas">Plantillas</a>`)}
  <section class="card"><div class="table-wrap"><table class="tbl"><thead><tr><th>Fase</th><th>Artefacto</th><th>Estado</th><th>Versión</th><th>Completitud</th><th>Elaboró</th><th>Requisitos</th><th>Consumido por</th><th></th></tr></thead><tbody>
  ${arts.map(a => { const s = p.artifacts[a.id]; const c = Store.artifactCompleteness(a.id); return `<tr>
    <td>${H.typeDot(MODEL.phase(a.phase).type)} ${a.phase}</td><td>${H.artLink(a.id)}</td><td>${H.artBadge(a.id)}</td><td>v${s.version}</td>
    <td style="min-width:120px">${H.bar(c)}<small class="muted">${c}%</small></td><td>${s.ownerId ? H.member(s.ownerId) : '—'}</td><td>${s.trace.length}</td>
    <td class="small">${MODEL.consumers(a.id).map(n => `<a href="#/fase/${n}">F${n}</a>`).join(', ') || '—'}</td>
    <td class="nowrap"><a class="btn btn-sm" href="#/artefacto/${a.id}">Abrir</a></td></tr>`; }).join('')}
  </tbody></table></div></section>
  <section class="card"><div class="card-head"><h3>Flujo principal de artefactos por fase (Cuadro 2)</h3></div>
  <div class="table-wrap"><table class="tbl"><thead><tr><th>Fase</th><th>Artefactos de entrada</th><th>Artefactos de salida</th></tr></thead><tbody>
  ${MODEL.phases.map(ph => `<tr><td>${H.phaseLink(ph.n)}</td><td>${ph.inputs.map(H.artLink).join(', ')}</td><td>${ph.outputs.map(H.artLink).join(', ')}</td></tr>`).join('')}
  </tbody></table></div></section>`;
};

/* ============================ Plantillas ============================ */
Views.plantillas = () => `${H.pageHead('Plantillas', 'Descargue plantillas en blanco para cada artefacto (Word o Markdown) y formatos de gestión del ciclo.', `<button class="btn btn-primary" data-action="tpl-zip">⬇ Descargar todas (ZIP)</button>`)}
  <div class="alert info">Las plantillas Word (.doc) se abren en Microsoft Word, LibreOffice o Google Docs. Una vez llenas, súbalas como evidencia al artefacto correspondiente para conservar la trazabilidad. Si documenta directamente en el sistema, use <b>⬇ Word (con contenido)</b> desde el editor del artefacto.</div>
  ${MODEL.phases.map(ph => `<section class="card tpl-group"><div class="card-head"><h3>${H.typeDot(ph.type)} Fase ${ph.n}. ${esc(ph.name)}</h3><span class="muted small">${ph.roles.map(r => MODEL.role(r).symbol).join(' ')}</span></div>
    <div class="tpl-grid">${ph.outputs.map(id => { const d = MODEL.artifact(id); return `<div class="tpl"><div class="tpl-ico">${d.short}</div><div class="tpl-body"><b>${id}</b><small class="muted">${d.fields.length} secciones · ${esc(d.desc.slice(0, 110))}…</small>
      <div class="btn-row"><button class="btn btn-sm" data-action="tpl-art" data-id="${id}" data-fmt="doc">Word</button><button class="btn btn-sm" data-action="tpl-art" data-id="${id}" data-fmt="md">Markdown</button><button class="btn btn-sm btn-ghost" data-action="tpl-preview" data-id="${id}">Vista previa</button></div></div></div>`; }).join('')}</div></section>`).join('')}
  <section class="card"><div class="card-head"><h3>Formatos de gestión del ciclo</h3></div>
    <div class="tpl-grid">${Object.entries(Templates.extra).map(([k, t]) => `<div class="tpl"><div class="tpl-ico">◆</div><div class="tpl-body"><b>${esc(t.name)}</b><div class="btn-row"><button class="btn btn-sm" data-action="tpl-extra" data-key="${k}">Word</button></div></div></div>`).join('')}
    <div class="tpl"><div class="tpl-ico">⚠</div><div class="tpl-body"><b>Registro de riesgos (CSV / Excel)</b><small class="muted">Precargado con los riesgos del modelo.</small><div class="btn-row"><button class="btn btn-sm" data-action="tpl-risk-csv">CSV</button></div></div></div></div>
  </section>`;

/* ============================ Equipo y roles ============================ */
Views.equipo = () => {
  const p = Store.project();
  return `${H.pageHead('Equipo y roles', 'Registre a los integrantes, asigne los seis roles del ciclo y consulte la matriz de responsabilidades.', `<button class="btn btn-primary" data-action="member-edit">＋ Agregar integrante</button>`)}
  <section class="card"><div class="card-head"><h3>Integrantes (${p.team.length})</h3><span class="small muted">El integrante «activo» firma las acciones en la bitácora.</span></div>
  ${p.team.length ? `<div class="members">${p.team.map(m => { const resp = MODEL.phases.filter(ph => Object.values(p.phases[ph.n].responsible).includes(m.id)).map(ph => ph.n); const acts = MODEL.phases.reduce((acc, ph) => acc + Object.values(p.phases[ph.n].activities).filter(a => a.done && a.byId === m.id).length, 0); return `
    <div class="member-card ${p.currentUserId === m.id ? 'active' : ''}">${H.avatar(m, 'lg')}<div class="mc-body"><b>${esc(m.name)}</b><small class="muted">${esc(m.email || '')}${m.affiliation ? ' · ' + esc(m.affiliation) : ''}</small>
      <div class="chips">${(m.roles || []).map(r => H.role(r)).join('') || '<span class="badge st-reopen">Sin rol</span>'}</div>
      <small class="muted">Responsable en fases: ${resp.join(', ') || '—'} · Actividades completadas: ${acts}</small></div>
      <div class="mc-act">${p.currentUserId === m.id ? '<span class="badge st-done">Activo</span>' : `<button class="btn btn-sm" data-action="set-user" data-id="${m.id}">Usar como activo</button>`}<button class="icon-btn" data-action="member-edit" data-id="${m.id}" title="Editar">✎</button><button class="icon-btn" data-action="member-del" data-id="${m.id}" title="Eliminar">🗑</button></div></div>`; }).join('')}</div>` : H.empty('Aún no hay integrantes.', '<button class="btn btn-primary" data-action="member-edit">＋ Agregar integrante</button>')}
  </section>
  <section class="card"><h3>Roles del ciclo (Cuadro 1)</h3><div class="roles-grid">
    ${MODEL.roles.map(r => { const ms = Store.membersForRole(r.id); return `<div class="role-card" style="--c:${r.color}"><div class="role-sym">${r.symbol}</div><b>${esc(r.name)}</b><small class="muted"><i>${esc(r.en)}</i></small><p class="small">${esc(r.resp)}</p>
      <small>Participa en fases: ${MODEL.phases.filter(ph => ph.roles.includes(r.id)).map(ph => `<a href="#/fase/${ph.n}">${ph.n}</a>`).join(', ')}</small>
      <div class="rc-people">${ms.length ? ms.map(m => `<span class="member">${H.avatar(m, 'sm')} ${esc(m.name)}</span>`).join('') : '<span class="badge st-reopen">Sin asignar</span>'}</div></div>`; }).join('')}
  </div></section>
  <section class="card"><div class="card-head"><h3>Matriz de responsabilidades por fase</h3><button class="btn btn-sm" data-action="tpl-extra" data-key="raci">⬇ Formato RACI</button></div>
  <p class="small muted">● = rol participante según la Figura 1. Se muestra la persona designada como responsable en cada fase.</p>
  <div class="table-wrap"><table class="tbl raci"><thead><tr><th>Fase</th>${MODEL.roles.map(r => `<th style="--c:${r.color}" title="${esc(r.name)}"><span class="rsym">${r.symbol}</span><br><small>${esc(r.short)}</small></th>`).join('')}</tr></thead><tbody>
  ${MODEL.phases.map(ph => `<tr><td>${H.phaseLink(ph.n)}</td>${MODEL.roles.map(r => { const mid = p.phases[ph.n].responsible[r.id]; const inRole = ph.roles.includes(r.id); return `<td class="${inRole ? 'raci-on' : ''}" style="--c:${r.color}">${inRole ? '<span class="dot">●</span>' : ''}${mid ? `<br><small>${esc((Store.member(mid) || {}).name || '')}</small>` : inRole ? '<br><small class="miss">sin asignar</small>' : ''}</td>`; }).join('')}</tr>`).join('')}
  </tbody></table></div>
  <button class="btn btn-sm" data-action="auto-assign">Asignar automáticamente según roles del equipo</button></section>`;
};

/* ============================ Requisitos ============================ */
Views.requisitos = () => {
  const p = Store.project();
  return `${H.pageHead('Requisitos de entrada', 'Requisitos del sistema clásico relevantes para el componente. Se reciben de la etapa previa (fuera del ciclo) y son la entrada de la fase 1.', `<button class="btn btn-primary" data-action="req-edit">＋ Nuevo requisito</button>`)}
  <div class="alert info">El ciclo <b>no</b> incluye la obtención ni definición de requisitos; aquí solo se registran para trazar qué artefactos los atienden. Los requisitos nuevos para mantenimiento evolutivo deben definirse primero en el proceso clásico externo.</div>
  <section class="card">${p.requirements.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Requisito</th><th>Tipo</th><th>Prioridad</th><th>Origen</th><th>Artefactos que lo trazan</th><th></th></tr></thead><tbody>
    ${p.requirements.map(r => { const arts = MODEL.internalArtifacts().filter(a => p.artifacts[a.id].trace.includes(r.id)); return `<tr><td><b>${esc(r.code)}</b></td><td><b>${esc(r.title)}</b><br><small class="muted">${esc(r.description || '')}</small></td><td>${esc(r.type)}</td><td><span class="prio prio-${r.priority}">${esc(r.priority)}</span></td><td>${esc(r.source || '')}</td>
    <td>${arts.length ? arts.map(a => `<a href="#/artefacto/${a.id}" class="tag">${a.short}</a>`).join(' ') : '<span class="badge st-reopen">Sin trazar</span>'}</td>
    <td class="nowrap"><button class="icon-btn" data-action="req-edit" data-id="${r.id}">✎</button><button class="icon-btn" data-action="req-del" data-id="${r.id}">🗑</button></td></tr>`; }).join('')}
  </tbody></table></div>` : H.empty('No hay requisitos registrados.', '<button class="btn btn-primary" data-action="req-edit">＋ Nuevo requisito</button>')}</section>`;
};

/* ============================ Trazabilidad ============================ */
Views.trazabilidad = () => {
  const p = Store.project();
  const arts = MODEL.internalArtifacts();
  const covered = p.requirements.filter(r => arts.some(a => p.artifacts[a.id].trace.includes(r.id))).length;
  const cov = p.requirements.length ? Math.round(covered / p.requirements.length * 100) : 0;
  const sel = UIState.impactArt;
  const up = Views.upstream(sel), down = Views.downstream(sel);
  return `${H.pageHead('Matriz de trazabilidad', 'Relaciones requisito ↔ artefacto ↔ fase, y análisis de impacto de cambios.', `<button class="btn" data-action="export-trace">⬇ Exportar matriz (CSV)</button>`)}
  <div class="grid g-3">
    <div class="card stat"><small>Cobertura de requisitos</small><b>${cov}%</b>${H.bar(cov)}<small class="muted">${covered}/${p.requirements.length} requisitos trazados</small></div>
    <div class="card stat"><small>Vínculos requisito–artefacto</small><b>${arts.reduce((a, x) => a + p.artifacts[x.id].trace.length, 0)}</b></div>
    <div class="card stat"><small>Artefactos con archivos de evidencia</small><b id="art-with-files">…</b></div>
  </div>
  <section class="card"><div class="card-head"><h3>Requisitos × artefactos</h3><span class="small muted">Haga clic en una celda para vincular/desvincular.</span></div>
  ${p.requirements.length ? `<div class="table-wrap"><table class="tbl matrix"><thead><tr><th>Requisito</th>${arts.map(a => `<th class="vert" title="${a.id}"><span>${a.short}</span></th>`).join('')}<th>Total</th></tr></thead><tbody>
    ${p.requirements.map(r => { const n = arts.filter(a => p.artifacts[a.id].trace.includes(r.id)).length; return `<tr><td class="nowrap"><b>${esc(r.code)}</b> <small class="muted">${esc(r.title.slice(0, 40))}</small></td>${arts.map(a => { const on = p.artifacts[a.id].trace.includes(r.id); return `<td class="mx ${on ? 'on' : ''}" data-action="trace-toggle" data-id="${a.id}" data-req="${r.id}" title="${r.code} ↔ ${a.id}">${on ? '●' : ''}</td>`; }).join('')}<td class="${n ? '' : 'miss'}">${n}</td></tr>`; }).join('')}
  </tbody></table></div><p class="small muted">${arts.map(a => `<b>${a.short}</b>=${a.id}`).join(' · ')}</p>` : H.empty('Registre requisitos para construir la matriz.', '<a class="btn btn-primary" href="#/requisitos">Ir a requisitos</a>')}
  </section>
  <section class="card"><div class="card-head"><h3>Fases × artefactos (E = entrada, S = salida)</h3></div>
  <div class="table-wrap"><table class="tbl matrix"><thead><tr><th>Fase</th>${arts.map(a => `<th class="vert" title="${a.id}"><span>${a.short}</span></th>`).join('')}</tr></thead><tbody>
  ${MODEL.phases.map(ph => `<tr><td class="nowrap">${H.phaseLink(ph.n)}</td>${arts.map(a => ph.outputs.includes(a.id) ? '<td class="mx out">S</td>' : ph.inputs.includes(a.id) ? '<td class="mx in">E</td>' : '<td></td>').join('')}</tr>`).join('')}
  </tbody></table></div></section>
  <section class="card"><div class="card-head"><h3>Análisis de impacto de cambios</h3></div>
    <label>Si cambia el artefacto…<select data-change="impact-art">${arts.map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${a.id} (fase ${a.phase})</option>`).join('')}</select></label>
    <div class="impact">
      <div><h4>⬆ Depende de (trazabilidad hacia atrás)</h4>${up.length ? up.map(id => `<div class="imp-item">${H.artLink(id)} ${MODEL.artifact(id).external ? '' : H.artBadge(id)}</div>`).join('') : '<p class="muted small">Entradas externas del ciclo.</p>'}</div>
      <div class="imp-center"><div class="imp-node">${sel}</div><small class="muted">Fase ${MODEL.artifact(sel).phase}</small>
        <p class="small">Requisitos: ${p.artifacts[sel].trace.map(rid => { const r = p.requirements.find(x => x.id === rid); return r ? `<span class="tag">${esc(r.code)}</span>` : ''; }).join(' ') || '—'}</p></div>
      <div><h4>⬇ Afecta a (trazabilidad hacia adelante)</h4>${down.length ? down.map(id => `<div class="imp-item">${H.artLink(id)} ${H.artBadge(id)}</div>`).join('') : '<p class="muted small">Sin dependientes.</p>'}
      ${down.length ? `<p class="small muted">Fases a revalidar: ${[...new Set(down.map(id => MODEL.artifact(id).phase))].sort((a, b) => a - b).join(', ')}</p>` : ''}</div>
    </div>
  </section>`;
};
Views.upstream = id => { const seen = new Set(); const walk = x => { const ph = MODEL.phase(MODEL.artifact(x).phase); if (!ph) return; ph.inputs.forEach(i => { if (!seen.has(i)) { seen.add(i); if (!MODEL.artifact(i).external) walk(i); } }); }; walk(id); return [...seen].sort((a, b) => MODEL.artifact(a).phase - MODEL.artifact(b).phase); };
Views.downstream = id => { const seen = new Set(); const walk = x => { MODEL.consumers(x).forEach(n => MODEL.phase(n).outputs.forEach(o => { if (!seen.has(o)) { seen.add(o); walk(o); } })); }; walk(id); return [...seen].sort((a, b) => MODEL.artifact(a).phase - MODEL.artifact(b).phase); };

/* ============================ Decisiones ============================ */
Views.decisiones = () => {
  const p = Store.project();
  return `${H.pageHead('Puntos de decisión', 'Adaptación de los anchor points del ICSM: pausas deliberadas para revisar la evidencia de un bloque de fases y decidir avanzar o iterar.', `<button class="btn" data-action="tpl-extra" data-key="decision">⬇ Formato de registro</button>`)}
  <div class="grid g-3">${Object.values(MODEL.decisionPoints).map(dp => { const h = p.decisions.filter(d => d.dp === dp.id); const st = p.phases[dp.phase].status; return `
    <section class="card dp-card"><div class="dp-badge">${dp.id}</div><h3>${esc(dp.name)}</h3><p class="small">${esc(dp.desc)}</p>
    <p class="small"><b>Bloque:</b> fases ${dp.block[0]}–${dp.block[1]} · <b>Avance a:</b> fase ${dp.next}</p>
    <p class="small"><b>Retornos posibles:</b> ${dp.returns.map(r => `F${r.to}`).join(', ')}</p>
    <div class="dp-stats"><span>${h.filter(d => d.decision === 'avanzar').length} avances</span><span>${h.filter(d => d.decision === 'iterar').length} iteraciones</span></div>
    ${H.phaseBadge(dp.phase)} <a class="btn btn-sm btn-primary" href="#/fase/${dp.phase}?tab=dp">Abrir ${dp.id}</a></section>`; }).join('')}</div>
  <section class="card"><h3>Historial de decisiones (${p.decisions.length})</h3>${p.decisions.length ? Views.decisionTable(p.decisions) : H.empty('Aún no se han registrado decisiones.')}</section>`;
};
Views.decisionTable = list => `<div class="table-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>DP</th><th>Recorrido</th><th>Decisión</th><th>Motivo</th><th>Cambio a evaluar</th><th>Participantes</th><th>Registró</th></tr></thead><tbody>
  ${list.map(d => `<tr><td class="nowrap">${H.dt(d.date)}</td><td><b>${d.dp}</b></td><td>${d.cycle}</td><td>${d.decision === 'avanzar' ? '<span class="badge st-done">Avanzar</span>' : `<span class="badge st-reopen">Iterar → F${d.target}</span><br>${H.kind(d.kind)}`}</td><td class="small">${esc(d.reason)}${d.maintenanceNote ? `<br><i>Mantenimiento futuro: ${esc(d.maintenanceNote)}</i>` : ''}</td><td class="small">${esc(d.change || '—')}</td><td class="small">${(d.participants || []).map(id => esc((Store.member(id) || {}).name || '')).join(', ') || '—'}</td><td class="small">${esc(d.by)}</td></tr>`).join('')}
  </tbody></table></div>`;

/* ============================ Iteraciones ============================ */
Views.iteraciones = () => {
  const p = Store.project();
  const byKind = k => p.iterations.filter(i => i.kind === k).length;
  return `${H.pageHead('Iteraciones y retroalimentación', 'Registro de retornos a fases anteriores. La fase a la que se regresa depende de la causa del hallazgo.', `<button class="btn" data-action="tpl-extra" data-key="iteration">⬇ Formato</button><button class="btn btn-primary" data-action="maint-new">＋ Nuevo recorrido por mantenimiento</button>`)}
  <div class="grid g-4">
    <div class="card stat"><small>Recorrido actual</small><b>${p.cycle}</b></div>
    ${Object.entries(MODEL.iterationKinds).map(([k, v]) => `<div class="card stat" style="border-top:3px solid ${v.color}"><small>${v.label}</small><b>${byKind(k)}</b></div>`).join('')}
  </div>
  <section class="card"><h3>Historial de iteraciones</h3>${p.iterations.length ? Views.iterationTable(p.iterations) : H.empty('No se han registrado iteraciones.')}</section>
  <div class="grid g-2">
    <section class="card"><h3>Retornos desde la fase 9 (Figura 2)</h3>${Views.fig2()}</section>
    <section class="card"><h3>Motivos de retorno según la fase de origen (Cuadro 3)</h3><div class="table-wrap"><table class="tbl small"><thead><tr><th>Hallazgo o necesidad</th><th>Origen y motivo</th><th>Retorno</th></tr></thead><tbody>
      ${Object.values(MODEL.decisionPoints).flatMap(dp => dp.returns.map(r => `<tr><td>${esc(r.label.split(':')[0])}</td><td>Fase ${dp.phase}: ${H.kind(r.kind)}${r.sub ? ' ' + r.sub : ''}</td><td>${H.phaseLink(r.to)}</td></tr>`)).join('')}
    </tbody></table></div>
    <p class="small muted">El retorno 7→6 verifica la adaptación realizada; el retorno 9→6 atiende mantenimiento por cambio de entorno. Son motivos distintos aunque compartan destino.</p></section>
  </div>`;
};
Views.iterationTable = list => `<div class="table-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Recorrido</th><th>Retorno</th><th>Tipo</th><th>Motivo</th><th>Cambio a evaluar</th><th>Estado</th><th>Registró</th></tr></thead><tbody>
  ${list.map(i => `<tr><td class="nowrap">${H.dt(i.date)}</td><td>${i.cycle}</td><td class="nowrap"><a href="#/fase/${i.from}">F${i.from}</a> → <a href="#/fase/${i.to}">F${i.to}</a></td><td>${H.kind(i.kind)}${i.sub ? '<br><small>' + esc(i.sub) + '</small>' : ''}</td><td class="small">${esc(i.reason)}</td><td class="small">${esc(i.change || '—')}</td><td>${i.status === 'abierta' ? '<span class="badge st-progress">Abierta</span>' : `<span class="badge st-done">Cerrada</span><br><small class="muted">${H.date(i.closedAt)}</small>`}</td><td class="small">${esc(i.by)}</td></tr>`).join('')}
  </tbody></table></div>`;
Views.fig2 = () => {
  const nodes = [[1, 'Análisis del problema', 'mant', 470, 210], [2, 'Diseño del algoritmo', 'exp', 90, 210], [3, 'Construcción del circuito', 'exp', 470, 40], [4, 'Implementación en código', 'exp', 90, 40], [6, 'Optimización para hardware', 'mant', 280, 20], [8, 'Ejecución en hardware', 'exp', 280, 230]];
  const cx = 280, cy = 128;
  return `<svg viewBox="0 0 560 280" class="fig2">
    <defs><marker id="f2a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" class="f2-mk"/></marker></defs>
    ${nodes.map(([n, , k, x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y + (y < cy ? 22 : -2)}" class="f2-l ${k}" marker-end="url(#f2a)"/>`).join('')}
    <rect x="${cx - 80}" y="${cy - 20}" width="160" height="40" rx="8" class="f2-c"/><text x="${cx}" y="${cy + 1}" text-anchor="middle" dominant-baseline="middle" class="f2-ct">9. Análisis y corrección</text>
    ${nodes.map(([n, l, k, x, y]) => `<a href="#/fase/${n}"><rect x="${x - 78}" y="${y - 18}" width="156" height="${k === 'mant' ? 44 : 36}" rx="8" class="f2-n ${k}"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" class="f2-t">${n}. ${l}</text>${k === 'mant' ? `<text x="${x}" y="${y + 16}" text-anchor="middle" class="f2-s">Mantenimiento</text>` : ''}</a>`).join('')}
  </svg>`;
};

/* ============================ Riesgos ============================ */
Views.riesgos = () => {
  const p = Store.project(); const f = UIState.riskFilter;
  const list = p.risks.filter(r => (!f.phase || String(r.phase) === f.phase) && (!f.status || r.status === f.status));
  const open = p.risks.filter(r => !['cerrado', 'mitigado'].includes(r.status));
  return `${H.pageHead('Registro de riesgos', 'Riesgos de formulación, adecuación algorítmica, implementación, limitaciones del hardware y ruido en la ejecución.', `<button class="btn" data-action="risk-seed">Importar riesgos del modelo</button><button class="btn" data-action="tpl-risk-csv-proj">⬇ CSV</button><button class="btn btn-primary" data-action="risk-edit">＋ Nuevo riesgo</button>`)}
  <div class="grid g-2">
    <section class="card"><h3>Mapa de calor (riesgos abiertos: ${open.length})</h3>${Views.heatmap(open)}</section>
    <section class="card"><h3>Riesgos por fase</h3><div class="bars">${MODEL.phases.map(ph => { const c = p.risks.filter(r => Number(r.phase) === ph.n); const o = c.filter(r => !['cerrado', 'mitigado'].includes(r.status)).length; const max = Math.max(1, ...MODEL.phases.map(x => p.risks.filter(r => Number(r.phase) === x.n).length)); return `<div class="hbar"><span class="hb-l">F${ph.n}</span><div class="hb-t"><span class="hb-o" style="width:${o / max * 100}%"></span><span class="hb-c" style="width:${(c.length - o) / max * 100}%"></span></div><span class="hb-n">${c.length}</span></div>`; }).join('')}
      <p class="small muted"><span class="lg-box hb-o"></span> abiertos <span class="lg-box hb-c"></span> mitigados/cerrados</p></div></section>
  </div>
  <section class="card"><div class="card-head"><h3>Riesgos (${list.length})</h3>
    <div class="filters"><select data-change="risk-filter" data-key="phase"><option value="">Todas las fases</option>${MODEL.phases.map(ph => `<option value="${ph.n}" ${f.phase === String(ph.n) ? 'selected' : ''}>Fase ${ph.n}</option>`).join('')}</select>
    <select data-change="risk-filter" data-key="status"><option value="">Todos los estados</option>${Object.entries(MODEL.riskStatus).map(([k, v]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
    ${list.length ? Views.riskTable(list) : H.empty('No hay riesgos que coincidan.')}</section>`;
};
Views.riskTable = list => `<div class="table-wrap"><table class="tbl"><thead><tr><th>ID</th><th>Fase</th><th>Riesgo</th><th>Categoría</th><th>P</th><th>I</th><th>Exp.</th><th>Mitigación</th><th>Responsable</th><th>Estado</th><th></th></tr></thead><tbody>
  ${list.map(r => { const e = r.probability * r.impact; return `<tr><td><b>${esc(r.code)}</b></td><td><a href="#/fase/${r.phase}">F${r.phase}</a></td><td><b>${esc(r.title)}</b>${r.description ? `<br><small class="muted">${esc(r.description)}</small>` : ''}</td><td class="small">${esc(r.category)}</td><td>${r.probability}</td><td>${r.impact}</td><td><span class="sev ${H.sev(e)}">${e}</span></td><td class="small">${esc(r.mitigation || '—')}</td><td>${r.ownerId ? H.member(r.ownerId) : '—'}</td>
  <td><select class="mini-sel" data-change="risk-status" data-id="${r.id}">${Object.entries(MODEL.riskStatus).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
  <td class="nowrap"><button class="icon-btn" data-action="risk-edit" data-id="${r.id}">✎</button><button class="icon-btn" data-action="risk-del" data-id="${r.id}">🗑</button></td></tr>`; }).join('')}
  </tbody></table></div>`;

/* ============================ Archivos ============================ */
Views.archivos = () => {
  const f = UIState.fileFilter;
  return `${H.pageHead('Repositorio de evidencias', 'Todos los archivos subidos, versionados por artefacto, fase y recorrido del ciclo.', `<button class="btn btn-primary" data-action="upload">⬆ Subir archivo</button>`)}
  <section class="card"><div class="filters">
    <input type="search" placeholder="Buscar por nombre, nota o etiqueta…" value="${esc(f.q)}" data-change="file-filter" data-key="q">
    <select data-change="file-filter" data-key="phase"><option value="">Todas las fases</option>${MODEL.phases.map(ph => `<option value="${ph.n}" ${f.phase === String(ph.n) ? 'selected' : ''}>Fase ${ph.n}. ${esc(ph.name)}</option>`).join('')}</select>
    <select data-change="file-filter" data-key="cat"><option value="">Todas las categorías</option>${FILE_CATEGORIES.map(c => `<option ${f.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
  </div><div id="storage-info" class="small muted"></div>
  <div data-files='${JSON.stringify({ all: true })}'></div></section>`;
};
const FILE_CATEGORIES = ['Evidencia', 'Artefacto (documento)', 'Código fuente', 'Resultados / datos', 'Notebook', 'Imagen / diagrama', 'Minuta / acta', 'Otro'];

/* ============================ Cronograma ============================ */
Views.cronograma = () => {
  const p = Store.project();
  const dates = [];
  MODEL.phases.forEach(ph => { const s = p.phases[ph.n]; [s.plannedStart, s.plannedEnd, s.startedAt, s.completedAt].filter(Boolean).forEach(d => dates.push(new Date(d).getTime())); });
  if (p.startDate) dates.push(new Date(p.startDate).getTime()); if (p.dueDate) dates.push(new Date(p.dueDate).getTime());
  dates.push(Date.now());
  const min = Math.min(...dates), max = Math.max(...dates, min + 86400000 * 30);
  const pct = t => ((t - min) / (max - min) * 100).toFixed(2);
  const months = []; { const d = new Date(min); d.setDate(1); while (d.getTime() <= max) { months.push(new Date(d)); d.setMonth(d.getMonth() + 1); } }
  return `${H.pageHead('Cronograma', 'Planeación de fases (barra clara) frente a la ejecución real (barra sólida). Defina fechas planeadas en cada fase o aquí mismo.')}
  <section class="card gantt-card"><div class="gantt">
    <div class="g-head"><div class="g-lbl"></div><div class="g-track">${months.map(m => `<span class="g-month" style="left:${pct(m.getTime())}%">${m.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })}</span>`).join('')}<span class="g-today" style="left:${pct(Date.now())}%" title="Hoy"></span></div></div>
    ${MODEL.phases.map(ph => { const s = p.phases[ph.n]; const ps = s.plannedStart && new Date(s.plannedStart).getTime(), pe = s.plannedEnd && new Date(s.plannedEnd).getTime(); const as = s.startedAt && new Date(s.startedAt).getTime(); const ae = s.completedAt ? new Date(s.completedAt).getTime() : (as ? Date.now() : 0);
      return `<div class="g-row"><div class="g-lbl"><a href="#/fase/${ph.n}">${ph.n}. ${esc(ph.name)}</a></div><div class="g-track">
        ${ps && pe ? `<span class="g-plan" style="left:${pct(ps)}%;width:${Math.max(.5, pct(pe) - pct(ps))}%"></span>` : ''}
        ${as ? `<span class="g-act ${MODEL.phaseStatus[s.status].cls}" style="left:${pct(as)}%;width:${Math.max(.6, pct(ae) - pct(as))}%"></span>` : ''}
        <span class="g-today" style="left:${pct(Date.now())}%"></span></div></div>`; }).join('')}
  </div></section>
  <section class="card"><h3>Fechas planeadas</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Fase</th><th>Inicio planeado</th><th>Fin planeado</th><th>Inicio real</th><th>Cierre real</th><th>Desviación</th></tr></thead><tbody>
    ${MODEL.phases.map(ph => { const s = p.phases[ph.n]; let dev = '—'; if (s.plannedEnd && s.completedAt) { const d = Math.round((new Date(s.completedAt) - new Date(s.plannedEnd + 'T23:59')) / 86400000); dev = d > 0 ? `<span class="sev sev-hi">+${d} días</span>` : `<span class="sev sev-lo">${d} días</span>`; } else if (s.plannedEnd && s.status !== 'completada' && new Date(s.plannedEnd + 'T23:59') < new Date()) dev = '<span class="sev sev-hi">Vencida</span>';
      return `<tr><td>${H.phaseLink(ph.n)}</td><td><input type="date" value="${s.plannedStart}" data-change="phase-field" data-n="${ph.n}" data-key="plannedStart"></td><td><input type="date" value="${s.plannedEnd}" data-change="phase-field" data-n="${ph.n}" data-key="plannedEnd"></td><td>${H.date(s.startedAt)}</td><td>${H.date(s.completedAt)}</td><td>${dev}</td></tr>`; }).join('')}
  </tbody></table></div></section>`;
};

/* ============================ Bitácora ============================ */
Views.bitacora = () => {
  const p = Store.project(); const f = UIState.logFilter;
  const types = [...new Set(p.log.map(l => l.type))];
  const list = p.log.filter(l => (!f.type || l.type === f.type) && (!f.phase || String(l.phase) === f.phase) && (!f.q || (l.message + l.user).toLowerCase().includes(f.q.toLowerCase())));
  return `${H.pageHead('Bitácora de auditoría', 'Registro inmutable y cronológico de todas las acciones realizadas en el proyecto.', `<button class="btn" data-action="export-log">⬇ Exportar CSV</button>`)}
  <section class="card"><div class="filters">
    <input type="search" placeholder="Buscar…" value="${esc(f.q)}" data-change="log-filter" data-key="q">
    <select data-change="log-filter" data-key="type"><option value="">Todos los tipos</option>${types.map(t => `<option ${f.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <select data-change="log-filter" data-key="phase"><option value="">Todas las fases</option>${MODEL.phases.map(ph => `<option value="${ph.n}" ${f.phase === String(ph.n) ? 'selected' : ''}>Fase ${ph.n}</option>`).join('')}</select>
    <span class="muted small">${list.length} registros</span></div>
  ${list.length ? `<ul class="timeline big">${list.slice(0, 400).map(l => `<li><span class="tl-dot t-${l.type}"></span><div><p>${esc(l.message)}</p><small><span class="tag">${l.type}</span> ${H.dt(l.date)} · ${esc(l.user)} · recorrido ${l.cycle || 1}${l.phase ? ` · <a href="#/fase/${l.phase}">fase ${l.phase}</a>` : ''}</small></div></li>`).join('')}</ul>` : H.empty('Sin registros.')}
  </section>`;
};

/* ============================ Reportes ============================ */
Views.reportes = () => `${H.pageHead('Reportes y respaldo', 'Genere reportes del estado del ciclo y respalde o comparta el proyecto completo.')}
  <div class="grid g-2">
    <section class="card"><h3>Reporte integral del proyecto</h3><p class="small muted">Incluye datos generales, equipo y roles, estado de cada fase con actividades, artefactos con su contenido, decisiones, iteraciones, riesgos, matriz de trazabilidad y bitácora.</p>
      <div class="form-col">
        <label class="chk"><input type="checkbox" id="rep-content" checked> Incluir contenido de los artefactos</label>
        <label class="chk"><input type="checkbox" id="rep-log"> Incluir bitácora completa</label>
      </div>
      <div class="btn-row"><button class="btn btn-primary" data-action="report" data-fmt="print">🖨 Ver / imprimir (PDF)</button><button class="btn" data-action="report" data-fmt="doc">⬇ Word</button><button class="btn" data-action="report" data-fmt="html">⬇ HTML</button></div></section>
    <section class="card"><h3>Exportaciones de datos</h3><div class="btn-col">
      <button class="btn" data-action="tpl-risk-csv-proj">⬇ Registro de riesgos (CSV)</button>
      <button class="btn" data-action="export-trace">⬇ Matriz de trazabilidad (CSV)</button>
      <button class="btn" data-action="export-decisions">⬇ Decisiones e iteraciones (CSV)</button>
      <button class="btn" data-action="export-log">⬇ Bitácora (CSV)</button></div></section>
    <section class="card"><h3>Respaldo del proyecto</h3><p class="small muted">Exporte todo el proyecto (incluyendo archivos) a un único archivo .json. Úselo para respaldar, versionar en su repositorio o compartir con su asesor/equipo.</p>
      <div class="btn-row"><button class="btn btn-primary" data-action="export-json" data-files="1">⬇ Exportar con archivos</button><button class="btn" data-action="export-json" data-files="0">⬇ Solo datos</button></div>
      <h4>Importar respaldo</h4><label class="btn btn-ghost">Seleccionar archivo .json<input type="file" accept=".json,application/json" data-change="import-json" hidden></label>
      <p class="small muted">Se importa como un proyecto adicional; no sobrescribe los existentes.</p></section>
    <section class="card"><h3>Almacenamiento</h3><div id="storage-info2" class="small"></div>
      <p class="small muted">Los datos residen únicamente en este navegador. Si borra los datos del sitio, se perderán: exporte respaldos con regularidad.</p></section>
  </div>`;

/* ============================ Guía ============================ */
Views.guia = () => `${H.pageHead('Guía del ciclo de vida', 'Referencia rápida del Anexo 1: propósito, fundamento, principios, fases y lógica de retroalimentación.')}
  <section class="card prose"><h3>Propósito</h3><p>El ciclo documenta de manera operativa el desarrollo de un <b>componente cuántico</b> destinado a incorporarse en un sistema clásico. No sustituye el ciclo de vida completo del software clásico: se ubica <b>después de la definición de requisitos del sistema</b>, una vez determinado que una función será atendida mediante un componente cuántico.</p>
  <h3>Fundamento en el ICSM</h3><p>La propuesta toma como base el <i>Incremental Commitment Spiral Model</i> (Boehm et al., 2014). De sus puntos de anclaje recupera la lógica de <b>detener el avance automático</b> al cierre de un conjunto de actividades para revisar el trabajo y decidir con base en evidencia, mediante tres <b>puntos de decisión</b> (DP1, DP2, DP3). Su función no es recalcular la viabilidad del proyecto, sino valorar si el componente cuenta con evidencia suficiente para avanzar o si necesita una iteración justificada.</p></section>
  <section class="card"><h3>Principios de operación</h3><div class="principles">${MODEL.principles.map((p, i) => `<div class="principle"><span>${i + 1}</span><div><b>${p[0]}</b><p class="small">${p[1]}</p></div></div>`).join('')}</div></section>
  <section class="card"><h3>Cómo usar este sistema</h3><ol class="howto">
    <li><b>Configure el equipo</b> en <a href="#/equipo">Equipo y roles</a> y elija el integrante activo en la barra superior.</li>
    <li><b>Registre los requisitos</b> de entrada en <a href="#/requisitos">Requisitos</a>.</li>
    <li>En cada <b>fase</b>: iníciela, asigne responsables, marque actividades, documente o suba los artefactos, envíelos a revisión y apruébelos.</li>
    <li>Confirme el <b>criterio de salida</b> y cierre la fase. En las fases 5, 7 y 9 la fase se cierra registrando el <b>punto de decisión</b>.</li>
    <li>Si un DP decide <b>iterar</b>, el sistema reabre la fase destino, versiona los artefactos afectados y registra la iteración.</li>
    <li>Use <a href="#/trazabilidad">Trazabilidad</a> para vincular requisitos y analizar el impacto de cambios, y <a href="#/reportes">Reportes</a> para generar evidencia y respaldos.</li></ol></section>
  <section class="card"><h3>Fases</h3>${MODEL.phases.map(ph => `<details class="acc"><summary>${H.typeDot(ph.type)} <b>${ph.n}. ${esc(ph.name)}</b> ${ph.dp ? `<span class="dp-inline">◆ ${ph.dp}</span>` : ''} <span class="acc-roles">${ph.roles.map(r => H.role(r, true)).join('')}</span></summary>
    <div class="acc-body"><p><b>Propósito.</b> ${esc(ph.purpose)}</p>${ph.note ? `<p class="small muted">${esc(ph.note)}</p>` : ''}
    <p><b>Entradas.</b> ${ph.inputs.map(H.artLink).join(', ')}</p><p><b>Actividades.</b></p><ol>${ph.activities.map(a => `<li>${esc(a)}</li>`).join('')}</ol>
    <p><b>Artefactos.</b> ${ph.outputs.map(H.artLink).join(', ')}</p><p><b>Riesgos.</b> ${ph.risks.map(esc).join(' ')}</p>
    <p><b>Criterio de salida.</b> ${esc(ph.exit)}</p><a class="btn btn-sm" href="#/fase/${ph.n}">Abrir fase</a></div></details>`).join('')}</section>
  <section class="card prose"><h3>Relación entre despliegue e integración</h3><p>El <b>despliegue</b> consiste en cargar el código del circuito en un entorno y dejarlo listo para que el sistema clásico lo invoque (<code>DeployedQuantumSystem</code>); no implica ejecución permanente ni integración. La <b>integración</b> incorpora la invocación al flujo del sistema clásico y el tratamiento de entradas y resultados (<code>HybridClassicalQuantumModule</code>).</p>
  <h3>Alcance y límites</h3><p>No prescribe proveedor, framework, algoritmo, mecanismo de comunicación ni arquitectura de despliegue. Los retornos de mantenimiento se limitan al componente cuántico y no incorporan al ciclo la definición de requisitos ni la gestión completa del mantenimiento del sistema clásico.</p>
  <h3>Referencias</h3><p class="small">Boehm, B., Lane, J. A., Koolmanojwong, S., &amp; Turner, R. (2014). <i>The Incremental Commitment Spiral Model</i>. Addison-Wesley.<br>Preskill, J. (2018). Quantum Computing in the NISQ era and beyond. <i>Quantum</i>, 2, 79. https://doi.org/10.22331/q-2018-08-06-79</p></section>`;

/* ============================ Proyecto ============================ */
Views.proyecto = () => {
  const p = Store.project();
  const projects = Object.values(Store.state.projects);
  return `${H.pageHead('Configuración del proyecto', 'Datos generales, proyectos guardados y preferencias.')}
  <div class="grid g-2">
    <section class="card"><h3>Datos generales</h3><div class="form-col" id="proj-form">
      <label>Nombre del proyecto<input name="name" value="${esc(p.name)}"></label>
      <label>Componente cuántico (función asignada)<input name="component" value="${esc(p.component)}"></label>
      <label>Sistema clásico anfitrión<input name="system" value="${esc(p.system)}"></label>
      <label>Institución / organización<input name="institution" value="${esc(p.institution)}"></label>
      <label>Responsable / líder<input name="leader" value="${esc(p.leader)}"></label>
      <div class="form-row"><label>Fecha de inicio<input type="date" name="startDate" value="${esc(p.startDate)}"></label><label>Fecha objetivo<input type="date" name="dueDate" value="${esc(p.dueDate)}"></label></div>
      <label>Descripción<textarea name="description" rows="4">${esc(p.description)}</textarea></label>
      <button class="btn btn-primary" data-action="project-save">Guardar cambios</button></div></section>
    <section class="card"><h3>Proyectos guardados (${projects.length})</h3>
      <ul class="proj-list">${projects.map(x => `<li class="${x.id === p.id ? 'on' : ''}"><div><b>${esc(x.name)}</b><small class="muted">Actualizado ${H.dt(x.updatedAt)}</small></div><div>${x.id === p.id ? '<span class="badge st-done">Abierto</span>' : `<button class="btn btn-sm" data-action="project-open" data-id="${x.id}">Abrir</button>`}<button class="icon-btn" data-action="project-del" data-id="${x.id}" title="Eliminar">🗑</button></div></li>`).join('')}</ul>
      <div class="btn-row"><button class="btn btn-primary" data-action="new-project">＋ Nuevo proyecto</button><button class="btn" data-action="load-demo">Cargar ejemplo</button><button class="btn" data-action="project-dup">Duplicar actual</button></div>
      <h3>Apariencia</h3><div class="seg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([k, l]) => `<label><input type="radio" name="theme" value="${k}" ${Store.state.theme === k ? 'checked' : ''} data-change="theme"> ${l}</label>`).join('')}</div>
    </section>
  </div>`;
};

const LOGO_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><circle cx="24" cy="24" r="5" fill="url(#lg1)"/><ellipse cx="24" cy="24" rx="20" ry="8" fill="none" stroke="url(#lg1)" stroke-width="2.4"/><ellipse cx="24" cy="24" rx="20" ry="8" fill="none" stroke="url(#lg1)" stroke-width="2.4" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="20" ry="8" fill="none" stroke="url(#lg1)" stroke-width="2.4" transform="rotate(120 24 24)"/></svg>`;
