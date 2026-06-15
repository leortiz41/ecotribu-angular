import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, catchError, switchMap } from 'rxjs';
import { RespuestaApi } from './auth.service';

interface EvidenciaRelacionReto {
  _id: string;
  titulo: string;
  puntos?: number;
}

interface EvidenciaAlumno {
  _id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  reto?: EvidenciaRelacionReto | string;
  puntoRecoleccionNombre?: string;
  puntoRecoleccionCiudad?: string;
  createdAt: string;
}

interface UsuarioRankingEscuelaApi {
  _id: string;
  nombre: string;
  puntos?: number;
  createdAt?: string;
}

interface RetoRelacionCreador {
  _id: string;
  nombre: string;
}

interface RetoDisponibleApi {
  _id: string;
  titulo: string;
  descripcion?: string;
  puntos?: number;
  fechaFin?: string;
  creador?: RetoRelacionCreador;
}

interface CuestionarioRelacionadoAlumno {
  _id: string;
  nombre: string;
}

interface CuestionarioDisponibleApi {
  _id: string;
  titulo: string;
  descripcion?: string;
  grado?: string;
  modalidad?: string;
  estado: 'borrador' | 'publicado' | 'cerrado';
  preguntas?: unknown[];
  creador?: CuestionarioRelacionadoAlumno;
}

interface RespuestaResultadoPayload {
  preguntaIndex: number;
  respuesta: string | number | number[];
  esCorrecta: boolean;
  puntajeObtenido: number;
}

interface ResultadoCuestionarioPayload {
  cuestionario: string;
  alumno: string;
  escuela: string;
  respuestas: RespuestaResultadoPayload[];
  puntajeObtenido: number;
  puntajeMaximo: number;
  aprobado: boolean;
  intento: number;
}

interface CuestionarioRelacionado {
  _id: string;
  titulo: string;
}

interface ResultadoCuestionarioAlumno {
  _id: string;
  porcentaje?: number;
  puntajeObtenido: number;
  puntajeMaximo: number;
  cuestionario?: CuestionarioRelacionado;
  createdAt: string;
}

export interface MetricaPerfilAlumno {
  titulo: string;
  valor: string;
}

export interface ActividadPerfilAlumno {
  nombre: string;
  porcentaje: number;
}

export interface ReportePerfilAlumno {
  metricas: MetricaPerfilAlumno[];
  actividades: ActividadPerfilAlumno[];
}

export interface RetoDisponibleAlumno {
  _id: string;
  titulo: string;
  descripcion?: string;
  puntos: number;
  fechaFin?: string;
  creadorNombre: string;
  estadoAlumno: 'sin_entregar' | 'pendiente' | 'aprobada' | 'rechazada';
}

export interface CuestionarioDisponibleAlumno {
  _id: string;
  titulo: string;
  descripcion?: string;
  grado?: string;
  modalidad?: string;
  creadorNombre: string;
  preguntasCantidad: number;
  preguntas: PreguntaCuestionarioAlumno[];
  yaRealizado: boolean;
  promedioObtenido?: number;
}

export interface PreguntaCuestionarioAlumno {
  enunciado: string;
  tipo: 'seleccion_unica' | 'seleccion_multiple' | 'verdadero_falso' | 'completacion' | 'respuesta_corta';
  opciones?: string[];
  respuestaCorrecta?: string | number | number[];
  puntaje: number;
}

export interface CrearEvidenciaAlumnoPayload {
  reto: string;
  alumno: string;
  descripcion: string;
  archivoUrl: string;
  puntoRecoleccionNombre: string;
  puntoRecoleccionCiudad: string;
}

export interface RankingFilaAlumno {
  posicion: number;
  alumnoId: string;
  nombre: string;
  puntos: number;
  esActual: boolean;
}

export interface RankingAlumnoEscuela {
  miPosicion: number | null;
  totalParticipantes: number;
  puntosActuales: number;
  top: RankingFilaAlumno[];
}

export interface PuntoRecoleccionSugerido {
  nombre: string;
  ciudad: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilAlumnoService {
  private readonly http = inject(HttpClient);
  private readonly evidenciasApiUrl = 'http://localhost:3000/api/evidencias';
  private readonly cuestionariosApiUrl = 'http://localhost:3000/api/cuestionarios';
  private readonly resultadosApiUrl = 'http://localhost:3000/api/resultados-cuestionarios';
  private readonly retosApiUrl = 'http://localhost:3000/api/retos';
  private readonly usuariosApiUrl = 'http://localhost:3000/api/usuarios';

  private readonly puntosRecoleccionSugeridos: ReadonlyArray<PuntoRecoleccionSugerido> = [
    { nombre: 'Centro de Acopio Municipal', ciudad: 'Distrito Central' },
    { nombre: 'Punto Verde Parque Central', ciudad: 'San Pedro Sula' },
    { nombre: 'Estación de Reciclaje Barrio Abajo', ciudad: 'La Ceiba' },
    { nombre: 'Centro de Clasificación Comunitario', ciudad: 'Comayagua' },
    { nombre: 'Punto Limpio Mercado Local', ciudad: 'Choluteca' },
  ];

  obtenerReporte(alumnoId: string): Observable<ReportePerfilAlumno> {
    return forkJoin({
      evidencias: this.obtenerEvidenciasAlumno(alumnoId),
      resultados: this.obtenerResultadosAlumno(alumnoId),
    }).pipe(
      map(({ evidencias, resultados }) => this.construirReporte(evidencias, resultados))
    );
  }

  obtenerRetosDisponibles(alumnoId: string, escuelaId: string, grado?: string): Observable<RetoDisponibleAlumno[]> {
    return forkJoin({
      retos: this.obtenerRetosPublicadosEscuela(escuelaId, grado),
      evidencias: this.obtenerEvidenciasAlumno(alumnoId),
    }).pipe(
      map(({ retos, evidencias }) => {
        const estadoPorReto = new Map<string, RetoDisponibleAlumno['estadoAlumno']>();

        evidencias.forEach((item) => {
          const retoId = this.extraerRetoId(item.reto);
          if (!retoId) {
            return;
          }
          estadoPorReto.set(retoId, item.estado);
        });

        return retos.map((reto) => ({
          _id: reto._id,
          titulo: reto.titulo,
          descripcion: reto.descripcion,
          puntos: Number(reto.puntos ?? 0),
          fechaFin: reto.fechaFin,
          creadorNombre: reto.creador?.nombre ?? 'Docente',
          estadoAlumno: estadoPorReto.get(reto._id) ?? 'sin_entregar',
        }));
      }),
      catchError(() => of([]))
    );
  }

  obtenerCuestionariosDisponibles(
    escuelaId: string,
    alumnoId: string,
    grado?: string
  ): Observable<CuestionarioDisponibleAlumno[]> {
    return forkJoin({
      cuestionarios: this.obtenerCuestionariosPublicadosEscuela(escuelaId, grado),
      resultados: this.obtenerResultadosAlumno(alumnoId),
    }).pipe(
      map(({ cuestionarios, resultados }) => {
        const cuestionariosRealizados = new Set<string>();
        const mejorPorcentajePorCuestionario = new Map<string, number>();

        resultados.forEach((resultado) => {
          const cuestionarioId = this.extraerCuestionarioId(resultado.cuestionario);
          if (!cuestionarioId) {
            return;
          }

          cuestionariosRealizados.add(cuestionarioId);

          const porcentajeActual = this.normalizarPorcentaje(
            resultado.porcentaje,
            resultado.puntajeObtenido,
            resultado.puntajeMaximo
          );
          const mejorPrevio = mejorPorcentajePorCuestionario.get(cuestionarioId) ?? 0;
          if (porcentajeActual > mejorPrevio) {
            mejorPorcentajePorCuestionario.set(cuestionarioId, porcentajeActual);
          }
        });

        return cuestionarios.map((cuestionario) => ({
          _id: cuestionario._id,
          titulo: cuestionario.titulo,
          descripcion: cuestionario.descripcion,
          grado: cuestionario.grado,
          modalidad: cuestionario.modalidad,
          creadorNombre: cuestionario.creador?.nombre ?? 'Docente',
          preguntasCantidad: Array.isArray(cuestionario.preguntas) ? cuestionario.preguntas.length : 0,
          preguntas: this.normalizarPreguntas(cuestionario.preguntas),
          yaRealizado: cuestionariosRealizados.has(cuestionario._id),
          promedioObtenido: mejorPorcentajePorCuestionario.get(cuestionario._id),
        }));
      }),
      catchError(() => of([]))
    );
  }

  registrarResultadoCuestionario(
    alumnoId: string,
    escuelaId: string,
    cuestionario: CuestionarioDisponibleAlumno,
    respuestasUsuario: Array<string | number | number[] | null>
  ): Observable<void> {
    return this.obtenerIntentoSiguiente(cuestionario._id, alumnoId).pipe(
      map((intento) => {
        const respuestasEvaluadas = this.evaluarRespuestas(cuestionario.preguntas, respuestasUsuario);
        const puntajeObtenido = respuestasEvaluadas.reduce((acc, item) => acc + item.puntajeObtenido, 0);
        const puntajeMaximo = cuestionario.preguntas.reduce((acc, item) => acc + (Number(item.puntaje) || 0), 0);
        const porcentaje = puntajeMaximo > 0 ? (puntajeObtenido / puntajeMaximo) * 100 : 0;

        const payload: ResultadoCuestionarioPayload = {
          cuestionario: cuestionario._id,
          alumno: alumnoId,
          escuela: escuelaId,
          respuestas: respuestasEvaluadas,
          puntajeObtenido,
          puntajeMaximo,
          aprobado: porcentaje >= 60,
          intento,
        };

        return payload;
      }),
      switchMap((payload) => this.http.post<RespuestaApi<unknown>>(this.resultadosApiUrl, payload)),
      map(() => void 0)
    );
  }

  crearEvidencia(payload: CrearEvidenciaAlumnoPayload): Observable<void> {
    return this.http.post<RespuestaApi<unknown>>(this.evidenciasApiUrl, payload).pipe(map(() => void 0));
  }

  obtenerPuntosRetosAprobados(alumnoId: string): Observable<number> {
    return this.obtenerEvidenciasAlumno(alumnoId).pipe(
      map((evidencias) =>
        evidencias
          .filter((item) => item.estado === 'aprobada')
          .reduce((acc, item) => acc + this.extraerPuntosReto(item.reto), 0)
      ),
      catchError(() => of(0))
    );
  }

  obtenerRankingEscuela(escuelaId: string, alumnoId: string): Observable<RankingAlumnoEscuela> {
    const query = `${this.usuariosApiUrl}?rol=alumno&escuela=${escuelaId}`;

    return this.http.get<RespuestaApi<UsuarioRankingEscuelaApi[]>>(query).pipe(
      map((res) => {
        const alumnos = [...(res.data ?? [])];
        alumnos.sort((a, b) => {
          const puntosA = Number(a.puntos ?? 0);
          const puntosB = Number(b.puntos ?? 0);
          if (puntosB !== puntosA) {
            return puntosB - puntosA;
          }

          const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
          const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
          return fechaA - fechaB;
        });

        const filas = alumnos.map((item, index) => ({
          posicion: index + 1,
          alumnoId: item._id,
          nombre: item.nombre,
          puntos: Number(item.puntos ?? 0),
          esActual: item._id === alumnoId,
        }));

        const filaActual = filas.find((item) => item.esActual);

        return {
          miPosicion: filaActual?.posicion ?? null,
          totalParticipantes: filas.length,
          puntosActuales: filaActual?.puntos ?? 0,
          top: filas.slice(0, 8),
        } satisfies RankingAlumnoEscuela;
      }),
      catchError(() =>
        of({
          miPosicion: null,
          totalParticipantes: 0,
          puntosActuales: 0,
          top: [],
        })
      )
    );
  }

  obtenerPuntosRecoleccionSugeridos(): ReadonlyArray<PuntoRecoleccionSugerido> {
    return this.puntosRecoleccionSugeridos;
  }

  private obtenerRetosPublicadosEscuela(escuelaId: string, grado?: string): Observable<RetoDisponibleApi[]> {
    const gradoParam = grado ? `&grado=${encodeURIComponent(grado)}` : '';
    const query = `${this.retosApiUrl}?escuela=${escuelaId}&estado=publicado${gradoParam}`;
    return this.http.get<RespuestaApi<RetoDisponibleApi[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private obtenerCuestionariosPublicadosEscuela(
    escuelaId: string,
    grado?: string
  ): Observable<CuestionarioDisponibleApi[]> {
    const gradoParam = grado ? `&grado=${encodeURIComponent(grado)}` : '';
    const query = `${this.cuestionariosApiUrl}?escuela=${escuelaId}&estado=publicado${gradoParam}`;
    return this.http.get<RespuestaApi<CuestionarioDisponibleApi[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private obtenerEvidenciasAlumno(alumnoId: string): Observable<EvidenciaAlumno[]> {
    return this.http
      .get<RespuestaApi<EvidenciaAlumno[]>>(`${this.evidenciasApiUrl}?alumno=${alumnoId}`)
      .pipe(
        map((res) => res.data ?? []),
        catchError(() => of([]))
      );
  }

  private obtenerResultadosAlumno(alumnoId: string): Observable<ResultadoCuestionarioAlumno[]> {
    return this.http
      .get<RespuestaApi<ResultadoCuestionarioAlumno[]>>(`${this.resultadosApiUrl}?alumno=${alumnoId}`)
      .pipe(
        map((res) => res.data ?? []),
        catchError(() => of([]))
      );
  }

  private obtenerIntentoSiguiente(cuestionarioId: string, alumnoId: string): Observable<number> {
    const query = `${this.resultadosApiUrl}?cuestionario=${cuestionarioId}&alumno=${alumnoId}&incluirInactivos=true`;

    return this.http.get<RespuestaApi<Array<{ intento?: number }>>>(query).pipe(
      map((res) => {
        const resultados = res.data ?? [];
        const intentoMaximo = resultados.reduce((acc, item) => Math.max(acc, Number(item.intento) || 0), 0);
        return intentoMaximo + 1;
      }),
      catchError(() => of(1))
    );
  }

  private normalizarPreguntas(rawPreguntas?: unknown[]): PreguntaCuestionarioAlumno[] {
    if (!Array.isArray(rawPreguntas)) {
      return [];
    }

    const preguntas: PreguntaCuestionarioAlumno[] = [];

    rawPreguntas.forEach((pregunta) => {
      if (!pregunta || typeof pregunta !== 'object') {
        return;
      }

      const item = pregunta as {
        enunciado?: string;
        tipo?: PreguntaCuestionarioAlumno['tipo'];
        opciones?: string[];
        respuestaCorrecta?: string | number | number[];
        puntaje?: number;
      };

      preguntas.push({
        enunciado: item.enunciado ?? 'Pregunta',
        tipo: item.tipo ?? 'seleccion_unica',
        opciones: Array.isArray(item.opciones) ? item.opciones : [],
        respuestaCorrecta: item.respuestaCorrecta,
        puntaje: Number(item.puntaje) || 1,
      });
    });

    return preguntas;
  }

  private evaluarRespuestas(
    preguntas: ReadonlyArray<PreguntaCuestionarioAlumno>,
    respuestasUsuario: Array<string | number | number[] | null>
  ): RespuestaResultadoPayload[] {
    return preguntas.map((pregunta, preguntaIndex) => {
      const respuesta = respuestasUsuario[preguntaIndex];
      const respuestaNormalizada: string | number | number[] =
        respuesta === null || respuesta === undefined ? '' : respuesta;

      const esCorrecta = this.esRespuestaCorrecta(respuestaNormalizada, pregunta.respuestaCorrecta);

      return {
        preguntaIndex,
        respuesta: respuestaNormalizada,
        esCorrecta,
        puntajeObtenido: esCorrecta ? Number(pregunta.puntaje) || 0 : 0,
      };
    });
  }

  private esRespuestaCorrecta(
    respuestaUsuario: string | number | number[],
    respuestaCorrecta?: string | number | number[]
  ): boolean {
    if (respuestaCorrecta === undefined || respuestaCorrecta === null) {
      return false;
    }

    if (Array.isArray(respuestaCorrecta)) {
      if (!Array.isArray(respuestaUsuario)) {
        return false;
      }

      const correcta = [...respuestaCorrecta].map(String).sort().join('|');
      const usuario = [...respuestaUsuario].map(String).sort().join('|');
      return correcta === usuario;
    }

    return String(respuestaUsuario).trim().toLowerCase() === String(respuestaCorrecta).trim().toLowerCase();
  }

  private construirReporte(
    evidencias: EvidenciaAlumno[],
    resultados: ResultadoCuestionarioAlumno[]
  ): ReportePerfilAlumno {
    const evidenciasAprobadas = evidencias.filter((item) => item.estado === 'aprobada').length;
    const participacion = this.calcularParticipacion(evidencias.length, evidenciasAprobadas);
    const promedioQuiz = this.calcularPromedioQuiz(resultados);

    return {
      metricas: [
        { titulo: 'Participación', valor: `${participacion}%` },
        { titulo: 'Retos completados', valor: String(evidenciasAprobadas) },
        { titulo: 'Promedio Quizzes', valor: `${promedioQuiz}%` },
        { titulo: 'Evidencias Aprobadas', valor: String(evidenciasAprobadas) },
      ],
      actividades: this.construirActividades(evidencias, resultados),
    };
  }

  private calcularParticipacion(total: number, aprobadas: number): number {
    if (total === 0) {
      return 0;
    }

    return Math.round((aprobadas / total) * 100);
  }

  private calcularPromedioQuiz(resultados: ResultadoCuestionarioAlumno[]): number {
    if (resultados.length === 0) {
      return 0;
    }

    const suma = resultados.reduce((acc, item) => {
      if (typeof item.porcentaje === 'number') {
        return acc + item.porcentaje;
      }

      if (!item.puntajeMaximo) {
        return acc;
      }

      return acc + (item.puntajeObtenido / item.puntajeMaximo) * 100;
    }, 0);

    return Math.round(suma / resultados.length);
  }

  private construirActividades(
    evidencias: EvidenciaAlumno[],
    resultados: ResultadoCuestionarioAlumno[]
  ): ActividadPerfilAlumno[] {
    const actividadesDesdeQuiz = resultados
      .slice(0, 5)
      .map((item, index) => ({
        nombre: item.cuestionario?.titulo || `Actividad ${index + 1}`,
        porcentaje: this.normalizarPorcentaje(item.porcentaje, item.puntajeObtenido, item.puntajeMaximo),
      }));

    if (actividadesDesdeQuiz.length > 0) {
      return actividadesDesdeQuiz;
    }

    const actividadesDesdeEvidencias = evidencias.slice(0, 5).map((item, index) => ({
      nombre: this.extraerTituloReto(item.reto) || `Actividad ${index + 1}`,
      porcentaje: this.porcentajePorEstado(item.estado),
    }));

    if (actividadesDesdeEvidencias.length > 0) {
      return actividadesDesdeEvidencias;
    }

    return [
      { nombre: 'Actividad 1', porcentaje: 0 },
      { nombre: 'Actividad 2', porcentaje: 0 },
      { nombre: 'Actividad 3', porcentaje: 0 },
      { nombre: 'Actividad 4', porcentaje: 0 },
      { nombre: 'Actividad 5', porcentaje: 0 },
    ];
  }

  private normalizarPorcentaje(
    porcentaje: number | undefined,
    puntajeObtenido: number,
    puntajeMaximo: number
  ): number {
    if (typeof porcentaje === 'number') {
      return Math.max(0, Math.min(100, Math.round(porcentaje)));
    }

    if (!puntajeMaximo) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((puntajeObtenido / puntajeMaximo) * 100)));
  }

  private porcentajePorEstado(estado: EvidenciaAlumno['estado']): number {
    switch (estado) {
      case 'aprobada':
        return 100;
      case 'pendiente':
        return 60;
      case 'rechazada':
        return 20;
      default:
        return 0;
    }
  }

  private extraerRetoId(reto?: EvidenciaRelacionReto | string): string {
    if (!reto) {
      return '';
    }

    if (typeof reto === 'string') {
      return reto;
    }

    return reto._id;
  }

  private extraerTituloReto(reto?: EvidenciaRelacionReto | string): string {
    if (!reto || typeof reto === 'string') {
      return '';
    }

    return reto.titulo;
  }

  private extraerPuntosReto(reto?: EvidenciaRelacionReto | string): number {
    if (!reto || typeof reto === 'string') {
      return 0;
    }

    return Number(reto.puntos ?? 0);
  }

  private extraerCuestionarioId(cuestionario?: CuestionarioRelacionado | string): string {
    if (!cuestionario) {
      return '';
    }

    if (typeof cuestionario === 'string') {
      return cuestionario;
    }

    return cuestionario._id;
  }
}
