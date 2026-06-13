import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { RespuestaApi } from './auth.service';

interface EvidenciaRelacionReto {
  _id: string;
  titulo: string;
}

interface EvidenciaAlumno {
  _id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  reto?: EvidenciaRelacionReto | string;
  createdAt: string;
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
}

@Injectable({ providedIn: 'root' })
export class PerfilAlumnoService {
  private readonly http = inject(HttpClient);
  private readonly evidenciasApiUrl = 'http://localhost:3000/api/evidencias';
  private readonly cuestionariosApiUrl = 'http://localhost:3000/api/cuestionarios';
  private readonly resultadosApiUrl = 'http://localhost:3000/api/resultados-cuestionarios';
  private readonly retosApiUrl = 'http://localhost:3000/api/retos';

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
    grado?: string
  ): Observable<CuestionarioDisponibleAlumno[]> {
    return this.obtenerCuestionariosPublicadosEscuela(escuelaId, grado).pipe(
      map((cuestionarios) =>
        cuestionarios.map((cuestionario) => ({
          _id: cuestionario._id,
          titulo: cuestionario.titulo,
          descripcion: cuestionario.descripcion,
          grado: cuestionario.grado,
          modalidad: cuestionario.modalidad,
          creadorNombre: cuestionario.creador?.nombre ?? 'Docente',
          preguntasCantidad: Array.isArray(cuestionario.preguntas) ? cuestionario.preguntas.length : 0,
        }))
      ),
      catchError(() => of([]))
    );
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
}
