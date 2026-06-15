import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, DatosRegistroUsuario, EscuelaCatalogo } from '../services/auth.service';

type RolUsuario = DatosRegistroUsuario['rol'];

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink, NgOptimizedImage],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
})
export class RegistroComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly roles: ReadonlyArray<{ label: string; value: RolUsuario }> = [
    { label: 'Alumno', value: 'alumno' },
    { label: 'Profesor', value: 'profesor' },
    { label: 'Administrador', value: 'administrador' },
  ];

  readonly formularioRegistro = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['alumno' as RolUsuario, Validators.required],
    escuela: ['', Validators.required],
    gradoSeccion: [''],
  });

  escuelas: EscuelaCatalogo[] = [];
  cargandoEscuelas = false;
  cargandoRegistro = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

  ngOnInit(): void {
    this.cargarEscuelas();
  }

  registrarse(): void {
    if (this.formularioRegistro.invalid) {
      this.formularioRegistro.markAllAsTouched();
      return;
    }

    this.cargandoRegistro = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    const value = this.formularioRegistro.getRawValue();
    const payload: DatosRegistroUsuario = {
      nombre: value.nombre.trim(),
      email: value.email.trim().toLowerCase(),
      password: value.password,
      rol: value.rol,
      escuela: value.escuela.trim(),
      solicitaValidacionRol: true,
    };

    this.authService.registrarUsuario(payload).subscribe({
      next: (res) => {
        this.cargandoRegistro = false;
        this.mensajeExito = res.message;
        this.limpiarFormulario();
        void this.router.navigate(['/iniciar-sesion']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoRegistro = false;
        this.mensajeError = err.error?.message ?? 'No fue posible completar el registro.';
      },
    });
  }

  private cargarEscuelas(): void {
    this.cargandoEscuelas = true;

    this.authService.obtenerEscuelas().subscribe({
      next: (res) => {
        this.cargandoEscuelas = false;
        this.escuelas = res.data ?? [];
      },
      error: () => {
        this.cargandoEscuelas = false;
      },
    });
  }

  private limpiarFormulario(): void {
    this.formularioRegistro.reset({
      nombre: '',
      email: '',
      password: '',
      rol: 'alumno',
      escuela: '',
      gradoSeccion: '',
    });
  }
}
