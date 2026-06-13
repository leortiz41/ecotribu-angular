import { CommonModule, NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import {
  ActualizarCuestionarioAdminPayload,
  ActualizarEscuelaPayload,
  ActualizarRetoAdminPayload,
  ActualizarUsuarioAdminPayload,
  CuestionarioAdmin,
  CrearEscuelaPayload,
  CrearUsuarioAdminPayload,
  EscuelaAdmin,
  MetricaAdministrador,
  PerfilAdministradorService,
  RetoAdmin,
  UsuarioAdmin,
} from '../services/perfil-administrador.service';
import { Chart } from 'chart.js';
import { crearGraficoDona } from '../utils/dashboard-chart';

type VistaAdmin = 'resumen' | 'escuelas' | 'usuarios' | 'contenido';

@Component({
  selector: 'app-perfil-administrador',
  imports: [CommonModule, NgIf, NgFor, NgOptimizedImage, ReactiveFormsModule],
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
  cargando = true;
  mensajeError: string | null = null;
  mensajeAccion: string | null = null;
  usuarioEnEdicionId: string | null = null;
  @ViewChild('adminChart') private adminChartCanvas?: ElementRef<HTMLCanvasElement>;
  private adminChart: Chart | null = null;

  readonly escuelaForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    codigo: ['', [Validators.required, Validators.minLength(2)]],
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
    return this.cuestionarios.slice(0, 10);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.inicializarAdmin();
    } else {
      this.cargando = false;
    }
  }

  ngAfterViewInit(): void {
    this.programarRenderGraficoAdmin();
  }

  ngOnDestroy(): void {
    this.adminChart?.destroy();
  }

  cambiarVista(vista: VistaAdmin): void {
    this.vistaActual = vista;
    this.mensajeAccion = null;

    if (vista === 'resumen') {
      this.programarRenderGraficoAdmin();
    }
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
      activa: true,
    };

    this.cargando = true;
    this.mensajeAccion = null;

    this.perfilAdminService.crearEscuela(payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Escuela creada correctamente.';
        this.escuelaForm.reset({ nombre: '', codigo: '' });
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
    const nombre = window.prompt('Nuevo nombre de la escuela:', escuela.nombre)?.trim();
    if (!nombre) {
      return;
    }

    const codigoActual = escuela.codigo ?? '';
    const codigo = window.prompt('Nuevo código de la escuela:', codigoActual)?.trim();
    if (!codigo) {
      return;
    }

    const payload: ActualizarEscuelaPayload = { nombre, codigo };
    this.cargando = true;
    this.perfilAdminService.actualizarEscuela(escuela._id, payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Escuela actualizada correctamente.';
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible actualizar la escuela.';
      },
    });
  }

  eliminarEscuela(escuela: EscuelaAdmin): void {
    const confirmacion = window.confirm(`¿Deseas desactivar la escuela "${escuela.nombre}"?`);
    if (!confirmacion) {
      return;
    }

    this.cargando = true;
    this.perfilAdminService.eliminarEscuela(escuela._id).subscribe({
      next: () => {
        this.mensajeAccion = 'Escuela desactivada correctamente.';
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible desactivar la escuela.';
      },
    });
  }

  editarUsuario(usuario: UsuarioAdmin): void {
    this.usuarioEnEdicionId = usuario._id;
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
    const payload: ActualizarUsuarioAdminPayload = {
      nombre: value.nombre.trim(),
      email: value.email.trim(),
      rol: value.rol as 'alumno' | 'profesor' | 'administrador',
      escuela: value.escuela,
      grado: value.grado.trim() || undefined,
    };

    if (value.password.trim().length > 0) {
      payload.password = value.password;
    }

    this.cargando = true;
    this.perfilAdminService.actualizarUsuario(this.usuarioEnEdicionId, payload).subscribe({
      next: () => {
        this.mensajeAccion = 'Usuario actualizado correctamente.';
        this.usuarioEnEdicionId = null;
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
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible actualizar el usuario.';
      },
    });
  }

  private configurarFormularioUsuarioParaCrear(): void {
    this.usuarioForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.controls.password.updateValueAndValidity({ emitEvent: false });
  }

  private configurarFormularioUsuarioParaEditar(): void {
    this.usuarioForm.controls.password.setValidators([Validators.minLength(6)]);
    this.usuarioForm.controls.password.updateValueAndValidity({ emitEvent: false });
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
}
