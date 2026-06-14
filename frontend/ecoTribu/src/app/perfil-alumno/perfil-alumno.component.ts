import { NgClass, NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import { CuestionarioQuizComponent, QuizCompletadoPayload } from '../cuestionario-quiz/cuestionario-quiz.component';
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
  imports: [NgFor, NgIf, NgClass, NgOptimizedImage, CuestionarioQuizComponent],
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
  cuestionarioSeleccionado: CuestionarioDisponibleAlumno | null = null;
  guardandoQuiz = false;
  filtroRetoActual: FiltroRetoAlumno = 'todos';
  cargando = true;
  mensajeError: string | null = null;
  mensajeQuiz: string | null = null;
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
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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
        this.mensajeQuiz = null;
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

  irASeccionCuestionarios(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const seccion = document.getElementById('seccion-cuestionarios-alumno');
    seccion?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private renderizarGraficoActividades(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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

  instruccionReto(estado: RetoDisponibleAlumno['estadoAlumno']): string {
    switch (estado) {
      case 'sin_entregar':
        return 'Lee las instrucciones del reto y prepara tu evidencia para enviarla esta semana.';
      case 'pendiente':
        return 'Tu evidencia ya fue enviada. Espera la revisión de tu profesor.';
      case 'aprobada':
        return 'Excelente trabajo. Revisa tus puntos y continúa con el siguiente reto.';
      case 'rechazada':
        return 'Corrige tu evidencia según la retroalimentación y vuelve a enviarla.';
      default:
        return 'Revisa el estado del reto y sigue la indicación de tu profesor.';
    }
  }

  instruccionCuestionario(cuestionario: CuestionarioDisponibleAlumno): string {
    const modalidad = (cuestionario.modalidad || 'mixto').toLowerCase();

    if (modalidad === 'mixto') {
      return 'Abre el cuestionario y responde todas las preguntas. Tendrás distintos tipos de reactivos.';
    }

    return `Abre el cuestionario y completa la modalidad ${modalidad.replaceAll('_', ' ')} con atención.`;
  }

  abrirQuiz(cuestionario: CuestionarioDisponibleAlumno): void {
    this.mensajeError = null;
    this.mensajeQuiz = null;

    if (!cuestionario.preguntas || cuestionario.preguntas.length === 0) {
      this.mensajeError = 'Este cuestionario aun no tiene preguntas configuradas por el profesor.';
      return;
    }

    this.cuestionarioSeleccionado = cuestionario;
  }

  cerrarQuiz(): void {
    if (this.guardandoQuiz) {
      return;
    }

    this.cuestionarioSeleccionado = null;
  }

  completarQuiz(evento: QuizCompletadoPayload): void {
    if (!this.sesion || !this.cuestionarioSeleccionado || this.guardandoQuiz) {
      return;
    }

    this.guardandoQuiz = true;
    this.mensajeQuiz = null;

    this.perfilAlumnoService
      .registrarResultadoCuestionario(
        this.sesion._id,
        this.sesion.escuela._id,
        this.cuestionarioSeleccionado,
        evento.respuestas
      )
      .subscribe({
        next: () => {
          this.guardandoQuiz = false;
          this.cuestionarioSeleccionado = null;
          this.mensajeQuiz = 'Resultado guardado correctamente. Se actualizó tu progreso.';
          this.cargarReporte();
        },
        error: () => {
          this.guardandoQuiz = false;
          this.mensajeError = 'No fue posible guardar el resultado del cuestionario.';
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
