import React, { useState } from 'react';
import { Alumno } from '../types';
import { X, FileSpreadsheet, ClipboardPaste, Check, ArrowRight } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newAlumnos: Alumno[], replaceExisting: boolean) => void;
  currentCount: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentCount,
}) => {
  const [rawText, setRawText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);

  if (!isOpen) return null;

  // Analizar y limpiar los nombres pegados
  const parseLines = (text: string): { nombre: string; apellidos: string }[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    
    // Lista de cabeceras comunes a ignorar si están en la primera fila
    const headerWords = ['nombre', 'nombres', 'alumno', 'alumnos', 'estudiante', 'estudiantes', 'apellidos', 'nombre y apellidos', 'name'];

    const result: { nombre: string; apellidos: string }[] = [];

    lines.forEach((line, index) => {
      // Ignorar encabezados típicos si es la primera línea
      if (index === 0 && headerWords.includes(line.toLowerCase().replace(/[:;]/g, ''))) {
        return;
      }

      // Si la línea tiene formato "Apellidos, Nombre" (separado por coma)
      if (line.includes(',')) {
        const parts = line.split(',');
        const apellidos = parts[0]?.trim() || '';
        const nombre = parts.slice(1).join(',').trim() || '';
        if (nombre || apellidos) {
          result.push({
            nombre: nombre || apellidos,
            apellidos: nombre ? apellidos : '',
          });
        }
      } else {
        // Formato regular separado por espacios: "Nombre Apellido1 Apellido2"
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length === 1) {
          result.push({ nombre: parts[0], apellidos: '' });
        } else if (parts.length >= 2) {
          // El primer elemento es el nombre, el resto son los apellidos
          const nombre = parts[0];
          const apellidos = parts.slice(1).join(' ');
          result.push({ nombre, apellidos });
        }
      }
    });

    return result;
  };

  const parsedStudents = parseLines(rawText);

  // Leer directamente del portapapeles con un clic
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
      }
    } catch (err) {
      // Si el navegador bloquea permisos, el usuario puede pegar con Ctrl+V
      console.warn('Acceso al portapapeles denegado o no soportado, usar Ctrl+V');
    }
  };

  const handleConfirmImport = () => {
    if (parsedStudents.length === 0) return;

    const timestamp = Date.now();
    const newAlumnos: Alumno[] = parsedStudents.map((item, idx) => ({
      id: `student-excel-${timestamp}-${idx}`,
      nombre: item.nombre,
      apellidos: item.apellidos,
      nivelApoyo: 'Ordinario',
      necesitaPrimeraFila: false,
      afinidades: [],
      enemistades: [],
    }));

    onImport(newAlumnos, replaceExisting);
    setRawText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Importar Alumnos desde Excel</h3>
              <p className="text-xs text-white/80">Copia la columna de nombres y pégala directamente aquí</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-lg p-1 hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-700">Instrucciones:</span>
              <span>Selecciona la columna con los nombres en Excel, pulsa <strong>Ctrl + C</strong> y pégala abajo (<strong>Ctrl + V</strong>).</span>
            </div>
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 rounded-lg font-medium transition-all shadow-sm flex-shrink-0"
              title="Pegar automáticamente lo que tengas copiado"
            >
              <ClipboardPaste className="h-3.5 w-3.5 text-emerald-600" />
              Pegar Portapapeles
            </button>
          </div>

          {/* Área de Texto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Columna de Nombres (un alumno por fila)
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Ejemplo:&#10;García López, Juan&#10;Martínez Ruiz, Laura&#10;Carlos Gómez&#10;Ana Hernández&#10;David"
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Vista Previa de Detección */}
          {parsedStudents.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {parsedStudents.length} {parsedStudents.length === 1 ? 'alumno detectado' : 'alumnos detectados'}
                </span>
                <span className="text-[11px] text-slate-500">
                  Formato reconocido: {parsedStudents[0].apellidos ? 'Nombre y Apellidos' : 'Solo Nombre'}
                </span>
              </div>
              
              {/* Chips de muestra de los primeros alumnos */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {parsedStudents.slice(0, 10).map((st, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 bg-white border border-emerald-200 rounded-md font-medium text-slate-700 shadow-2xs"
                  >
                    {st.nombre} {st.apellidos}
                  </span>
                ))}
                {parsedStudents.length > 10 && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-100/70 text-emerald-800 rounded-md font-semibold">
                    + {parsedStudents.length - 10} más...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Opciones de Importación */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Reemplazar lista actual ({currentCount} alumnos existentes)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={parsedStudents.length === 0}
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200"
              >
                <span>Importar {parsedStudents.length} Alumnos</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
