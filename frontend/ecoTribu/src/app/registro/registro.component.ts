import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface CampoCapturado {
  campo: string;
  tipoDato: string;
  descripcion: string;
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink, NgOptimizedImage],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  formularioRegistro = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', Validators.required]
  }, { validators: this.passwordsIguales });

  camposCapturados: CampoCapturado[] = [];

  constructor(private fb: FormBuilder) {}

  passwordsIguales(formGroup: any) {
    const password = formGroup.get('password')?.value;
    const confirmarPassword = formGroup.get('confirmarPassword')?.value;
    return password === confirmarPassword ? null : { passwordsNoIguales: true };
  }

  onSubmit() {
    if (this.formularioRegistro.valid) {
      const { nombre, email, password } = this.formularioRegistro.value;
      this.camposCapturados.push({ campo: 'Nombre', tipoDato: 'Texto', descripcion: nombre });
      this.camposCapturados.push({ campo: 'Email', tipoDato: 'Correo Electrónico', descripcion: email });
      this.camposCapturados.push({ campo: 'Password', tipoDato: 'Contraseña', descripcion: '********' });
      console.log('Campos Capturados:', this.camposCapturados);
      // Aquí podrías enviar los datos a un servidor o realizar otras acciones
    }
  }     

  readonly tiposDato = [
    
  ];

  