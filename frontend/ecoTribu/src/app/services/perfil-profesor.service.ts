import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { RespuestaApi } from './auth.service';

export interface RetoProfesor {
  _id: string;
  titulo: string;
  descripcion?: string;
  grado?: string;
  estado: 'borrador' | 'publicado' | 'cerrado';
  puntos?: number;
  fechaInicio?: string;
  fechaFin?: string;
  createdAt: string;
}

export interface PreguntaCuestionarioProfesor {
  enunciado: string;
  tipo: 'seleccion_unica' | 'seleccion_multiple' | 'verdadero_falso' | 'completacion' | 'respuesta_corta';
  opciones?: string[];
  respuestaCorrecta: number | number[] | string;
  puntaje: number;
}

export interface CuestionarioProfesor {
  _id: string;
  titulo: string;
  descripcion?: string;
  grado?: string;
  modalidad?: string;
  estado: 'borrador' | 'publicado' | 'cerrado';
  activo: boolean;
  preguntas?: PreguntaCuestionarioProfesor[];
}

interface EvidenciaProfesor {
  _id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface MetricaPerfilProfesor {
  titulo: string;
  valor: string;
}

export interface ActividadPerfilProfesor {
  nombre: string;
  porcentaje: number;
}

export interface ItemRecienteProfesor {
  titulo: string;
  estado: string;
}

export interface AlumnoEscuelaProfesor {
  _id: string;
  nombre: string;
  email: string;
  puntos: number;
  activo: boolean;
}

export interface CrearRetoPayload {
  titulo: string;
  descripcion: string;
  grado?: string;
  instrucciones?: string;
  categoria?: string;
  dificultad?: string;
  puntos: number;
  fechaInicio: string;
  fechaFin: string;
  escuela: string;
  creador: string;
  estado?: 'borrador' | 'publicado' | 'cerrado';
}

export interface PreguntaCuestionarioPayload {
  enunciado: string;
  tipo: 'seleccion_unica' | 'seleccion_multiple' | 'verdadero_falso' | 'completacion' | 'respuesta_corta';
  opciones?: string[];
  respuestaCorrecta: number | number[] | string;
  puntaje: number;
}

export interface CrearCuestionarioPayload {
  titulo: string;
  descripcion?: string;
  grado?: string;
  modalidad: 'mixto' | 'seleccion_unica' | 'seleccion_multiple' | 'verdadero_falso' | 'completacion' | 'respuesta_corta';
  escuela: string;
  creador: string;
  preguntas: PreguntaCuestionarioPayload[];
  estado?: 'borrador' | 'publicado' | 'cerrado';
}

export interface ActualizarRetoPayload {
  titulo?: string;
  descripcion?: string;
  grado?: string;
  puntos?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ActualizarCuestionarioPayload {
  titulo?: string;
  descripcion?: string;
  grado?: string;
  modalidad?: 'mixto' | 'seleccion_unica' | 'seleccion_multiple' | 'verdadero_falso' | 'completacion' | 'respuesta_corta';
  preguntas?: PreguntaCuestionarioPayload[];
}

export interface EvidenciaResumenProfesor {
  _id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  reto: string | { _id: string };
  alumno: string | { _id: string };
  descripcion?: string;
  archivoUrl?: string;
  puntoRecoleccionNombre?: string;
  puntoRecoleccionCiudad?: string;
  createdAt?: string;
  activo: boolean;
}

export interface RevisarEvidenciaPayload {
  revisor: string;
  comentarioRevision?: string;
}

export interface ResultadoCuestionarioResumenProfesor {
  _id: string;
  cuestionario: string | { _id: string };
  alumno: string | { _id: string };
  porcentaje: number;
  aprobado: boolean;
  activo: boolean;
}

export interface ReportePerfilProfesor {
  metricas: MetricaPerfilProfesor[];
  actividades: ActividadPerfilProfesor[];
  recientes: ItemRecienteProfesor[];
}

@Injectable({ providedIn: 'root' })
export class PerfilProfesorService {
  private readonly http = inject(HttpClient);
  private readonly retosApiUrl = 'http://localhost:3000/api/retos';
  private readonly cuestionariosApiUrl = 'http://localhost:3000/api/cuestionarios';
  private readonly evidenciasApiUrl = 'http://localhost:3000/api/evidencias';
  private readonly resultadosCuestionariosApiUrl = 'http://localhost:3000/api/resultados-cuestionarios';
  private readonly usuariosApiUrl = 'http://localhost:3000/api/usuarios';

  obtenerReporte(profesorId: string): Observable<ReportePerfilProfesor> {
    return forkJoin({
      retosPublicados: this.obtenerRetosPorEstado(profesorId, 'publicado'),
      retosBorrador: this.obtenerRetosPorEstado(profesorId, 'borrador'),
      retosCerrados: this.obtenerRetosPorEstado(profesorId, 'cerrado'),
      cuestionarios: this.obtenerCuestionariosPorCreador(profesorId),
      evidenciasPendientes: this.obtenerEvidenciasPorEstado('pendiente'),
      evidenciasAprobadasMias: this.obtenerEvidenciasPorEstado('aprobada', profesorId),
      evidenciasRechazadasMias: this.obtenerEvidenciasPorEstado('rechazada', profesorId),
    }).pipe(
      map((payload) => this.construirReporte(payload))
    );
  }

  obtenerRetosProfesor(profesorId: string): Observable<RetoProfesor[]> {
    const query = `${this.retosApiUrl}?creador=${profesorId}&incluirInactivos=true`;
    return this.http.get<RespuestaApi<RetoProfesor[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  obtenerCuestionariosProfesor(profesorId: string): Observable<CuestionarioProfesor[]> {
    const query = `${this.cuestionariosApiUrl}?creador=${profesorId}&incluirInactivos=true`;
    return this.http.get<RespuestaApi<CuestionarioProfesor[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  obtenerAlumnosEscuela(escuelaId: string): Observable<AlumnoEscuelaProfesor[]> {
    const query = `${this.usuariosApiUrl}?rol=alumno&escuela=${escuelaId}`;
    return this.http.get<RespuestaApi<AlumnoEscuelaProfesor[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  crearReto(payload: CrearRetoPayload): Observable<RespuestaApi<RetoProfesor>> {
    return this.http.post<RespuestaApi<RetoProfesor>>(this.retosApiUrl, payload);
  }

  publicarReto(retoId: string): Observable<RespuestaApi<RetoProfesor>> {
    return this.http.patch<RespuestaApi<RetoProfesor>>(`${this.retosApiUrl}/${retoId}/publicar`, {});
  }

  crearCuestionario(payload: CrearCuestionarioPayload): Observable<RespuestaApi<CuestionarioProfesor>> {
    return this.http.post<RespuestaApi<CuestionarioProfesor>>(this.cuestionariosApiUrl, payload);
  }

  publicarCuestionario(cuestionarioId: string): Observable<RespuestaApi<CuestionarioProfesor>> {
    return this.http.post<RespuestaApi<CuestionarioProfesor>>(`${this.cuestionariosApiUrl}/${cuestionarioId}/publicar`, {});
  }

  actualizarReto(retoId: string, payload: ActualizarRetoPayload): Observable<RespuestaApi<RetoProfesor>> {
    return this.http.put<RespuestaApi<RetoProfesor>>(`${this.retosApiUrl}/${retoId}`, payload);
  }

  eliminarReto(retoId: string): Observable<RespuestaApi<RetoProfesor>> {
    return this.http.delete<RespuestaApi<RetoProfesor>>(`${this.retosApiUrl}/${retoId}`);
  }

  actualizarCuestionario(
    cuestionarioId: string,
    payload: ActualizarCuestionarioPayload
  ): Observable<RespuestaApi<CuestionarioProfesor>> {
    return this.http.put<RespuestaApi<CuestionarioProfesor>>(`${this.cuestionariosApiUrl}/${cuestionarioId}`, payload);
  }

  eliminarCuestionario(cuestionarioId: string): Observable<RespuestaApi<CuestionarioProfesor>> {
    return this.http.delete<RespuestaApi<CuestionarioProfesor>>(`${this.cuestionariosApiUrl}/${cuestionarioId}`);
  }

  obtenerEvidenciasEscuela(): Observable<EvidenciaResumenProfesor[]> {
    const query = `${this.evidenciasApiUrl}?incluirInactivas=true`;
    return this.http.get<RespuestaApi<EvidenciaResumenProfesor[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  obtenerResultadosCuestionariosEscuela(escuelaId: string): Observable<ResultadoCuestionarioResumenProfesor[]> {
    const query = `${this.resultadosCuestionariosApiUrl}?escuela=${escuelaId}&incluirInactivos=true`;
    return this.http.get<RespuestaApi<ResultadoCuestionarioResumenProfesor[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  aprobarEvidencia(evidenciaId: string, payload: RevisarEvidenciaPayload): Observable<void> {
    return this.http.patch<RespuestaApi<unknown>>(`${this.evidenciasApiUrl}/${evidenciaId}/aprobar`, payload).pipe(map(() => void 0));
  }

  rechazarEvidencia(evidenciaId: string, payload: RevisarEvidenciaPayload): Observable<void> {
    return this.http.patch<RespuestaApi<unknown>>(`${this.evidenciasApiUrl}/${evidenciaId}/rechazar`, payload).pipe(map(() => void 0));
  }

  private obtenerRetosPorEstado(profesorId: string, estado: RetoProfesor['estado']): Observable<RetoProfesor[]> {
    const query = `${this.retosApiUrl}?creador=${profesorId}&estado=${estado}&incluirInactivos=true`;
    return this.http.get<RespuestaApi<RetoProfesor[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private obtenerCuestionariosPorCreador(profesorId: string): Observable<CuestionarioProfesor[]> {
    const query = `${this.cuestionariosApiUrl}?creador=${profesorId}&incluirInactivos=true`;
    return this.http.get<RespuestaApi<CuestionarioProfesor[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private obtenerEvidenciasPorEstado(
    estado: EvidenciaProfesor['estado'],
    revisadoPor?: string
  ): Observable<EvidenciaProfesor[]> {
    const base = `${this.evidenciasApiUrl}?estado=${estado}`;
    const query = revisadoPor ? `${base}&revisadoPor=${revisadoPor}` : base;

    return this.http.get<RespuestaApi<EvidenciaProfesor[]>>(query).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private construirReporte(payload: {
    retosPublicados: RetoProfesor[];
    retosBorrador: RetoProfesor[];
    retosCerrados: RetoProfesor[];
    cuestionarios: CuestionarioProfesor[];
    evidenciasPendientes: EvidenciaProfesor[];
    evidenciasAprobadasMias: EvidenciaProfesor[];
    evidenciasRechazadasMias: EvidenciaProfesor[];
  }): ReportePerfilProfesor {
    const totalRetos = payload.retosPublicados.length + payload.retosBorrador.length + payload.retosCerrados.length;
    const cuestionariosActivos = payload.cuestionarios.filter((item) => item.estado === 'publicado' && item.activo).length;
    const evidenciasRevisadas = payload.evidenciasAprobadasMias.length + payload.evidenciasRechazadasMias.length;

    return {
      metricas: [
        { titulo: 'Retos Creados', valor: String(totalRetos) },
        { titulo: 'Cuestionarios Activos', valor: String(cuestionariosActivos) },
        { titulo: 'Evidencias Pendientes', valor: String(payload.evidenciasPendientes.length) },
        { titulo: 'Evidencias Revisadas', valor: String(evidenciasRevisadas) },
      ],
      actividades: this.construirActividades(payload, totalRetos),
      recientes: this.construirRecientes(payload),
    };
  }

  private construirActividades(
    payload: {
      retosPublicados: RetoProfesor[];
      retosBorrador: RetoProfesor[];
      retosCerrados: RetoProfesor[];
      cuestionarios: CuestionarioProfesor[];
      evidenciasPendientes: EvidenciaProfesor[];
      evidenciasAprobadasMias: EvidenciaProfesor[];
      evidenciasRechazadasMias: EvidenciaProfesor[];
    },
    totalRetos: number
  ): ActividadPerfilProfesor[] {
    const porcentaje = (cantidad: number, total: number): number => {
      if (!total) {
        return 0;
      }
      return Math.max(0, Math.min(100, Math.round((cantidad / total) * 100)));
    };

    const totalRevisadas = payload.evidenciasAprobadasMias.length + payload.evidenciasRechazadasMias.length;
    const totalGestionEvidencias = totalRevisadas + payload.evidenciasPendientes.length;

    return [
      { nombre: 'Retos Publicados', porcentaje: porcentaje(payload.retosPublicados.length, totalRetos) },
      { nombre: 'Retos Borrador', porcentaje: porcentaje(payload.retosBorrador.length, totalRetos) },
      { nombre: 'Retos Cerrados', porcentaje: porcentaje(payload.retosCerrados.length, totalRetos) },
      { nombre: 'Cuestionarios Activos', porcentaje: porcentaje(payload.cuestionarios.filter((item) => item.estado === 'publicado' && item.activo).length, payload.cuestionarios.length) },
      { nombre: 'Revisión Evidencias', porcentaje: porcentaje(totalRevisadas, totalGestionEvidencias) },
    ];
  }

  private construirRecientes(payload: {
    retosPublicados: RetoProfesor[];
    retosBorrador: RetoProfesor[];
    retosCerrados: RetoProfesor[];
  }): ItemRecienteProfesor[] {
    const retos = [...payload.retosPublicados, ...payload.retosBorrador, ...payload.retosCerrados]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((item) => ({
        titulo: item.titulo,
        estado: this.normalizarEstado(item.estado),
      }));

    return retos;
  }

  private normalizarEstado(estado: string): string {
    switch (estado) {
      case 'publicado':
        return 'Publicado';
      case 'borrador':
        return 'Borrador';
      case 'cerrado':
        return 'Cerrado';
      default:
        return estado;
    }
  }
}
