import React, { useState, useEffect } from 'react';
import { Alumno, NivelApoyo } from '../types';
import { X, UserPlus, Heart, ShieldAlert } from 'lucide-react';
import { getStudentAffinities, getStudentEnmities } from '../lib/aulaGenerator';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alumno: Alumno) => void;
  alumnoToEdit?: Alumno | null;
  allAlumnos: Alumno[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  alumnoToEdit,
  allAlumnos,
}) => {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nivelApoyo, setNivelApoyo] = useState<NivelApoyo>('Ordinario');
  const [necesitaPrimeraFila, setNecesitaPrimeraFila] = useState(false);
  const [selectedAfinidades, setSelectedAfinidades] = useState<string[]>([]);
  const [selectedEnemistades, setSelectedEnemistades] = useState<string[]>([]);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (alumnoToEdit) {
      setNombre(alumnoToEdit.nombre);
      setApellidos(alumnoToEdit.apellidos);
      setNivelApoyo(alumnoToEdit.nivelApoyo);
      setNecesitaPrimeraFila(alumnoToEdit.necesitaPrimeraFila);
      setSelectedAfinidades(getStudentAffinities(alumnoToEdit));
      setSelectedEnemistades(getStudentEnmities(alumnoToEdit));
      setNotas(alumnoToEdit.notas || '');
    } else {
      setNombre('');
      setApellidos('');
      setNivelApoyo('Ordinario');
      setNecesitaPrimeraFila(false);
      setSelectedAfinidades([]);
      setSelectedEnemistades([]);
      setNotas('');
    }
  }, [alumnoToEdit, isOpen]);

  if (!isOpen) return null;

  const otherStudents = allAlumnos.filter(
    (a) => !alumnoToEdit || a.id !== alumnoToEdit.id
  );

  const toggleAfinidad = (id: string) => {
    if (selectedAfinidades.includes(id)) {
      setSelectedAfinidades(selectedAfinidades.filter((item) => item !== id));
    } else {
      setSelectedAfinidades([...selectedAfinidades, id]);
      // Quitar de enemistades si estuviera seleccionado
      setSelectedEnemistades(selectedEnemistades.filter((item) => item !== id));
    }
  };

  const toggleEnemistad = (id: string) => {
    if (selectedEnemistades.includes(id)) {
      setSelectedEnemistades(selectedEnemistades.filter((item) => item !== id));
    } else {
      setSelectedEnemistades([...selectedEnemistades, id]);
      // Quitar de afinidades si estuviera seleccionado
      setSelectedAfinidades(selectedAfinidades.filter((item) => item !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const newAlumno: Alumno = {
      id: alumnoToEdit ? alumnoToEdit.id : `student-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      nivelApoyo,
      necesitaPrimeraFila,
      afinidades: selectedAfinidades,
      enemistades: selectedEnemistades,
      notas: notas.trim(),
    };

    onSave(newAlumno);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <h3 className="font-semibold text-lg">
              {alumnoToEdit ? 'Editar Alumno' : 'Nuevo Alumno'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-lg p-1 hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Nombre y Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Lucas"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Apellidos
              </label>
              <input
                type="text"
                placeholder="Ej. Fernández"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Nivel de Apoyo y Primera Fila */}
          <div className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nivel de Apoyo
              </label>
              <select
                value={nivelApoyo}
                onChange={(e) => setNivelApoyo(e.target.value as NivelApoyo)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Ordinario">Ordinario (Estándar)</option>
                <option value="Nivel II">Nivel II (Atención Leve)</option>
                <option value="Nivel III">Nivel III (Refuerzo Moderado)</option>
                <option value="Nivel IV">Nivel IV (Apoyo Intensivo)</option>
              </select>
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={necesitaPrimeraFila}
                  onChange={(e) => setNecesitaPrimeraFila(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Requiere 1ª Fila
                </span>
              </label>
              <p className="text-[11px] text-slate-400 mt-1 pl-6">
                Visión, audición o atención preferente.
              </p>
            </div>
          </div>

          {/* Afinidades (Compañeros recomendados) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-emerald-600 fill-emerald-500" /> Afinidades (Sienta bien juntos)
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedAfinidades.length} seleccionados
              </span>
            </div>
            {otherStudents.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-dashed border-slate-200">
                Añade más alumnos a la lista para poder establecer afinidades.
              </p>
            ) : (
              <div className="max-h-28 overflow-y-auto border border-emerald-200 rounded-lg p-2 bg-emerald-50/30 flex flex-wrap gap-1.5">
                {otherStudents.map((s) => {
                  const isSelected = selectedAfinidades.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleAfinidad(s.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      {s.nombre} {s.apellidos}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enemistades (Compañeros incompatibles) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Incompatibilidades / Enemistades (Evitar juntos)
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedEnemistades.length} seleccionados
              </span>
            </div>
            {otherStudents.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-dashed border-slate-200">
                Añade más alumnos a la lista para poder marcar incompatibilidades.
              </p>
            ) : (
              <div className="max-h-28 overflow-y-auto border border-rose-200 rounded-lg p-2 bg-rose-50/30 flex flex-wrap gap-1.5">
                {otherStudents.map((s) => {
                  const isSelected = selectedEnemistades.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleEnemistad(s.id)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      {s.nombre} {s.apellidos}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
            >
              {alumnoToEdit ? 'Guardar Cambios' : 'Añadir Alumno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
