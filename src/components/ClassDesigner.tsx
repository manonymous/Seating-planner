import React, { useState } from 'react';
import { Aula, AulaConfig, PresetDistribucion } from '../types';
import { 
  Grid, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  LayoutGrid 
} from 'lucide-react';
import { generateAula, getPresetConfig } from '../lib/aulaGenerator';

interface ClassDesignerProps {
  aula: Aula;
  setAula: React.Dispatch<React.SetStateAction<Aula>>;
  totalStudents: number;
  onApplyAndGoToSeating: () => void;
}

export const ClassDesigner: React.FC<ClassDesignerProps> = ({
  aula,
  setAula,
  totalStudents,
  onApplyAndGoToSeating,
}) => {
  // Inicializamos la configuración con los valores actuales del aula
  const [config, setConfig] = useState<AulaConfig>({
    nombre: aula.nombre || 'Aula 101',
    filas: aula.filas || 4,
    mesasPorFila: aula.mesasPorFila || aula.columnas || 3,
    capacidadPorMesa: aula.capacidadPorMesa || 2,
    posicionProfesor: aula.elementosFijos?.mesaProfesor?.posicion || 'centro',
    posicionPizarra: (aula.elementosFijos?.pizarra?.posicion as 'arriba' | 'abajo') || 'arriba',
    separacionPasillo: true,
  });

  const totalMesas = config.filas * config.mesasPorFila;
  const capacidadTotal = totalMesas * config.capacidadPorMesa;
  const diferenciaAsientos = capacidadTotal - totalStudents;

  const handleApplyPreset = (preset: PresetDistribucion) => {
    const presetValues = getPresetConfig(preset);
    setConfig((prev) => ({
      ...prev,
      ...presetValues,
    }));
  };

  const handleSaveAndApply = () => {
    const updatedAula = generateAula(config, aula.mesas);
    setAula(updatedAula);
    onApplyAndGoToSeating();
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Grid className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Diseño del Aula</h2>
              <p className="text-sm text-slate-500">
                Configura el número de filas, mesas por fila, capacidad de asientos y distribución física.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAndApply}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200"
            >
              Aplicar y Abrir Plano <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Layout en 2 columnas: Configuración a la izquierda, Vista Previa en Vivo a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* PANEL DE CONTROLES (5 columnas en lg) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Presets rápidos */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Plantillas Rápidas
                </span>
                <span className="text-[11px] text-slate-400">Distribuciones habituales</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('filas_parejas')}
                  className="p-2.5 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-600">Parejas (Estándar)</div>
                  <div className="text-[11px] text-slate-400">4 filas × 3 mesas (2 puestos)</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('filas_individuales')}
                  className="p-2.5 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-600">Individuales (Examen)</div>
                  <div className="text-[11px] text-slate-400">5 filas × 4 mesas (1 puesto)</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('filas_triples')}
                  className="p-2.5 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-600">Filas Triples</div>
                  <div className="text-[11px] text-slate-400">4 filas × 2 mesas (3 puestos)</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('islas_4')}
                  className="p-2.5 text-left border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl transition-all text-xs group"
                >
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-600">Islas Colaborativas</div>
                  <div className="text-[11px] text-slate-400">3 filas × 2 mesas (4 puestos)</div>
                </button>
              </div>
            </div>

            {/* Parámetros de Filas y Mesas */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" /> Parámetros del Aula
              </h3>

              {/* Nombre del Aula */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nombre del Aula o Grupo
                </label>
                <input
                  type="text"
                  value={config.nombre}
                  onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                  placeholder="Ej. 2º ESO A - Aula 204"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Número de Filas */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Número de Filas:</span>
                  <span className="text-indigo-600 text-sm font-bold">{config.filas}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={config.filas}
                    onChange={(e) => setConfig({ ...config, filas: Number(e.target.value) })}
                    className="flex-1 accent-indigo-600"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, filas: Math.max(1, config.filas - 1) })}
                      className="w-7 h-7 bg-white border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, filas: Math.min(8, config.filas + 1) })}
                      className="w-7 h-7 bg-white border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">De 1 a 8 filas en profundidad.</p>
              </div>

              {/* Mesas por Fila (Columnas) */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Mesas por Fila (Columnas):</span>
                  <span className="text-indigo-600 text-sm font-bold">{config.mesasPorFila}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={config.mesasPorFila}
                    onChange={(e) => setConfig({ ...config, mesasPorFila: Number(e.target.value) })}
                    className="flex-1 accent-indigo-600"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, mesasPorFila: Math.max(1, config.mesasPorFila - 1) })}
                      className="w-7 h-7 bg-white border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-100"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, mesasPorFila: Math.min(6, config.mesasPorFila + 1) })}
                      className="w-7 h-7 bg-white border border-slate-300 rounded-md font-bold text-slate-700 hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">Total de mesas: {totalMesas}</p>
              </div>

              {/* Capacidad por Mesa */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Puestos / Alumnos por Mesa:</span>
                  <span className="text-indigo-600 text-sm font-bold">{config.capacidadPorMesa}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[1, 2, 3, 4].map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setConfig({ ...config, capacidadPorMesa: cap })}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        config.capacidadPorMesa === cap
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {cap === 1 ? '1 (Indiv)' : cap === 2 ? '2 (Pareja)' : cap === 3 ? '3 (Trío)' : '4 (Grupo)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Posición del Profesor y Pasillo */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mesa del Profesor
                  </label>
                  <select
                    value={config.posicionProfesor}
                    onChange={(e) =>
                      setConfig({ ...config, posicionProfesor: e.target.value as 'izquierda' | 'centro' | 'derecha' })
                    }
                    className="w-full text-xs font-medium px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="izquierda">A la Izquierda</option>
                    <option value="centro">En el Centro</option>
                    <option value="derecha">A la Derecha</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={config.separacionPasillo}
                      onChange={(e) => setConfig({ ...config, separacionPasillo: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Pasillo Central
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tarjeta de Métricas y Balance */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Resumen de Capacidad
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500">Mesas</div>
                  <div className="text-lg font-bold text-slate-800">{totalMesas}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500">Puestos Totales</div>
                  <div className="text-lg font-bold text-indigo-600">{capacidadTotal}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500">Alumnos Actuales</div>
                  <div className="text-lg font-bold text-slate-800">{totalStudents}</div>
                </div>
              </div>

              {diferenciaAsientos >= 0 ? (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Capacidad suficiente: Hay {diferenciaAsientos} {diferenciaAsientos === 1 ? 'plaza libre' : 'plazas libres'}.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>
                    Faltan {Math.abs(diferenciaAsientos)} asientos para todos los alumnos ({totalStudents}). Añade más filas o mesas.
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* VISTA PREVIA INTERACTIVA EN VIVO (7 columnas en lg) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <LayoutGrid className="h-4 w-4 text-indigo-600" />
                Vista Previa en Tiempo Real ({config.filas} filas × {config.mesasPorFila} mesas)
              </div>
              <span className="text-xs text-slate-400">
                Pizarra Frontal arriba
              </span>
            </div>

            {/* Lienzo del aula interactivo a escala */}
            <div className="w-full max-w-xl bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 flex flex-col items-center relative shadow-inner min-h-[460px]">
              
              {/* Pizarra */}
              <div className="w-56 h-5 bg-slate-800 rounded-md flex items-center justify-center shadow-sm mb-4">
                <span className="text-[10px] font-bold text-slate-200 tracking-widest uppercase">
                  Pizarra
                </span>
              </div>

              {/* Mesa Profesor */}
              <div className="w-full flex mb-6 px-4">
                <div
                  className={`w-24 h-12 bg-amber-100 border-2 border-amber-300 rounded-xl flex items-center justify-center shadow-sm text-xs font-semibold text-amber-800 transition-all ${
                    config.posicionProfesor === 'izquierda'
                      ? 'mr-auto'
                      : config.posicionProfesor === 'derecha'
                      ? 'ml-auto'
                      : 'mx-auto'
                  }`}
                >
                  Profesor
                </div>
              </div>

              {/* Matriz de Mesas */}
              <div className="w-full space-y-4">
                {Array.from({ length: config.filas }).map((_, rIndex) => (
                  <div key={`row-${rIndex}`} className="flex items-center justify-center gap-4">
                    
                    {/* Indicador de Fila */}
                    <span className="text-[10px] font-bold text-slate-400 w-8 text-right">
                      Fila {rIndex + 1}
                    </span>

                    {/* Mesas de esta fila */}
                    <div className="flex items-center justify-center gap-3">
                      {Array.from({ length: config.mesasPorFila }).map((_, cIndex) => {
                        const isMiddleAisle =
                          config.separacionPasillo &&
                          cIndex === Math.floor(config.mesasPorFila / 2) &&
                          config.mesasPorFila > 1;

                        const tableNum = rIndex * config.mesasPorFila + cIndex + 1;

                        return (
                          <React.Fragment key={`t-${rIndex}-${cIndex}`}>
                            {/* Pasillo central si aplica */}
                            {isMiddleAisle && (
                              <div className="w-4 border-l border-dashed border-slate-300 h-8 self-center" title="Pasillo Central" />
                            )}

                            {/* Mesa */}
                            <div className="bg-white border-2 border-slate-300 rounded-xl p-1.5 shadow-sm flex flex-col items-center gap-1 hover:border-indigo-400 transition-colors">
                              <span className="text-[9px] font-bold text-slate-400">
                                M{tableNum}
                              </span>
                              
                              {/* Asientos de la mesa */}
                              <div className="flex items-center gap-1">
                                {Array.from({ length: config.capacidadPorMesa }).map((_, sIndex) => (
                                  <div
                                    key={`seat-${sIndex}`}
                                    className="w-6 h-6 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-[8px] font-medium text-slate-400"
                                  >
                                    {sIndex + 1}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-[11px] text-slate-400 text-center">
                ↓ Fondo del Aula
              </div>
            </div>

            {/* Botón inferior grande de confirmación */}
            <div className="w-full mt-6">
              <button
                onClick={handleSaveAndApply}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>Guardar Diseño y Empezar a Sentar Alumnos</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
