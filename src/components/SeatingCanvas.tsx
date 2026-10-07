import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Alumno, Aula, Mesa } from '../types';
import { 
  Users, 
  Sparkles, 
  RotateCcw, 
  Heart, 
  ShieldAlert, 
  Eye, 
  X, 
  CheckCircle2,
  Printer,
  ZoomIn,
  ZoomOut,
  LayoutGrid
} from 'lucide-react';
import { 
  autoAssignStudents, 
  checkClassroomIssues, 
  getStudentAffinities, 
  getStudentEnmities 
} from '../lib/aulaGenerator';

interface SeatingCanvasProps {
  alumnos: Alumno[];
  aula: Aula;
  setAula: React.Dispatch<React.SetStateAction<Aula>>;
  onGoToStudentsList: () => void;
  onGoToClassDesigner: () => void;
}

export const SeatingCanvas: React.FC<SeatingCanvasProps> = ({
  alumnos,
  aula,
  setAula,
  onGoToStudentsList,
  onGoToClassDesigner,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  // Mapear alumnos por ID para acceso rápido
  const studentMap = new Map<string, Alumno>();
  alumnos.forEach((a) => studentMap.set(a.id, a));

  // Alumnos ya asignados en alguna mesa
  const assignedStudentIds = new Set<string>();
  aula.mesas.forEach((mesa) => {
    mesa.alumnoIds.forEach((id) => {
      if (id) assignedStudentIds.add(id);
    });
  });

  // Lista de alumnos sin asignar
  const unassignedStudents = alumnos.filter(
    (a) =>
      !assignedStudentIds.has(a.id) &&
      (`${a.nombre} ${a.apellidos}`.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  // Análisis de conflictos y afinidades
  const issues = checkClassroomIssues(alumnos, aula.mesas);

  // Manejador del Drag and Drop
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const studentId = draggableId;
    const newMesas: Mesa[] = aula.mesas.map((m) => ({
      ...m,
      alumnoIds: [...m.alumnoIds],
    }));

    // 1. Si venía de un asiento en una mesa, vaciar ese asiento
    if (source.droppableId.startsWith('mesa-')) {
      const parts = source.droppableId.split('-seat-');
      const mesaId = parts[0];
      const seatIndex = parseInt(parts[1], 10);
      const sourceMesa = newMesas.find((m) => m.id === mesaId);
      if (sourceMesa) {
        sourceMesa.alumnoIds[seatIndex] = null;
      }
    }

    // 2. Si se soltó en un asiento de una mesa
    if (destination.droppableId.startsWith('mesa-')) {
      const parts = destination.droppableId.split('-seat-');
      const targetMesaId = parts[0];
      const targetSeatIndex = parseInt(parts[1], 10);
      const targetMesa = newMesas.find((m) => m.id === targetMesaId);

      if (targetMesa) {
        // Intercambiar si ya había un alumno sentado
        const existingStudentId = targetMesa.alumnoIds[targetSeatIndex];
        targetMesa.alumnoIds[targetSeatIndex] = studentId;

        // Si venía de otra mesa, colocamos al existente en el hueco que quedó libre
        if (source.droppableId.startsWith('mesa-') && existingStudentId) {
          const partsSrc = source.droppableId.split('-seat-');
          const sourceMesaId = partsSrc[0];
          const sourceSeatIndex = parseInt(partsSrc[1], 10);
          const sourceMesa = newMesas.find((m) => m.id === sourceMesaId);
          if (sourceMesa) {
            sourceMesa.alumnoIds[sourceSeatIndex] = existingStudentId;
          }
        }
      }
    }

    setAula((prev) => ({
      ...prev,
      mesas: newMesas,
    }));
  };

  // Desasignar un alumno específico de su mesa
  const handleUnseat = (mesaId: string, seatIndex: number) => {
    setAula((prev) => ({
      ...prev,
      mesas: prev.mesas.map((m) => {
        if (m.id === mesaId) {
          const updated = [...m.alumnoIds];
          updated[seatIndex] = null;
          return { ...m, alumnoIds: updated };
        }
        return m;
      }),
    }));
  };

  // Limpiar todos los asientos
  const handleClearAllSeats = () => {
    if (window.confirm('¿Desalojar a todos los alumnos de las mesas? Volverán a la lista de sin asignar.')) {
      setAula((prev) => ({
        ...prev,
        mesas: prev.mesas.map((m) => ({
          ...m,
          alumnoIds: new Array(m.capacidad).fill(null),
        })),
      }));
    }
  };

  // Asignación automática inteligente
  const handleAutoAssign = () => {
    const assignedMesas = autoAssignStudents(alumnos, aula.mesas);
    setAula((prev) => ({
      ...prev,
      mesas: assignedMesas,
    }));
  };

  // Imprimir / Exportar a PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Agrupar mesas por filas para renderizado organizado
  const filasArray: Mesa[][] = [];
  aula.mesas.forEach((mesa) => {
    const r = mesa.fila ?? 0;
    if (!filasArray[r]) filasArray[r] = [];
    filasArray[r].push(mesa);
  });
  // Ordenar columnas dentro de cada fila
  filasArray.forEach((row) => row.sort((a, b) => a.columna - b.columna));

  // Cálculo de tamaño dinámico de asiento según capacidad para que nunca se desborden
  const getSeatDimensions = (capacidad: number) => {
    if (capacidad === 1) return 'w-28 h-24';
    if (capacidad === 2) return 'w-28 h-24';
    if (capacidad === 3) return 'w-24 h-24';
    return 'w-20 h-22';
  };

  // Lista ordenada alfabéticamente para la tabla de impresión PDF
  const alphabeticalStudents = [...alumnos].sort((a, b) => 
    `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`)
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
      
      {/* Barra superior de herramientas del plano (oculta al imprimir) */}
      <div className="no-print bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm z-10">
        
        {/* Resumen de estado y avisos */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="font-semibold text-slate-700">
            {aula.nombre || 'Aula'} ({assignedStudentIds.size}/{alumnos.length} asignados)
          </span>

          {/* Badges de Conflictos / Afinidades */}
          {issues.conflicts.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              {issues.conflicts.length} {issues.conflicts.length === 1 ? 'Conflicto detectado' : 'Conflictos detectados'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              0 Conflictos
            </span>
          )}

          {issues.affinitiesMet.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Heart className="h-3.5 w-3.5 fill-emerald-500 text-emerald-600" />
              {issues.affinitiesMet.length} afinidades satisfechas
            </span>
          )}

          {issues.frontRowWarnings.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <Eye className="h-3.5 w-3.5 text-amber-600" />
              {issues.frontRowWarnings.length} requieren 1ª fila (están detrás)
            </span>
          )}
        </div>

        {/* Acciones del Canvas: Zoom, Distribución, Imprimir PDF */}
        <div className="flex items-center gap-2">
          
          {/* Controles de Zoom */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setZoomPercent((z) => Math.max(60, z - 10))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Reducir escala"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-semibold text-slate-600">{zoomPercent}%</span>
            <button
              onClick={() => setZoomPercent((z) => Math.min(120, z + 10))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Aumentar escala"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={onGoToClassDesigner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium transition-all"
            title="Diseñar y configurar distribución de mesas"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
            Configurar Aula
          </button>

          <button
            onClick={handleAutoAssign}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            title="Distribuye automáticamente respetando 1ª fila, juntando afinidades y separando enemistades"
          >
            <Sparkles className="h-4 w-4" />
            Distribución Automática Inteligente
          </button>
          
          <button
            onClick={handleClearAllSeats}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-xl text-xs font-medium transition-all"
            title="Vaciar todos los asientos"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Desalojar Todos
          </button>

          {/* Botón Imprimir en PDF */}
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            title="Imprimir plano de asientos o guardar como documento PDF"
          >
            <Printer className="h-4 w-4 text-emerald-400" />
            Imprimir / Guardar en PDF
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR: Alumnos pendientes de asignar (oculto al imprimir) */}
          <aside className="no-print w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10 flex-shrink-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" /> Alumnos por Asignar
                </h3>
                <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full text-xs">
                  {unassignedStudents.length}
                </span>
              </div>
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <Droppable droppableId="unassigned-students">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto p-3 space-y-2.5 transition-colors ${
                    snapshot.isDraggingOver ? 'bg-indigo-50/40' : 'bg-slate-50/30'
                  }`}
                >
                  {unassignedStudents.length === 0 ? (
                    <div className="text-center py-10 px-4 text-slate-400">
                      {alumnos.length === 0 ? (
                        <div>
                          <p className="text-xs font-medium mb-2">No hay alumnos en la lista</p>
                          <button
                            onClick={onGoToStudentsList}
                            className="text-xs text-indigo-600 hover:underline font-semibold"
                          >
                            Ir a Lista de Alumnos →
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700">¡Todos los alumnos sentados!</p>
                          <p className="text-[11px]">Puedes arrastrar para recolocarlos o intercambiarlos.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    unassignedStudents.map((alumno, index) => {
                      const affinities = getStudentAffinities(alumno);
                      const enmities = getStudentEnmities(alumno);

                      return (
                        <Draggable key={alumno.id} draggableId={alumno.id} index={index}>
                          {(provided, dragSnapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-2.5 rounded-xl border transition-all select-none ${
                                dragSnapshot.isDragging
                                  ? 'bg-indigo-50 border-indigo-400 shadow-xl scale-105 ring-2 ring-indigo-400 z-50'
                                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-xs text-slate-800">
                                  {alumno.nombre} {alumno.apellidos}
                                </div>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                    alumno.nivelApoyo === 'Ordinario'
                                      ? 'bg-slate-100 text-slate-600'
                                      : alumno.nivelApoyo === 'Nivel II'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : alumno.nivelApoyo === 'Nivel III'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {alumno.nivelApoyo}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                                {alumno.necesitaPrimeraFila && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-medium flex items-center gap-0.5">
                                    <Eye className="h-2.5 w-2.5" /> 1ª Fila
                                  </span>
                                )}
                                {affinities.length > 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium flex items-center gap-0.5">
                                    <Heart className="h-2.5 w-2.5 fill-emerald-500" /> {affinities.length} afin.
                                  </span>
                                )}
                                {enmities.length > 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-medium flex items-center gap-0.5">
                                    <ShieldAlert className="h-2.5 w-2.5" /> {enmities.length} incomp.
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </aside>

          {/* LIENZO PRINCIPAL DEL AULA */}
          <main className="flex-1 bg-slate-100/80 overflow-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            
            {/* ENCABEZADO EXCLUSIVO PARA IMPRESIÓN EN PDF */}
            <div className="print-only w-full mb-6 text-center border-b border-slate-300 pb-3">
              <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
                Classroom Seating Planner • {aula.nombre || 'Distribución de Aula'}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Generado: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {alumnos.length} Alumnos • {aula.filas} Filas × {aula.mesasPorFila || aula.columnas} Mesas por fila ({aula.capacidadPorMesa || 2} alumnos/mesa)
              </p>
            </div>

            {/* Contenedor del Lienzo que preserva el diseño físico de columnas y filas exactas */}
            <div 
              style={{ transform: `scale(${zoomPercent / 100})`, transformOrigin: 'top center' }}
              className="print-canvas w-fit min-w-max bg-white rounded-3xl shadow-lg border border-slate-200/90 p-8 flex flex-col items-center transition-transform duration-150"
            >
              
              {/* Pizarra frontal */}
              <div className="w-72 h-6 bg-slate-800 rounded-lg flex items-center justify-center shadow-md mb-6">
                <span className="text-[11px] font-bold text-slate-100 uppercase tracking-widest">
                  Pizarra Frontal
                </span>
              </div>

              {/* Mesa del Profesor */}
              <div className="w-full flex mb-8 px-6">
                <div
                  className={`w-32 h-12 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-center shadow-sm text-xs font-bold text-amber-800 ${
                    aula.elementosFijos?.mesaProfesor?.posicion === 'izquierda'
                      ? 'mr-auto'
                      : aula.elementosFijos?.mesaProfesor?.posicion === 'derecha'
                      ? 'ml-auto'
                      : 'mx-auto'
                  }`}
                >
                  Mesa del Profesor
                </div>
              </div>

              {/* MATRIZ DE MESAS: Cada fila física se mantiene en una ÚNICA fila horizontal (flex-nowrap) */}
              <div className="w-fit space-y-6">
                {filasArray.map((mesasFila, filaIndex) => (
                  <div key={`canvas-row-${filaIndex}`} className="flex items-center gap-5">
                    
                    {/* Etiqueta lateral de fila */}
                    <div className="text-right w-16 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-500">
                        Fila {filaIndex + 1}
                      </span>
                      {filaIndex === 0 && (
                        <div className="text-[9px] text-blue-600 font-bold uppercase">1ª Fila</div>
                      )}
                    </div>

                    {/* Mesas en esta fila: NUNCA hacer wrap a otra línea horizontal */}
                    <div className="flex items-center flex-nowrap gap-5">
                      {mesasFila.map((mesa, colIndex) => {
                        // Separación de pasillo central si está habilitado
                        const isMiddleAisle =
                          aula.separacionPasillo &&
                          colIndex === Math.floor(mesasFila.length / 2) &&
                          mesasFila.length > 1;

                        const mesaConflicts = issues.conflicts.filter((c) => c.mesaNumero === mesa.numero);
                        const mesaAffinities = issues.affinitiesMet.filter((a) => a.mesaNumero === mesa.numero);
                        const seatDimensionClass = getSeatDimensions(mesa.capacidad);

                        return (
                          <React.Fragment key={mesa.id}>
                            {/* Pasillo central */}
                            {isMiddleAisle && (
                              <div 
                                className="w-8 border-l-2 border-dashed border-slate-300 h-20 self-center flex items-center justify-center" 
                                title="Pasillo Central"
                              >
                                <span className="hidden print:hidden text-[9px] text-slate-300 -rotate-90">Pasillo</span>
                              </div>
                            )}

                            {/* Mesa */}
                            <div
                              className={`bg-slate-50 border-2 rounded-2xl p-2.5 shadow-sm transition-all flex flex-col items-center gap-1.5 flex-shrink-0 ${
                                mesaConflicts.length > 0
                                  ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-300'
                                  : mesaAffinities.length > 0
                                  ? 'border-emerald-300 bg-emerald-50/20'
                                  : 'border-slate-200 hover:border-indigo-300'
                              }`}
                            >
                              {/* Cabecera de la Mesa */}
                              <div className="w-full flex items-center justify-between px-1 text-[11px] font-bold text-slate-500">
                                <span>Mesa {mesa.numero}</span>
                                <div className="flex items-center gap-1">
                                  {mesaConflicts.length > 0 && (
                                    <span title="Incompatibilidad en esta mesa" className="text-rose-600 flex items-center">
                                      <ShieldAlert className="h-3.5 w-3.5" />
                                    </span>
                                  )}
                                  {mesaAffinities.length > 0 && (
                                    <span title="Afinidad satisfecha" className="text-emerald-600 flex items-center">
                                      <Heart className="h-3.5 w-3.5 fill-emerald-500" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Asientos de la Mesa */}
                              <div className="flex items-center flex-nowrap gap-1.5">
                                {mesa.alumnoIds.map((studentId, seatIndex) => {
                                  const droppableId = `${mesa.id}-seat-${seatIndex}`;
                                  const student = studentId ? studentMap.get(studentId) : null;
                                  const isFrontRowWarning = student?.necesitaPrimeraFila && mesa.fila > 0;

                                  return (
                                    <Droppable key={droppableId} droppableId={droppableId}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          className={`${seatDimensionClass} rounded-xl border-2 transition-all p-1 flex flex-col items-center justify-center relative flex-shrink-0 ${
                                            snapshot.isDraggingOver
                                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                                              : student
                                              ? 'border-slate-200 bg-white shadow-sm'
                                              : 'border-dashed border-slate-300 bg-white/70 hover:border-indigo-300'
                                          }`}
                                        >
                                          {student ? (
                                            <Draggable draggableId={student.id} index={0}>
                                              {(dragProvided, dragSnapshot) => (
                                                <div
                                                  ref={dragProvided.innerRef}
                                                  {...dragProvided.draggableProps}
                                                  {...dragProvided.dragHandleProps}
                                                  className={`w-full h-full flex flex-col justify-between p-0.5 select-none relative ${
                                                    dragSnapshot.isDragging ? 'opacity-80 scale-105' : ''
                                                  }`}
                                                >
                                                  {/* Botón desalojar puesto (oculto al imprimir) */}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleUnseat(mesa.id, seatIndex)}
                                                    className="no-print absolute -top-1 -right-1 w-4 h-4 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-full text-slate-400 flex items-center justify-center transition-colors"
                                                    title="Levantar del asiento"
                                                  >
                                                    <X className="h-2.5 w-2.5" />
                                                  </button>

                                                  {/* Nombre del alumno */}
                                                  <div className="pt-0.5">
                                                    <div className="font-bold text-[11px] text-slate-800 line-clamp-1 pr-2 leading-tight">
                                                      {student.nombre}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 line-clamp-1 leading-tight">
                                                      {student.apellidos}
                                                    </div>
                                                  </div>

                                                  {/* Indicadores de soporte y alertas */}
                                                  <div className="flex flex-wrap items-center gap-1 mt-auto">
                                                    <span
                                                      className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                                                        student.nivelApoyo === 'Ordinario'
                                                          ? 'bg-slate-100 text-slate-600'
                                                          : student.nivelApoyo === 'Nivel II'
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : student.nivelApoyo === 'Nivel III'
                                                          ? 'bg-orange-100 text-orange-800'
                                                          : 'bg-rose-100 text-rose-800'
                                                      }`}
                                                    >
                                                      {student.nivelApoyo}
                                                    </span>

                                                    {isFrontRowWarning && (
                                                      <span
                                                        className="text-[8px] px-1 rounded bg-amber-100 text-amber-800 flex items-center"
                                                        title="Requiere 1ª fila"
                                                      >
                                                        <Eye className="h-2 w-2 text-amber-600 mr-0.5" /> 1ªF
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </Draggable>
                                          ) : (
                                            <div className="text-center text-slate-400 select-none pointer-events-none">
                                              <div className="text-[10px] font-semibold">Puesto {seatIndex + 1}</div>
                                              <div className="text-[8px] text-slate-300">Vacío</div>
                                            </div>
                                          )}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  );
                                })}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Fondo del aula */}
              <div className="mt-8 text-xs text-slate-400 text-center">
                ↓ Fondo del Aula / Puerta
              </div>

            </div>

            {/* TABLA DE ASIGNACIONES IMPRIMIBLE EN PDF */}
            <div className="print-only w-full mt-8 pt-4 border-t border-slate-300">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Listado Alfabético de Asignación de Puestos
              </h2>
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="p-2 border-r border-slate-300">Alumno (Apellidos, Nombre)</th>
                    <th className="p-2 border-r border-slate-300">Mesa</th>
                    <th className="p-2 border-r border-slate-300">Fila</th>
                    <th className="p-2 border-r border-slate-300">Nivel de Apoyo</th>
                    <th className="p-2">Compañeros de Mesa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {alphabeticalStudents.map((alumno) => {
                    // Buscar mesa asignada
                    let assignedMesa: Mesa | undefined;
                    aula.mesas.forEach((m) => {
                      if (m.alumnoIds.includes(alumno.id)) {
                        assignedMesa = m;
                      }
                    });

                    const compañeros = assignedMesa
                      ? assignedMesa.alumnoIds
                          .filter((id): id is string => Boolean(id && id !== alumno.id))
                          .map((id) => {
                            const comp = studentMap.get(id);
                            return comp ? `${comp.nombre} ${comp.apellidos}` : '';
                          })
                          .filter(Boolean)
                          .join(', ')
                      : 'Sin asignar';

                    return (
                      <tr key={alumno.id}>
                        <td className="p-1.5 border-r border-slate-300 font-medium">
                          {alumno.apellidos ? `${alumno.apellidos}, ` : ''}{alumno.nombre}
                        </td>
                        <td className="p-1.5 border-r border-slate-300">
                          {assignedMesa ? `Mesa ${assignedMesa.numero}` : '—'}
                        </td>
                        <td className="p-1.5 border-r border-slate-300">
                          {assignedMesa ? `Fila ${assignedMesa.fila + 1}` : '—'}
                        </td>
                        <td className="p-1.5 border-r border-slate-300">
                          {alumno.nivelApoyo} {alumno.necesitaPrimeraFila ? '(1ª Fila)' : ''}
                        </td>
                        <td className="p-1.5 text-slate-600">
                          {compañeros || 'Solo'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </main>

        </div>
      </DragDropContext>
    </div>
  );
};
