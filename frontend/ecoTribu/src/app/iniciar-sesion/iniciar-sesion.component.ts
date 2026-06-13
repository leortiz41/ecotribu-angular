import { NgIf, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, PLATFORM_ID, inject } from '@angular/core';
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
  private readonly platformId = inject(PLATFORM_ID);

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

        if (!isPlatformBrowser(this.platformId)) {
          return;
        }

        this.authService.guardarSesion(res.data);
        void this.redireccionarPorRol(res.data.rol);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.mensajeError = err.error?.message ?? 'Error al conectar con el servidor.';
      },
    });
  }

  private async redireccionarPorRol(rol: string): Promise<void> {
    const rolNormalizado = String(rol || '').trim().toLowerCase();

    let destino = '';

    switch (rolNormalizado) {
      case 'alumno':
      case 'estudiante':
        destino = '/perfil-alumno';
        break;
      case 'profesor':
      case 'docente':
        destino = '/perfil-profesor';
        break;
      case 'administrador':
      case 'admin':
        destino = '/perfil-administrador';
        break;
      default:
        this.mensajeError = `Rol no reconocido: "${rol}".`;
        return;
    }

    try {
      const navego = await this.router.navigateByUrl(destino, { replaceUrl: true });
      if (!navego) {
        window.location.assign(destino);
      }
    } catch {
      window.location.assign(destino);
    }
  }
}
