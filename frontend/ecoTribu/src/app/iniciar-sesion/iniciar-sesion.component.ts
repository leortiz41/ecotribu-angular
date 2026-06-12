import { NgIf, NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-iniciar-sesion',
  imports: [ReactiveFormsModule, NgIf, RouterLink, NgOptimizedImage],
  templateUrl: './iniciar-sesion.component.html',
  styleUrls: ['./iniciar-sesion.component.css'],
})
export class IniciarSesionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sesionForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  cargando = false;
  mensajeError: string | null = null;
  mostrarPassword = false;

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  iniciarSesion(): void {
    if (this.sesionForm.invalid) {
      this.sesionForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.mensajeError = null;

    const { email, password } = this.sesionForm.getRawValue();

    this.authService.iniciarSesion({ email, password }).subscribe({
      next: (res) => {
        this.cargando = false;
        if (!res.success || !res.data) {
          this.mensajeError = res.message || 'No fue posible iniciar sesión.';
          return;
        }

        this.authService.guardarSesion(res.data);

        this.redireccionarPorRol(res.data.rol);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeError = err.error?.message ?? 'Error al conectar con el servidor.';
      },
    });
  }

  private redireccionarPorRol(rol: string): void {
    switch (rol) {
      case 'alumno':
        void this.router.navigate(['/perfil-alumno']);
        return;
      case 'profesor':
        void this.router.navigate(['/perfil-profesor']);
        return;
      case 'administrador':
        void this.router.navigate(['/perfil-administrador']);
        return;
      default:
        this.mensajeError = 'El rol de la cuenta no es válido para esta aplicación.';
    }
  }
}
