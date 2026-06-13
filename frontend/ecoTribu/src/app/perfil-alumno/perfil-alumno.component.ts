import { NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import { ActividadPerfilAlumno, MetricaPerfilAlumno, PerfilAlumnoService } from '../services/perfil-alumno.service';

@Component({
  selector: 'app-perfil-alumno',
  imports: [NgFor, NgIf, NgOptimizedImage],
  templateUrl: './perfil-alumno.component.html',
  styleUrls: ['./perfil-alumno.component.css'],
})
export class PerfilAlumnoComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly perfilAlumnoService = inject(PerfilAlumnoService);
  private readonly platformId = inject(PLATFORM_ID);

  sesion: UsuarioSesion | null = null;
  metricas: ReadonlyArray<MetricaPerfilAlumno> = [];
  actividades: ReadonlyArray<ActividadPerfilAlumno> = [];
  cargando = true;
  mensajeError: string | null = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarReporte();
    } else {
      this.cargando = false;
      this.metricas = this.metricasPorDefecto();
      this.actividades = this.actividadesPorDefecto();
    }
  }

  cargarReporte(): void {
    this.cargando = true;
    this.mensajeError = null;

    const sesion = this.authService.obtenerSesionGuardada();
    this.sesion = sesion;

    if (!sesion || sesion.rol !== 'alumno') {
      this.cargando = false;
      this.mensajeError = 'No se encontró una sesión de alumno activa. Inicia sesión nuevamente.';
      this.metricas = this.metricasPorDefecto();
      this.actividades = this.actividadesPorDefecto();
      return;
    }

    this.perfilAlumnoService.obtenerReporte(sesion._id).subscribe({
      next: (reporte) => {
        this.metricas = reporte.metricas;
        this.actividades = reporte.actividades;
        this.cargando = false;
      },
      error: () => {
        this.metricas = this.metricasPorDefecto();
        this.actividades = this.actividadesPorDefecto();
        this.mensajeError = 'No fue posible cargar el reporte real del alumno.';
        this.cargando = false;
      },
    });
  }

  private metricasPorDefecto(): ReadonlyArray<MetricaPerfilAlumno> {
    return [
      { titulo: 'Participación', valor: '0%' },
      { titulo: 'Retos completados', valor: '0' },
      { titulo: 'Promedio Quizzes', valor: '0%' },
      { titulo: 'Evidencias Aprobadas', valor: '0' },
    ];
  }

  private actividadesPorDefecto(): ReadonlyArray<ActividadPerfilAlumno> {
    return [
      { nombre: 'Actividad 1', porcentaje: 0 },
      { nombre: 'Actividad 2', porcentaje: 0 },
      { nombre: 'Actividad 3', porcentaje: 0 },
      { nombre: 'Actividad 4', porcentaje: 0 },
      { nombre: 'Actividad 5', porcentaje: 0 },
    ];
  }
}
