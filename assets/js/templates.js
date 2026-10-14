/* =========================================================================
   Generación de plantillas (Markdown, Word .doc, CSV) y descargas
   ========================================================================= */
'use strict';

const Templates = {};

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* Encabezado de control documental común */
function headerRows(def, ctx) {
  const ph = def.phase ? MODEL.phase(def.phase) : null;
  return [
    ['Proyecto', ctx.project ? ctx.project.name : ''],
    ['Componente cuántico', ctx.project ? ctx.project.component : ''],
    ['Artefacto', def.id],
    ['Fase de origen', ph ? `${ph.n}. ${ph.name}` : ''],
    ['Versión', ctx.state ? 'v' + ctx.state.version : 'v1'],
    ['Recorrido del ciclo', ctx.project ? String(ctx.project.cycle) : '1'],
    ['Estado', ctx.state ? MODEL.artifactStatus[ctx.state.status].label : 'Borrador'],
    ['Elaboró', ctx.state && ctx.state.owner ? ctx.state.owner : ''],
    ['Revisó / aprobó', ctx.state && ctx.state.approvedBy ? ctx.state.approvedBy : ''],
    ['Fecha', today()]
  ];
}

function traceSection(def) {
  const ph = MODEL.phase(def.phase);
  const consumers = MODEL.consumers(def.id);
  return {
    from: ph.inputs.map(i => MODEL.artifact(i).name),
    to: consumers.map(n => `Fase ${n}. ${MODEL.phase(n).name}`)
  };
}

/* ------------------------------ Markdown ------------------------------ */
Templates.markdown = function (artId, ctx = {}) {
  const def = MODEL.artifact(artId);
  const filled = ctx.state ? ctx.state.fields : {};
  const ph = MODEL.phase(def.phase);
  const tr = traceSection(def);
  let md = `# ${def.id}\n\n> ${def.desc}\n\n## Control del documento\n\n| Campo | Valor |\n|---|---|\n`;
  headerRows(def, ctx).forEach(([k, v]) => { md += `| ${k} | ${v || ' '} |\n`; });
  md += `\n## Trazabilidad\n\n- **Se deriva de:** ${tr.from.join('; ')}\n- **Alimenta a:** ${tr.to.join('; ') || 'Fin del ciclo'}\n`;
  if (ctx.reqs && ctx.reqs.length) md += `- **Requisitos vinculados:** ${ctx.reqs.join(', ')}\n`;
  md += `- **Responsables de la fase:** ${ph.roles.map(r => MODEL.role(r).name).join(', ')}\n`;
  def.fields.forEach((f, i) => {
    md += `\n## ${i + 1}. ${f.label}\n\n`;
    if (f.hint) md += `_${f.hint}_\n\n`;
    if (f.type === 'table') {
      const rows = (Array.isArray(filled[f.id]) && filled[f.id].length) ? filled[f.id] : (f.seed || [f.columns.map(() => '')]);
      md += `| ${f.columns.join(' | ')} |\n|${f.columns.map(() => '---').join('|')}|\n`;
      rows.forEach(r => { md += `| ${f.columns.map((_, j) => String(r[j] || ' ').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |\n`; });
    } else {
      md += (filled[f.id] ? filled[f.id] : '<!-- Completar -->') + '\n';
    }
  });
  md += `\n## Criterio de salida de la fase\n\n${ph.exit}\n\n- [ ] Criterio de salida cumplido\n\n## Firmas\n\n| Rol | Nombre | Firma | Fecha |\n|---|---|---|---|\n`;
  ph.roles.forEach(r => { md += `| ${MODEL.role(r).name} | | | |\n`; });
  return md;
};

/* ------------------------- Word (.doc vía HTML) ------------------------- */
Templates.wordHTML = function (title, bodyHTML) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
 @page { size: 21.59cm 27.94cm; margin: 2.5cm 2.5cm 2.5cm 2.5cm; }
 body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; }
 h1 { font-size: 20pt; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 4pt; }
 h2 { font-size: 13pt; color: #1e3a8a; margin-top: 16pt; }
 h3 { font-size: 11.5pt; color: #334155; }
 table { border-collapse: collapse; width: 100%; margin: 6pt 0; }
 th, td { border: 1px solid #94a3b8; padding: 4pt 6pt; vertical-align: top; font-size: 10pt; }
 th { background: #e2e8f0; text-align: left; }
 .hint { color: #64748b; font-style: italic; font-size: 9.5pt; }
 .box { border: 1px solid #cbd5e1; min-height: 60pt; padding: 6pt; }
 .muted { color: #64748b; }
 blockquote { border-left: 3px solid #1e3a8a; margin: 0; padding-left: 8pt; color: #475569; }
</style></head><body>${bodyHTML}</body></html>`;
};

Templates.artifactHTML = function (artId, ctx = {}) {
  const def = MODEL.artifact(artId);
  const filled = ctx.state ? ctx.state.fields : {};
  const ph = MODEL.phase(def.phase);
  const tr = traceSection(def);
  let h = `<p class="muted">Ciclo de vida para el desarrollo de software cuántico — Fase ${ph.n}. ${esc(ph.name)}</p><h1>${esc(def.id)}</h1><blockquote>${esc(def.desc)}</blockquote>`;
  h += '<h2>Control del documento</h2><table>' + headerRows(def, ctx).map(([k, v]) => `<tr><th style="width:35%">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('') + '</table>';
  h += `<h2>Trazabilidad</h2><table><tr><th style="width:35%">Se deriva de</th><td>${esc(tr.from.join('; '))}</td></tr><tr><th>Alimenta a</th><td>${esc(tr.to.join('; ') || 'Fin del ciclo')}</td></tr>`;
  if (ctx.reqs && ctx.reqs.length) h += `<tr><th>Requisitos vinculados</th><td>${esc(ctx.reqs.join(', '))}</td></tr>`;
  h += `<tr><th>Roles responsables</th><td>${esc(ph.roles.map(r => MODEL.role(r).name).join(', '))}</td></tr></table>`;
  def.fields.forEach((f, i) => {
    h += `<h2>${i + 1}. ${esc(f.label)}</h2>`;
    if (f.hint) h += `<p class="hint">${esc(f.hint)}</p>`;
    if (f.type === 'table') {
      const rows = (Array.isArray(filled[f.id]) && filled[f.id].length) ? filled[f.id] : (f.seed || [f.columns.map(() => ''), f.columns.map(() => ''), f.columns.map(() => '')]);
      h += '<table><tr>' + f.columns.map(c => `<th>${esc(c)}</th>`).join('') + '</tr>' + rows.map(r => '<tr>' + f.columns.map((_, j) => `<td>${esc(r[j] || '')}&nbsp;</td>`).join('') + '</tr>').join('') + '</table>';
    } else {
      h += filled[f.id] ? `<p>${esc(filled[f.id]).replace(/\n/g, '<br>')}</p>` : '<div class="box">&nbsp;</div>';
    }
  });
  h += `<h2>Criterio de salida de la fase</h2><p>${esc(ph.exit)}</p><p>☐ Criterio de salida cumplido</p>`;
  h += '<h2>Firmas</h2><table><tr><th>Rol</th><th>Nombre</th><th>Firma</th><th>Fecha</th></tr>' + ph.roles.map(r => `<tr><td>${esc(MODEL.role(r).name)}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('') + '</table>';
  return h;
};

/* ------------------------ Plantillas adicionales ------------------------ */
Templates.extra = {
  decision: {
    name: 'Registro de punto de decisión (DP1/DP2/DP3)', file: 'Registro_Punto_de_Decision',
    html() {
      let h = '<h1>Registro de punto de decisión</h1><blockquote>Pausa deliberada para revisar la evidencia del bloque de fases y registrar una decisión justificada de avanzar o iterar (adaptación de los anchor points del ICSM).</blockquote>';
      h += '<table><tr><th style="width:35%">Punto de decisión</th><td>☐ DP1 (fase 5, bloque 1–5) &nbsp; ☐ DP2 (fase 7, bloque 6–7) &nbsp; ☐ DP3 (fase 9, bloque 8–9)</td></tr><tr><th>Fecha</th><td>&nbsp;</td></tr><tr><th>Recorrido del ciclo</th><td>&nbsp;</td></tr><tr><th>Participantes</th><td>&nbsp;</td></tr></table>';
      h += '<h2>1. Evidencia revisada</h2><table><tr><th>Artefacto</th><th>Versión</th><th>Observaciones</th></tr>' + '<tr><td>&nbsp;</td><td></td><td></td></tr>'.repeat(4) + '</table>';
      h += '<h2>2. Lista de verificación</h2>';
      Object.values(MODEL.decisionPoints).forEach(dp => { h += `<h3>${dp.id} — ${esc(dp.name)}</h3><ul>` + dp.checks.map(c => `<li>☐ ${esc(c)}</li>`).join('') + '</ul>'; });
      h += '<h2>3. Riesgos pendientes</h2><div class="box">&nbsp;</div>';
      h += '<h2>4. Decisión</h2><p>☐ Avanzar a la siguiente fase &nbsp;&nbsp; ☐ Iterar</p><table><tr><th style="width:35%">Fase de retorno (si itera)</th><td>&nbsp;</td></tr><tr><th>Tipo de retorno</th><td>☐ Corrección &nbsp; ☐ Ajuste experimental &nbsp; ☐ Mantenimiento evolutivo &nbsp; ☐ Mantenimiento adaptativo</td></tr><tr><th>Motivo</th><td>&nbsp;</td></tr><tr><th>Cambio que se evaluará</th><td>&nbsp;</td></tr><tr><th>Justificación</th><td>&nbsp;</td></tr></table>';
      h += '<h2>5. Firmas</h2><table><tr><th>Rol</th><th>Nombre</th><th>Firma</th></tr>' + MODEL.roles.map(r => `<tr><td>${esc(r.name)}</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('') + '</table>';
      return h;
    } },
  iteration: {
    name: 'Solicitud de iteración / retorno', file: 'Solicitud_de_Iteracion',
    html() {
      let h = '<h1>Solicitud de iteración (retorno a fase anterior)</h1><blockquote>La fase a la que se regresa depende de la causa del hallazgo. Toda versión modificada debe recorrer nuevamente las validaciones posteriores.</blockquote>';
      h += '<table><tr><th style="width:35%">Fase de origen</th><td>&nbsp;</td></tr><tr><th>Fase de destino</th><td>&nbsp;</td></tr><tr><th>Punto de decisión asociado</th><td>&nbsp;</td></tr><tr><th>Hallazgo o necesidad</th><td>&nbsp;</td></tr><tr><th>Tipo</th><td>☐ Corrección (DP1/DP2) ☐ Ajuste experimental (DP3) ☐ Mantenimiento</td></tr><tr><th>Cambio que se evaluará</th><td>&nbsp;</td></tr><tr><th>Artefactos afectados</th><td>&nbsp;</td></tr><tr><th>Validaciones a repetir</th><td>&nbsp;</td></tr><tr><th>Solicitó / Autorizó</th><td>&nbsp;</td></tr></table>';
      h += '<h2>Referencia: motivos de retorno (Cuadro 3)</h2><table><tr><th>Hallazgo o necesidad</th><th>Origen y motivo</th><th>Fase de retorno</th></tr>' +
        [['Error de código detectado en simulación', 'Fase 5: corrección lógica', '4. Implementación'], ['Circuito no representa el algoritmo', 'Fase 5: corrección del modelo', '3. Construcción del circuito'], ['Comportamiento alterado tras adaptar', 'Fase 7: revisión de transformaciones', '6. Optimización y adaptación'], ['Buscar una estrategia más robusta', 'Fase 9: ajuste experimental', '2. Diseño del algoritmo'], ['Reducir exposición del circuito al ruido', 'Fase 9: ajuste experimental', '3. Construcción del circuito'], ['Evaluar ajustes de código o mitigación', 'Fase 9: ajuste experimental', '4. Implementación'], ['Caracterizar variabilidad en hardware', 'Fase 9: reevaluación experimental', '8. Ejecución en hardware'], ['Cambiar de dispositivo o entorno', 'Fase 9: mantenimiento adaptativo', '6. Optimización y adaptación'], ['Modificar o agregar funcionalidad', 'Fase 9: mantenimiento evolutivo', '1. Análisis del problema']]
          .map(r => '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>';
      return h;
    } },
  meeting: {
    name: 'Minuta de reunión de revisión', file: 'Minuta_de_Revision',
    html() {
      return '<h1>Minuta de reunión de revisión</h1><table><tr><th style="width:35%">Fecha y hora</th><td>&nbsp;</td></tr><tr><th>Fase(s) revisada(s)</th><td>&nbsp;</td></tr><tr><th>Asistentes y roles</th><td>&nbsp;</td></tr></table><h2>Orden del día</h2><div class="box">&nbsp;</div><h2>Acuerdos</h2><table><tr><th>#</th><th>Acuerdo</th><th>Responsable</th><th>Fecha compromiso</th></tr>' + '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>'.repeat(5) + '</table><h2>Riesgos o hallazgos</h2><div class="box">&nbsp;</div>';
    } },
  raci: {
    name: 'Matriz de roles por fase (RACI)', file: 'Matriz_Roles_RACI',
    html() {
      let h = '<h1>Matriz de roles por fase</h1><p>R = Responsable de ejecutar (según Figura 1). Complete A (aprueba), C (consultado), I (informado) según su organización.</p><table><tr><th>Fase</th>' + MODEL.roles.map(r => `<th>${r.symbol} ${esc(r.name)}</th>`).join('') + '</tr>';
      MODEL.phases.forEach(p => { h += `<tr><td>${p.n}. ${esc(p.name)}</td>` + MODEL.roles.map(r => `<td style="text-align:center">${p.roles.includes(r.id) ? 'R' : ''}</td>`).join('') + '</tr>'; });
      h += '</table><h2>Asignación de personas</h2><table><tr><th>Rol</th><th>Persona(s)</th><th>Contacto</th></tr>' + MODEL.roles.map(r => `<tr><td>${r.symbol} ${esc(r.name)}</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join('') + '</table>';
      return h;
    } },
  phasechecklist: {
    name: 'Lista de verificación de todas las fases', file: 'Checklist_Fases',
    html() {
      let h = '<h1>Lista de verificación por fase</h1>';
      MODEL.phases.forEach(p => {
        h += `<h2>Fase ${p.n}. ${esc(p.name)}</h2><p><b>Propósito:</b> ${esc(p.purpose)}</p><p><b>Entradas:</b> ${esc(p.inputs.map(i => MODEL.artifact(i).name).join(', '))}</p><ul>` + p.activities.map(a => `<li>☐ ${esc(a)}</li>`).join('') + `</ul><p><b>Artefactos:</b> ${p.outputs.map(o => '☐ ' + o).join(' &nbsp; ')}</p><p><b>Criterio de salida:</b> ☐ ${esc(p.exit)}</p>`;
        if (p.dp) h += `<p><b>Punto de decisión:</b> ${p.dp}</p>`;
      });
      return h;
    } }
};

Templates.riskCSV = function (risks) {
  const head = ['ID', 'Fase', 'Categoría', 'Riesgo', 'Descripción', 'Probabilidad (1-5)', 'Impacto (1-5)', 'Exposición', 'Mitigación', 'Responsable', 'Estado'];
  const rows = (risks && risks.length) ? risks.map(r => [r.code, r.phase, r.category, r.title, r.description, r.probability, r.impact, r.probability * r.impact, r.mitigation, r.ownerName || '', MODEL.riskStatus[r.status]])
    : MODEL.phases.flatMap(p => p.risks.map((t, i) => [`R${p.n}.${i + 1}`, p.n, MODEL.phaseRiskCategory[p.n], t, '', '', '', '', '', '', 'Abierto']));
  return toCSV([head, ...rows]);
};
function toCSV(rows) {
  return '﻿' + rows.map(r => r.map(c => { const s = String(c == null ? '' : c); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n');
}

/* Descargas de alto nivel */
Templates.downloadArtifact = function (artId, format, ctx) {
  const suffix = ctx && ctx.state ? `_v${ctx.state.version}` : '_plantilla';
  if (format === 'md') download(`${artId}${suffix}.md`, Templates.markdown(artId, ctx), 'text/markdown;charset=utf-8');
  else download(`${artId}${suffix}.doc`, Templates.wordHTML(artId, Templates.artifactHTML(artId, ctx)), 'application/msword');
};
Templates.downloadExtra = function (key) {
  const t = Templates.extra[key];
  download(`${t.file}.doc`, Templates.wordHTML(t.name, t.html()), 'application/msword');
};
Templates.downloadAllZip = async function () {
  if (typeof JSZip === 'undefined') { UI.toast('No se pudo cargar la librería ZIP (requiere conexión). Descargue las plantillas individualmente.', 'error'); return; }
  const zip = new JSZip();
  const word = zip.folder('Word'), md = zip.folder('Markdown');
  MODEL.internalArtifacts().forEach(a => {
    const ph = String(a.phase).padStart(2, '0');
    word.file(`F${ph}_${a.id}.doc`, Templates.wordHTML(a.id, Templates.artifactHTML(a.id)));
    md.file(`F${ph}_${a.id}.md`, Templates.markdown(a.id));
  });
  const gest = zip.folder('Gestion');
  Object.entries(Templates.extra).forEach(([k, t]) => gest.file(`${t.file}.doc`, Templates.wordHTML(t.name, t.html())));
  gest.file('Registro_de_Riesgos.csv', Templates.riskCSV());
  const blob = await zip.generateAsync({ type: 'blob' });
  download('Plantillas_Ciclo_Vida_Software_Cuantico.zip', blob);
};
