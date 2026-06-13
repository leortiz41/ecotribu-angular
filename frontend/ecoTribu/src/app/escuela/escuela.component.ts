import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EscuelaService } from '../services/escuela.service';

type EstadoEscuela = 'ACTIVA' | 'INACTIVA';

interface EscuelaFormPayload {
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
export class EscuelaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly escuelaService = inject(EscuelaService);

  escuelaEnEdicionId: string | null = null;
  cargando = false;
  mensajeError: string | null = null;
  mensajeExito: string | null = null;

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
    telefono: ['', [Validators.pattern(/^[0-9+\-\s]{8,15}$/)]],
    correo: ['', [Validators.email, Validators.maxLength(120)]],
    estado: ['ACTIVA' as EstadoEscuela, Validators.required]
  });

  payloadEscuela: EscuelaFormPayload | null = null;
  envioListo = false;

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get('edit');
    if (!id) {
      return;
    }

    this.escuelaEnEdicionId = id;
    this.cargarEscuelaParaEdicion(id);
  }

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

    const payloadApi = {
      nombre: this.payloadEscuela.nombreEscuela,
      codigo: this.payloadEscuela.codigoEscuela,
      direccion: this.payloadEscuela.direccion,
      municipio: this.payloadEscuela.ciudadPueblo,
      departamento: this.payloadEscuela.departamento,
      activa: this.payloadEscuela.estado === 'ACTIVA'
    };

    this.cargando = true;
    this.mensajeError = null;
    this.mensajeExito = null;

    const request$ = this.escuelaEnEdicionId
      ? this.escuelaService.actualizarEscuela(this.escuelaEnEdicionId, payloadApi)
      : this.escuelaService.crearEscuela(payloadApi);

    request$.subscribe({
      next: () => {
        this.cargando = false;
        this.envioListo = true;
        this.mensajeExito = this.escuelaEnEdicionId
          ? 'Escuela actualizada correctamente.'
          : 'Escuela creada correctamente.';
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = this.escuelaEnEdicionId
          ? 'No se pudo actualizar la escuela.'
          : 'No se pudo crear la escuela.';
      }
    });
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
    this.mensajeError = null;
    this.mensajeExito = null;

    if (this.escuelaEnEdicionId) {
      this.router.navigate(['/escuela']);
    }
  }

  private cargarEscuelaParaEdicion(id: string): void {
    this.cargando = true;
    this.mensajeError = null;

    this.escuelaService.obtenerEscuelaPorId(id).subscribe({
      next: (res) => {
        const escuela = res.data;
        if (!escuela) {
          this.cargando = false;
          this.mensajeError = 'No se encontró la escuela para editar.';
          return;
        }

        this.escuelaForm.patchValue({
          nombreEscuela: escuela.nombre ?? '',
          codigoEscuela: escuela.codigo ?? '',
          direccion: escuela.direccion ?? '',
          ciudadPueblo: escuela.municipio ?? '',
          departamento: escuela.departamento ?? '',
          telefono: '',
          correo: '',
          estado: escuela.activa ? 'ACTIVA' : 'INACTIVA'
        });

        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible cargar la escuela para edición.';
      }
    });
  }
}
