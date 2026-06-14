import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RetoDisponibleAlumno } from '../services/perfil-alumno.service';

export interface PuntoRecoleccionAlumno {
  nombre: string;
  ciudad: string;
}

export interface EvidenciaRetoPayload {
  descripcion: string;
  archivoUrl: string;
  puntoRecoleccionNombre: string;
  puntoRecoleccionCiudad: string;
}

@Component({
  selector: 'app-evidencia-reto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './evidencia-reto.component.html',
  styleUrls: ['./evidencia-reto.component.css'],
})
export class EvidenciaRetoComponent {
  private readonly fb = inject(FormBuilder);

  @Input({ required: true }) reto: RetoDisponibleAlumno | null = null;
  @Input() enviando = false;
  @Input() puntosRecoleccion: ReadonlyArray<PuntoRecoleccionAlumno> = [];

  @Output() cancelar = new EventEmitter<void>();
  @Output() enviar = new EventEmitter<EvidenciaRetoPayload>();

  readonly evidenciaForm = this.fb.nonNullable.group({
    puntoRecoleccionIndice: [-1, [Validators.required, Validators.min(0)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    archivoUrl: ['', Validators.required],
  });

  vistaPreviaArchivo: string | null = null;
  mensajeArchivo: string | null = null;

  get puedeEnviar(): boolean {
    return this.evidenciaForm.valid && !this.enviando;
  }

  cerrar(): void {
    if (this.enviando) {
      return;
    }

    this.cancelar.emit();
  }

  seleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];

    this.mensajeArchivo = null;

    if (!archivo) {
      return;
    }

    const esImagen = archivo.type.startsWith('image/');
    if (!esImagen) {
      this.vistaPreviaArchivo = null;
      this.evidenciaForm.patchValue({ archivoUrl: '' });
      this.mensajeArchivo = 'Selecciona una imagen valida (JPG, PNG, WEBP).';
      return;
    }

    const maxBytes = 4 * 1024 * 1024;
    if (archivo.size > maxBytes) {
      this.vistaPreviaArchivo = null;
      this.evidenciaForm.patchValue({ archivoUrl: '' });
      this.mensajeArchivo = 'La imagen supera 4MB. Reduce su tamaño e intenta de nuevo.';
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      const resultado = typeof lector.result === 'string' ? lector.result : '';
      this.vistaPreviaArchivo = resultado || null;
      this.evidenciaForm.patchValue({ archivoUrl: resultado });
    };

    lector.onerror = () => {
      this.vistaPreviaArchivo = null;
      this.evidenciaForm.patchValue({ archivoUrl: '' });
      this.mensajeArchivo = 'No fue posible leer la imagen. Intenta con otro archivo.';
    };

    lector.readAsDataURL(archivo);
  }

  enviarEvidencia(): void {
    this.evidenciaForm.markAllAsTouched();

    if (!this.puedeEnviar) {
      return;
    }

    const valor = this.evidenciaForm.getRawValue();
    const punto = this.puntosRecoleccion[valor.puntoRecoleccionIndice];

    if (!punto) {
      this.mensajeArchivo = 'Selecciona un punto de recoleccion valido.';
      return;
    }

    this.enviar.emit({
      descripcion: valor.descripcion.trim(),
      archivoUrl: valor.archivoUrl,
      puntoRecoleccionNombre: punto.nombre,
      puntoRecoleccionCiudad: punto.ciudad,
    });
  }
}
