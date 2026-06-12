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
  reto?: EvidenciaRelacionReto;
  createdAt: string;
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

@Injectable({ providedIn: 'root' })
export class PerfilAlumnoService {
  private readonly http = inject(HttpClient);
  private readonly evidenciasApiUrl = 'http://localhost:3000/api/evidencias';
  private readonly resultadosApiUrl = 'http://localhost:3000/api/resultados-cuestionarios';

  obtenerReporte(alumnoId: string): Observable<ReportePerfilAlumno> {
    return forkJoin({
      evidencias: this.obtenerEvidenciasAlumno(alumnoId),
      resultados: this.obtenerResultadosAlumno(alumnoId),
    }).pipe(
      map(({ evidencias, resultados }) => this.construirReporte(evidencias, resultados))
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
      nombre: item.reto?.titulo || `Actividad ${index + 1}`,
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
}
