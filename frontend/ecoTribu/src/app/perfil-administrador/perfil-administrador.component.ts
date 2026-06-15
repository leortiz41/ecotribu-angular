import { CommonModule, NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import { SessionActionsComponent } from '../shared/session-actions/session-actions.component';
import {
  ActualizarEvidenciaAdminPayload,
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
  PreguntaCuestionarioAdmin,
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
  imports: [CommonModule, NgIf, NgFor, NgOptimizedImage, ReactiveFormsModule, RouterLink, SessionActionsComponent],
  templateUrl: './perfil-administrador.component.html',
  styleUrls: ['./perfil-administrador.component.css'],
})
export class PerfilAdministradorComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly perfilAdminService = inject(PerfilAdministradorService);
  private readonly router = inject(Router);
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
  retoEnEdicionId: string | null = null;
  modalEdicionRetoAbierto = false;
  cuestionarioEnEdicionId: string | null = null;
  modalEdicionCuestionarioAbierto = false;
  private bloqueoTemporalCierreModalUsuario = false;
    evidenciaEnValidacionId: string | null = null;
    modalValidacionEvidenciaAbierto = false;
    evidenciaEnEdicion: EvidenciaAdmin | null = null;
    validandoEvidencia = false;
    mensajeValidacionEvidencia: string | null = null;
  @ViewChild('adminChart') private adminChartCanvas?: ElementRef<HTMLCanvasElement>;
  private adminChart: Chart | null = null;

  // Filtros usuarios
  filtroUsuarioRol: 'todos' | 'alumno' | 'profesor' | 'administrador' | 'pendiente' = 'todos';
  filtroUsuarioNombre = '';

  // Filtros cuestionarios
  filtroCuestionarioNombre = '';
  filtroCuestionarioEscuela = '';

  // Filtros escuelas
  filtroEscuelaNombre = '';
  filtroEscuelaEstado: 'todas' | 'activa' | 'inactiva' = 'todas';

  readonly escuelaForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: ['', [Validators.minLength(2)]],
    activa: [true],
  });

  readonly escuelaEdicionForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: ['', [Validators.minLength(2)]],
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

  readonly retoEdicionForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    grado: [''],
    puntos: [50, [Validators.required, Validators.min(1)]],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    estado: ['publicado' as 'borrador' | 'publicado' | 'cerrado', Validators.required],
  });

  readonly cuestionarioEdicionForm = this.fb.nonNullable.group({
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
    estado: ['publicado' as 'borrador' | 'publicado' | 'cerrado', Validators.required],
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

  get solicitudesValidacionRolPendientes(): UsuarioAdmin[] {
    return this.usuarios.filter((u) => u.pendienteValidacionRol);
  }

  get totalSolicitudesValidacionRolPendientes(): number {
    return this.solicitudesValidacionRolPendientes.length;
  }

  get retosPublicados(): RetoAdmin[] {
    return this.retos.filter((r) => r.estado === 'publicado');
  }

  get cuestionariosActivos(): CuestionarioAdmin[] {
    return this.cuestionarios.filter((c) => c.estado === 'publicado').slice(0, 10);
  }

  get usuariosFiltrados(): UsuarioAdmin[] {
    const nombreLower = this.filtroUsuarioNombre.trim().toLowerCase();
    return this.usuarios.filter((u) => {
      const coincideRol =
        this.filtroUsuarioRol === 'todos'
        || (this.filtroUsuarioRol === 'pendiente' ? Boolean(u.pendienteValidacionRol) : u.rol === this.filtroUsuarioRol);
      const coincideNombre = !nombreLower || u.nombre.toLowerCase().includes(nombreLower) || u.email.toLowerCase().includes(nombreLower);
      return coincideRol && coincideNombre;
    });
  }

  irASolicitudesRolPendientes(): void {
    this.cambiarVista('usuarios');
    this.filtroUsuarioRol = 'pendiente';
    this.filtroUsuarioNombre = '';
  }

  get cuestionariosFiltrados(): CuestionarioAdmin[] {
    const nombreLower = this.filtroCuestionarioNombre.trim().toLowerCase();
    const escuelaLower = this.filtroCuestionarioEscuela.trim().toLowerCase();
    return this.cuestionarios.filter((c) => {
      const coincideNombre = !nombreLower || c.titulo.toLowerCase().includes(nombreLower);
      const coincideEscuela = !escuelaLower || (c.escuela?.nombre ?? '').toLowerCase().includes(escuelaLower);
      return coincideNombre && coincideEscuela;
    });
  }

  get escuelasFiltradas(): EscuelaAdmin[] {
    const nombreLower = this.filtroEscuelaNombre.trim().toLowerCase();
    return this.escuelas.filter((e) => {
      const coincideNombre = !nombreLower || e.nombre.toLowerCase().includes(nombreLower) || (e.codigo ?? '').toLowerCase().includes(nombreLower);
      const coincideEstado = this.filtroEscuelaEstado === 'todas' || (this.filtroEscuelaEstado === 'activa' ? e.activa : !e.activa);
      return coincideNombre && coincideEstado;
    });
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

  cerrarSesion(): void {
    this.authService.cerrarSesionGuardada();
    this.router.navigate(['/'], { replaceUrl: true });
  }

  cambiarContrasena(nueva: string): void {
    if (!this.sesion) {
      this.mensajeError = 'No hay sesión activa para cambiar la contraseña.';
      return;
    }

    this.authService.cambiarContrasena(this.sesion._id, nueva).subscribe({
      next: () => {
        this.mensajeError = null;
        this.mensajeAccion = 'Contraseña actualizada correctamente.';
      },
      error: () => {
        this.mensajeError = 'No fue posible actualizar la contraseña.';
      },
    });
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
    const codigoNormalizado = value.codigo.trim();
    const payload: CrearEscuelaPayload = {
      nombre: value.nombre.trim(),
      codigo: codigoNormalizado || undefined,
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
      error: (error) => {
        this.cargando = false;
        this.mensajeError = this.obtenerMensajeErrorApi(error, 'No fue posible crear la escuela.');
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
      solicitaValidacionRol: false,
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
    const codigoNormalizado = value.codigo.trim();
    const payload: ActualizarEscuelaPayload = {
      nombre: value.nombre.trim(),
      codigo: codigoNormalizado || undefined,
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

  validarRolUsuario(usuario: UsuarioAdmin): void {
    this.cargando = true;
    this.mensajeError = null;

    const payload: ActualizarUsuarioAdminPayload = {
      pendienteValidacionRol: false,
      notificacionValidacionLeida: true,
      activo: true,
    };

    this.perfilAdminService.actualizarUsuario(usuario._id, payload).subscribe({
      next: () => {
        this.mensajeAccion = `Rol validado correctamente para ${usuario.nombre}.`;
        this.refrescarDatos();
      },
      error: (error) => {
        this.cargando = false;
        this.mensajeError = this.obtenerMensajeErrorApi(error, 'No fue posible validar el rol del usuario.');
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
    this.retoEnEdicionId = reto._id;
    this.modalEdicionRetoAbierto = true;
    this.mensajeError = null;
    this.mensajeAccion = `Editando reto: ${reto.titulo}`;

    this.retoEdicionForm.reset({
      titulo: reto.titulo ?? '',
      descripcion: reto.descripcion ?? '',
      grado: reto.grado ?? '',
      puntos: reto.puntos ?? 50,
      fechaInicio: this.convertirFechaParaFormulario(reto.fechaInicio),
      fechaFin: this.convertirFechaParaFormulario(reto.fechaFin),
      estado: reto.estado ?? 'publicado',
    });

    this.perfilAdminService.obtenerRetoPorId(reto._id).subscribe({
      next: (response) => {
        const data = response.data;
        if (!data) {
          return;
        }

        this.retoEdicionForm.patchValue({
          titulo: data.titulo ?? '',
          descripcion: data.descripcion ?? '',
          grado: data.grado ?? '',
          puntos: data.puntos ?? 50,
          fechaInicio: this.convertirFechaParaFormulario(data.fechaInicio),
          fechaFin: this.convertirFechaParaFormulario(data.fechaFin),
          estado: data.estado ?? 'publicado',
        });
      },
      error: () => {
        this.mensajeError = 'No fue posible cargar todos los datos del reto. Puedes editar los campos visibles.';
      },
    });
  }

  cerrarModalEdicionReto(): void {
    this.retoEnEdicionId = null;
    this.modalEdicionRetoAbierto = false;
    this.retoEdicionForm.reset({
      titulo: '',
      descripcion: '',
      grado: '',
      puntos: 50,
      fechaInicio: '',
      fechaFin: '',
      estado: 'publicado',
    });
    this.mensajeAccion = 'Edición de reto cancelada.';
  }

  actualizarRetoDesdeFormulario(): void {
    if (!this.retoEnEdicionId) {
      return;
    }

    if (this.retoEdicionForm.invalid) {
      this.retoEdicionForm.markAllAsTouched();
      return;
    }

    const value = this.retoEdicionForm.getRawValue();
    const payload: ActualizarRetoAdminPayload = {
      titulo: value.titulo.trim(),
      descripcion: value.descripcion.trim(),
      grado: value.grado.trim() || undefined,
      puntos: Number(value.puntos),
      fechaInicio: value.fechaInicio,
      fechaFin: value.fechaFin,
      estado: value.estado,
      categoria: 'otro',
      dificultad: 'media',
    };

    this.cargando = true;
    this.perfilAdminService.actualizarReto(this.retoEnEdicionId, payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Reto actualizado correctamente.';
        this.cerrarModalEdicionReto();
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
    this.cuestionarioEnEdicionId = cuestionario._id;
    this.modalEdicionCuestionarioAbierto = true;
    this.mensajeError = null;
    this.mensajeAccion = `Editando cuestionario: ${cuestionario.titulo}`;

    this.cuestionarioEdicionForm.reset({
      titulo: cuestionario.titulo ?? '',
      descripcion: cuestionario.descripcion ?? '',
      grado: cuestionario.grado ?? '',
      pregunta: '',
      opcionA: '',
      opcionB: '',
      opcionC: '',
      opcionD: '',
      respuestaCorrecta: 0,
      puntaje: 1,
      estado: cuestionario.estado ?? 'publicado',
    });

    this.perfilAdminService.obtenerCuestionarioPorId(cuestionario._id).subscribe({
      next: (response) => {
        const data = response.data;
        if (!data) {
          return;
        }

        const primeraPregunta = data.preguntas?.[0];
        this.cuestionarioEdicionForm.patchValue({
          titulo: data.titulo ?? '',
          descripcion: data.descripcion ?? '',
          grado: data.grado ?? '',
          pregunta: primeraPregunta?.enunciado ?? '',
          opcionA: primeraPregunta?.opciones?.[0] ?? '',
          opcionB: primeraPregunta?.opciones?.[1] ?? '',
          opcionC: primeraPregunta?.opciones?.[2] ?? '',
          opcionD: primeraPregunta?.opciones?.[3] ?? '',
          respuestaCorrecta: this.obtenerIndiceRespuestaCorrecta(primeraPregunta),
          puntaje: primeraPregunta?.puntaje ?? 1,
          estado: data.estado ?? 'publicado',
        });
      },
      error: () => {
        this.mensajeError = 'No fue posible cargar todas las preguntas del cuestionario. Completa los campos para actualizar.';
      },
    });
  }

  cerrarModalEdicionCuestionario(): void {
    this.cuestionarioEnEdicionId = null;
    this.modalEdicionCuestionarioAbierto = false;
    this.cuestionarioEdicionForm.reset({
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
      estado: 'publicado',
    });
    this.mensajeAccion = 'Edición de cuestionario cancelada.';
  }

  actualizarCuestionarioDesdeFormulario(): void {
    if (!this.cuestionarioEnEdicionId) {
      return;
    }

    if (this.cuestionarioEdicionForm.invalid) {
      this.cuestionarioEdicionForm.markAllAsTouched();
      return;
    }

    const value = this.cuestionarioEdicionForm.getRawValue();
    const preguntas: PreguntaCuestionarioAdmin[] = [
      {
        enunciado: value.pregunta.trim(),
        tipo: 'seleccion_unica',
        opciones: [value.opcionA.trim(), value.opcionB.trim(), value.opcionC.trim(), value.opcionD.trim()],
        respuestaCorrecta: Number(value.respuestaCorrecta),
        puntaje: Number(value.puntaje),
      },
    ];

    const payload: ActualizarCuestionarioAdminPayload = {
      titulo: value.titulo.trim(),
      descripcion: value.descripcion.trim(),
      grado: value.grado.trim(),
      modalidad: 'mixto',
      preguntas,
      estado: value.estado,
    };

    this.cargando = true;
    this.perfilAdminService.actualizarCuestionario(this.cuestionarioEnEdicionId, payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Cuestionario actualizado correctamente.';
        this.cerrarModalEdicionCuestionario();
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

  abrirValidacionEvidencia(evidencia: EvidenciaAdmin): void {
    this.evidenciaEnValidacionId = evidencia._id;
    this.evidenciaEnEdicion = evidencia;
    this.modalValidacionEvidenciaAbierto = true;
    this.mensajeValidacionEvidencia = null;
  }

  cerrarModalValidacionEvidencia(): void {
    this.evidenciaEnValidacionId = null;
    this.evidenciaEnEdicion = null;
    this.modalValidacionEvidenciaAbierto = false;
    this.validandoEvidencia = false;
    this.mensajeValidacionEvidencia = null;
  }

  validarEvidencia(estado: 'aprobada' | 'rechazada', comentario: string = ''): void {
    if (!this.evidenciaEnValidacionId) {
      this.mensajeError = 'No hay evidencia seleccionada.';
      return;
    }

    const comentarioLimpio = comentario.trim();
    if (estado === 'rechazada' && !comentarioLimpio) {
      this.mensajeValidacionEvidencia = 'El comentario es obligatorio para rechazar una evidencia.';
      return;
    }

    if (!this.sesion?._id) {
      this.mensajeValidacionEvidencia = 'No hay sesión activa para registrar el revisor.';
      return;
    }

    this.mensajeError = null;
    this.mensajeValidacionEvidencia = null;
    this.validandoEvidencia = true;

    const payload: ActualizarEvidenciaAdminPayload = {
      revisor: this.sesion._id,
      comentarioRevision: comentarioLimpio || undefined,
    };

    const solicitud =
      estado === 'aprobada'
        ? this.perfilAdminService.aprobarEvidencia(this.evidenciaEnValidacionId, payload)
        : this.perfilAdminService.rechazarEvidencia(this.evidenciaEnValidacionId, payload);

    solicitud.subscribe({
      next: () => {
        this.mensajeAccion = `Evidencia ${estado === 'aprobada' ? 'aprobada' : 'rechazada'} correctamente.`;
        this.cerrarModalValidacionEvidencia();
        this.refrescarDatos();
      },
      error: (error: unknown) => {
        this.validandoEvidencia = false;
        this.mensajeValidacionEvidencia = this.obtenerMensajeErrorApi(error, 'No fue posible validar la evidencia.');
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

  private convertirFechaParaFormulario(fecha?: string | Date | null): string {
    if (!fecha) {
      return '';
    }

    const fechaObjeto = new Date(fecha);
    if (Number.isNaN(fechaObjeto.getTime())) {
      return '';
    }

    return fechaObjeto.toISOString().slice(0, 10);
  }

  private obtenerIndiceRespuestaCorrecta(pregunta?: PreguntaCuestionarioAdmin): number {
    if (!pregunta) {
      return 0;
    }

    if (typeof pregunta.respuestaCorrecta === 'number') {
      return pregunta.respuestaCorrecta;
    }

    if (Array.isArray(pregunta.respuestaCorrecta) && pregunta.respuestaCorrecta.length > 0) {
      const primerIndice = pregunta.respuestaCorrecta[0];
      return typeof primerIndice === 'number' ? primerIndice : 0;
    }

    return 0;
  }

  tipoEvidencia(archivoUrl?: string): string {
    if (!archivoUrl) {
      return 'No disponible';
    }

    const urlLimpia = archivoUrl.split('?')[0].toLowerCase();
    if (urlLimpia.endsWith('.jpg') || urlLimpia.endsWith('.jpeg') || urlLimpia.endsWith('.png') || urlLimpia.endsWith('.webp')) {
      return 'Imagen';
    }

    if (urlLimpia.endsWith('.pdf')) {
      return 'PDF';
    }

    if (urlLimpia.endsWith('.mp4') || urlLimpia.endsWith('.mov') || urlLimpia.endsWith('.avi')) {
      return 'Video';
    }

    if (urlLimpia.endsWith('.doc') || urlLimpia.endsWith('.docx')) {
      return 'Documento Word';
    }

    return 'Archivo';
  }

  esEnlaceExterno(archivoUrl?: string): boolean {
    if (!archivoUrl) {
      return false;
    }

    return /^https?:\/\//i.test(archivoUrl);
  }

  esDataUriImagen(archivoUrl?: string): boolean {
    if (!archivoUrl) {
      return false;
    }

    return /^data:image\//i.test(archivoUrl);
  }

  resumenArchivo(archivoUrl?: string): string {
    if (!archivoUrl) {
      return 'Sin archivo';
    }

    if (archivoUrl.length <= 90) {
      return archivoUrl;
    }

    return `${archivoUrl.slice(0, 45)}...${archivoUrl.slice(-25)}`;
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
