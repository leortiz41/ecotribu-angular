import { NgClass, NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import {
  CuestionarioDisponibleAlumno,
  ActividadPerfilAlumno,
  MetricaPerfilAlumno,
  PerfilAlumnoService,
  RetoDisponibleAlumno,
} from '../services/perfil-alumno.service';
import { Chart } from 'chart.js';
import { crearGraficoBarras } from '../utils/dashboard-chart';

type FiltroRetoAlumno = 'todos' | 'sin_entregar' | 'pendiente' | 'aprobada' | 'rechazada';

@Component({
  selector: 'app-perfil-alumno',
  imports: [NgFor, NgIf, NgClass, NgOptimizedImage],
  templateUrl: './perfil-alumno.component.html',
  styleUrls: ['./perfil-alumno.component.css'],
})
export class PerfilAlumnoComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly perfilAlumnoService = inject(PerfilAlumnoService);
  private readonly platformId = inject(PLATFORM_ID);

  sesion: UsuarioSesion | null = null;
  metricas: ReadonlyArray<MetricaPerfilAlumno> = [];
  actividades: ReadonlyArray<ActividadPerfilAlumno> = [];
  retosDisponibles: ReadonlyArray<RetoDisponibleAlumno> = [];
  cuestionariosDisponibles: ReadonlyArray<CuestionarioDisponibleAlumno> = [];
  filtroRetoActual: FiltroRetoAlumno = 'todos';
  cargando = true;
  mensajeError: string | null = null;
  @ViewChild('actividadChart') private actividadChartCanvas?: ElementRef<HTMLCanvasElement>;
  private actividadChart: Chart | null = null;

  get retosFiltrados(): ReadonlyArray<RetoDisponibleAlumno> {
    if (this.filtroRetoActual === 'todos') {
      return this.retosDisponibles;
    }

    return this.retosDisponibles.filter((item) => item.estadoAlumno === this.filtroRetoActual);
  }

  get claseActualTexto(): string {
    return this.sesion?.grado || 'No configurada';
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarReporte();
    } else {
      this.cargando = false;
      this.metricas = this.metricasPorDefecto();
      this.actividades = this.actividadesPorDefecto();
    }
  }

  ngAfterViewInit(): void {
    this.renderizarGraficoActividades();
  }

  ngOnDestroy(): void {
    this.actividadChart?.destroy();
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
      this.retosDisponibles = [];
      return;
    }

    forkJoin({
      reporte: this.perfilAlumnoService.obtenerReporte(sesion._id),
      retosDisponibles: this.perfilAlumnoService.obtenerRetosDisponibles(
        sesion._id,
        sesion.escuela._id,
        sesion.grado
      ),
      cuestionariosDisponibles: this.perfilAlumnoService.obtenerCuestionariosDisponibles(sesion.escuela._id, sesion.grado),
    }).subscribe({
      next: ({ reporte, retosDisponibles, cuestionariosDisponibles }) => {
        this.metricas = reporte.metricas;
        this.actividades = reporte.actividades;
        this.retosDisponibles = retosDisponibles;
        this.cuestionariosDisponibles = cuestionariosDisponibles;
        this.renderizarGraficoActividades();
        this.cargando = false;
      },
      error: () => {
        this.metricas = this.metricasPorDefecto();
        this.actividades = this.actividadesPorDefecto();
        this.retosDisponibles = [];
        this.cuestionariosDisponibles = [];
        this.mensajeError = 'No fue posible cargar el reporte real del alumno.';
        this.cargando = false;
      },
    });
  }

  cambiarFiltroRetos(valor: string): void {
    const filtrosValidos: ReadonlyArray<FiltroRetoAlumno> = ['todos', 'sin_entregar', 'pendiente', 'aprobada', 'rechazada'];

    if (!filtrosValidos.includes(valor as FiltroRetoAlumno)) {
      this.filtroRetoActual = 'todos';
      return;
    }

    this.filtroRetoActual = valor as FiltroRetoAlumno;
  }

  private renderizarGraficoActividades(): void {
    if (!this.actividadChartCanvas?.nativeElement || this.actividades.length === 0) {
      return;
    }

    const etiquetas = this.actividades.map((actividad) => actividad.nombre);
    const valores = this.actividades.map((actividad) => actividad.porcentaje);

    this.actividadChart = crearGraficoBarras(
      this.actividadChartCanvas.nativeElement,
      this.actividadChart,
      etiquetas,
      valores,
      'Progreso por actividad',
      '#047857'
    );
  }

  etiquetaEstadoReto(estado: RetoDisponibleAlumno['estadoAlumno']): string {
    switch (estado) {
      case 'sin_entregar':
        return 'Sin entregar';
      case 'pendiente':
        return 'Pendiente';
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      default:
        return estado;
    }
  }

  claseEstadoReto(estado: RetoDisponibleAlumno['estadoAlumno']): string {
    switch (estado) {
      case 'sin_entregar':
        return 'status-neutral';
      case 'pendiente':
        return 'status-pending';
      case 'aprobada':
        return 'status-approved';
      case 'rechazada':
        return 'status-rejected';
      default:
        return 'status-neutral';
    }
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
