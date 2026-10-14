import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Grid, 
  Layout, 
  Save, 
  Download, 
  Upload, 
  School,
  Printer
} from 'lucide-react';
import { Alumno, Aula } from './types';
import { StudentList } from './components/StudentList';
import { ClassDesigner } from './components/ClassDesigner';
import { SeatingCanvas } from './components/SeatingCanvas';
import { DEFAULT_AULA_CONFIG, generateAula } from './lib/aulaGenerator';

// Datos iniciales enriquecidos
const initialAlumnos: Alumno[] = [
  { id: '1', nombre: 'Ana', apellidos: 'García', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['2'], incompatibilidades: ['5'] },
  { id: '2', nombre: 'Carlos', apellidos: 'López', nivelApoyo: 'Nivel II', necesitaPrimeraFila: true, afinidades: ['1'], incompatibilidades: [] },
  { id: '3', nombre: 'María', apellidos: 'Martínez', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['4'], incompatibilidades: [] },
  { id: '4', nombre: 'Juan', apellidos: 'Pérez', nivelApoyo: 'Nivel III', necesitaPrimeraFila: true, afinidades: ['3'], incompatibilidades: ['6'] },
  { id: '5', nombre: 'Elena', apellidos: 'Ruiz', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['6'], incompatibilidades: ['1'] },
  { id: '6', nombre: 'David', apellidos: 'Sánchez', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['5'], incompatibilidades: ['4'] },
  { id: '7', nombre: 'Lucía', apellidos: 'Gómez', nivelApoyo: 'Nivel II', necesitaPrimeraFila: true, afinidades: ['8'], incompatibilidades: [] },
  { id: '8', nombre: 'Mateo', apellidos: 'Díaz', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['7'], incompatibilidades: [] },
  { id: '9', nombre: 'Sara', apellidos: 'Torres', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: ['10'], incompatibilidades: [] },
  { id: '10', nombre: 'Hugo', apellidos: 'Vega', nivelApoyo: 'Nivel IV', necesitaPrimeraFila: true, afinidades: ['9'], incompatibilidades: ['11'] },
  { id: '11', nombre: 'Irene', apellidos: 'Morales', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: [], incompatibilidades: ['10'] },
  { id: '12', nombre: 'Pablo', apellidos: 'Navarro', nivelApoyo: 'Ordinario', necesitaPrimeraFila: false, afinidades: [], incompatibilidades: [] },
];

const initialAula: Aula = generateAula(DEFAULT_AULA_CONFIG);

type TabType = 'students' | 'designer' | 'canvas';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [alumnos, setAlumnos] = useState<Alumno[]>(initialAlumnos);
  const [aula, setAula] = useState<Aula>(initialAula);
  const [saveAlert, setSaveAlert] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar de LocalStorage al iniciar
  useEffect(() => {
    try {
      const savedAlumnos = localStorage.getItem('seating-alumnos');
      const savedAula = localStorage.getItem('seating-aula');
      if (savedAlumnos) {
        setAlumnos(JSON.parse(savedAlumnos));
      }
      if (savedAula) {
        setAula(JSON.parse(savedAula));
      }
    } catch (e) {
      console.error('Error al cargar datos locales', e);
    }
  }, []);

  const showNotification = (message: string) => {
    setSaveAlert(message);
    setTimeout(() => {
      setSaveAlert(null);
    }, 3000);
  };

  // Guardar en LocalStorage
  const handleSave = () => {
    try {
      localStorage.setItem('seating-alumnos', JSON.stringify(alumnos));
      localStorage.setItem('seating-aula', JSON.stringify(aula));
      showNotification('✅ Cambios guardados correctamente en tu navegador');
    } catch (e) {
      showNotification('❌ Error al guardar datos');
    }
  };

  // Exportar archivo JSON
  const handleExport = () => {
    const data = { alumnos, aula, exportadoEn: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distribucion-${aula.nombre.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📥 Archivo de aula descargado');
  };

  // Importar archivo JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.alumnos && Array.isArray(json.alumnos)) {
          setAlumnos(json.alumnos);
        }
        if (json.aula) {
          setAula(json.aula);
        }
        showNotification('📤 Datos importados con éxito');
      } catch (err) {
        alert('El archivo no tiene un formato válido JSON de Classroom Seating Planner.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Imprimir plano o exportar a PDF
  const handlePrint = () => {
    setActiveTab('canvas');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Toast Notification */}
      {saveAlert && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          {saveAlert}
        </div>
      )}

      {/* Header Superior Principal */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between sticky top-0 z-30 shadow-sm gap-4">
        
        {/* Logo & Marca */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <School className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Classroom Seating Planner</h1>
            <span className="text-[11px] text-slate-400 font-medium">{aula.nombre || 'Distribución de Alumnos'}</span>
          </div>
        </div>

        {/* Pestañas de Navegación Centrales */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/70 shadow-inner">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'students'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>1. Lista de Alumnos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'students' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {alumnos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('designer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'designer'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Grid className="h-4 w-4" />
            <span>2. Diseñar Aula</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-200 text-slate-700">
              {aula.filas}×{aula.mesasPorFila || aula.columnas}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'canvas'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Layout className="h-4 w-4" />
            <span>3. Plano de Asientos</span>
          </button>
        </nav>

        {/* Botones de Guardar / Exportar / Importar / Imprimir PDF */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Importar archivo JSON guardado"
          >
            <Upload className="h-3.5 w-3.5" />
            Importar
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Exportar archivo JSON"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            title="Imprimir o Guardar como PDF"
          >
            <Printer className="h-3.5 w-3.5 text-emerald-400" />
            Imprimir / PDF
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            title="Guardar en el navegador"
          >
            <Save className="h-3.5 w-3.5" />
            Guardar
          </button>
        </div>

      </header>

      {/* Vistas Principales según la pestaña activa */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'students' && (
          <StudentList
            alumnos={alumnos}
            setAlumnos={setAlumnos}
            onGoToClassDesigner={() => setActiveTab('designer')}
            onGoToSeatingPlan={() => setActiveTab('canvas')}
          />
        )}

        {activeTab === 'designer' && (
          <ClassDesigner
            aula={aula}
            setAula={setAula}
            totalStudents={alumnos.length}
            onApplyAndGoToSeating={() => setActiveTab('canvas')}
          />
        )}

        {activeTab === 'canvas' && (
          <SeatingCanvas
            alumnos={alumnos}
            aula={aula}
            setAula={setAula}
            onGoToStudentsList={() => setActiveTab('students')}
            onGoToClassDesigner={() => setActiveTab('designer')}
          />
        )}
      </main>

    </div>
  );
}

export default App;
