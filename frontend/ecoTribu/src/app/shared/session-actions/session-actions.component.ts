import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-session-actions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './session-actions.component.html',
  styleUrls: ['./session-actions.component.css'],
})
export class SessionActionsComponent {
  @Input() displayName = 'Usuario';
  @Input() roleLabel = 'Perfil';
  @Input() disabled = false;

  @Output() cerrarSesion = new EventEmitter<void>();
  @Output() cambiarContrasena = new EventEmitter<string>();

  menuOpen = false;
  modalOpen = false;

  readonly passwordForm = new FormBuilder().nonNullable.group({
    nueva: ['', [Validators.required, Validators.minLength(6)]],
    confirmar: ['', [Validators.required]],
  });

  get iniciales(): string {
    const limpio = this.displayName.trim();
    if (!limpio) {
      return 'US';
    }

    const partes = limpio.split(/\s+/).filter(Boolean);
    const dos = partes.slice(0, 2).map((item) => item[0]?.toUpperCase() ?? '');
    return dos.join('').slice(0, 2) || 'US';
  }

  toggleMenu(): void {
    if (this.disabled) {
      return;
    }

    this.menuOpen = !this.menuOpen;
  }

  abrirCambioContrasena(): void {
    this.menuOpen = false;
    this.modalOpen = true;
    this.passwordForm.reset({ nueva: '', confirmar: '' });
  }

  cerrarModal(): void {
    this.modalOpen = false;
  }

  solicitarLogout(): void {
    this.menuOpen = false;
    const confirmar = window.confirm('¿Seguro que deseas cerrar sesión?');
    if (!confirmar) {
      return;
    }

    this.cerrarSesion.emit();
  }

  enviarCambioContrasena(): void {
    this.passwordForm.markAllAsTouched();

    if (this.passwordForm.invalid) {
      return;
    }

    const value = this.passwordForm.getRawValue();
    if (value.nueva !== value.confirmar) {
      this.passwordForm.get('confirmar')?.setErrors({ mismatch: true });
      return;
    }

    this.modalOpen = false;
    this.cambiarContrasena.emit(value.nueva);
  }
}
