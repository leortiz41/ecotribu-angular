import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

type EstadoEscuela = 'ACTIVA' | 'INACTIVA';

interface EscuelaPayload {
  nombreEscuela: string;
  codigoEscuela: string;
  direccion: string;
  ciudadPueblo: string;
  departamento: string;
  telefono: string;
  correo: string;
  estado: EstadoEscuela;
}

@Component({
  selector: 'app-escuela',
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink, NgOptimizedImage],
  templateUrl: './escuela.component.html',
  styleUrl: './escuela.component.css'
})
export class EscuelaComponent {
  private readonly fb = inject(FormBuilder);

  readonly departamentos = [
    'Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés',
    'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá',
    'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho',
    'Santa Bárbara', 'Valle', 'Yoro'
  ];

  readonly escuelaForm = this.fb.nonNullable.group({
    nombreEscuela: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    codigoEscuela: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,20}$/)]],
    direccion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(160)]],
    ciudadPueblo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    departamento: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{8,15}$/)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    estado: ['ACTIVA' as EstadoEscuela, Validators.required]
  });

  payloadEscuela: EscuelaPayload | null = null;
  envioListo = false;

  guardarEscuela(): void {
    if (this.escuelaForm.invalid) {
      this.escuelaForm.markAllAsTouched();
      return;
    }

    const value = this.escuelaForm.getRawValue();
    this.payloadEscuela = {
      nombreEscuela: value.nombreEscuela.trim(),
      codigoEscuela: value.codigoEscuela.trim().toUpperCase(),
      direccion: value.direccion.trim(),
      ciudadPueblo: value.ciudadPueblo.trim(),
      departamento: value.departamento,
      telefono: value.telefono.trim(),
      correo: value.correo.trim().toLowerCase(),
      estado: value.estado
    };
    this.envioListo = true;
  }

  limpiarFormulario(): void {
    this.escuelaForm.reset({
      nombreEscuela: '',
      codigoEscuela: '',
      direccion: '',
      ciudadPueblo: '',
      departamento: '',
      telefono: '',
      correo: '',
      estado: 'ACTIVA'
    });
    this.payloadEscuela = null;
    this.envioListo = false;
  }
}
