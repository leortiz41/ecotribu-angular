import { CommonModule, NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import {
  ActualizarCuestionarioAdminPayload,
  ActualizarEscuelaPayload,
  ActualizarRetoAdminPayload,
  ActualizarUsuarioAdminPayload,
  CuestionarioAdmin,
  CrearEscuelaPayload,
  CrearUsuarioAdminPayload,
  EvidenciaAdmin,
  EscuelaAdmin,
  MetricaAdministrador,
  PerfilAdministradorService,
  RetoAdmin,
  UsuarioAdmin,
} from '../services/perfil-administrador.service';
import { Chart } from 'chart.js';
import { crearGraficoDona } from '../utils/dashboard-chart';

type VistaAdmin =
  | 'resumen'
  | 'escuelas'
  | 'usuarios'
  | 'contenido'
  | 'profesores'
  | 'alumnos'
  | 'ranking'
  | 'encuestas'
  | 'evidencias';

@Component({
  selector: 'app-perfil-administrador',
  imports: [CommonModule, NgIf, NgFor, NgOptimizedImage, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil-administrador.component.html',
  styleUrls: ['./perfil-administrador.component.css'],
})
export class PerfilAdministradorComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly perfilAdminService = inject(PerfilAdministradorService);
  private readonly platformId = inject(PLATFORM_ID);

  vistaActual: VistaAdmin = 'resumen';
  sesion: UsuarioSesion | null = null;
  metricas: ReadonlyArray<MetricaAdministrador> = [];
  escuelas: ReadonlyArray<EscuelaAdmin> = [];
  usuarios: ReadonlyArray<UsuarioAdmin> = [];
  retos: ReadonlyArray<RetoAdmin> = [];
  cuestionarios: ReadonlyArray<CuestionarioAdmin> = [];
  evidencias: ReadonlyArray<EvidenciaAdmin> = [];
  cargando = true;
  mensajeError: string | null = null;
  mensajeAccion: string | null = null;
  escuelaEnEdicionId: string | null = null;
  modalEdicionEscuelaAbierto = false;
  usuarioEnEdicionId: string | null = null;
  modalEdicionUsuarioAbierto = false;
  private bloqueoTemporalCierreModalUsuario = false;
  @ViewChild('adminChart') private adminChartCanvas?: ElementRef<HTMLCanvasElement>;
  private adminChart: Chart | null = null;

  readonly escuelaForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: ['', [Validators.required, Validators.minLength(2)]],
    activa: [true],
  });

  readonly escuelaEdicionForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: ['', [Validators.required, Validators.minLength(2)]],
    activa: [true],
  });

  readonly usuarioForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['alumno', Validators.required],
    escuela: ['', Validators.required],
    grado: [''],
  });

  get usuariosActivos(): number {
    return this.usuarios.filter((u) => u.activo).length;
  }

  get profesoresActivos(): number {
    return this.usuarios.filter((u) => u.rol === 'profesor' && u.activo).length;
  }

  get alumnosActivos(): number {
    return this.usuarios.filter((u) => u.rol === 'alumno' && u.activo).length;
  }

  get retosPublicados(): RetoAdmin[] {
    return this.retos.filter((r) => r.estado === 'publicado');
  }

  get cuestionariosActivos(): CuestionarioAdmin[] {
    return this.cuestionarios.filter((c) => c.estado === 'publicado').slice(0, 10);
  }

  get profesoresSistema(): UsuarioAdmin[] {
    return this.usuarios.filter((u) => u.rol === 'profesor');
  }

  get alumnosSistema(): UsuarioAdmin[] {
    return this.usuarios.filter((u) => u.rol === 'alumno');
  }

  get rankingAlumnos(): UsuarioAdmin[] {
    return [...this.alumnosSistema].sort((a, b) => (b.puntos ?? 0) - (a.puntos ?? 0));
  }

  get evidenciasPendientes(): number {
    return this.evidencias.filter((e) => e.estado === 'pendiente').length;
  }

  get evidenciasAprobadas(): number {
    return this.evidencias.filter((e) => e.estado === 'aprobada').length;
  }

  get evidenciasRechazadas(): number {
    return this.evidencias.filter((e) => e.estado === 'rechazada').length;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.inicializarAdmin();
    } else {
      this.cargando = false;
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.programarRenderGraficoAdmin();
  }

  ngOnDestroy(): void {
    this.adminChart?.destroy();
    this.restaurarScrollBody();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeModalUsuario(event: Event): void {
    if (!this.modalEdicionUsuarioAbierto) {
      return;
    }

    event.preventDefault();
    this.cerrarModalEdicionUsuario();
  }

  cambiarVista(vista: VistaAdmin): void {
    this.vistaActual = vista;
    this.mensajeAccion = null;

    if (vista === 'resumen') {
      this.programarRenderGraficoAdmin();
    }
  }

  navegarGestionSuperior(vista: VistaAdmin): void {
    this.cambiarVista(vista);
  }

  crearEscuela(): void {
    if (this.escuelaForm.invalid) {
      this.escuelaForm.markAllAsTouched();
      return;
    }

    const value = this.escuelaForm.getRawValue();
    const payload: CrearEscuelaPayload = {
      nombre: value.nombre.trim(),
      codigo: value.codigo.trim(),
      activa: Boolean(value.activa),
    };

    this.cargando = true;
    this.mensajeAccion = null;

    this.perfilAdminService.crearEscuela(payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Escuela creada correctamente.';
        this.escuelaForm.reset({ nombre: '', codigo: '', activa: true });
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeAccion = 'No fue posible crear la escuela.';
      },
    });
  }

  crearUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const value = this.usuarioForm.getRawValue();
    const payload: CrearUsuarioAdminPayload = {
      nombre: value.nombre.trim(),
      email: value.email.trim(),
      password: value.password,
      rol: value.rol as 'alumno' | 'profesor' | 'administrador',
      escuela: value.escuela,
      grado: value.grado.trim() || undefined,
    };

    this.cargando = true;
    this.mensajeAccion = null;

    this.perfilAdminService.crearUsuario(payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Usuario creado correctamente.';
        this.usuarioForm.reset({
          nombre: '',
          email: '',
          password: '',
          rol: 'alumno',
          escuela: '',
          grado: '',
        });
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeAccion = 'No fue posible crear el usuario.';
      },
    });
  }

  guardarUsuario(): void {
    if (this.usuarioEnEdicionId) {
      this.actualizarUsuarioDesdeFormulario();
      return;
    }

    this.crearUsuario();
  }

  cancelarEdicionUsuario(): void {
    this.usuarioEnEdicionId = null;
    this.modalEdicionUsuarioAbierto = false;
    this.sincronizarScrollBodyConModalUsuario();
    this.usuarioForm.reset({
      nombre: '',
      email: '',
      password: '',
      rol: 'alumno',
      escuela: '',
      grado: '',
    });
    this.configurarFormularioUsuarioParaCrear();
    this.mensajeAccion = 'Edición de usuario cancelada.';
  }

  cargarReporte(): void {
    this.refrescarDatos();
  }

  editarEscuela(escuela: EscuelaAdmin): void {
    this.escuelaEnEdicionId = escuela._id;
    this.modalEdicionEscuelaAbierto = true;
    this.escuelaEdicionForm.patchValue({
      nombre: escuela.nombre ?? '',
      codigo: escuela.codigo ?? '',
      activa: escuela.activa,
    });
    this.mensajeError = null;
    this.mensajeAccion = `Editando escuela: ${escuela.nombre}`;
  }

  cerrarModalEdicionEscuela(): void {
    this.escuelaEnEdicionId = null;
    this.modalEdicionEscuelaAbierto = false;
    this.escuelaEdicionForm.reset({ nombre: '', codigo: '', activa: true });
    this.mensajeAccion = 'Edición de escuela cancelada.';
  }

  toggleEstadoEscuela(escuela: EscuelaAdmin): void {
    const accion = escuela.activa ? 'desactivar' : 'activar';
    const confirmacion = window.confirm(`¿Deseas ${accion} la escuela "${escuela.nombre}"?`);
    if (!confirmacion) {
      return;
    }

    this.cargando = true;
    this.perfilAdminService.actualizarEscuela(escuela._id, { activa: !escuela.activa }).subscribe({
      next: () => {
        this.mensajeAccion = escuela.activa ? 'Escuela desactivada correctamente.' : 'Escuela activada correctamente.';
        if (this.escuelaEnEdicionId === escuela._id) {
          this.cerrarModalEdicionEscuela();
        }
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = escuela.activa ? 'No fue posible desactivar la escuela.' : 'No fue posible activar la escuela.';
      },
    });
  }

  actualizarEscuelaDesdeFormulario(): void {
    if (!this.escuelaEnEdicionId) {
      return;
    }

    if (this.escuelaEdicionForm.invalid) {
      this.escuelaEdicionForm.markAllAsTouched();
      return;
    }

    const value = this.escuelaEdicionForm.getRawValue();
    const payload: ActualizarEscuelaPayload = {
      nombre: value.nombre.trim(),
      codigo: value.codigo.trim(),
      activa: Boolean(value.activa),
    };

    this.cargando = true;
    this.perfilAdminService.actualizarEscuela(this.escuelaEnEdicionId, payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Escuela actualizada correctamente.';
        this.escuelaEnEdicionId = null;
        this.modalEdicionEscuelaAbierto = false;
        this.escuelaEdicionForm.reset({ nombre: '', codigo: '', activa: true });
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible actualizar la escuela.';
      },
    });
  }

  editarUsuario(usuario: UsuarioAdmin, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.bloqueoTemporalCierreModalUsuario = true;
    this.usuarioEnEdicionId = usuario._id;
    this.modalEdicionUsuarioAbierto = true;
    this.sincronizarScrollBodyConModalUsuario();
    this.configurarFormularioUsuarioParaEditar();
    this.usuarioForm.patchValue({
      nombre: usuario.nombre ?? '',
      email: usuario.email ?? '',
      password: '',
      rol: usuario.rol,
      escuela: usuario.escuela?._id ?? '',
      grado: usuario.grado ?? '',
    });
    this.mensajeError = null;
    this.mensajeAccion = `Editando usuario: ${usuario.nombre}`;

    setTimeout(() => {
      this.bloqueoTemporalCierreModalUsuario = false;
    }, 0);
  }

  cerrarModalEdicionUsuario(): void {
    this.cancelarEdicionUsuario();
  }

  manejarClickBackdropModalUsuario(event: MouseEvent): void {
    if (this.bloqueoTemporalCierreModalUsuario) {
      return;
    }

    if (event.target === event.currentTarget) {
      this.cerrarModalEdicionUsuario();
    }
  }

  eliminarUsuario(usuario: UsuarioAdmin): void {
    const confirmacion = window.confirm(`¿Deseas desactivar al usuario "${usuario.nombre}"?`);
    if (!confirmacion) {
      return;
    }

    this.cargando = true;
    this.perfilAdminService.eliminarUsuario(usuario._id).subscribe({
      next: () => {
        this.mensajeAccion = 'Usuario desactivado correctamente.';
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible desactivar el usuario.';
      },
    });
  }

  private actualizarUsuarioDesdeFormulario(): void {
    if (!this.usuarioEnEdicionId) {
      return;
    }

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const value = this.usuarioForm.getRawValue();
    const escuelaSeleccionada = value.escuela.trim();
    const payload: ActualizarUsuarioAdminPayload = {
      nombre: value.nombre.trim(),
      email: value.email.trim(),
      rol: value.rol as 'alumno' | 'profesor' | 'administrador',
      grado: value.grado.trim() || undefined,
    };

    if (escuelaSeleccionada.length > 0) {
      payload.escuela = escuelaSeleccionada;
    }

    if (value.password.trim().length > 0) {
      payload.password = value.password;
    }

    this.cargando = true;
    this.perfilAdminService.actualizarUsuario(this.usuarioEnEdicionId, payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Usuario actualizado correctamente.';
        this.usuarioEnEdicionId = null;
        this.modalEdicionUsuarioAbierto = false;
        this.sincronizarScrollBodyConModalUsuario();
        this.usuarioForm.reset({
          nombre: '',
          email: '',
          password: '',
          rol: 'alumno',
          escuela: '',
          grado: '',
        });
        this.configurarFormularioUsuarioParaCrear();
        this.refrescarDatos();
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = this.obtenerMensajeErrorApi(error, 'No fue posible actualizar el usuario.');
      },
    });
  }

  private configurarFormularioUsuarioParaCrear(): void {
    this.usuarioForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.controls.password.updateValueAndValidity({ emitEvent: false });
    this.usuarioForm.controls.escuela.setValidators([Validators.required]);
    this.usuarioForm.controls.escuela.updateValueAndValidity({ emitEvent: false });
  }

  private configurarFormularioUsuarioParaEditar(): void {
    this.usuarioForm.controls.password.setValidators([Validators.minLength(6)]);
    this.usuarioForm.controls.password.updateValueAndValidity({ emitEvent: false });
    this.usuarioForm.controls.escuela.clearValidators();
    this.usuarioForm.controls.escuela.updateValueAndValidity({ emitEvent: false });
  }

  editarReto(reto: RetoAdmin): void {
    const titulo = window.prompt('Nuevo título del reto:', reto.titulo)?.trim();
    if (!titulo) {
      return;
    }

    const payload: ActualizarRetoAdminPayload = { titulo };
    this.cargando = true;
    this.perfilAdminService.actualizarReto(reto._id, payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Reto actualizado correctamente.';
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible actualizar el reto.';
      },
    });
  }

  eliminarReto(reto: RetoAdmin): void {
    const confirmacion = window.confirm(`¿Deseas desactivar el reto "${reto.titulo}"?`);
    if (!confirmacion) {
      return;
    }

    this.cargando = true;
    this.perfilAdminService.eliminarReto(reto._id).subscribe({
      next: () => {
        this.mensajeAccion = 'Reto desactivado correctamente.';
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible desactivar el reto.';
      },
    });
  }

  editarCuestionario(cuestionario: CuestionarioAdmin): void {
    const titulo = window.prompt('Nuevo título del cuestionario:', cuestionario.titulo)?.trim();
    if (!titulo) {
      return;
    }

    const payload: ActualizarCuestionarioAdminPayload = { titulo };
    this.cargando = true;
    this.perfilAdminService.actualizarCuestionario(cuestionario._id, payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Cuestionario actualizado correctamente.';
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible actualizar el cuestionario.';
      },
    });
  }

  eliminarCuestionario(cuestionario: CuestionarioAdmin): void {
    const confirmacion = window.confirm(`¿Deseas desactivar el cuestionario "${cuestionario.titulo}"?`);
    if (!confirmacion) {
      return;
    }

    this.cargando = true;
    this.perfilAdminService.eliminarCuestionario(cuestionario._id).subscribe({
      next: () => {
        this.mensajeAccion = 'Cuestionario desactivado correctamente.';
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible desactivar el cuestionario.';
      },
    });
  }

  private inicializarAdmin(): void {
    this.cargando = true;
    this.mensajeError = null;
    this.mensajeAccion = null;

    const sesion = this.authService.obtenerSesionGuardada();
    this.sesion = sesion;

    if (!sesion || sesion.rol !== 'administrador') {
      this.cargando = false;
      this.mensajeError = 'No se encontró una sesión de administrador activa.';
      return;
    }

    this.refrescarDatos();
  }

  private refrescarDatos(): void {
    this.cargando = true;

    this.perfilAdminService.obtenerReporte().subscribe({
      next: (reporte) => {
        this.metricas = reporte.metricas;
        this.escuelas = reporte.escuelas;
        this.usuarios = reporte.usuarios;
        this.retos = reporte.retos;
        this.cuestionarios = reporte.cuestionarios;
        this.evidencias = reporte.evidencias;
        this.programarRenderGraficoAdmin();
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'No fue posible cargar los datos del administrador.';
        this.cargando = false;
      },
    });
  }

  private renderizarGraficoAdmin(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.adminChartCanvas?.nativeElement || this.metricas.length === 0) {
      return;
    }

    const etiquetas = this.metricas.slice(0, 6).map((metrica) => metrica.titulo);
    const valores = this.metricas.slice(0, 6).map((metrica) => Number.parseInt(metrica.valor, 10) || 0);

    this.adminChart = crearGraficoDona(
      this.adminChartCanvas.nativeElement,
      this.adminChart,
      etiquetas,
      valores,
      'Resumen general',
      '#059669'
    );
  }

  private programarRenderGraficoAdmin(): void {
    setTimeout(() => this.renderizarGraficoAdmin(), 0);
  }

  private sincronizarScrollBodyConModalUsuario(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.body.style.overflow = this.modalEdicionUsuarioAbierto ? 'hidden' : '';
  }

  private restaurarScrollBody(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.body.style.overflow = '';
  }

  private obtenerMensajeErrorApi(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.message;

      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }
    }

    return fallback;
  }
}
