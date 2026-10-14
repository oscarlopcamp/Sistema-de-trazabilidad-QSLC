/* =========================================================================
   Persistencia: estado en localStorage, archivos en IndexedDB
   ========================================================================= */
'use strict';

const STORE_KEY = 'qslc-trace-v1';
const uid = (p = 'id') => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowISO = () => new Date().toISOString();

/* ------------------------------ IndexedDB ------------------------------ */
const FileDB = (() => {
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('IndexedDB no disponible'));
      const r = indexedDB.open('qslc-files', 1);
      r.onupgradeneeded = () => {
        const os = r.result.createObjectStore('files', { keyPath: 'id' });
        os.createIndex('project', 'projectId');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('files', mode);
      const os = t.objectStore('files');
      const out = fn(os);
      t.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
      t.onerror = () => rej(t.error);
    });
  }
  return {
    put: rec => tx('readwrite', os => os.put(rec)),
    get: id => tx('readonly', os => os.get(id)),
    del: id => tx('readwrite', os => os.delete(id)),
    byProject: pid => tx('readonly', os => os.index('project').getAll(pid)),
    delProject: async pid => {
      const all = await FileDB.byProject(pid);
      await tx('readwrite', os => all.forEach(f => os.delete(f.id)));
    }
  };
})();

/* ------------------------------- Estado -------------------------------- */
const Store = {
  state: null,

  load() {
    try { this.state = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { this.state = null; }
    if (!this.state || !this.state.projects) this.state = { version: 1, currentProjectId: null, projects: {}, theme: 'auto' };
    Object.values(this.state.projects).forEach(p => this.migrate(p));
    return this.state;
  },
  save() {
    try {
      const p = this.project();
      if (p) p.updatedAt = nowISO();
      localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    } catch (e) {
      UI.toast('No se pudo guardar: el almacenamiento local está lleno o bloqueado.', 'error');
    }
  },
  project() { return this.state.projects[this.state.currentProjectId] || null; },

  newProject(data) {
    const p = {
      id: uid('prj'), name: data.name || 'Nuevo componente cuántico',
      description: data.description || '', system: data.system || '', component: data.component || '',
      institution: data.institution || '', leader: data.leader || '',
      createdAt: nowISO(), updatedAt: nowISO(), startDate: data.startDate || new Date().toISOString().slice(0, 10), dueDate: data.dueDate || '',
      cycle: 1, currentUserId: null,
      team: [], requirements: [], decisions: [], iterations: [], risks: [], log: [], phases: {}, artifacts: {}, meetings: []
    };
    this.migrate(p);
    this.state.projects[p.id] = p;
    this.state.currentProjectId = p.id;
    this.log('proyecto', `Proyecto creado: «${p.name}»`);
    this.save();
    return p;
  },

  /* Garantiza que todas las estructuras existan (compatibilidad hacia adelante) */
  migrate(p) {
    ['team', 'requirements', 'decisions', 'iterations', 'risks', 'log', 'meetings'].forEach(k => { if (!Array.isArray(p[k])) p[k] = []; });
    p.phases = p.phases || {}; p.artifacts = p.artifacts || {};
    MODEL.phases.forEach(ph => {
      const s = p.phases[ph.n] = p.phases[ph.n] || {};
      s.status = s.status || 'no_iniciada';
      s.activities = s.activities || {};
      s.exit = s.exit || { met: false };
      s.notes = s.notes || '';
      s.responsible = s.responsible || {};
      s.dpChecks = s.dpChecks || {};
      s.plannedStart = s.plannedStart || ''; s.plannedEnd = s.plannedEnd || '';
      s.visits = s.visits || 0;
    });
    MODEL.internalArtifacts().forEach(a => {
      const s = p.artifacts[a.id] = p.artifacts[a.id] || {};
      s.status = s.status || 'pendiente';
      s.version = s.version || 1;
      s.fields = s.fields || {};
      s.history = s.history || [];
      s.trace = s.trace || [];
      s.owner = s.owner || '';
    });
    return p;
  },

  /* ------------------------- Bitácora ------------------------- */
  log(type, message, extra = {}) {
    const p = this.project(); if (!p) return;
    const u = this.currentUser();
    p.log.unshift({ id: uid('log'), date: nowISO(), type, message, user: u ? u.name : 'Sin usuario', userId: u ? u.id : null, cycle: p.cycle, ...extra });
    if (p.log.length > 2000) p.log.length = 2000;
  },
  currentUser() {
    const p = this.project(); if (!p) return null;
    return p.team.find(m => m.id === p.currentUserId) || null;
  },
  member(id) { const p = this.project(); return p ? p.team.find(m => m.id === id) : null; },
  membersForRole(roleId) { const p = this.project(); return p ? p.team.filter(m => (m.roles || []).includes(roleId)) : []; },

  /* ------------------------- Fases ------------------------- */
  phaseState(n) { return this.project().phases[n]; },
  isPhaseUnlocked(n) {
    if (n === 1) return true;
    const p = this.project();
    const prev = p.phases[n - 1];
    return prev.status === 'completada' || p.phases[n].status !== 'no_iniciada';
  },
  setPhaseStatus(n, status, why) {
    const s = this.phaseState(n);
    const old = s.status;
    if (old === status) return;
    s.status = status;
    if (status === 'en_progreso' && !s.startedAt) s.startedAt = nowISO();
    if (status === 'en_progreso') s.visits = (s.visits || 0) + (old === 'no_iniciada' || old === 'reabierta' ? 1 : 0);
    if (status === 'completada') { s.completedAt = nowISO(); this.closeIterationsReaching(n); }
    this.log('fase', `Fase ${n} «${MODEL.phase(n).name}»: ${MODEL.phaseStatus[old].label} → ${MODEL.phaseStatus[status].label}${why ? ' — ' + why : ''}`, { phase: n });
  },
  activityProgress(n) {
    const ph = MODEL.phase(n), s = this.phaseState(n);
    const done = ph.activities.filter((_, i) => s.activities[i] && s.activities[i].done).length;
    return { done, total: ph.activities.length };
  },
  phaseProgress(n) {
    const ph = MODEL.phase(n), s = this.phaseState(n), p = this.project();
    if (s.status === 'completada') return 100;
    const a = this.activityProgress(n);
    const arts = ph.outputs.map(id => p.artifacts[id]);
    const artScore = arts.reduce((acc, x) => acc + ({ pendiente: 0, en_elaboracion: .4, requiere_cambios: .4, en_revision: .75, aprobado: 1 }[x.status] || 0), 0);
    const total = a.total + arts.length + 1;
    const got = a.done + artScore + (s.exit.met ? 1 : 0);
    return Math.round(got / total * 100);
  },
  overallProgress() {
    return Math.round(MODEL.phases.reduce((acc, ph) => acc + this.phaseProgress(ph.n), 0) / MODEL.phases.length);
  },
  currentPhase() {
    const p = this.project();
    const reopened = MODEL.phases.find(ph => p.phases[ph.n].status === 'reabierta' || p.phases[ph.n].status === 'en_progreso' || p.phases[ph.n].status === 'en_revision');
    if (reopened) return reopened.n;
    const next = MODEL.phases.find(ph => p.phases[ph.n].status !== 'completada');
    return next ? next.n : null;
  },

  /* Verificaciones para cerrar una fase */
  closeChecks(n) {
    const ph = MODEL.phase(n), s = this.phaseState(n), p = this.project();
    const a = this.activityProgress(n);
    const issues = [];
    if (n > 1 && p.phases[n - 1].status !== 'completada') issues.push({ level: 'error', text: `La fase ${n - 1} no está completada.` });
    if (a.done < a.total) issues.push({ level: 'warn', text: `Actividades completadas: ${a.done}/${a.total}.` });
    ph.outputs.forEach(id => { if (p.artifacts[id].status !== 'aprobado') issues.push({ level: 'error', text: `El artefacto ${id} no está aprobado (${MODEL.artifactStatus[p.artifacts[id].status].label}).` }); });
    if (!s.exit.met) issues.push({ level: 'error', text: 'El criterio de salida no ha sido confirmado.' });
    const unassigned = ph.roles.filter(r => !s.responsible[r]);
    if (unassigned.length) issues.push({ level: 'warn', text: `Roles sin responsable asignado: ${unassigned.map(r => MODEL.role(r).name).join(', ')}.` });
    return issues;
  },

  /* ------------------------- Artefactos ------------------------- */
  setArtifactStatus(id, status, note) {
    const a = this.project().artifacts[id];
    const old = a.status; a.status = status;
    if (status === 'aprobado') { a.approvedAt = nowISO(); a.approvedBy = (this.currentUser() || {}).name || ''; }
    a.history.unshift({ date: nowISO(), version: a.version, by: (this.currentUser() || {}).name || 'Sin usuario', action: `${MODEL.artifactStatus[old].label} → ${MODEL.artifactStatus[status].label}`, note: note || '' });
    this.log('artefacto', `${id} v${a.version}: ${MODEL.artifactStatus[old].label} → ${MODEL.artifactStatus[status].label}${note ? ' — ' + note : ''}`, { phase: MODEL.artifact(id).phase, artifact: id });
  },
  bumpArtifact(id, reason) {
    const a = this.project().artifacts[id];
    a.history.unshift({ date: nowISO(), version: a.version, by: (this.currentUser() || {}).name || 'Sin usuario', action: `Nueva versión v${a.version + 1}`, note: reason || '', snapshot: JSON.parse(JSON.stringify(a.fields)) });
    a.version += 1;
    a.status = 'en_elaboracion';
    a.approvedAt = null;
    this.log('artefacto', `${id}: nueva versión v${a.version}${reason ? ' — ' + reason : ''}`, { phase: MODEL.artifact(id).phase, artifact: id });
  },
  artifactCompleteness(id) {
    const def = MODEL.artifact(id), a = this.project().artifacts[id];
    if (!def.fields) return 0;
    const filled = def.fields.filter(f => {
      const v = a.fields[f.id];
      if (f.type === 'table') return Array.isArray(v) && v.some(r => r.some(c => String(c || '').trim()));
      return v && String(v).trim();
    }).length;
    return Math.round(filled / def.fields.length * 100);
  },

  /* ------------------------- Decisiones e iteraciones ------------------------- */
  registerDecision(d) {
    const p = this.project();
    const dp = MODEL.decisionPoints[d.dp];
    const rec = { id: uid('dec'), date: nowISO(), cycle: p.cycle, by: (this.currentUser() || {}).name || 'Sin usuario', ...d };
    p.decisions.unshift(rec);
    // Registrar fundamento en el informe asociado
    const reportId = { DP1: 'InitialSimulationReport', DP2: 'OptimizedSimulationReport', DP3: 'ResultsAnalysisReport' }[d.dp];
    const rep = p.artifacts[reportId];
    const line = `[${new Date().toLocaleDateString('es-MX')}] ${d.dp} — ${d.decision === 'avanzar' ? 'AVANZAR a fase ' + dp.next : 'ITERAR hacia fase ' + d.target}: ${d.reason}${d.change ? ' | Cambio a evaluar: ' + d.change : ''}`;
    rep.fields.decision = (rep.fields.decision ? rep.fields.decision + '\n' : '') + line;

    if (d.decision === 'avanzar') {
      this.log('decision', `${d.dp}: decisión de AVANZAR a la fase ${dp.next}. ${d.reason}`, { phase: dp.phase });
      if (this.phaseState(dp.phase).status !== 'completada') {
        this.phaseState(dp.phase).exit.met = true;
        this.setPhaseStatus(dp.phase, 'completada', `Autorizado por ${d.dp}`);
      }
      if (d.maintenanceNote) this.log('decision', `${d.dp}: necesidad de mantenimiento futuro documentada: ${d.maintenanceNote}`, { phase: dp.phase });
    } else {
      this.log('decision', `${d.dp}: decisión de ITERAR hacia la fase ${d.target} (${MODEL.iterationKinds[d.kind].label}). ${d.reason}`, { phase: dp.phase });
      this.startIteration({ from: dp.phase, to: d.target, kind: d.kind, sub: d.sub, reason: d.reason, change: d.change, decisionId: rec.id });
    }
    return rec;
  },
  startIteration(it) {
    const p = this.project();
    const rec = { id: uid('it'), date: nowISO(), cycle: p.cycle, by: (this.currentUser() || {}).name || 'Sin usuario', status: 'abierta', ...it };
    p.iterations.unshift(rec);
    // Reabrir fases afectadas: destino .. origen
    const upTo = Math.max(it.from, it.to);
    for (let n = it.to; n <= upTo; n++) {
      const s = p.phases[n];
      if (n === it.to) { this.setPhaseStatus(n, 'reabierta', `Iteración desde fase ${it.from}`); }
      else if (s.status !== 'no_iniciada') { s.status = 'no_iniciada'; s.reset = true; }
      s.exit = { met: false };
      s.activities = {};
      s.dpChecks = {};
    }
    // Las fases posteriores también requieren nuevo recorrido
    for (let n = upTo + 1; n <= 11; n++) { const s = p.phases[n]; if (s.status !== 'no_iniciada') { s.status = 'no_iniciada'; s.exit = { met: false }; s.activities = {}; s.dpChecks = {}; } }
    // Versionar artefactos producidos en las fases afectadas
    // (en reevaluación experimental hacia la fase 8 no cambia la versión del circuito)
    MODEL.internalArtifacts().forEach(a => {
      if (a.phase >= it.to && p.artifacts[a.id].status !== 'pendiente') this.bumpArtifact(a.id, `Iteración ${it.from}→${it.to}`);
    });
    if (it.kind === 'mantenimiento') p.cycle += 1;
    this.log('iteracion', `Retorno de la fase ${it.from} a la fase ${it.to} (${MODEL.iterationKinds[it.kind].label}${it.sub ? ' ' + it.sub : ''}): ${it.reason}`, { phase: it.to });
    return rec;
  },
  closeIterationsReaching(n) {
    // Una iteración se cierra cuando se vuelve a completar la fase de origen
    this.project().iterations.forEach(it => { if (it.status === 'abierta' && it.from === n) { it.status = 'cerrada'; it.closedAt = nowISO(); } });
  },

  /* ------------------------- Archivos ------------------------- */
  async addFile(file, meta) {
    const p = this.project();
    const rec = {
      id: uid('file'), projectId: p.id, name: file.name, type: file.type || 'application/octet-stream', size: file.size,
      blob: file, date: nowISO(), uploadedBy: (this.currentUser() || {}).name || 'Sin usuario', cycle: p.cycle,
      phase: meta.phase || null, artifact: meta.artifact || null, artifactVersion: meta.artifact ? p.artifacts[meta.artifact].version : null,
      category: meta.category || 'Evidencia', note: meta.note || '', tags: meta.tags || []
    };
    await FileDB.put(rec);
    this.log('archivo', `Archivo subido: ${file.name}${rec.artifact ? ' → ' + rec.artifact + ' v' + rec.artifactVersion : rec.phase ? ' → fase ' + rec.phase : ''}`, { phase: rec.phase || (rec.artifact ? MODEL.artifact(rec.artifact).phase : null) });
    this.save();
    return rec;
  },
  async files() { const p = this.project(); return p ? (await FileDB.byProject(p.id)).sort((a, b) => b.date.localeCompare(a.date)) : []; },

  /* ------------------------- Exportar / importar ------------------------- */
  async exportProject(withFiles = true) {
    const p = this.project();
    const out = { format: 'qslc-trace', version: 1, exportedAt: nowISO(), project: p, files: [] };
    if (withFiles) {
      const files = await this.files();
      for (const f of files) out.files.push({ ...f, blob: undefined, dataURL: await blobToDataURL(f.blob) });
    }
    return out;
  },
  async importProject(json) {
    if (!json || json.format !== 'qslc-trace' || !json.project) throw new Error('El archivo no es un respaldo válido de este sistema.');
    const p = this.migrate(json.project);
    const oldId = p.id;
    if (this.state.projects[p.id]) p.id = uid('prj');
    this.state.projects[p.id] = p;
    this.state.currentProjectId = p.id;
    for (const f of (json.files || [])) {
      const blob = await (await fetch(f.dataURL)).blob();
      await FileDB.put({ ...f, dataURL: undefined, id: p.id === oldId ? f.id : uid('file'), projectId: p.id, blob });
    }
    this.log('proyecto', 'Proyecto importado desde respaldo');
    this.save();
    return p;
  },
  async deleteProject(id) {
    delete this.state.projects[id];
    try { await FileDB.delProject(id); } catch (e) { /* sin IDB */ }
    if (this.state.currentProjectId === id) this.state.currentProjectId = Object.keys(this.state.projects)[0] || null;
    this.save();
  }
};

function blobToDataURL(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
}
