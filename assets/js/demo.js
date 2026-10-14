/* =========================================================================
   Proyecto de ejemplo (datos ficticios con fines de demostración)
   ========================================================================= */
'use strict';

const Demo = {
  create() {
    const p = Store.newProject({
      name: 'Ejemplo — Ruteo de última milla con QAOA',
      component: 'Solucionador QUBO para la asignación de rutas de reparto',
      system: 'Sistema de gestión de transporte (TMS)',
      institution: 'Proyecto de demostración',
      leader: 'Laura Méndez',
      description: 'Proyecto ficticio que ilustra el uso del ciclo: un componente cuántico basado en QAOA resuelve una instancia reducida del problema de ruteo, invocado por un sistema clásico de logística.',
      startDate: Demo.d(-70).slice(0, 10), dueDate: Demo.d(60).slice(0, 10)
    });
    p.log = [];
    const T = p.team = [
      { id: 'm1', name: 'Laura Méndez', email: 'laura.mendez@ejemplo.mx', affiliation: 'Algoritmos', roles: ['qad'] },
      { id: 'm2', name: 'Carlos Ruiz', email: 'carlos.ruiz@ejemplo.mx', affiliation: 'Ingeniería cuántica', roles: ['qse'] },
      { id: 'm3', name: 'Sofía Navarro', email: 'sofia.navarro@ejemplo.mx', affiliation: 'Arquitectura', roles: ['arch'] },
      { id: 'm4', name: 'Diego Herrera', email: 'diego.herrera@ejemplo.mx', affiliation: 'Desarrollo', roles: ['cse'] },
      { id: 'm5', name: 'Andrés Salgado', email: 'andres.salgado@ejemplo.mx', affiliation: 'Hardware', roles: ['hw'] },
      { id: 'm6', name: 'Paula Ortega', email: 'paula.ortega@ejemplo.mx', affiliation: 'Calidad', roles: ['qa'] }
    ];
    p.currentUserId = 'm2';
    const byRole = r => T.find(m => m.roles.includes(r));
    p.requirements = [
      { id: 'rq1', code: 'RQ-01', title: 'Minimizar la distancia total de la ruta', description: 'Para instancias de hasta 4 puntos de entrega, el componente devuelve el orden de visita de menor distancia.', type: 'Funcional', priority: 'Alta', source: 'Documento de requisitos TMS v2' },
      { id: 'rq2', code: 'RQ-02', title: 'Ruta factible', description: 'Cada punto se visita exactamente una vez.', type: 'Restricción', priority: 'Alta', source: 'Documento de requisitos TMS v2' },
      { id: 'rq3', code: 'RQ-03', title: 'Formato de intercambio JSON', description: 'Entrada: matriz de distancias; salida: permutación y costo.', type: 'Interfaz', priority: 'Media', source: 'Especificación de interfaces' },
      { id: 'rq4', code: 'RQ-04', title: 'Tiempo de respuesta acotado', description: 'Respuesta en menos de 5 minutos incluyendo la cola del proveedor.', type: 'No funcional', priority: 'Media', source: 'Acuerdo de nivel de servicio' }
    ];
    // Fases 1–5 completadas, 6 en progreso
    MODEL.phases.forEach(ph => {
      const s = p.phases[ph.n];
      ph.roles.forEach(r => { s.responsible[r] = byRole(r).id; });
      s.plannedStart = Demo.d(-70 + (ph.n - 1) * 11).slice(0, 10);
      s.plannedEnd = Demo.d(-60 + (ph.n - 1) * 11).slice(0, 10);
      if (ph.n <= 5) {
        s.status = 'completada'; s.startedAt = Demo.d(-70 + (ph.n - 1) * 11); s.completedAt = Demo.d(-61 + (ph.n - 1) * 11 + (ph.n === 4 || ph.n === 5 ? 6 : 0)); s.visits = ph.n >= 4 ? 2 : 1;
        ph.activities.forEach((_, i) => { s.activities[i] = { done: true, by: byRole(ph.roles[0]).name, byId: byRole(ph.roles[0]).id, date: s.completedAt }; });
        s.exit = { met: true, by: byRole(ph.roles[0]).name, date: s.completedAt, justification: 'Criterio verificado en reunión de revisión; evidencia en los artefactos aprobados.' };
      }
      if (ph.n === 5) MODEL.decisionPoints.DP1.checks.forEach((_, i) => { s.dpChecks[i] = true; });
      if (ph.n === 6) { s.status = 'en_progreso'; s.startedAt = Demo.d(-6); s.visits = 1; [0, 1, 2].forEach(i => { s.activities[i] = { done: true, by: 'Andrés Salgado', byId: 'm5', date: Demo.d(-4 + i) }; }); }
    });
    const A = p.artifacts;
    const approve = (id, v = 1, owner = 'm2', when = -30) => { Object.assign(A[id], { status: 'aprobado', version: v, ownerId: owner, owner: Store.member(owner).name, approvedBy: 'Paula Ortega', approvedAt: Demo.d(when) }); A[id].history = [{ date: Demo.d(when), version: v, by: 'Paula Ortega', action: 'En revisión → Aprobado', note: '' }]; };
    A.ProblemAnalysisDocument.fields = {
      reqs: 'RQ-01, RQ-02, RQ-03 y RQ-04 del documento de requisitos TMS v2.',
      funcion: 'Determinar el orden de visita de un conjunto reducido de puntos de entrega que minimiza la distancia total.',
      viabilidad: 'Dictamen de viabilidad del comité técnico (acta 2026-07): se aprobó explorar un enfoque variacional para instancias pequeñas.',
      delimitacion: 'Instancias de 3 a 4 puntos con depósito fijo; matriz de distancias simétrica.',
      formulacion: 'Problema del agente viajero codificado como QUBO: min Σ d_ij x_{i,t} x_{j,t+1} + A·Σ_i (1-Σ_t x_{i,t})² + A·Σ_t (1-Σ_i x_{i,t})²',
      variables: [['x_{i,t}', 'El punto i se visita en la posición t', '{0,1}', 'n² variables'], ['d_ij', 'Distancia entre i y j', 'ℝ⁺', 'km']],
      restricciones: [['C1', 'Cada punto se visita una vez', 'Dura', 'Σ_t x_{i,t} = 1'], ['C2', 'Una posición por punto', 'Dura', 'Σ_i x_{i,t} = 1']],
      entradas: 'Matriz de distancias n×n (JSON).', salidas: 'Permutación de visita y costo total.', objetivo: 'Minimizar la distancia total de la ruta.'
    };
    A.InitialRiskRegister.fields = { supuestos: [['S1', 'La matriz es simétrica', 'Datos del TMS', 'Validación de entrada']], ambiguedades: [['AM1', 'Valor de la penalización A', 'Afecta la factibilidad', 'Resuelta en fase 2']], riesgos: [['RF1', 'Penalización mal calibrada genera rutas infactibles', '3', '4', 'Barrido de A en simulación']], orientacion: 'Revisar la calibración de penalizaciones durante el diseño.' };
    A.QuantumAlgorithmSpecification.fields = { familias: [['QAOA', 'Alta (QUBO)', 'Adecuado para NISQ', 'Requiere optimización clásica'], ['VQE', 'Media', 'Flexible', 'Ansatz más profundo'], ['Grover', 'Baja', 'Garantías teóricas', 'Profundidad excesiva']], estrategia: 'QAOA con p=2 capas y optimizador clásico COBYLA.', pasos: '1) Construir el Hamiltoniano de costo. 2) Preparar superposición uniforme. 3) Alternar capas de costo y mezclador. 4) Medir. 5) Optimizar parámetros clásicamente.', hibrido: 'Ciclo variacional: el optimizador clásico ajusta γ y β.', recursos: [['Qubits lógicos', '9 (n=3)', 'Codificación one-hot'], ['Número de operaciones', '≈ 120', 'p=2'], ['Profundidad esperada', '≈ 60', 'Antes de transpilar'], ['Complejidad', 'O(p·n⁴)', 'Términos ZZ']], parametros: [['p', '2', 'Capas QAOA'], ['A', '2·max(d)', 'Penalización']] };
    A.ExperimentationPlan.fields = { objetivo: 'Verificar que la ruta óptima aparece entre las soluciones más probables.', condiciones: 'Simulador statevector y Aer con 4096 shots; semilla 42.', parametros: [['shots', '4096', 'Error estadístico < 2 %']], esperados: 'La ruta óptima tiene la mayor probabilidad entre las rutas factibles.', criterios: [['CE1', 'Probabilidad de ruta óptima', '≥ 0.25', 'sim/opt'], ['CE2', 'Proporción de soluciones factibles', '≥ 0.60', 'sim/opt/hw'], ['CE3', 'Razón de aproximación', '≥ 0.90', 'hw']] };
    A.QuantumCircuitModel.fields = { registros: [['q', 'Cuántico', '9', 'Variables x_{i,t}'], ['c', 'Clásico', '9', 'Medición']], preparacion: 'Hadamard en todos los qubits.', operaciones: [['1', 'H⊗9', 'q0–q8', '—', 'Preparación'], ['2', 'RZZ(2γ d_ij)', 'pares', 'γ1', 'Costo'], ['3', 'RX(2β)', 'q0–q8', 'β1', 'Mezclador']], mediciones: 'Medición en base computacional de los 9 qubits.', estructurales: 'Profundidad lógica 58; 72 compuertas de 2 qubits.', coherencia: 'Revisado contra la especificación: correspondencia 1:1 de términos.' };
    A.QuantumCircuitCode.fields = { framework: 'Qiskit 1.2', repositorio: 'github.com/ejemplo/qaoa-tms', commit: 'v0.2 (a1b2c3d)', estructura: 'qubo.py, circuit.py, run_sim.py, tests/', config: 'AerSimulator, 4096 shots, seed=42', casos: [['TC1', 'Instancia n=3 trivial', 'Ruta 0-1-2'], ['TC2', 'Instancia n=3 asimétrica', 'Ruta 0-2-1']], revision: 'En la v0.1 el mezclador se aplicaba con signo incorrecto (detectado en DP1). Corregido en v0.2.' };
    A.InitialSimulationReport.fields = { condiciones: 'AerSimulator ideal, 4096 shots, semilla 42.', resultados: 'Ruta óptima con probabilidad 0.31; 68 % de soluciones factibles.', comparacion: [['CE1', '≥ 0.25', '0.31', 'Sí'], ['CE2', '≥ 0.60', '0.68', 'Sí']], desviaciones: [['v0.1: probabilidad óptima 0.04', 'Implementación', 'Signo del mezclador invertido']], hallazgos: 'Tras corregir la implementación, los criterios se cumplen.', decision: '' };
    A.QuantumTestCases.fields = { casos: [['TC1', 'n=3 trivial', 'Ideal', '0-1-2', '0-1-2', 'Aprobado'], ['TC2', 'n=3 asimétrica', 'Ideal', '0-2-1', '0-2-1', 'Aprobado']], cobertura: 'Casos con solución única y con empates.' };
    approve('ProblemAnalysisDocument', 1, 'm1', -60); approve('InitialRiskRegister', 1, 'm1', -60); approve('QuantumAlgorithmSpecification', 1, 'm1', -50); approve('ExperimentationPlan', 1, 'm6', -50);
    approve('QuantumCircuitModel', 1, 'm2', -39); approve('QuantumCircuitCode', 2, 'm2', -20); approve('InitialSimulationReport', 2, 'm6', -12); approve('QuantumTestCases', 2, 'm6', -12);
    A.QuantumCircuitCode.trace = ['rq1', 'rq2', 'rq3']; A.ProblemAnalysisDocument.trace = ['rq1', 'rq2', 'rq3', 'rq4']; A.QuantumAlgorithmSpecification.trace = ['rq1', 'rq2']; A.ExperimentationPlan.trace = ['rq1', 'rq2', 'rq4']; A.QuantumTestCases.trace = ['rq1', 'rq2'];
    A.OptimizedQuantumCircuit.status = 'en_elaboracion'; A.OptimizedQuantumCircuit.ownerId = 'm5';
    A.OptimizedQuantumCircuit.fields = { backend: 'Dispositivo superconductor de 27 qubits (heavy-hex)', caracterizacion: 'Conectividad heavy-hex; compuertas nativas ECR, RZ, SX, X.', transpilacion: 'optimization_level=3, layout SABRE.', metricas: [['Profundidad', '58', '', ''], ['Compuertas de 2 qubits', '72', '', ''], ['Total de compuertas', '150', '', ''], ['Qubits físicos', '9', '', '']] };
    A.TechnicalRiskRegister.status = 'en_elaboracion'; A.TechnicalRiskRegister.ownerId = 'm5';

    p.decisions = [
      { id: 'dec2', dp: 'DP1', date: Demo.d(-12), cycle: 1, by: 'Paula Ortega', decision: 'avanzar', reason: 'CE1 y CE2 satisfechos con la v0.2; casos TC1 y TC2 aprobados.', participants: ['m2', 'm6', 'm1'] },
      { id: 'dec1', dp: 'DP1', date: Demo.d(-26), cycle: 1, by: 'Paula Ortega', decision: 'iterar', target: 4, kind: 'correctivo', reason: 'La probabilidad de la ruta óptima (0.04) es inferior al umbral; el análisis atribuye la desviación a la implementación del mezclador.', change: 'Corregir el signo del operador RX del mezclador y repetir la simulación.', participants: ['m2', 'm6'] }
    ];
    A.InitialSimulationReport.fields.decision = `DP1 — ITERAR hacia fase 4: probabilidad óptima 0.04 < 0.25 | Cambio a evaluar: corregir el mezclador.\nDP1 — AVANZAR a fase 6: CE1 y CE2 satisfechos con la v0.2.`;
    p.iterations = [{ id: 'it1', date: Demo.d(-26), cycle: 1, by: 'Paula Ortega', status: 'cerrada', closedAt: Demo.d(-12), from: 5, to: 4, kind: 'correctivo', reason: 'Desviación atribuible a errores de traducción al framework (mezclador).', change: 'Corregir el signo del operador RX.', decisionId: 'dec1' }];
    p.risks = [
      { id: 'r1', code: 'R1.1', phase: 1, title: 'Penalización mal calibrada', description: 'Rutas infactibles por un valor de A inadecuado.', category: 'Formulación del problema', probability: 3, impact: 4, mitigation: 'Barrido de A en simulación.', ownerId: 'm1', status: 'mitigado', createdAt: Demo.d(-65) },
      { id: 'r2', code: 'R4.1', phase: 4, title: 'ImplementationErrorRisk', description: 'Errores de traducción entre el modelo y Qiskit.', category: 'Implementación', probability: 3, impact: 3, mitigation: 'Pruebas unitarias por bloque del circuito.', ownerId: 'm2', status: 'materializado', createdAt: Demo.d(-40) },
      { id: 'r3', code: 'R6.1', phase: 6, title: 'Profundidad excesiva tras el ruteo', description: 'La conectividad heavy-hex añade SWAPs.', category: 'Limitaciones del hardware', probability: 4, impact: 4, mitigation: 'Seleccionar un layout con cadena lineal de 9 qubits.', ownerId: 'm5', status: 'abierto', createdAt: Demo.d(-5) },
      { id: 'r4', code: 'R8.1', phase: 8, title: 'Ruido que oculte la ruta óptima', description: 'Tasas de error de compuertas de 2 qubits.', category: 'Ruido en ejecución', probability: 4, impact: 5, mitigation: 'Mitigación de errores de lectura; repetir ejecuciones.', ownerId: 'm5', status: 'abierto', createdAt: Demo.d(-5) },
      { id: 'r5', code: 'R11.1', phase: 11, title: 'Incompatibilidad del formato JSON', description: 'El TMS usa índices desde 1.', category: 'Integración', probability: 2, impact: 2, mitigation: 'Contrato de interfaz versionado.', ownerId: 'm4', status: 'abierto', createdAt: Demo.d(-30) }
    ];
    const L = (days, user, type, message, phase) => p.log.push({ id: uid('log'), date: Demo.d(days), user, type, message, phase, cycle: 1 });
    L(-4, 'Andrés Salgado', 'fase', 'Fase 6: actividad 3 completada', 6);
    L(-6, 'Carlos Ruiz', 'fase', 'Fase 6 «Optimización y adaptación al hardware»: No iniciada → En progreso', 6);
    L(-12, 'Paula Ortega', 'decision', 'DP1: decisión de AVANZAR a la fase 6. CE1 y CE2 satisfechos con la v0.2.', 5);
    L(-12, 'Paula Ortega', 'artefacto', 'InitialSimulationReport v2: En revisión → Aprobado', 5);
    L(-20, 'Paula Ortega', 'artefacto', 'QuantumCircuitCode v2: En revisión → Aprobado', 4);
    L(-26, 'Paula Ortega', 'iteracion', 'Retorno de la fase 5 a la fase 4 (Corrección (validación)): desviación atribuible al mezclador', 4);
    L(-26, 'Paula Ortega', 'decision', 'DP1: decisión de ITERAR hacia la fase 4 (Corrección (validación)).', 5);
    L(-39, 'Carlos Ruiz', 'fase', 'Fase 3 «Construcción del circuito cuántico»: En progreso → Completada', 3);
    L(-50, 'Laura Méndez', 'fase', 'Fase 2 «Diseño del algoritmo cuántico»: En progreso → Completada', 2);
    L(-60, 'Sofía Navarro', 'fase', 'Fase 1 «Análisis del problema»: En progreso → Completada', 1);
    L(-70, 'Laura Méndez', 'proyecto', 'Proyecto creado', null);
    p.log.sort((a, b) => b.date.localeCompare(a.date));
    p.createdAt = Demo.d(-70);
    Store.save();
    return p;
  },
  d(days) { return new Date(Date.now() + days * 86400000).toISOString(); }
};
