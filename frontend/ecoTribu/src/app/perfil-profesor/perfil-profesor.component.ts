import { NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import {
  AlumnoEscuelaProfesor,
  ActividadPerfilProfesor,
  ActualizarCuestionarioPayload,
  ActualizarRetoPayload,
  CrearCuestionarioPayload,
  CrearRetoPayload,
  CuestionarioProfesor,
  EvidenciaResumenProfesor,
  ItemRecienteProfesor,
  MetricaPerfilProfesor,
  PerfilProfesorService,
  ResultadoCuestionarioResumenProfesor,
  RetoProfesor,
} from '../services/perfil-profesor.service';
import { Chart } from 'chart.js';
import { crearGraficoLinea } from '../utils/dashboard-chart';

type VistaProfesor = 'resumen' | 'retos' | 'cuestionarios' | 'alumnos';

@Component({
  selector: 'app-perfil-profesor',
  imports: [NgIf, NgFor, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './perfil-profesor.component.html',
  styleUrls: ['./perfil-profesor.component.css'],
})
export class PerfilProfesorComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly perfilProfesorService = inject(PerfilProfesorService);
  private readonly platformId = inject(PLATFORM_ID);

  vistaActual: VistaProfesor = 'resumen';
  sesion: UsuarioSesion | null = null;
  metricas: ReadonlyArray<MetricaPerfilProfesor> = [];
  actividades: ReadonlyArray<ActividadPerfilProfesor> = [];
  recientes: ReadonlyArray<ItemRecienteProfesor> = [];
  retosProfesor: ReadonlyArray<RetoProfesor> = [];
  cuestionariosProfesor: ReadonlyArray<CuestionarioProfesor> = [];
  alumnosEscuela: ReadonlyArray<AlumnoEscuelaProfesor> = [];
  retoEnEdicionId: string | null = null;
  cuestionarioEnEdicionId: string | null = null;
  resultadosRetosTomados = 0;
  resultadosRetosAprobados = 0;
  resultadosCuestionariosIntentos = 0;
  resultadosCuestionariosPromedio = 0;
  resultadosAlumnosParticipantes = 0;
  cargando = true;
  mensajeError: string | null = null;
  mensajeAccion: string | null = null;
  @ViewChild('profesorChart') private profesorChartCanvas?: ElementRef<HTMLCanvasElement>;
  private profesorChart: Chart | null = null;

  readonly retoForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    grado: [''],
    puntos: [50, [Validators.required, Validators.min(1)]],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
  });

  readonly cuestionarioForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    grado: ['', Validators.required],
    pregunta: ['', [Validators.required, Validators.minLength(5)]],
    opcionA: ['', [Validators.required, Validators.minLength(1)]],
    opcionB: ['', [Validators.required, Validators.minLength(1)]],
    opcionC: ['', [Validators.required, Validators.minLength(1)]],
    opcionD: ['', [Validators.required, Validators.minLength(1)]],
    respuestaCorrecta: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
    puntaje: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.inicializarPerfil();
    } else {
      this.cargando = false;
      this.metricas = this.metricasPorDefecto();
      this.actividades = this.actividadesPorDefecto();
      this.recientes = [];
    }
  }

  ngAfterViewInit(): void {
    this.renderizarGraficoProfesor();
  }

  ngOnDestroy(): void {
    this.profesorChart?.destroy();
  }

  cambiarVista(vista: VistaProfesor): void {
    this.vistaActual = vista;
    this.mensajeAccion = null;
  }

  irAResumenResultados(): void {
    this.vistaActual = 'resumen';
    this.mensajeAccion = 'Mostrando resumen de resultados de alumnos.';
  }

  crearReto(): void {
    if (!this.sesion || this.retoForm.invalid) {
      this.retoForm.markAllAsTouched();
      return;
    }

    const value = this.retoForm.getRawValue();
    const payload: CrearRetoPayload = {
      titulo: value.titulo.trim(),
      descripcion: value.descripcion.trim(),
      grado: value.grado.trim() || undefined,
      puntos: Number(value.puntos),
      fechaInicio: value.fechaInicio,
      fechaFin: value.fechaFin,
      escuela: this.sesion.escuela._id,
      creador: this.sesion._id,
      categoria: 'otro',
      dificultad: 'media',
      estado: 'publicado',
    };

    this.cargando = true;
    this.mensajeAccion = null;

    if (this.retoEnEdicionId) {
      this.perfilProfesorService.actualizarReto(this.retoEnEdicionId, payload).subscribe({
        next: () => {
          this.mensajeAccion = 'Reto actualizado correctamente.';
          this.retoEnEdicionId = null;
          this.retoForm.reset({
            titulo: '',
            descripcion: '',
            grado: '',
            puntos: 50,
            fechaInicio: '',
            fechaFin: '',
          });
          this.refrescarDatosProfesor();
        },
        error: () => {
          this.cargando = false;
          this.mensajeError = 'No fue posible actualizar el reto.';
        },
      });

      return;
    }

    this.perfilProfesorService.crearReto(payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Reto creado correctamente.';
        this.retoForm.reset({
          titulo: '',
          descripcion: '',
          grado: '',
          puntos: 50,
          fechaInicio: '',
          fechaFin: '',
        });
        this.refrescarDatosProfesor();
      },
      error: () => {
        this.cargando = false;
        this.mensajeAccion = 'No fue posible crear el reto.';
      },
    });
  }

  crearCuestionario(): void {
    if (!this.sesion || this.cuestionarioForm.invalid) {
      this.cuestionarioForm.markAllAsTouched();
      return;
    }

    const value = this.cuestionarioForm.getRawValue();
    const preguntas = [
      {
        enunciado: value.pregunta.trim(),
        tipo: 'seleccion_unica' as const,
        opciones: [value.opcionA.trim(), value.opcionB.trim(), value.opcionC.trim(), value.opcionD.trim()],
        respuestaCorrecta: Number(value.respuestaCorrecta),
        puntaje: Number(value.puntaje),
      },
    ];

    const payload: CrearCuestionarioPayload = {
      titulo: value.titulo.trim(),
      descripcion: value.descripcion.trim(),
      grado: value.grado.trim(),
      modalidad: 'mixto',
      escuela: this.sesion.escuela._id,
      creador: this.sesion._id,
      preguntas,
    };

    this.cargando = true;
    this.mensajeAccion = null;

    if (this.cuestionarioEnEdicionId) {
      const actualizar: ActualizarCuestionarioPayload = {
        titulo: payload.titulo,
        descripcion: payload.descripcion,
        grado: payload.grado,
        modalidad: payload.modalidad,
        preguntas,
      };

      this.perfilProfesorService.actualizarCuestionario(this.cuestionarioEnEdicionId, actualizar).subscribe({
        next: () => {
          this.mensajeAccion = 'Cuestionario actualizado correctamente.';
          this.cuestionarioEnEdicionId = null;
          this.cuestionarioForm.reset({
            titulo: '',
            descripcion: '',
            grado: '',
            pregunta: '',
            opcionA: '',
            opcionB: '',
            opcionC: '',
            opcionD: '',
            respuestaCorrecta: 0,
            puntaje: 1,
          });
          this.refrescarDatosProfesor();
        },
        error: () => {
          this.cargando = false;
          this.mensajeError = 'No fue posible actualizar el cuestionario.';
        },
      });

      return;
    }

    this.perfilProfesorService.crearCuestionario(payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Cuestionario creado correctamente.';
        this.cuestionarioForm.reset({
          titulo: '',
          descripcion: '',
          grado: '',
          pregunta: '',
          opcionA: '',
          opcionB: '',
          opcionC: '',
          opcionD: '',
          respuestaCorrecta: 0,
          puntaje: 1,
        });
        this.refrescarDatosProfesor();
      },
      error: () => {
        this.cargando = false;
        this.mensajeAccion = 'No fue posible crear el cuestionario.';
      },
    });
  }

  editarReto(reto: RetoProfesor): void {
    this.vistaActual = 'retos';
    this.retoEnEdicionId = reto._id;
    this.mensajeError = null;
    this.mensajeAccion = `Editando reto: ${reto.titulo}`;

    this.retoForm.patchValue({
      titulo: reto.titulo ?? '',
      descripcion: reto.descripcion ?? '',
      grado: reto.grado ?? '',
      puntos: reto.puntos ?? 50,
      fechaInicio: this.convertirFechaParaFormulario(reto.fechaInicio),
      fechaFin: this.convertirFechaParaFormulario(reto.fechaFin),
    });
  }

  cancelarEdicionReto(): void {
    this.retoEnEdicionId = null;
    this.retoForm.reset({
      titulo: '',
      descripcion: '',
      grado: '',
      puntos: 50,
      fechaInicio: '',
      fechaFin: '',
    });
    this.mensajeAccion = 'Edición de reto cancelada.';
  }

  eliminarReto(reto: RetoProfesor): void {
    const confirmar = window.confirm(`¿Deseas eliminar (desactivar) el reto "${reto.titulo}"?`);
    if (!confirmar) {
      return;
    }

    this.cargando = true;
    this.perfilProfesorService.eliminarReto(reto._id).subscribe({
      next: () => {
        this.mensajeAccion = 'Reto eliminado correctamente.';
        this.refrescarDatosProfesor();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible eliminar el reto.';
      },
    });
  }

  publicarReto(reto: RetoProfesor): void {
    this.cargando = true;
    this.perfilProfesorService.publicarReto(reto._id).subscribe({
      next: () => {
        this.mensajeAccion = 'Reto publicado correctamente.';
        this.refrescarDatosProfesor();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible publicar el reto.';
      },
    });
  }

  editarCuestionario(cuestionario: CuestionarioProfesor): void {
    const primeraPregunta = cuestionario.preguntas?.[0];

    this.vistaActual = 'cuestionarios';
    this.cuestionarioEnEdicionId = cuestionario._id;
    this.mensajeError = null;
    this.mensajeAccion = `Editando cuestionario: ${cuestionario.titulo}`;

    this.cuestionarioForm.patchValue({
      titulo: cuestionario.titulo ?? '',
      descripcion: cuestionario.descripcion ?? '',
      grado: cuestionario.grado ?? '',
      pregunta: primeraPregunta?.enunciado ?? '',
      opcionA: primeraPregunta?.opciones?.[0] ?? '',
      opcionB: primeraPregunta?.opciones?.[1] ?? '',
      opcionC: primeraPregunta?.opciones?.[2] ?? '',
      opcionD: primeraPregunta?.opciones?.[3] ?? '',
      respuestaCorrecta: this.obtenerIndiceRespuestaCorrecta(primeraPregunta),
      puntaje: primeraPregunta?.puntaje ?? 1,
    });
  }

  cancelarEdicionCuestionario(): void {
    this.cuestionarioEnEdicionId = null;
    this.cuestionarioForm.reset({
      titulo: '',
      descripcion: '',
      grado: '',
      pregunta: '',
      opcionA: '',
      opcionB: '',
      opcionC: '',
      opcionD: '',
      respuestaCorrecta: 0,
      puntaje: 1,
    });
    this.mensajeAccion = 'Edición de cuestionario cancelada.';
  }

  eliminarCuestionario(cuestionario: CuestionarioProfesor): void {
    const confirmar = window.confirm(`¿Deseas eliminar (desactivar) el cuestionario "${cuestionario.titulo}"?`);
    if (!confirmar) {
      return;
    }

    this.cargando = true;
    this.perfilProfesorService.eliminarCuestionario(cuestionario._id).subscribe({
      next: () => {
        this.mensajeAccion = 'Cuestionario eliminado correctamente.';
        this.refrescarDatosProfesor();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible eliminar el cuestionario.';
      },
    });
  }

  private inicializarPerfil(): void {
    this.cargando = true;
    this.mensajeError = null;
    this.mensajeAccion = null;

    const sesion = this.authService.obtenerSesionGuardada();
    this.sesion = sesion;

    if (!sesion || sesion.rol !== 'profesor') {
      this.cargando = false;
      this.mensajeError = 'No se encontró una sesión de profesor activa. Inicia sesión nuevamente.';
      this.metricas = this.metricasPorDefecto();
      this.actividades = this.actividadesPorDefecto();
      this.recientes = [];
      this.retosProfesor = [];
      this.cuestionariosProfesor = [];
      this.alumnosEscuela = [];
      return;
    }

    this.refrescarDatosProfesor();
  }

  cargarReporte(): void {
    this.refrescarDatosProfesor();
  }

  private refrescarDatosProfesor(): void {
    if (!this.sesion) {
      return;
    }

    this.cargando = true;

    this.perfilProfesorService.obtenerReporte(this.sesion._id).subscribe({
      next: (reporte) => {
        this.metricas = reporte.metricas;
        this.actividades = reporte.actividades;
        this.recientes = reporte.recientes;
        this.renderizarGraficoProfesor();
        this.cargarListadosProfesor();
      },
      error: () => {
        this.metricas = this.metricasPorDefecto();
        this.actividades = this.actividadesPorDefecto();
        this.recientes = [];
        this.mensajeError = 'No fue posible cargar el reporte real del profesor.';
        this.cargando = false;
      },
    });
  }

  private cargarListadosProfesor(): void {
    if (!this.sesion) {
      this.cargando = false;
      return;
    }

    forkJoin({
      retos: this.perfilProfesorService.obtenerRetosProfesor(this.sesion._id),
      cuestionarios: this.perfilProfesorService.obtenerCuestionariosProfesor(this.sesion._id),
      alumnos: this.perfilProfesorService.obtenerAlumnosEscuela(this.sesion.escuela._id),
      evidencias: this.perfilProfesorService.obtenerEvidenciasEscuela(),
      resultados: this.perfilProfesorService.obtenerResultadosCuestionariosEscuela(this.sesion.escuela._id),
    }).subscribe({
      next: ({ retos, cuestionarios, alumnos, evidencias, resultados }) => {
        this.retosProfesor = retos;
        this.cuestionariosProfesor = cuestionarios;
        this.alumnosEscuela = alumnos;
        this.calcularResumenResultados(evidencias, resultados);
        this.cargando = false;
      },
      error: () => {
        this.retosProfesor = [];
        this.cuestionariosProfesor = [];
        this.alumnosEscuela = [];
        this.resetearResumenResultados();
        this.cargando = false;
      },
    });
  }

  private calcularResumenResultados(
    evidencias: ReadonlyArray<EvidenciaResumenProfesor>,
    resultados: ReadonlyArray<ResultadoCuestionarioResumenProfesor>
  ): void {
    const retoIds = new Set(this.retosProfesor.map((item) => item._id));
    const cuestionarioIds = new Set(this.cuestionariosProfesor.map((item) => item._id));

    const evidenciasMias = evidencias.filter((item) => retoIds.has(this.extraerId(item.reto)));
    const resultadosMios = resultados.filter((item) => cuestionarioIds.has(this.extraerId(item.cuestionario)));

    const alumnosRetos = evidenciasMias.map((item) => this.extraerId(item.alumno));
    const alumnosQuiz = resultadosMios.map((item) => this.extraerId(item.alumno));

    const sumaPorcentajes = resultadosMios.reduce((acc, item) => acc + (Number(item.porcentaje) || 0), 0);
    const promedio = resultadosMios.length > 0 ? sumaPorcentajes / resultadosMios.length : 0;

    this.resultadosRetosTomados = evidenciasMias.length;
    this.resultadosRetosAprobados = evidenciasMias.filter((item) => item.estado === 'aprobada').length;
    this.resultadosCuestionariosIntentos = resultadosMios.length;
    this.resultadosCuestionariosPromedio = Number(promedio.toFixed(1));
    this.resultadosAlumnosParticipantes = new Set([...alumnosRetos, ...alumnosQuiz]).size;
  }

  private resetearResumenResultados(): void {
    this.resultadosRetosTomados = 0;
    this.resultadosRetosAprobados = 0;
    this.resultadosCuestionariosIntentos = 0;
    this.resultadosCuestionariosPromedio = 0;
    this.resultadosAlumnosParticipantes = 0;
  }

  private renderizarGraficoProfesor(): void {
    if (!this.profesorChartCanvas?.nativeElement || this.actividades.length === 0) {
      return;
    }

    const etiquetas = this.actividades.map((actividad) => actividad.nombre);
    const valores = this.actividades.map((actividad) => actividad.porcentaje);

    this.profesorChart = crearGraficoLinea(
      this.profesorChartCanvas.nativeElement,
      this.profesorChart,
      etiquetas,
      valores,
      'Indicadores del profesor',
      '#0f766e'
    );
  }

  private convertirFechaParaFormulario(fecha?: string): string {
    if (!fecha) {
      return '';
    }

    const fechaParseada = new Date(fecha);
    if (Number.isNaN(fechaParseada.getTime())) {
      return '';
    }

    return fechaParseada.toISOString().slice(0, 10);
  }

  private obtenerIndiceRespuestaCorrecta(
    pregunta?: {
      respuestaCorrecta: number | number[] | string;
      opciones?: string[];
    }
  ): number {
    if (!pregunta || typeof pregunta.respuestaCorrecta !== 'number') {
      return 0;
    }

    return pregunta.respuestaCorrecta;
  }

  private extraerId(valor: string | { _id: string }): string {
    if (typeof valor === 'string') {
      return valor;
    }

    return valor?._id ?? '';
  }

  private metricasPorDefecto(): ReadonlyArray<MetricaPerfilProfesor> {
    return [
      { titulo: 'Retos Creados', valor: '0' },
      { titulo: 'Cuestionarios Activos', valor: '0' },
      { titulo: 'Evidencias Pendientes', valor: '0' },
      { titulo: 'Evidencias Revisadas', valor: '0' },
    ];
  }

  private actividadesPorDefecto(): ReadonlyArray<ActividadPerfilProfesor> {
    return [
      { nombre: 'Retos Publicados', porcentaje: 0 },
      { nombre: 'Retos Borrador', porcentaje: 0 },
      { nombre: 'Retos Cerrados', porcentaje: 0 },
      { nombre: 'Cuestionarios Activos', porcentaje: 0 },
      { nombre: 'Revision Evidencias', porcentaje: 0 },
    ];
  }
}
