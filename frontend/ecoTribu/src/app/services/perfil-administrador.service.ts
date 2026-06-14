import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { RespuestaApi } from './auth.service';

export interface EscuelaAdmin {
  _id: string;
  nombre: string;
  codigo?: string;
  activa: boolean;
}

export interface UsuarioAdmin {
  _id: string;
  nombre: string;
  email: string;
  rol: 'alumno' | 'profesor' | 'administrador';
  puntos?: number;
  grado?: string;
  activo: boolean;
  escuela?: { _id: string; nombre: string; codigo?: string };
}

export interface RetoAdmin {
  _id: string;
  titulo: string;
  estado: 'borrador' | 'publicado' | 'cerrado';
  escuela: { _id: string; nombre: string };
}

export interface CuestionarioAdmin {
  _id: string;
  titulo: string;
  estado: 'borrador' | 'publicado' | 'cerrado';
  escuela: { _id: string; nombre: string };
}

export interface MetricaAdministrador {
  titulo: string;
  valor: string;
}

export interface EvidenciaAdmin {
  _id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  descripcion?: string;
  archivoUrl?: string;
  createdAt?: string;
  reto?: { _id: string; titulo: string };
  alumno?: { _id: string; nombre: string; email?: string };
  revisadoPor?: { _id: string; nombre: string; rol?: string };
}

export interface CrearEscuelaPayload {
  nombre: string;
  codigo?: string;
  activa: boolean;
}

export interface CrearUsuarioAdminPayload {
  nombre: string;
  email: string;
  password: string;
  rol: 'alumno' | 'profesor' | 'administrador';
  escuela: string;
  grado?: string;
}

export interface ActualizarEscuelaPayload {
  nombre?: string;
  codigo?: string;
  activa?: boolean;
}

export interface ActualizarUsuarioAdminPayload {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: 'alumno' | 'profesor' | 'administrador';
  escuela?: string;
  grado?: string;
  activo?: boolean;
}

export interface ActualizarRetoAdminPayload {
  titulo?: string;
  descripcion?: string;
  estado?: 'borrador' | 'publicado' | 'cerrado';
  activo?: boolean;
}

export interface ActualizarCuestionarioAdminPayload {
  titulo?: string;
  descripcion?: string;
  estado?: 'borrador' | 'publicado' | 'cerrado';
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PerfilAdministradorService {
  private readonly http = inject(HttpClient);
  private readonly escuelasApiUrl = 'http://localhost:3000/api/escuelas';
  private readonly usuariosApiUrl = 'http://localhost:3000/api/usuarios';
  private readonly retosApiUrl = 'http://localhost:3000/api/retos';
  private readonly cuestionariosApiUrl = 'http://localhost:3000/api/cuestionarios';
  private readonly evidenciasApiUrl = 'http://localhost:3000/api/evidencias';

  obtenerReporte(): Observable<{
    metricas: MetricaAdministrador[];
    escuelas: EscuelaAdmin[];
    usuarios: UsuarioAdmin[];
    retos: RetoAdmin[];
    cuestionarios: CuestionarioAdmin[];
    evidencias: EvidenciaAdmin[];
  }> {
    return forkJoin({
      escuelas: this.obtenerEscuelas(),
      usuarios: this.obtenerUsuarios(),
      retos: this.obtenerRetos(),
      cuestionarios: this.obtenerCuestionarios(),
      evidencias: this.obtenerEvidencias(),
    }).pipe(
      map((payload) => this.construirReporte(payload)),
      catchError(() =>
        of({
          metricas: [],
          escuelas: [],
          usuarios: [],
          retos: [],
          cuestionarios: [],
          evidencias: [],
        })
      )
    );
  }

  private obtenerEscuelas(): Observable<EscuelaAdmin[]> {
    return this.http.get<RespuestaApi<EscuelaAdmin[]>>(this.escuelasApiUrl).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private obtenerUsuarios(): Observable<UsuarioAdmin[]> {
    return this.http.get<RespuestaApi<UsuarioAdmin[]>>(this.usuariosApiUrl).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private obtenerRetos(): Observable<RetoAdmin[]> {
    return this.http.get<RespuestaApi<RetoAdmin[]>>(`${this.retosApiUrl}?estado=publicado`).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private obtenerCuestionarios(): Observable<CuestionarioAdmin[]> {
    return this.http.get<RespuestaApi<CuestionarioAdmin[]>>(`${this.cuestionariosApiUrl}?estado=publicado`).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private obtenerEvidencias(): Observable<EvidenciaAdmin[]> {
    return this.http.get<RespuestaApi<EvidenciaAdmin[]>>(`${this.evidenciasApiUrl}?incluirInactivas=true`).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([]))
    );
  }

  private construirReporte(payload: {
    escuelas: EscuelaAdmin[];
    usuarios: UsuarioAdmin[];
    retos: RetoAdmin[];
    cuestionarios: CuestionarioAdmin[];
    evidencias: EvidenciaAdmin[];
  }): {
    metricas: MetricaAdministrador[];
    escuelas: EscuelaAdmin[];
    usuarios: UsuarioAdmin[];
    retos: RetoAdmin[];
    cuestionarios: CuestionarioAdmin[];
    evidencias: EvidenciaAdmin[];
  } {
    const usuariosActivos = payload.usuarios.filter((u) => u.activo).length;
    const profesores = payload.usuarios.filter((u) => u.rol === 'profesor' && u.activo).length;
    const alumnos = payload.usuarios.filter((u) => u.rol === 'alumno' && u.activo).length;

    return {
      metricas: [
        { titulo: 'Escuelas', valor: String(payload.escuelas.length) },
        { titulo: 'Usuarios Totales', valor: String(usuariosActivos) },
        { titulo: 'Profesores', valor: String(profesores) },
        { titulo: 'Alumnos', valor: String(alumnos) },
        { titulo: 'Retos Publicados', valor: String(payload.retos.filter((r) => r.estado === 'publicado').length) },
        { titulo: 'Cuestionarios Publicados', valor: String(payload.cuestionarios.filter((c) => c.estado === 'publicado').length) },
        { titulo: 'Evidencias', valor: String(payload.evidencias.length) },
      ],
      escuelas: payload.escuelas,
      usuarios: payload.usuarios,
      retos: payload.retos,
      cuestionarios: payload.cuestionarios,
      evidencias: payload.evidencias,
    };
  }

  crearEscuela(payload: CrearEscuelaPayload): Observable<RespuestaApi<EscuelaAdmin>> {
    return this.http.post<RespuestaApi<EscuelaAdmin>>(this.escuelasApiUrl, payload);
  }

  crearUsuario(payload: CrearUsuarioAdminPayload): Observable<RespuestaApi<UsuarioAdmin>> {
    return this.http.post<RespuestaApi<UsuarioAdmin>>(this.usuariosApiUrl, payload);
  }

  actualizarEscuela(id: string, payload: ActualizarEscuelaPayload): Observable<RespuestaApi<EscuelaAdmin>> {
    return this.http.put<RespuestaApi<EscuelaAdmin>>(`${this.escuelasApiUrl}/${id}`, payload);
  }

  eliminarEscuela(id: string): Observable<RespuestaApi<EscuelaAdmin>> {
    return this.http.delete<RespuestaApi<EscuelaAdmin>>(`${this.escuelasApiUrl}/${id}`);
  }

  actualizarUsuario(id: string, payload: ActualizarUsuarioAdminPayload): Observable<RespuestaApi<UsuarioAdmin>> {
    return this.http.put<RespuestaApi<UsuarioAdmin>>(`${this.usuariosApiUrl}/${id}`, payload);
  }

  eliminarUsuario(id: string): Observable<RespuestaApi<UsuarioAdmin>> {
    return this.http.delete<RespuestaApi<UsuarioAdmin>>(`${this.usuariosApiUrl}/${id}`);
  }

  actualizarReto(id: string, payload: ActualizarRetoAdminPayload): Observable<RespuestaApi<RetoAdmin>> {
    return this.http.put<RespuestaApi<RetoAdmin>>(`${this.retosApiUrl}/${id}`, payload);
  }

  eliminarReto(id: string): Observable<RespuestaApi<RetoAdmin>> {
    return this.http.delete<RespuestaApi<RetoAdmin>>(`${this.retosApiUrl}/${id}`);
  }

  actualizarCuestionario(id: string, payload: ActualizarCuestionarioAdminPayload): Observable<RespuestaApi<CuestionarioAdmin>> {
    return this.http.put<RespuestaApi<CuestionarioAdmin>>(`${this.cuestionariosApiUrl}/${id}`, payload);
  }

  eliminarCuestionario(id: string): Observable<RespuestaApi<CuestionarioAdmin>> {
    return this.http.delete<RespuestaApi<CuestionarioAdmin>>(`${this.cuestionariosApiUrl}/${id}`);
  }
}
