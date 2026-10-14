# QSLC Trace — Sistema de trazabilidad del ciclo de vida para software cuántico

Aplicación web estática (HTML, CSS y JavaScript, sin dependencias de compilación) para dar seguimiento y documentar el **ciclo de vida propuesto para el desarrollo de componentes cuánticos** descrito en el *Anexo 1* de la tesis:

> *Propuesta de un Ciclo de Vida para el Desarrollo de Software Cuántico Basada en el Análisis Comparativo de Modelos Clásicos y Cuánticos* — Oscar Alejandro López Campero, CENIDET.

## Demostración en línea

🔗 **[Abrir la aplicación en GitHub Pages](https://oscarlopcamp.github.io/Sistema-de-trazabilidad-QSLC/)** · [Abrir con el proyecto de ejemplo cargado](https://oscarlopcamp.github.io/Sistema-de-trazabilidad-QSLC/?demo)

Repositorio: <https://github.com/oscarlopcamp/Sistema-de-trazabilidad-QSLC>

> [!NOTE]
> Esta publicación es una **página de ejemplificación** para mostrar el funcionamiento del sistema. **No cuenta con base de datos ni servidor**: toda la información que se capture se guarda únicamente en el navegador de quien la usa (`localStorage` / `IndexedDB`), no se comparte con otros usuarios y puede perderse si se borran los datos del sitio. Para conservar o compartir un proyecto use **Reportes → Exportar** y luego importe el respaldo `.json`. Consulte [Almacenamiento de datos](#almacenamiento-de-datos).

## Funcionalidades

| Módulo | Qué permite |
|---|---|
| **Panel de control** | Avance global, KPI, avance por fase, próximas acciones, cobertura de roles, mapa de calor de riesgos y actividad reciente. |
| **Ciclo de vida** | Diagrama interactivo de las 11 fases (Figura 1) con estados, puntos de decisión y capas de retornos (DP1, DP2, DP3 experimental y de mantenimiento). |
| **Fases (1–11)** | Por fase: propósito, entradas y su justificación, actividades con registro de quién/cuándo, artefactos, responsables por rol, riesgos, evidencias, criterio de salida, iteraciones e inicio/cierre controlado. |
| **Puntos de decisión** | DP1 (fase 5), DP2 (fase 7) y DP3 (fase 9): lista de verificación, evidencia, decisión **avanzar/iterar** con destino, motivo, cambio a evaluar y participantes. |
| **Iteraciones** | Al iterar se reabre la fase destino, se reinician las posteriores y se versionan los artefactos afectados. Distingue corrección, ajuste experimental y mantenimiento (evolutivo → fase 1, adaptativo → fase 6) con contador de recorridos. |
| **Artefactos** | Editor estructurado de los 15 artefactos (campos y tablas), guardado automático, flujo *pendiente → en elaboración → en revisión → aprobado*, versiones con instantáneas y exportación a Word/Markdown con contenido. |
| **Plantillas** | Descarga de plantillas en blanco (Word `.doc` y Markdown) de cada artefacto, formatos de gestión (registro de DP, solicitud de iteración, minuta, RACI, checklist) y ZIP con todo. |
| **Equipo y roles** | Integrantes, asignación de los 6 roles (Cuadro 1), matriz de responsabilidades por fase y usuario activo que firma la bitácora. |
| **Requisitos y trazabilidad** | Requisitos de entrada, matriz requisito × artefacto, matriz fase × artefacto (E/S) y análisis de impacto hacia atrás/adelante. |
| **Riesgos** | Registro con probabilidad, impacto, exposición, mitigación, responsable y estado; importación de los riesgos del modelo; mapa de calor. |
| **Repositorio de evidencias** | Subida de archivos (arrastrar y soltar) asociados a fase o artefacto y versión, con vista previa (PDF, imágenes, texto/código), filtros y etiquetas. |
| **Cronograma** | Fechas planeadas vs. ejecución real (Gantt) y desviaciones. |
| **Bitácora** | Registro de auditoría de todas las acciones, con filtros y exportación CSV. |
| **Reportes y respaldo** | Reporte integral imprimible/PDF, Word o HTML; CSV de riesgos, trazabilidad, decisiones y bitácora; respaldo `.json` completo (incluye archivos) e importación. |

Incluye un **proyecto de ejemplo** (ficticio) para demostraciones: abra `index.html?demo` o use el botón *Cargar proyecto de ejemplo*.

## Publicar en GitHub Pages

1. Cree un repositorio y suba el contenido de esta carpeta (`index.html`, `assets/`, `.nojekyll`, `README.md`).
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. La aplicación quedará en `https://<usuario>.github.io/<repositorio>/`.

Para probarla localmente basta con abrir `index.html` en el navegador, o servir la carpeta:

```bash
python3 -m http.server 8000   # luego abrir http://localhost:8000
```

## Almacenamiento de datos

GitHub Pages solo sirve archivos estáticos, por lo que **los datos viven en el navegador de cada usuario**:

- Estado del proyecto → `localStorage`.
- Archivos subidos → `IndexedDB` (admite archivos grandes, según la cuota del navegador).

Consecuencias prácticas:

- Cada persona/navegador tiene su propia copia. Para compartir el avance con el asesor o el equipo use **Reportes → Exportar con archivos** y que la otra persona lo importe.
- Si se borran los datos del sitio en el navegador, se pierde la información: **exporte respaldos con regularidad** (puede versionar el `.json` en el mismo repositorio).

## Estructura

```
index.html              Estructura de la aplicación
assets/css/styles.css   Estilos (tema claro/oscuro, responsivo, impresión)
assets/js/model.js      Modelo del ciclo: fases, roles, artefactos, DP, riesgos (Anexo 1)
assets/js/store.js      Persistencia, bitácora, decisiones, iteraciones, archivos
assets/js/templates.js  Generación de plantillas Word/Markdown/CSV
assets/js/views.js      Vistas
assets/js/demo.js       Proyecto de ejemplo
assets/js/app.js        Enrutador, acciones e interacción
```

Para adaptar el modelo (p. ej. agregar campos a un artefacto o actividades a una fase) edite `assets/js/model.js`; las vistas, plantillas y reportes se actualizan automáticamente.

Dependencia externa opcional: JSZip (cdnjs) solo para descargar todas las plantillas en un ZIP; el resto funciona sin conexión.
