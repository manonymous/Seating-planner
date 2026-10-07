import { Alumno, Aula, AulaConfig, Mesa, PresetDistribucion } from '../types';

export const DEFAULT_AULA_CONFIG: AulaConfig = {
  nombre: 'Aula Principal',
  filas: 4,
  mesasPorFila: 3,
  capacidadPorMesa: 2,
  posicionProfesor: 'centro',
  posicionPizarra: 'arriba',
  separacionPasillo: true,
};

export function getPresetConfig(preset: PresetDistribucion): Partial<AulaConfig> {
  switch (preset) {
    case 'filas_parejas':
      return { filas: 4, mesasPorFila: 3, capacidadPorMesa: 2, separacionPasillo: true };
    case 'filas_individuales':
      return { filas: 5, mesasPorFila: 4, capacidadPorMesa: 1, separacionPasillo: true };
    case 'filas_triples':
      return { filas: 4, mesasPorFila: 2, capacidadPorMesa: 3, separacionPasillo: false };
    case 'islas_4':
      return { filas: 3, mesasPorFila: 2, capacidadPorMesa: 4, separacionPasillo: true };
    case 'u_shape':
      return { filas: 3, mesasPorFila: 3, capacidadPorMesa: 2, separacionPasillo: false };
    default:
      return {};
  }
}

/**
 * Genera una nueva estructura de aula según la configuración deseada,
 * preservando opcionalmente los alumnos ya asignados si caben.
 */
export function generateAula(
  config: AulaConfig,
  existingMesas?: Mesa[]
): Aula {
  const mesas: Mesa[] = [];
  let tableCounter = 1;

  // Mapa de alumnos previamente asignados para preservarlos si es posible
  const previousAssignments: string[] = [];
  if (existingMesas) {
    existingMesas.forEach((mesa) => {
      mesa.alumnoIds.forEach((id) => {
        if (id) previousAssignments.push(id);
      });
    });
  }

  let assignedIndex = 0;

  for (let r = 0; r < config.filas; r++) {
    for (let c = 0; c < config.mesasPorFila; c++) {
      const alumnoIds: (string | null)[] = [];
      for (let s = 0; s < config.capacidadPorMesa; s++) {
        if (assignedIndex < previousAssignments.length) {
          alumnoIds.push(previousAssignments[assignedIndex++]);
        } else {
          alumnoIds.push(null);
        }
      }

      mesas.push({
        id: `mesa-${r}-${c}-${tableCounter}`,
        numero: tableCounter++,
        fila: r,
        columna: c,
        x: c,
        y: r,
        rotation: 0,
        capacidad: config.capacidadPorMesa,
        alumnoIds,
      });
    }
  }

  let profX = 1;
  if (config.posicionProfesor === 'izquierda') profX = 0;
  else if (config.posicionProfesor === 'derecha') profX = Math.max(0, config.mesasPorFila - 1);
  else profX = Math.floor(config.mesasPorFila / 2);

  return {
    id: `aula-${Date.now()}`,
    nombre: config.nombre || 'Aula 101',
    filas: config.filas,
    columnas: config.mesasPorFila,
    mesasPorFila: config.mesasPorFila,
    capacidadPorMesa: config.capacidadPorMesa,
    separacionPasillo: config.separacionPasillo,
    mesas,
    elementosFijos: {
      pizarra: { posicion: config.posicionPizarra },
      mesaProfesor: { x: profX, y: 0, posicion: config.posicionProfesor },
    },
  };
}

/**
 * Analiza conflictos de afinidades, enemistades y posición en primera fila
 */
export function checkClassroomIssues(alumnos: Alumno[], mesas: Mesa[]) {
  const studentMap = new Map<string, Alumno>();
  alumnos.forEach((a) => studentMap.set(a.id, a));

  const conflicts: { alumno1: Alumno; alumno2: Alumno; mesaNumero: number; tipo: 'enemistad' }[] = [];
  const affinitiesMet: { alumno1: Alumno; alumno2: Alumno; mesaNumero: number }[] = [];
  const frontRowWarnings: { alumno: Alumno; fila: number }[] = [];

  let totalAffinitiesDeclared = 0;
  alumnos.forEach((a) => {
    const afins = getStudentAffinities(a);
    totalAffinitiesDeclared += afins.length;
  });

  mesas.forEach((mesa) => {
    const presentStudents = mesa.alumnoIds
      .map((id) => (id ? studentMap.get(id) : null))
      .filter((s): s is Alumno => s !== null && s !== undefined);

    // Revisar requerimiento de 1ª fila (fila 0)
    presentStudents.forEach((student) => {
      if (student.necesitaPrimeraFila && mesa.fila > 0) {
        frontRowWarnings.push({ alumno: student, fila: mesa.fila + 1 });
      }
    });

    // Comparar pares de alumnos en la misma mesa
    for (let i = 0; i < presentStudents.length; i++) {
      for (let j = i + 1; j < presentStudents.length; j++) {
        const s1 = presentStudents[i];
        const s2 = presentStudents[j];

        const s1Enemies = getStudentEnmities(s1);
        const s2Enemies = getStudentEnmities(s2);

        if (s1Enemies.includes(s2.id) || s2Enemies.includes(s1.id)) {
          conflicts.push({
            alumno1: s1,
            alumno2: s2,
            mesaNumero: mesa.numero,
            tipo: 'enemistad',
          });
        }

        const s1Affinities = getStudentAffinities(s1);
        const s2Affinities = getStudentAffinities(s2);

        if (s1Affinities.includes(s2.id) || s2Affinities.includes(s1.id)) {
          affinitiesMet.push({
            alumno1: s1,
            alumno2: s2,
            mesaNumero: mesa.numero,
          });
        }
      }
    }
  });

  return {
    conflicts,
    affinitiesMet,
    frontRowWarnings,
    totalAffinitiesDeclared,
  };
}

export function getStudentAffinities(alumno: Alumno): string[] {
  const result = new Set<string>();
  if (alumno.afinidades && Array.isArray(alumno.afinidades)) {
    alumno.afinidades.forEach((id) => id && result.add(id));
  }
  if (alumno.afinidadId) {
    result.add(alumno.afinidadId);
  }
  return Array.from(result);
}

export function getStudentEnmities(alumno: Alumno): string[] {
  const result = new Set<string>();
  if (alumno.enemistades && Array.isArray(alumno.enemistades)) {
    alumno.enemistades.forEach((id) => id && result.add(id));
  }
  if (alumno.enemistadId) {
    result.add(alumno.enemistadId);
  }
  return Array.from(result);
}

/**
 * Algoritmo inteligente de distribución de alumnos en mesas respetando:
 * 1. Necesidad de primera fila -> mesas de fila 0
 * 2. Evitar enemistades en la misma mesa
 * 3. Fomentar afinidades en la misma mesa
 */
export function autoAssignStudents(alumnos: Alumno[], mesas: Mesa[]): Mesa[] {
  // Clona las mesas con asientos limpios
  const newMesas: Mesa[] = mesas.map((m) => ({
    ...m,
    alumnoIds: new Array(m.capacidad).fill(null),
  }));

  const totalSeats = newMesas.reduce((acc, m) => acc + m.capacidad, 0);
  if (totalSeats === 0 || alumnos.length === 0) return newMesas;

  const studentMap = new Map<string, Alumno>();
  alumnos.forEach((a) => studentMap.set(a.id, a));

  const unassigned = [...alumnos];

  // Helper para verificar compatibilidad de un alumno con los ya sentados en una mesa
  function canSitTogether(student: Alumno, seatedIds: (string | null)[]): boolean {
    const studentEnemies = getStudentEnmities(student);
    for (const sid of seatedIds) {
      if (!sid) continue;
      const seated = studentMap.get(sid);
      if (!seated) continue;
      if (studentEnemies.includes(seated.id)) return false;
      if (getStudentEnmities(seated).includes(student.id)) return false;
    }
    return true;
  }

  // 1. Asignar alumnos que necesitan primera fila a mesas con fila === 0
  const frontRowStudents = unassigned.filter((a) => a.necesitaPrimeraFila);
  const frontMesas = newMesas.filter((m) => m.fila === 0);

  for (const student of frontRowStudents) {
    let placed = false;
    for (const mesa of frontMesas) {
      const freeIndex = mesa.alumnoIds.indexOf(null);
      if (freeIndex !== -1 && canSitTogether(student, mesa.alumnoIds)) {
        mesa.alumnoIds[freeIndex] = student.id;
        const idx = unassigned.findIndex((a) => a.id === student.id);
        if (idx !== -1) unassigned.splice(idx, 1);
        placed = true;
        break;
      }
    }
    if (!placed) {
      // Si no cupo en fila 0, intentar cualquier mesa con hueco
      for (const mesa of newMesas) {
        const freeIndex = mesa.alumnoIds.indexOf(null);
        if (freeIndex !== -1 && canSitTogether(student, mesa.alumnoIds)) {
          mesa.alumnoIds[freeIndex] = student.id;
          const idx = unassigned.findIndex((a) => a.id === student.id);
          if (idx !== -1) unassigned.splice(idx, 1);
          break;
        }
      }
    }
  }

  // 2. Agrupar alumnos con afinidades mutuas o directas
  const remaining = [...unassigned];
  remaining.sort((a, b) => {
    // Ordenar con prioridad a los que tienen afinidades declaradas
    return getStudentAffinities(b).length - getStudentAffinities(a).length;
  });

  for (const student of remaining) {
    if (!unassigned.some((u) => u.id === student.id)) continue; // ya asignado

    const affinities = getStudentAffinities(student);
    let placed = false;

    // Buscar si algún amigo ya está sentado en una mesa con espacio disponible
    for (const mesa of newMesas) {
      const freeIndex = mesa.alumnoIds.indexOf(null);
      if (freeIndex === -1) continue;

      const hasFriendHere = mesa.alumnoIds.some((sid) => sid && affinities.includes(sid));
      if (hasFriendHere && canSitTogether(student, mesa.alumnoIds)) {
        mesa.alumnoIds[freeIndex] = student.id;
        const idx = unassigned.findIndex((a) => a.id === student.id);
        if (idx !== -1) unassigned.splice(idx, 1);
        placed = true;
        break;
      }
    }

    // Si no tiene amigo sentado aún, intentar sentarlo con un amigo disponible en una mesa vacía
    if (!placed && affinities.length > 0) {
      const friendId = affinities.find((fid) => unassigned.some((u) => u.id === fid));
      if (friendId) {
        const friend = unassigned.find((u) => u.id === friendId)!;
        // Buscar mesa con al menos 2 huecos libres
        const targetMesa = newMesas.find((m) => {
          const emptyCount = m.alumnoIds.filter((id) => id === null).length;
          return emptyCount >= 2 && canSitTogether(student, m.alumnoIds) && canSitTogether(friend, m.alumnoIds);
        });

        if (targetMesa) {
          const firstFree = targetMesa.alumnoIds.indexOf(null);
          targetMesa.alumnoIds[firstFree] = student.id;
          const secondFree = targetMesa.alumnoIds.indexOf(null);
          targetMesa.alumnoIds[secondFree] = friend.id;

          unassigned.splice(unassigned.findIndex((a) => a.id === student.id), 1);
          unassigned.splice(unassigned.findIndex((a) => a.id === friend.id), 1);
          placed = true;
        }
      }
    }
  }

  // 3. Sentar al resto de alumnos en cualquier espacio disponible evitando enemigos
  const stillUnassigned = [...unassigned];
  for (const student of stillUnassigned) {
    let placed = false;
    for (const mesa of newMesas) {
      const freeIndex = mesa.alumnoIds.indexOf(null);
      if (freeIndex !== -1 && canSitTogether(student, mesa.alumnoIds)) {
        mesa.alumnoIds[freeIndex] = student.id;
        const idx = unassigned.findIndex((a) => a.id === student.id);
        if (idx !== -1) unassigned.splice(idx, 1);
        placed = true;
        break;
      }
    }

    // Si no encontró hueco sin conflicto, colocar en el primer hueco que quede
    if (!placed) {
      for (const mesa of newMesas) {
        const freeIndex = mesa.alumnoIds.indexOf(null);
        if (freeIndex !== -1) {
          mesa.alumnoIds[freeIndex] = student.id;
          const idx = unassigned.findIndex((a) => a.id === student.id);
          if (idx !== -1) unassigned.splice(idx, 1);
          break;
        }
      }
    }
  }

  return newMesas;
}
