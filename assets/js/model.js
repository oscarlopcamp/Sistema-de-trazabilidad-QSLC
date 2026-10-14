/* =========================================================================
   Modelo del ciclo de vida para el desarrollo de software cuántico
   Fuente: Anexo 1 — Descripción detallada del ciclo de vida propuesto
   ========================================================================= */
'use strict';

const MODEL = {};

/* ---------------------------- Roles (Cuadro 1) ---------------------------- */
MODEL.roles = [
  { id: 'qad', short: 'Diseñador de algoritmos',  symbol: '♣', name: 'Diseñador de algoritmos cuánticos', en: 'Quantum Algorithm Designer', color: '#7c3aed',
    resp: 'Formula y selecciona la estrategia algorítmica cuántica, estima recursos y apoya el análisis de resultados.' },
  { id: 'qse', short: 'Ing. software cuántico',  symbol: '♠', name: 'Ingeniero de software cuántico', en: 'Quantum Software Engineer', color: '#2563eb',
    resp: 'Construye, implementa, simula, optimiza y prepara el componente cuántico para su despliegue.' },
  { id: 'arch', short: 'Arquitecto de software', symbol: '♥', name: 'Arquitecto de software', en: 'Software Architect', color: '#dc2626',
    resp: 'Delimita el componente dentro de la arquitectura y define su incorporación al sistema clásico.' },
  { id: 'cse', short: 'Ing. software clásico',  symbol: '♦', name: 'Ingeniero de software clásico', en: 'Classical Software Engineer', color: '#ea580c',
    resp: 'Prepara el sistema clásico para localizar, invocar y utilizar el componente cuántico desplegado.' },
  { id: 'hw', short: 'Especialista hardware',   symbol: '★', name: 'Especialista en hardware cuántico', en: 'Quantum Hardware Specialist', color: '#0891b2',
    resp: 'Analiza restricciones del dispositivo, adapta el circuito y gestiona su ejecución.' },
  { id: 'qa', short: 'Calidad y validación',   symbol: '☆', name: 'Ingeniero de calidad y validación', en: 'Quality Assurance / Validation Engineer', color: '#16a34a',
    resp: 'Define criterios, revisa evidencias y participa en las decisiones de avance o iteración.' }
];

/* -------- Tipos de fase según la Figura 1 (color del recuadro) -------- */
MODEL.phaseTypes = {
  risk:        { label: 'Incluye control de riesgos', color: '#dc2626' },
  test:        { label: 'Incluye pruebas',            color: '#16a34a' },
  process:     { label: 'Fase del proceso',           color: '#334155' },
  integration: { label: 'Integración de sistema clásico', color: '#94a3b8' }
};

/* --------------------------- Artefactos -------------------------------- */
/* type: text | textarea | table(columns) | select(options) */
MODEL.artifacts = {
  EXT_REQ: { id: 'EXT_REQ', name: 'Requisitos del sistema clásico', external: true, phase: 0,
    desc: 'Requisitos relevantes para el componente, recibidos de la etapa previa de definición de requisitos (fuera del ciclo).' },
  EXT_FUNC: { id: 'EXT_FUNC', name: 'Función asignada al componente cuántico', external: true, phase: 0,
    desc: 'Delimita el objeto de la formulación matemática y evita extender el ciclo al sistema clásico completo.' },
  EXT_VIAB: { id: 'EXT_VIAB', name: 'Decisión previa de viabilidad', external: true, phase: 0,
    desc: 'Antecedente externo que justifica que el componente ingrese al ciclo.' },

  ProblemAnalysisDocument: {
    id: 'ProblemAnalysisDocument', phase: 1, short: 'PAD',
    desc: 'Documenta la formulación matemática, las variables, los dominios, las restricciones y las entradas y salidas esperadas. Proporciona una base explícita para diseñar el algoritmo y revisar después si este resuelve el problema correcto.',
    fields: [
      { id: 'reqs', label: 'Requisitos del sistema clásico relevantes para el componente', type: 'textarea', hint: 'Referencie los requisitos recibidos (no se elaboran de nuevo en esta fase).' },
      { id: 'funcion', label: 'Función o problema asignado al componente cuántico', type: 'textarea' },
      { id: 'viabilidad', label: 'Referencia a la decisión previa de viabilidad', type: 'textarea', hint: 'Antecedente externo; no se reevalúa la viabilidad general.' },
      { id: 'delimitacion', label: 'Delimitación precisa del problema', type: 'textarea' },
      { id: 'formulacion', label: 'Formulación matemática', type: 'textarea', hint: 'Puede incluir notación LaTeX, p. ej. min x^T Q x.' },
      { id: 'variables', label: 'Variables y dominios', type: 'table', columns: ['Variable', 'Descripción', 'Dominio', 'Unidades / notas'] },
      { id: 'restricciones', label: 'Relaciones y restricciones', type: 'table', columns: ['ID', 'Restricción', 'Tipo (dura/blanda)', 'Expresión'] },
      { id: 'entradas', label: 'Entradas del componente', type: 'textarea' },
      { id: 'salidas', label: 'Resultados esperados', type: 'textarea' },
      { id: 'objetivo', label: 'Función objetivo (cuando corresponda)', type: 'textarea' }
    ] },
  InitialRiskRegister: {
    id: 'InitialRiskRegister', phase: 1, short: 'IRR',
    desc: 'Registra supuestos, ambigüedades y riesgos detectados al formular el problema; los mantiene visibles para orientar su revisión durante el diseño.',
    fields: [
      { id: 'supuestos', label: 'Supuestos de formulación', type: 'table', columns: ['ID', 'Supuesto', 'Justificación', 'Cómo se verificará'] },
      { id: 'ambiguedades', label: 'Ambigüedades detectadas', type: 'table', columns: ['ID', 'Ambigüedad', 'Impacto en el diseño', 'Estado'] },
      { id: 'riesgos', label: 'Riesgos de formulación', type: 'table', columns: ['ID', 'Riesgo', 'Probabilidad (1-5)', 'Impacto (1-5)', 'Acción'] },
      { id: 'orientacion', label: 'Orientación para la revisión durante el diseño', type: 'textarea' }
    ] },
  QuantumAlgorithmSpecification: {
    id: 'QuantumAlgorithmSpecification', phase: 2, short: 'QAS',
    desc: 'Describe la estrategia cuántica, sus pasos, parámetros, recursos estimados y, cuando corresponda, la interacción con procesamiento clásico. Guía la construcción del circuito.',
    fields: [
      { id: 'familias', label: 'Algoritmos o familias algorítmicas evaluadas', type: 'table', columns: ['Algoritmo / familia', 'Aplicabilidad', 'Ventajas', 'Limitaciones'] },
      { id: 'estrategia', label: 'Estrategia seleccionada y justificación', type: 'textarea' },
      { id: 'pasos', label: 'Pasos del algoritmo', type: 'textarea' },
      { id: 'hibrido', label: 'Interacción con procesamiento clásico (si aplica)', type: 'textarea' },
      { id: 'recursos', label: 'Recursos estimados', type: 'table', columns: ['Recurso', 'Estimación', 'Supuesto'], seed: [['Qubits lógicos', '', ''], ['Número de operaciones', '', ''], ['Profundidad esperada', '', ''], ['Complejidad', '', '']] },
      { id: 'parametros', label: 'Parámetros del algoritmo', type: 'table', columns: ['Parámetro', 'Valor / rango', 'Descripción'] }
    ] },
  ExperimentationPlan: {
    id: 'ExperimentationPlan', phase: 2, short: 'EXP',
    desc: 'Define las condiciones de experimentación, los resultados esperados y los criterios de evaluación antes de observar resultados.',
    fields: [
      { id: 'objetivo', label: 'Objetivo de la experimentación', type: 'textarea' },
      { id: 'condiciones', label: 'Condiciones de experimentación', type: 'textarea', hint: 'Simuladores, backends previstos, número de ejecuciones (shots), semillas.' },
      { id: 'parametros', label: 'Parámetros experimentales', type: 'table', columns: ['Parámetro', 'Valores', 'Justificación'] },
      { id: 'esperados', label: 'Resultados esperados', type: 'textarea' },
      { id: 'criterios', label: 'Criterios de evaluación', type: 'table', columns: ['ID', 'Métrica', 'Umbral de aceptación', 'Aplica en (sim/opt/hw)'] }
    ] },
  QuantumCircuitModel: {
    id: 'QuantumCircuitModel', phase: 3, short: 'QCM',
    desc: 'Representa los registros, qubits lógicos, operaciones, parámetros y mediciones que materializan el algoritmo. Sirve como referencia para implementarlo en código.',
    fields: [
      { id: 'registros', label: 'Registros y qubits lógicos', type: 'table', columns: ['Registro', 'Tipo (cuántico/clásico)', 'Tamaño', 'Propósito'] },
      { id: 'preparacion', label: 'Preparación de estados', type: 'textarea' },
      { id: 'operaciones', label: 'Compuertas u operaciones (en orden)', type: 'table', columns: ['#', 'Operación / bloque', 'Qubits', 'Parámetros', 'Paso del algoritmo'] },
      { id: 'mediciones', label: 'Mediciones', type: 'textarea' },
      { id: 'estructurales', label: 'Parámetros estructurales', type: 'textarea', hint: 'Profundidad lógica, número de capas, conteo de compuertas.' },
      { id: 'coherencia', label: 'Revisión de coherencia lógica respecto del algoritmo', type: 'textarea' }
    ] },
  QuantumCircuitCode: {
    id: 'QuantumCircuitCode', phase: 4, short: 'QCC',
    desc: 'Implementación ejecutable del modelo de circuito en el framework seleccionado. Permite ejecutar simulaciones y es la base para la adaptación al hardware.',
    fields: [
      { id: 'framework', label: 'Framework y versión', type: 'text', hint: 'p. ej. Qiskit 1.x, Cirq, PennyLane, Q#.' },
      { id: 'repositorio', label: 'Repositorio / ubicación del código', type: 'text' },
      { id: 'commit', label: 'Versión / commit', type: 'text' },
      { id: 'estructura', label: 'Estructura del código', type: 'textarea' },
      { id: 'config', label: 'Configuración de ejecución para simulación', type: 'textarea' },
      { id: 'casos', label: 'Casos de prueba preparados', type: 'table', columns: ['ID', 'Entrada', 'Resultado esperado'] },
      { id: 'revision', label: 'Revisión de errores sintácticos, lógicos y de traducción', type: 'textarea' }
    ] },
  InitialSimulationReport: {
    id: 'InitialSimulationReport', phase: 5, short: 'ISR',
    desc: 'Registra condiciones de simulación, resultados, comparaciones con los criterios esperados y hallazgos. Respalda la decisión DP1.',
    fields: [
      { id: 'condiciones', label: 'Condiciones de simulación', type: 'textarea', hint: 'Simulador, shots, semilla, condiciones ideales o controladas.' },
      { id: 'resultados', label: 'Resultados obtenidos', type: 'textarea' },
      { id: 'comparacion', label: 'Comparación con los criterios esperados', type: 'table', columns: ['Criterio', 'Umbral', 'Obtenido', 'Cumple (Sí/No)'] },
      { id: 'desviaciones', label: 'Desviaciones y atribución', type: 'table', columns: ['Desviación', 'Atribuible a (algoritmo/circuito/implementación)', 'Evidencia'] },
      { id: 'hallazgos', label: 'Hallazgos', type: 'textarea' },
      { id: 'decision', label: 'Decisión DP1 y fundamento', type: 'textarea', hint: 'Se completa automáticamente al registrar DP1, puede ampliarse.' }
    ] },
  QuantumTestCases: {
    id: 'QuantumTestCases', phase: 5, short: 'QTC',
    desc: 'Formaliza los casos preparados durante la implementación, con sus entradas, condiciones y resultados esperados, y registra su aplicación.',
    fields: [
      { id: 'casos', label: 'Casos de prueba', type: 'table', columns: ['ID', 'Entrada', 'Condiciones', 'Resultado esperado', 'Resultado obtenido', 'Veredicto'] },
      { id: 'cobertura', label: 'Cobertura y suficiencia de los casos', type: 'textarea' }
    ] },
  OptimizedQuantumCircuit: {
    id: 'OptimizedQuantumCircuit', phase: 6, short: 'OQC',
    desc: 'Versión del circuito transformada según la conectividad, las compuertas nativas y las demás restricciones del backend.',
    fields: [
      { id: 'backend', label: 'Backend objetivo', type: 'text' },
      { id: 'caracterizacion', label: 'Caracterización del backend', type: 'textarea', hint: 'Qubits disponibles, conectividad, compuertas nativas, restricciones físicas.' },
      { id: 'transpilacion', label: 'Configuración de transpilación / mapeo / optimización', type: 'textarea' },
      { id: 'metricas', label: 'Métricas antes y después', type: 'table', columns: ['Métrica', 'Original', 'Optimizado', 'Variación'], seed: [['Profundidad', '', '', ''], ['Compuertas de 2 qubits', '', '', ''], ['Total de compuertas', '', '', ''], ['Qubits físicos', '', '', '']] },
      { id: 'version', label: 'Versión / ubicación del circuito optimizado', type: 'text' }
    ] },
  TechnicalRiskRegister: {
    id: 'TechnicalRiskRegister', phase: 6, short: 'TRR',
    desc: 'Documenta las limitaciones del dispositivo y los riesgos introducidos o identificados durante la adaptación.',
    fields: [
      { id: 'limitaciones', label: 'Limitaciones del dispositivo', type: 'textarea' },
      { id: 'calibracion', label: 'Datos de calibración relevantes', type: 'textarea', hint: 'T1/T2, errores de compuerta, errores de lectura, fecha de calibración.' },
      { id: 'riesgos', label: 'Riesgos técnicos', type: 'table', columns: ['ID', 'Riesgo', 'Origen (dispositivo/adaptación)', 'Probabilidad', 'Impacto', 'Mitigación'] }
    ] },
  OptimizedSimulationReport: {
    id: 'OptimizedSimulationReport', phase: 7, short: 'OSR',
    desc: 'Documenta la simulación del circuito adaptado, su comparación con la evidencia inicial y las desviaciones detectadas. Respalda DP2.',
    fields: [
      { id: 'condiciones', label: 'Condiciones de simulación', type: 'textarea' },
      { id: 'resultados', label: 'Resultados', type: 'textarea' },
      { id: 'comparacion', label: 'Comparación con la simulación inicial', type: 'table', columns: ['Métrica / criterio', 'Simulación inicial', 'Simulación optimizada', 'Diferencia', 'Aceptable'] },
      { id: 'equivalencia', label: 'Verificación de equivalencia funcional', type: 'textarea', hint: 'Método (fidelidad, distancia de variación total, etc.) y resultado.' },
      { id: 'degradaciones', label: 'Degradaciones por mapeo o transformación', type: 'textarea' },
      { id: 'decision', label: 'Decisión DP2 y fundamento', type: 'textarea' }
    ] },
  ExperimentalResults: {
    id: 'ExperimentalResults', phase: 8, short: 'EXR',
    desc: 'Resultados obtenidos en el dispositivo, configuración, parámetros, metadatos e incidencias. Su existencia no implica que los resultados sean aceptables.',
    fields: [
      { id: 'backend', label: 'Backend / dispositivo', type: 'text' },
      { id: 'config', label: 'Configuración y parámetros experimentales', type: 'textarea' },
      { id: 'trabajos', label: 'Trabajos enviados', type: 'table', columns: ['Job ID', 'Fecha', 'Shots', 'Estado', 'Notas'] },
      { id: 'metadatos', label: 'Metadatos para reproducibilidad', type: 'textarea', hint: 'Calibración del día, versión del transpilador, semillas, layout.' },
      { id: 'resultados', label: 'Resultados experimentales', type: 'textarea' },
      { id: 'incidencias', label: 'Incidencias de ejecución', type: 'textarea' }
    ] },
  ResultsAnalysisReport: {
    id: 'ResultsAnalysisReport', phase: 9, short: 'RAR',
    desc: 'Documenta comparaciones con simulaciones, desviaciones, posibles causas y la decisión de aceptar o iterar, distinguiendo ajustes experimentales de mantenimiento.',
    fields: [
      { id: 'comparacion', label: 'Comparación con simulaciones y criterios', type: 'table', columns: ['Criterio', 'Sim. inicial', 'Sim. optimizada', 'Hardware', 'Cumple'] },
      { id: 'ruido', label: 'Análisis de ruido y limitaciones del dispositivo', type: 'textarea' },
      { id: 'desviaciones', label: 'Desviaciones y posibles causas', type: 'table', columns: ['Desviación', 'Causa probable', 'Evidencia', '¿Ruido o defecto?'] },
      { id: 'ajustes', label: 'Ajustes experimentales evaluados', type: 'textarea' },
      { id: 'mantenimiento', label: 'Necesidades de mantenimiento identificadas', type: 'textarea', hint: 'Diferenciadas de las condiciones de aceptación actuales.' },
      { id: 'decision', label: 'Decisión DP3, destino y justificación', type: 'textarea' }
    ] },
  DeployedQuantumSystem: {
    id: 'DeployedQuantumSystem', phase: 10, short: 'DQS',
    desc: 'Componente cuyo código del circuito está cargado en un entorno y listo para su invocación. No implica ejecución permanente.',
    fields: [
      { id: 'version', label: 'Versión aceptada que se despliega', type: 'text', hint: 'Debe coincidir con la aprobada en el ResultsAnalysisReport.' },
      { id: 'entorno', label: 'Entorno de destino', type: 'textarea' },
      { id: 'mecanismo', label: 'Mecanismo de carga', type: 'textarea' },
      { id: 'evidencia', label: 'Evidencia de carga y disponibilidad', type: 'textarea' },
      { id: 'config', label: 'Configuración conservada del circuito y del entorno', type: 'textarea' },
      { id: 'invocacion', label: 'Cómo puede localizarse e invocarse', type: 'textarea' }
    ] },
  HybridClassicalQuantumModule: {
    id: 'HybridClassicalQuantumModule', phase: 11, short: 'HCQM',
    desc: 'Resultado de incorporar al sistema clásico la invocación del componente desplegado y el tratamiento de sus entradas y resultados.',
    fields: [
      { id: 'localizacion', label: 'Cómo el sistema clásico localiza y utiliza el componente', type: 'textarea' },
      { id: 'datos', label: 'Preparación de datos de entrada', type: 'textarea' },
      { id: 'invocacion', label: 'Invocación incorporada al flujo del sistema clásico', type: 'textarea' },
      { id: 'resultados', label: 'Recepción y procesamiento de resultados', type: 'textarea' },
      { id: 'pruebas', label: 'Verificación de la interacción', type: 'table', columns: ['ID', 'Escenario', 'Resultado esperado', 'Resultado obtenido', 'Veredicto'] },
      { id: 'documentacion', label: 'Documentación de la integración', type: 'textarea' }
    ] }
};
Object.values(MODEL.artifacts).forEach(a => { if (!a.name) a.name = a.id; });

/* ------------------------------ Fases ---------------------------------- */
MODEL.phases = [
  { n: 1, name: 'Análisis del problema', type: 'process', roles: ['arch', 'qad'],
    purpose: 'Precisar la formulación matemática de la función asignada al componente cuántico a partir de requerimientos ya definidos y de una viabilidad cuántica determinada previamente.',
    inputs: ['EXT_REQ', 'EXT_FUNC', 'EXT_VIAB'],
    inputWhy: {
      EXT_REQ: 'Establecen qué función debe atenderse y qué restricciones deben respetarse; no se elaboran de nuevo en esta fase.',
      EXT_FUNC: 'Delimita el objeto de la formulación matemática y evita extender el ciclo al sistema clásico completo.',
      EXT_VIAB: 'Justifica que el componente ingrese a este ciclo, sin convertir el análisis en una nueva evaluación general de viabilidad.' },
    activities: ['Delimitar con precisión el problema que resolverá el componente.', 'Identificar variables, dominios, relaciones y restricciones.', 'Definir entradas y resultados esperados.', 'Especificar la función objetivo cuando corresponda.', 'Registrar supuestos y riesgos de formulación.', 'Preparar la información necesaria para el diseño algorítmico.'],
    outputs: ['ProblemAnalysisDocument', 'InitialRiskRegister'],
    risks: ['Ambigüedad en variables, restricciones o resultados esperados.', 'Supuestos de formulación no documentados que conduzcan a resolver un problema distinto del asignado.'],
    exit: 'La formulación debe ser suficientemente precisa para seleccionar o diseñar una estrategia algorítmica cuántica sin reabrir la decisión general de viabilidad.',
    goal: 'Formalizar matemáticamente la función cuántica', advance: 'Problema suficientemente definido' },
  { n: 2, name: 'Diseño del algoritmo cuántico', type: 'risk', roles: ['qad'],
    purpose: 'Seleccionar, adaptar o diseñar el algoritmo cuántico capaz de resolver la formulación definida en la fase anterior.',
    inputs: ['ProblemAnalysisDocument', 'InitialRiskRegister'],
    inputWhy: {
      ProblemAnalysisDocument: 'Aporta variables, restricciones, entradas y resultados esperados; la estrategia algorítmica debe responder a esa formulación.',
      InitialRiskRegister: 'Aporta los supuestos y riesgos de formulación que deben considerarse al seleccionar el algoritmo y planear su evaluación.' },
    activities: ['Identificar algoritmos o familias algorítmicas aplicables.', 'Definir la estrategia cuántica y, cuando corresponda, su interacción con procesamiento clásico.', 'Estimar qubits, operaciones y complejidad esperada.', 'Definir parámetros y condiciones experimentales relevantes.', 'Establecer el plan de experimentación y criterios de evaluación.'],
    outputs: ['QuantumAlgorithmSpecification', 'ExperimentationPlan'],
    risks: ['Seleccionar una estrategia que no resuelva la formulación.', 'Necesidades de recursos y condiciones de evaluación insuficientemente especificadas.'],
    exit: 'Debe existir una especificación suficientemente clara para traducir el algoritmo a un circuito cuántico.',
    goal: 'Definir estrategia cuántica y experimentación', advance: 'Algoritmo especificado' },
  { n: 3, name: 'Construcción del circuito cuántico', type: 'risk', roles: ['qad', 'qse'],
    purpose: 'Traducir la especificación algorítmica a una representación de circuito compuesta por registros, qubits, operaciones y mediciones.',
    inputs: ['QuantumAlgorithmSpecification', 'ExperimentationPlan'],
    inputWhy: {
      QuantumAlgorithmSpecification: 'Define la lógica que debe traducirse a registros, operaciones y mediciones; evita construir un circuito sin correspondencia con el algoritmo.',
      ExperimentationPlan: 'Aporta los parámetros y criterios de evaluación que orientan la preparación de estados y las mediciones necesarias.' },
    activities: ['Definir registros y qubits lógicos.', 'Seleccionar y ordenar compuertas u operaciones.', 'Incorporar preparación de estados y mediciones.', 'Revisar coherencia lógica del circuito respecto del algoritmo.', 'Documentar parámetros estructurales relevantes.'],
    outputs: ['QuantumCircuitModel'],
    risks: ['Que la organización de registros, operaciones o mediciones no represente la lógica del algoritmo especificado.'],
    exit: 'El circuito debe representar la lógica definida por el algoritmo y estar listo para implementarse en un framework.',
    goal: 'Traducir algoritmo a circuito', advance: 'Circuito lógicamente definido' },
  { n: 4, name: 'Implementación del circuito en código', type: 'risk', roles: ['qse'],
    purpose: 'Transformar el modelo del circuito en una implementación ejecutable.',
    inputs: ['QuantumCircuitModel'],
    inputWhy: { QuantumCircuitModel: 'Referencia estructural y lógica que se traduce al framework; permite comprobar que el código conserve operaciones, parámetros y mediciones.' },
    activities: ['Seleccionar el framework de programación.', 'Implementar registros, operaciones, parámetros y mediciones.', 'Preparar la configuración de ejecución para simulación.', 'Definir casos de prueba y resultados esperados.', 'Revisar errores sintácticos, lógicos y de traducción.'],
    outputs: ['QuantumCircuitCode'],
    risks: ['ImplementationErrorRisk: errores sintácticos, lógicos o de traducción entre el modelo del circuito y el framework utilizado.'],
    exit: 'El código debe ser ejecutable en un entorno de simulación y conservar la lógica del modelo de circuito.',
    goal: 'Obtener código ejecutable', advance: 'Código listo para simulación' },
  { n: 5, name: 'Simulación y validación inicial', type: 'test', roles: ['qse', 'qa'], dp: 'DP1',
    purpose: 'Evaluar el comportamiento lógico del circuito antes de introducir las restricciones de un dispositivo cuántico específico.',
    inputs: ['QuantumCircuitCode', 'ExperimentationPlan'],
    inputWhy: {
      QuantumCircuitCode: 'Implementación que se ejecuta en el simulador para observar su comportamiento antes de adaptarla a un dispositivo.',
      ExperimentationPlan: 'Establece condiciones y criterios con los que se evalúan los resultados, para que la aceptación no dependa de una apreciación informal.' },
    activities: ['Ejecutar el circuito en condiciones ideales o controladas.', 'Aplicar los casos de prueba definidos.', 'Comparar distribuciones o resultados con los criterios esperados.', 'Analizar desviaciones atribuibles a algoritmo, circuito o implementación.', 'Documentar resultados y evidencia.', 'Tomar la decisión de continuar o iterar.'],
    outputs: ['InitialSimulationReport', 'QuantumTestCases'],
    risks: ['Aceptar un comportamiento incorrecto por casos de prueba insuficientes.', 'Configuración inadecuada del simulador.', 'Interpretación incompleta de los resultados.'],
    exit: 'Los casos de prueba aplicados y los resultados de simulación deben respaldar el comportamiento lógico esperado conforme a los criterios del plan de experimentación. La evidencia y los casos deben quedar documentados antes de avanzar.',
    goal: 'Validar comportamiento lógico', advance: 'Evidencia satisfactoria' },
  { n: 6, name: 'Optimización y adaptación al hardware', type: 'risk', roles: ['qse', 'hw'],
    purpose: 'Preparar el circuito validado para las restricciones del dispositivo cuántico seleccionado.',
    inputs: ['QuantumCircuitCode', 'InitialSimulationReport'],
    inputWhy: {
      QuantumCircuitCode: 'Versión ejecutable que se transpila, mapea y optimiza para el backend objetivo.',
      InitialSimulationReport: 'Evidencia del comportamiento previo a la adaptación; referencia para conservar la funcionalidad al transformar el circuito.' },
    activities: ['Seleccionar o caracterizar el backend objetivo.', 'Analizar disponibilidad de qubits y conectividad.', 'Considerar conjunto de compuertas nativas y restricciones físicas.', 'Transpilar, mapear y optimizar el circuito.', 'Reducir profundidad u operaciones cuando sea posible.', 'Registrar riesgos técnicos derivados de la adaptación.'],
    outputs: ['OptimizedQuantumCircuit', 'TechnicalRiskRegister'],
    risks: ['Restricciones de qubits, conectividad, compuertas o profundidad que impidan una adaptación adecuada.', 'Transformaciones que degraden el comportamiento del circuito.'],
    exit: 'Debe existir una versión adaptada al backend cuya equivalencia funcional todavía pueda ser verificada antes de usar hardware real.',
    goal: 'Adaptar al backend', advance: 'Circuito adaptado' },
  { n: 7, name: 'Simulación del circuito optimizado', type: 'test', roles: ['qse', 'qa'], dp: 'DP2',
    purpose: 'Comprobar que las transformaciones realizadas durante la optimización no alteraron de forma inaceptable el comportamiento lógico del circuito.',
    inputs: ['OptimizedQuantumCircuit', 'TechnicalRiskRegister'],
    inputWhy: {
      OptimizedQuantumCircuit: 'Versión adaptada que debe someterse a una nueva simulación antes de utilizar hardware real.',
      TechnicalRiskRegister: 'Identifica las restricciones y transformaciones que requieren atención; orienta el análisis hacia posibles degradaciones.' },
    activities: ['Simular la versión optimizada.', 'Comparar con la evidencia de la simulación inicial.', 'Verificar equivalencia funcional.', 'Analizar degradaciones introducidas por mapeo o transformación.', 'Determinar si el circuito está listo para hardware.'],
    outputs: ['OptimizedSimulationReport'],
    risks: ['Que las pruebas no detecten una alteración introducida por la adaptación.', 'Condiciones de comparación que no permitan evaluar la equivalencia funcional.'],
    exit: 'La comparación con la simulación inicial debe respaldar que la versión optimizada conserva el comportamiento esperado dentro de los criterios definidos, y el informe debe justificar su paso a hardware.',
    goal: 'Verificar equivalencia tras adaptación', advance: 'Comportamiento conservado' },
  { n: 8, name: 'Ejecución en hardware cuántico', type: 'process', roles: ['qse', 'hw'],
    purpose: 'Obtener evidencia experimental mediante la ejecución del circuito optimizado y validado sobre un dispositivo cuántico real.',
    inputs: ['OptimizedQuantumCircuit', 'OptimizedSimulationReport'],
    inputWhy: {
      OptimizedQuantumCircuit: 'Circuito adaptado que se enviará al dispositivo cuántico.',
      OptimizedSimulationReport: 'Evidencia que respalda el paso a hardware y referencia para contrastar los resultados experimentales.' },
    activities: ['Configurar backend, número de ejecuciones y parámetros experimentales.', 'Enviar trabajos al dispositivo.', 'Registrar configuración y metadatos necesarios para reproducibilidad.', 'Recuperar y almacenar resultados experimentales.', 'Documentar incidencias relevantes de ejecución.'],
    outputs: ['ExperimentalResults'],
    risks: ['Ruido y limitaciones del dispositivo.', 'Configuración experimental inadecuada.', 'Pérdida de resultados y metadatos necesarios para interpretar la ejecución.'],
    exit: 'Debe existir un conjunto de resultados suficientemente documentado para compararse con la evidencia obtenida en simulación.',
    goal: 'Obtener evidencia experimental', advance: 'Resultados documentados' },
  { n: 9, name: 'Análisis y corrección de errores', type: 'risk', roles: ['hw', 'qa'], dp: 'DP3',
    purpose: 'Interpretar las diferencias entre simulación y hardware para decidir si el componente puede avanzar o requiere ajustes orientados a su comportamiento experimental. También permite identificar necesidades de mantenimiento por cambios de hardware o evolución de la funcionalidad.',
    note: 'En dispositivos NISQ el ruido limita la fiabilidad de los circuitos ejecutados (Preskill, 2018). Las diferencias no demuestran, por sí solas, un error en el algoritmo, el circuito o el código; requieren analizar la evidencia antes de decidir qué ajustar.',
    inputs: ['ExperimentalResults', 'TechnicalRiskRegister'],
    inputWhy: {
      ExperimentalResults: 'Resultados y condiciones de ejecución que se analizan para identificar desviaciones respecto del comportamiento esperado.',
      TechnicalRiskRegister: 'Riesgos y restricciones conocidos; ayuda a interpretar las desviaciones sin atribuirlas automáticamente al algoritmo.' },
    activities: ['Comparar resultados experimentales con simulaciones previas y con los criterios de evaluación establecidos.', 'Analizar el ruido y las limitaciones del dispositivo, distinguiendo sus posibles efectos de la evidencia de un defecto no detectado previamente.', 'Evaluar ajustes en la estrategia algorítmica, el circuito, su implementación o las condiciones de ejecución, conservando la función requerida.', 'Identificar necesidades de mantenimiento por cambio de hardware o por modificación o ampliación futura de la funcionalidad.', 'Determinar si las desviaciones son aceptables e identificar, cuando corresponda, la fase de retorno y el objetivo del cambio.', 'Documentar el análisis y la decisión, diferenciando los ajustes experimentales del mantenimiento.'],
    outputs: ['ResultsAnalysisReport'],
    risks: ['Confundir los efectos del ruido con defectos lógicos.', 'Atribuir toda desviación al hardware sin comprobar otras causas.', 'Aceptar resultados sin evidencia suficiente.', 'Realizar cambios que no mejoren el comportamiento experimental.', 'Incorporar nuevas funcionalidades sin requisitos definidos previamente en el proceso clásico externo.'],
    exit: 'El análisis debe documentar evidencia suficiente para aceptar la versión evaluada y avanzar a despliegue. Si las desviaciones exceden los criterios, debe justificarse el ajuste o cambio de hardware; no basta con atribuirlas al contexto NISQ. Las necesidades de mantenimiento futuro deben quedar diferenciadas.',
    goal: 'Aceptar o identificar retorno', advance: 'Evidencia aceptable' },
  { n: 10, name: 'Despliegue', type: 'process', roles: ['arch', 'cse', 'qa'],
    purpose: 'Cargar el código del circuito cuántico validado en un entorno y dejarlo listo para que el sistema clásico pueda invocarlo cuando lo necesite, antes de incorporar esa invocación al flujo del sistema clásico.',
    note: 'Despliegue se refiere a la carga y disponibilidad del código del circuito, no a su ejecución permanente ni a su integración. El entorno y el mecanismo quedan abiertos para cada aplicación del ciclo.',
    inputs: ['OptimizedQuantumCircuit', 'ResultsAnalysisReport'],
    inputWhy: {
      OptimizedQuantumCircuit: 'Versión del código del circuito que se cargará en un entorno para dejarla disponible.',
      ResultsAnalysisReport: 'Documenta la decisión de aceptación que justifica desplegar esa versión.' },
    activities: ['Preparar la versión aceptada del código del circuito para su carga.', 'Cargar el código en el entorno que se determine para la aplicación concreta.', 'Comprobar que el código cargado quede disponible y listo para su posterior invocación.', 'Conservar la configuración relevante del circuito y del entorno.', 'Registrar evidencia de la carga y disponibilidad del código para la integración posterior.'],
    outputs: ['DeployedQuantumSystem'],
    risks: ['Cargar una versión distinta de la aceptada.', 'Dejar el código sin las condiciones necesarias para que pueda ser localizado e invocado.'],
    exit: 'El código del circuito debe estar cargado en un entorno y listo para que el sistema clásico pueda llamarlo cuando lo necesite. No se exige ejecución permanente.',
    goal: 'Cargar el código del circuito en un entorno', advance: 'Código listo para invocación' },
  { n: 11, name: 'Integración con el sistema clásico', type: 'integration', roles: ['cse', 'arch', 'qse'],
    purpose: 'Incorporar el componente cuántico previamente desplegado al funcionamiento del sistema clásico.',
    inputs: ['DeployedQuantumSystem'],
    inputWhy: { DeployedQuantumSystem: 'Componente cuyo código ya está cargado y disponible; la integración incorpora su invocación, no sustituye la carga.' },
    activities: ['Definir cómo el sistema clásico localizará y utilizará el componente cuántico.', 'Preparar los datos de entrada requeridos por el componente.', 'Incorporar al flujo del sistema clásico la invocación del código del circuito ya cargado.', 'Recibir y procesar los resultados generados por el componente cuántico.', 'Verificar la interacción entre ambos componentes dentro del alcance definido.', 'Documentar la integración realizada.'],
    outputs: ['HybridClassicalQuantumModule'],
    risks: ['Incompatibilidad de entradas o resultados.', 'Invocación incorrecta del componente.', 'Interacción que no satisfaga la función asignada dentro del sistema clásico.'],
    exit: 'El sistema clásico utiliza el componente cuántico desplegado como parte de su funcionamiento. Esta es la fase final del ciclo.',
    goal: 'Incorporar componente al sistema clásico', advance: 'Integración completada' }
];

/* ------------------------- Puntos de decisión -------------------------- */
MODEL.decisionPoints = {
  DP1: { id: 'DP1', phase: 5, block: [1, 5], next: 6, name: 'Revisión de la validación inicial',
    evidence: ['InitialSimulationReport', 'QuantumTestCases'],
    desc: 'Se analizan el circuito implementado, los casos de prueba y el informe de simulación inicial para decidir si existe evidencia suficiente para avanzar a la adaptación al hardware o si se requiere regresar al diseño, la construcción o la implementación.',
    checks: ['Los casos de prueba aplicados respaldan el comportamiento lógico esperado.', 'Los resultados cumplen los criterios del plan de experimentación.', 'Las desviaciones están analizadas y atribuidas.', 'Los riesgos pendientes del bloque 1–5 han sido revisados.', 'La evidencia y los casos están documentados.'],
    returns: [
      { to: 2, kind: 'correctivo', label: 'La estrategia algorítmica no permite obtener los resultados esperados; se revisa el algoritmo.' },
      { to: 3, kind: 'correctivo', label: 'El circuito no representa correctamente el algoritmo; se revisan estructura, operaciones o mediciones.' },
      { to: 4, kind: 'correctivo', label: 'Desviación por errores sintácticos, lógicos o de traducción al framework; se corrige la implementación.' }
    ] },
  DP2: { id: 'DP2', phase: 7, block: [6, 7], next: 8, name: 'Revisión de la validación posterior a la adaptación',
    evidence: ['OptimizedSimulationReport', 'TechnicalRiskRegister'],
    desc: 'Se examinan el circuito adaptado, los riesgos técnicos y el informe de simulación optimizada para decidir si las transformaciones conservan el comportamiento esperado y puede avanzarse a la ejecución física.',
    checks: ['La versión optimizada conserva el comportamiento esperado dentro de los criterios.', 'Se comparó contra la evidencia de la simulación inicial.', 'Se revisó el registro de riesgos técnicos.', 'Las degradaciones por mapeo/transpilación están analizadas.', 'El informe justifica el paso a hardware.'],
    returns: [
      { to: 6, kind: 'correctivo', label: 'El mapeo, la transpilación u otra transformación altera de forma inaceptable el comportamiento esperado; se revisa la adaptación.' }
    ] },
  DP3: { id: 'DP3', phase: 9, block: [8, 9], next: 10, name: 'Revisión de la evidencia experimental',
    evidence: ['ExperimentalResults', 'ResultsAnalysisReport', 'TechnicalRiskRegister'],
    desc: 'Se analizan los resultados experimentales y el informe de análisis para decidir si puede avanzarse a despliegue, o justificar un ajuste experimental o una necesidad de mantenimiento.',
    checks: ['Los resultados experimentales se compararon con las simulaciones y los criterios.', 'Se distinguieron efectos del ruido de posibles defectos lógicos.', 'Las desviaciones están dentro de los criterios o se justificó el ajuste.', 'Las necesidades de mantenimiento futuro están diferenciadas de la aceptación actual.', 'No se atribuyen desviaciones al contexto NISQ sin evidencia.'],
    returns: [
      { to: 2, kind: 'experimental', label: 'Ajuste de la estrategia: explorar una variante algorítmica menos sensible a las limitaciones del dispositivo.' },
      { to: 3, kind: 'experimental', label: 'Ajuste de la representación: estructura alternativa con menor profundidad o menor exposición al ruido.' },
      { to: 4, kind: 'experimental', label: 'Ajuste de la implementación: alternativas de código, configuración o mitigación de errores.' },
      { to: 8, kind: 'experimental', label: 'Reevaluación experimental: repetir adquisición o ajustar condiciones en el mismo dispositivo, sin cambiar la versión del circuito.' },
      { to: 1, kind: 'mantenimiento', sub: 'evolutivo', label: 'Mantenimiento por evolución funcional: modificar o ampliar la funcionalidad (requisitos definidos previamente fuera del ciclo).' },
      { to: 6, kind: 'mantenimiento', sub: 'adaptativo', label: 'Mantenimiento por cambio de entorno: otro dispositivo o cambios relevantes en el backend.' }
    ] }
};

MODEL.iterationKinds = {
  correctivo:    { label: 'Corrección (validación)', color: '#d97706' },
  experimental:  { label: 'Ajuste experimental', color: '#7c3aed' },
  mantenimiento: { label: 'Mantenimiento', color: '#0891b2' }
};

/* ------------------------ Estados ------------------------------------- */
MODEL.phaseStatus = {
  no_iniciada: { label: 'No iniciada', cls: 'st-none' },
  en_progreso: { label: 'En progreso', cls: 'st-progress' },
  en_revision: { label: 'En revisión', cls: 'st-review' },
  completada:  { label: 'Completada', cls: 'st-done' },
  reabierta:   { label: 'Reabierta (iteración)', cls: 'st-reopen' }
};
MODEL.artifactStatus = {
  pendiente:      { label: 'Pendiente', cls: 'st-none' },
  en_elaboracion: { label: 'En elaboración', cls: 'st-progress' },
  en_revision:    { label: 'En revisión', cls: 'st-review' },
  aprobado:       { label: 'Aprobado', cls: 'st-done' },
  requiere_cambios: { label: 'Requiere cambios', cls: 'st-reopen' }
};
MODEL.riskStatus = {
  abierto: 'Abierto', en_mitigacion: 'En mitigación', mitigado: 'Mitigado', materializado: 'Materializado', cerrado: 'Cerrado'
};
MODEL.riskCategories = ['Formulación del problema', 'Adecuación algorítmica', 'Implementación', 'Limitaciones del hardware', 'Ruido en ejecución', 'Validación', 'Despliegue', 'Integración'];
MODEL.phaseRiskCategory = { 1: 'Formulación del problema', 2: 'Adecuación algorítmica', 3: 'Adecuación algorítmica', 4: 'Implementación', 5: 'Validación', 6: 'Limitaciones del hardware', 7: 'Validación', 8: 'Ruido en ejecución', 9: 'Ruido en ejecución', 10: 'Despliegue', 11: 'Integración' };

MODEL.principles = [
  ['Entrada posterior a requisitos', 'El ciclo comienza después de la definición de requisitos del sistema y de la decisión de utilizar un componente cuántico.'],
  ['Componente cuántico delimitado', 'El objeto del ciclo es el componente cuántico, no el sistema híbrido completo.'],
  ['Iteración adaptativa', 'La fase a la que se regresa depende de la causa del hallazgo.'],
  ['Validación progresiva', 'Se valida antes y después de adaptar el circuito al hardware.'],
  ['Orientación al riesgo y a la evidencia', 'Las decisiones se respaldan mediante artefactos y resultados verificables.'],
  ['Pausa y revisión por bloques', 'Los puntos de decisión adaptan la lógica de los puntos de anclaje del ICSM.'],
  ['Despliegue previo a la integración', 'El código del circuito debe estar cargado en un entorno y listo para que el sistema clásico lo invoque.']
];

MODEL.phase = n => MODEL.phases.find(p => p.n === Number(n));
MODEL.role = id => MODEL.roles.find(r => r.id === id);
MODEL.artifact = id => MODEL.artifacts[id];
MODEL.internalArtifacts = () => Object.values(MODEL.artifacts).filter(a => !a.external);
/* Consumidores de un artefacto (trazabilidad hacia adelante) */
MODEL.consumers = id => MODEL.phases.filter(p => p.inputs.includes(id)).map(p => p.n);
