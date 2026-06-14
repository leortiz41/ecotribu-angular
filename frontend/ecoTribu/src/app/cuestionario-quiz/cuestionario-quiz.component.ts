import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CuestionarioDisponibleAlumno, PreguntaCuestionarioAlumno } from '../services/perfil-alumno.service';

export interface QuizCompletadoPayload {
  respuestas: Array<string | number | number[] | null>;
  forzadoPorTiempo?: boolean;
}

@Component({
  selector: 'app-cuestionario-quiz',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './cuestionario-quiz.component.html',
  styleUrls: ['./cuestionario-quiz.component.css'],
})
export class CuestionarioQuizComponent implements OnChanges {
  @Input({ required: true }) cuestionario: CuestionarioDisponibleAlumno | null = null;
  @Input() enviando = false;

  @Output() cancelar = new EventEmitter<void>();
  @Output() completar = new EventEmitter<QuizCompletadoPayload>();

  respuestasSeleccionadas: Array<string | number | number[] | null> = [];
  tiempoRestanteSegundos = 0;
  tiempoAgotado = false;

  private temporizadorId: ReturnType<typeof setInterval> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cuestionario']) {
      this.inicializarRespuestas();
      this.inicializarTemporizador();
    }
  }

  ngOnDestroy(): void {
    this.detenerTemporizador();
  }

  get preguntas(): ReadonlyArray<PreguntaCuestionarioAlumno> {
    return this.cuestionario?.preguntas ?? [];
  }

  get puedeEnviar(): boolean {
    if (this.tiempoAgotado) {
      return false;
    }

    if (!this.cuestionario || this.preguntas.length === 0) {
      return false;
    }

    return this.preguntas.every((_, index) => this.respuestaValida(this.respuestasSeleccionadas[index]));
  }

  get tiempoRestanteTexto(): string {
    const minutos = Math.floor(this.tiempoRestanteSegundos / 60)
      .toString()
      .padStart(2, '0');
    const segundos = (this.tiempoRestanteSegundos % 60)
      .toString()
      .padStart(2, '0');
    return `${minutos}:${segundos}`;
  }

  get preguntasRespondidas(): number {
    return this.respuestasSeleccionadas.filter((respuesta) => this.respuestaValida(respuesta)).length;
  }

  get progresoPorcentaje(): number {
    const totalPreguntas = this.preguntas.length;
    if (totalPreguntas === 0) {
      return 0;
    }

    return Math.round((this.preguntasRespondidas / totalPreguntas) * 100);
  }

  get erroresPermitidos(): number {
    const totalPreguntas = this.preguntas.length;
    if (totalPreguntas === 0) {
      return 0;
    }

    const respuestasMinimasParaAprobar = Math.ceil(totalPreguntas * 0.6);
    return Math.max(0, totalPreguntas - respuestasMinimasParaAprobar);
  }

  seleccionarOpcion(preguntaIndex: number, opcionIndex: number): void {
    if (this.tiempoAgotado) {
      return;
    }

    this.respuestasSeleccionadas[preguntaIndex] = opcionIndex;
  }

  seleccionarVerdaderoFalso(preguntaIndex: number, valor: boolean): void {
    if (this.tiempoAgotado) {
      return;
    }

    this.respuestasSeleccionadas[preguntaIndex] = valor ? 'verdadero' : 'falso';
  }

  actualizarRespuestaTexto(preguntaIndex: number, valor: string): void {
    if (this.tiempoAgotado) {
      return;
    }

    this.respuestasSeleccionadas[preguntaIndex] = valor;
  }

  esOpcionSeleccionada(preguntaIndex: number, opcionIndex: number): boolean {
    return this.respuestasSeleccionadas[preguntaIndex] === opcionIndex;
  }

  enviarRespuestas(): void {
    this.enviarRespuestasInterno(false);
  }

  private enviarRespuestasInterno(forzadoPorTiempo: boolean): void {
    if (!this.puedeEnviar || this.enviando) {
      if (!forzadoPorTiempo) {
        return;
      }
    }

    if (this.enviando) {
      return;
    }

    this.detenerTemporizador();

    this.completar.emit({
      respuestas: [...this.respuestasSeleccionadas],
      forzadoPorTiempo,
    });
  }

  cerrar(): void {
    if (this.enviando) {
      return;
    }

    this.detenerTemporizador();

    this.cancelar.emit();
  }

  private inicializarRespuestas(): void {
    const totalPreguntas = this.preguntas.length;
    this.respuestasSeleccionadas = Array.from({ length: totalPreguntas }, () => null);
  }

  private inicializarTemporizador(): void {
    this.detenerTemporizador();
    this.tiempoAgotado = false;

    const totalPreguntas = this.preguntas.length;
    const segundosCalculados = Math.max(120, totalPreguntas * 45);
    this.tiempoRestanteSegundos = segundosCalculados;

    if (totalPreguntas === 0) {
      return;
    }

    this.temporizadorId = setInterval(() => {
      if (this.tiempoRestanteSegundos <= 1) {
        this.tiempoRestanteSegundos = 0;
        this.tiempoAgotado = true;
        this.detenerTemporizador();
        this.enviarRespuestasInterno(true);
        return;
      }

      this.tiempoRestanteSegundos -= 1;
    }, 1000);
  }

  private detenerTemporizador(): void {
    if (!this.temporizadorId) {
      return;
    }

    clearInterval(this.temporizadorId);
    this.temporizadorId = null;
  }

  private respuestaValida(respuesta: string | number | number[] | null): boolean {
    if (respuesta === null || respuesta === undefined) {
      return false;
    }

    if (typeof respuesta === 'string') {
      return respuesta.trim().length > 0;
    }

    if (Array.isArray(respuesta)) {
      return respuesta.length > 0;
    }

    return true;
  }
}
