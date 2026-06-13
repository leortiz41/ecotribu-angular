import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sesionStorageKey = 'ecotribu.sesion';
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

  guardarSesion(usuario: UsuarioSesion): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(this.sesionStorageKey, JSON.stringify(usuario));
  }

  obtenerSesionGuardada(): UsuarioSesion | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const raw = localStorage.getItem(this.sesionStorageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as UsuarioSesion;
    } catch {
      return null;
    }
  }

  cerrarSesionGuardada(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.sesionStorageKey);
  }
}
