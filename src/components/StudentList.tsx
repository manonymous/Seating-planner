import React, { useState } from 'react';
import { Alumno } from '../types';
import { 
  Users, 
  UserPlus, 
  Heart, 
  ShieldAlert, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { StudentModal } from './StudentModal';
import { ExcelImportModal } from './ExcelImportModal';
import { getStudentAffinities, getStudentEnmities } from '../lib/aulaGenerator';

interface StudentListProps {
  alumnos: Alumno[];
  setAlumnos: React.Dispatch<React.SetStateAction<Alumno[]>>;
  onGoToClassDesigner?: () => void;
  onGoToSeatingPlan?: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  alumnos,
  setAlumnos,
  onGoToClassDesigner,
  onGoToSeatingPlan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null);

  const studentMap = new Map<string, Alumno>();
  alumnos.forEach((a) => studentMap.set(a.id, a));

  const handleImportExcel = (newAlumnos: Alumno[], replaceExisting: boolean) => {
    if (replaceExisting) {
      setAlumnos(newAlumnos);
    } else {
      setAlumnos((prev) => [...prev, ...newAlumnos]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAlumno(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (alumno: Alumno) => {
    setEditingAlumno(alumno);
    setIsModalOpen(true);
  };

  const handleDeleteAlumno = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar a este alumno?')) {
      // Remover al alumno y también las referencias a su ID en afinidades y enemistades
      setAlumnos((prev) =>
        prev
          .filter((a) => a.id !== id)
          .map((a) => ({
            ...a,
            afinidades: getStudentAffinities(a).filter((fid) => fid !== id),
            enemistades: getStudentEnmities(a).filter((eid) => eid !== id),
          }))
      );
    }
  };

  const handleSaveAlumno = (savedAlumno: Alumno) => {
    setAlumnos((prev) => {
      const exists = prev.some((a) => a.id === savedAlumno.id);
      if (exists) {
        return prev.map((a) => (a.id === savedAlumno.id ? savedAlumno : a));
      } else {
        return [...prev, savedAlumno];
      }
    });
  };

  const handleLoadDemoData = () => {
    const demo: Alumno[] = [
      { id: 'a1', nombre: 'Ana', apellidos: 'García', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['a2'], enemistades: ['a5'] },
      { id: 'a2', nombre: 'Carlos', apellidos: 'López', nivelApoyo: 'Nivel II', necesitaPrimeraFila: true, afinidades: ['a1'], enemistades: [] },
      { id: 'a3', nombre: 'María', apellidos: 'Martínez', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['a4'], enemistades: [] },
      { id: 'a4', nombre: 'Juan', apellidos: 'Pérez', nivelApoyo: 'Nivel III', necesitaPrimeraFila: true, afinidades: ['a3'], enemistades: ['a6'] },
      { id: 'a5', nombre: 'Elena', apellidos: 'Ruiz', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['a6'], enemistades: ['a1'] },
      { id: 'a6', nombre: 'David', apellidos: 'Sánchez', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['a5'], enemistades: ['a4'] },
      { id: 'a7', nombre: 'Lucía', apellidos: 'Gómez', nivelApoyo: 'Nivel II', necesitaPrimeraFila: true, afinidades: ['a8'], enemistades: [] },
      { id: 'a8', nombre: 'Mateo', apellidos: 'Díaz', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['a7'], enemistades: [] },
      { id: 'a9', nombre: 'Sara', apellidos: 'Torres', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['a10'], enemistades: [] },
      { id: 'a10', nombre: 'Hugo', apellidos: 'Vega', nivelApoyo: 'Nivel IV', necesitaPrimeraFila: true, afinidades: ['a9'], enemistades: ['a11'] },
      { id: 'a11', nombre: 'Irene', apellidos: 'Morales', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: [], enemistades: ['a10'] },
      { id: 'a12', nombre: 'Pablo', apellidos: 'Navarro', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: [], enemistades: [] },
    ];
    setAlumnos(demo);
  };

  const filteredAlumnos = alumnos.filter((a) => {
    const fullName = `${a.nombre} ${a.apellidos}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Estadísticas rápidas
  const conApoyoEspecial = alumnos.filter((a) => a.nivelApoyo !== 'Ordinario').length;
  const conPrimeraFila = alumnos.filter((a) => a.necesitaPrimeraFila).length;

  return (
    <div className="flex-1 bg-slate-50 p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header con título y acciones principales */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Lista de Alumnos</h2>
                <p className="text-sm text-slate-500">
                  Gestiona las columnas de datos: Nombres, Nivel de apoyo, Afinidades y Enemistades.
                </p>
              </div>
            </div>

            {/* Badges de estadísticas */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                Total: <strong className="text-slate-900">{alumnos.length}</strong> alumnos
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Con Apoyo: <strong>{conApoyoEspecial}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                Requiere 1ª Fila: <strong>{conPrimeraFila}</strong>
              </span>
            </div>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Pegar una columna de nombres copiada directamente de Excel o Google Sheets"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Pegar desde Excel
            </button>
            <button
              onClick={handleLoadDemoData}
              className="flex items-center gap-2 px-3.5 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-medium transition-all shadow-sm"
              title="Cargar 12 alumnos de ejemplo con afinidades y niveles de apoyo ya configurados"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Cargar Ejemplo Demo
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo Alumno
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda y Navegación contextual */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            {onGoToClassDesigner && (
              <button
                onClick={onGoToClassDesigner}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 rounded-lg transition-colors font-medium shadow-sm"
              >
                📐 Diseñar Aula ({alumnos.length} asientos necesarios)
              </button>
            )}
            {onGoToSeatingPlan && (
              <button
                onClick={onGoToSeatingPlan}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
              >
                🪑 Ir al Plano de Asientos →
              </button>
            )}
          </div>
        </div>

        {/* TABLA PRINCIPAL DE ALUMNOS EN COLUMNAS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Alumno</th>
                  <th className="py-3.5 px-4">Nivel de Apoyo</th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <Heart className="h-3.5 w-3.5 fill-emerald-500 text-emerald-600" />
                      Afinidades
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                      Enemistades / Incompatibles
                    </span>
                  </th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAlumnos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users className="h-10 w-10 text-slate-300" />
                        <p className="font-medium text-slate-600">
                          {searchTerm
                            ? 'No se encontraron alumnos con ese nombre'
                            : 'Aún no hay alumnos en la lista'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() => setIsExcelModalOpen(true)}
                            className="text-xs px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Pegar desde Excel
                          </button>
                          <button
                            onClick={handleOpenAddModal}
                            className="text-xs px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                          >
                            Crear alumno manual
                          </button>
                          <button
                            onClick={handleLoadDemoData}
                            className="text-xs px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                          >
                            Cargar lista de ejemplo
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAlumnos.map((alumno) => {
                    const affinities = getStudentAffinities(alumno);
                    const enmities = getStudentEnmities(alumno);

                    return (
                      <tr
                        key={alumno.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Columna: Nombre */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              {alumno.nombre[0]}
                              {alumno.apellidos ? alumno.apellidos[0] : ''}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {alumno.nombre} {alumno.apellidos}
                              </div>
                              {alumno.notas && (
                                <div className="text-xs text-slate-400 truncate max-w-xs">
                                  {alumno.notas}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Columna: Nivel de Apoyo */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center ${
                                alumno.nivelApoyo === 'Ordinario'
                                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                  : alumno.nivelApoyo === 'Nivel II'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : alumno.nivelApoyo === 'Nivel III'
                                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {alumno.nivelApoyo}
                            </span>
                            {alumno.necesitaPrimeraFila && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                                <Eye className="h-3 w-3" /> 1ª Fila
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Columna: Afinidades */}
                        <td className="py-3.5 px-4">
                          {affinities.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Sin preferencias</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {affinities.map((fid) => {
                                const friend = studentMap.get(fid);
                                return (
                                  <span
                                    key={fid}
                                    className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                                  >
                                    <Heart className="h-3 w-3 fill-emerald-500 text-emerald-600" />
                                    {friend ? `${friend.nombre} ${friend.apellidos ? friend.apellidos[0] + '.' : ''}` : 'Alumno'}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Columna: Enemistades */}
                        <td className="py-3.5 px-4">
                          {enmities.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Ninguna</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-w-sm">
                              {enmities.map((eid) => {
                                const enemy = studentMap.get(eid);
                                return (
                                  <span
                                    key={eid}
                                    className="text-xs px-2 py-0.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"
                                  >
                                    <ShieldAlert className="h-3 w-3 text-rose-600" />
                                    {enemy ? `${enemy.nombre} ${enemy.apellidos ? enemy.apellidos[0] + '.' : ''}` : 'Alumno'}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Columna: Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(alumno)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar alumno"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAlumno(alumno.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar alumno"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para Crear / Editar Alumno */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAlumno}
        alumnoToEdit={editingAlumno}
        allAlumnos={alumnos}
      />

      {/* Modal para Importar / Pegar desde Excel */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImport={handleImportExcel}
        currentCount={alumnos.length}
      />
    </div>
  );
};
