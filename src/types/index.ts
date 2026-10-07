export type NivelApoyo = 'Ordinario' | 'Nivel II' | 'Nivel III' | 'Nivel IV';

export interface Alumno {
  id: string;
  nombre: string;
  apellidos: string;
  nivelApoyo: NivelApoyo;
  necesitaPrimeraFila: boolean;
  afinidades: string[]; // IDs de alumnos con los que conviene sentarse
  enemistades: string[]; // IDs de alumnos con los que NO debe sentarse
  afinidadId?: string; // Retrocompatibilidad
  enemistadId?: string; // Retrocompatibilidad
  notas?: string;
}

export interface Mesa {
  id: string;
  numero: number;
  fila: number; // Índice de fila (0-indexed o 1-indexed)
  columna: number; // Índice de columna
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270 grados
  capacidad: number; // 1 (individual), 2 (parejas), 3 (tríos), 4 (grupo), etc.
  alumnoIds: (string | null)[]; // Array de IDs de alumnos asignados a cada puesto
}

export type PresetDistribucion = 'filas_parejas' | 'filas_individuales' | 'filas_triples' | 'islas_4' | 'u_shape';

export interface AulaConfig {
  nombre: string;
  filas: number;
  mesasPorFila: number;
  capacidadPorMesa: number;
  posicionProfesor: 'izquierda' | 'centro' | 'derecha';
  posicionPizarra: 'arriba' | 'abajo';
  separacionPasillo: boolean;
}

export interface Aula {
  id: string;
  nombre: string;
  filas: number;
  columnas: number;
  mesasPorFila?: number;
  capacidadPorMesa?: number;
  separacionPasillo?: boolean;
  mesas: Mesa[];
  elementosFijos: {
    pizarra: { posicion: 'arriba' | 'abajo' | 'izquierda' | 'derecha' };
    mesaProfesor: { x: number; y: number; posicion?: 'izquierda' | 'centro' | 'derecha' };
  };
}
