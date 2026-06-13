import { NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import {
  AlumnoEscuelaProfesor,
  ActividadPerfilProfesor,
  CrearCuestionarioPayload,
  CrearRetoPayload,
  CuestionarioProfesor,
  ItemRecienteProfesor,
  MetricaPerfilProfesor,
  PerfilProfesorService,
  RetoProfesor,
} from '../services/perfil-profesor.service';

type VistaProfesor = 'resumen' | 'retos' | 'cuestionarios' | 'alumnos';

@Component({
  selector: 'app-perfil-profesor',
  imports: [NgIf, NgFor, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './perfil-profesor.component.html',
  styleUrls: ['./perfil-profesor.component.css'],
})
export class PerfilProfesorComponent implements OnInit {
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
  cargando = true;
  mensajeError: string | null = null;
  mensajeAccion: string | null = null;

  readonly retoForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
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

  cambiarVista(vista: VistaProfesor): void {
    this.vistaActual = vista;
    this.mensajeAccion = null;
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
      puntos: Number(value.puntos),
      fechaInicio: value.fechaInicio,
      fechaFin: value.fechaFin,
      escuela: this.sesion.escuela._id,
      creador: this.sesion._id,
      categoria: 'otro',
      dificultad: 'media',
    };

    this.cargando = true;
    this.mensajeAccion = null;

    this.perfilProfesorService.crearReto(payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Reto creado correctamente.';
        this.retoForm.reset({
          titulo: '',
          descripcion: '',
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
    const payload: CrearCuestionarioPayload = {
      titulo: value.titulo.trim(),
      descripcion: value.descripcion.trim(),
      grado: value.grado.trim(),
      modalidad: 'mixto',
      escuela: this.sesion.escuela._id,
      creador: this.sesion._id,
      preguntas: [
        {
          enunciado: value.pregunta.trim(),
          tipo: 'seleccion_unica',
          opciones: [value.opcionA.trim(), value.opcionB.trim(), value.opcionC.trim(), value.opcionD.trim()],
          respuestaCorrecta: Number(value.respuestaCorrecta),
          puntaje: Number(value.puntaje),
        },
      ],
    };

    this.cargando = true;
    this.mensajeAccion = null;

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

    this.perfilProfesorService.obtenerRetosProfesor(this.sesion._id).subscribe({
      next: (retos) => {
        this.retosProfesor = retos;
      },
      error: () => {
        this.retosProfesor = [];
      },
    });

    this.perfilProfesorService.obtenerCuestionariosProfesor(this.sesion._id).subscribe({
      next: (cuestionarios) => {
        this.cuestionariosProfesor = cuestionarios;
      },
      error: () => {
        this.cuestionariosProfesor = [];
      },
    });

    this.perfilProfesorService.obtenerAlumnosEscuela(this.sesion.escuela._id).subscribe({
      next: (alumnos) => {
        this.alumnosEscuela = alumnos;
        this.cargando = false;
      },
      error: () => {
        this.alumnosEscuela = [];
        this.cargando = false;
      },
    });
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
