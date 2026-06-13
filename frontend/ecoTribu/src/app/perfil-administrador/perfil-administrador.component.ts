import { CommonModule, NgFor, NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UsuarioSesion } from '../services/auth.service';
import {
  CuestionarioAdmin,
  CrearEscuelaPayload,
  CrearUsuarioAdminPayload,
  EscuelaAdmin,
  MetricaAdministrador,
  PerfilAdministradorService,
  RetoAdmin,
  UsuarioAdmin,
} from '../services/perfil-administrador.service';

type VistaAdmin = 'resumen' | 'escuelas' | 'usuarios' | 'contenido';

@Component({
  selector: 'app-perfil-administrador',
  imports: [CommonModule, NgIf, NgFor, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './perfil-administrador.component.html',
  styleUrls: ['./perfil-administrador.component.css'],
})
export class PerfilAdministradorComponent implements OnInit {
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

  cambiarVista(vista: VistaAdmin): void {
    this.vistaActual = vista;
    this.mensajeAccion = null;
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
        });
        this.refrescarDatos();
      },
      error: () => {
        this.cargando = false;
        this.mensajeAccion = 'No fue posible crear el usuario.';
      },
    });
  }

  cargarReporte(): void {
    this.refrescarDatos();
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
        this.cargando = false;
      },
      error: () => {
        this.mensajeError = 'No fue posible cargar los datos del administrador.';
        this.cargando = false;
      },
    });
  }
}
