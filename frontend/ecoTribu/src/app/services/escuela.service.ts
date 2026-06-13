import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RespuestaApi } from './auth.service';

export interface EscuelaDetalle {
  _id: string;
  nombre: string;
  codigo?: string;
  direccion?: string;
  municipio?: string;
  departamento?: string;
  activa: boolean;
}

export interface EscuelaPayload {
  nombre: string;
  codigo?: string;
  direccion?: string;
  municipio?: string;
  departamento?: string;
  activa: boolean;
}

@Injectable({ providedIn: 'root' })
export class EscuelaService {
  private readonly http = inject(HttpClient);
  private readonly escuelasApiUrl = 'http://localhost:3000/api/escuelas';

  obtenerEscuelaPorId(id: string): Observable<RespuestaApi<EscuelaDetalle>> {
    return this.http.get<RespuestaApi<EscuelaDetalle>>(`${this.escuelasApiUrl}/${id}`);
  }

  crearEscuela(payload: EscuelaPayload): Observable<RespuestaApi<EscuelaDetalle>> {
    return this.http.post<RespuestaApi<EscuelaDetalle>>(this.escuelasApiUrl, payload);
  }

  actualizarEscuela(id: string, payload: EscuelaPayload): Observable<RespuestaApi<EscuelaDetalle>> {
    return this.http.put<RespuestaApi<EscuelaDetalle>>(`${this.escuelasApiUrl}/${id}`, payload);
  }
}
