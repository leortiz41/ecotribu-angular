import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface CredencialesLogin {
  email: string;
  password: string;
}

export interface UsuarioSesion {
  _id: string;
  nombre: string;
  email: string;
  rol: 'alumno' | 'profesor' | 'administrador';
  escuela: { _id: string; nombre: string; codigo: string };
  puntos: number;
  activo: boolean;
}

export interface RespuestaLogin {
  success: boolean;
  message: string;
  data?: UsuarioSesion;
}

export interface DatosRegistroUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: 'alumno' | 'profesor' | 'administrador';
  escuela: string;
}

export interface EscuelaCatalogo {
  _id: string;
  nombre: string;
  codigo?: string;
}

export interface RespuestaApi<T> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authApiUrl = 'http://localhost:3000/api/auth';
  private readonly usuariosApiUrl = 'http://localhost:3000/api/usuarios';
  private readonly escuelasApiUrl = 'http://localhost:3000/api/escuelas';

  iniciarSesion(credenciales: CredencialesLogin): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.authApiUrl}/login`, credenciales);
  }

  registrarUsuario(payload: DatosRegistroUsuario): Observable<RespuestaApi<UsuarioSesion>> {
    return this.http.post<RespuestaApi<UsuarioSesion>>(this.usuariosApiUrl, payload);
  }

  obtenerEscuelas(): Observable<RespuestaApi<EscuelaCatalogo[]>> {
    return this.http.get<RespuestaApi<EscuelaCatalogo[]>>(this.escuelasApiUrl);
  }
}
