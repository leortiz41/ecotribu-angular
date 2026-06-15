import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

interface CategoriaReciclaje {
  id: string;
  icono: string;
  titulo: string;
  etiqueta: string;
  color: string;
  descripcion: string;
  ejemplos: string[];
  tip: string;
}

interface PasoReciclaje {
  icono: string;
  titulo: string;
  descripcion: string;
}

interface VideoEducativo {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  urlSegura: SafeResourceUrl;
}

interface HechoCurioso {
  icono: string;
  texto: string;
  tag: string;
}

interface ActorEcosistema {
  icono: string;
  titulo: string;
  descripcion: string;
}

interface PreguntaQuiz {
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

@Component({
  selector: 'app-educacion-reciclaje',
  standalone: true,
  imports: [NgFor, NgIf, NgOptimizedImage, RouterLink],
  templateUrl: './educacion-reciclaje.component.html',
  styleUrls: ['./educacion-reciclaje.component.css'],
})
export class EducacionReciclajeComponent {

  categoriaAbierta: string | null = null;
  videoActivo = 2;
  preguntaActual = 0;
  respuestaSeleccionada: number | null = null;
  puntajeQuiz = 0;
  quizFinalizado = false;

  readonly categorias: ReadonlyArray<CategoriaReciclaje> = [
    {
      id: 'vidrio',
      icono: '🟩',
      titulo: 'Vidrio',
      etiqueta: 'Contenedor verde',
      color: '#16a34a',
      descripcion: 'El vidrio es 100% reciclable y se puede reutilizar infinitas veces sin perder calidad. Separarlo correctamente ahorra mucha energía.',
      ejemplos: ['Botellas de refresco', 'Tarros de conserva', 'Frascos de perfume', 'Botellas de vino'],
      tip: 'Retira las tapas metálicas antes de depositar el vidrio. No incluyas espejos, cerámica ni cristal de ventana.',
    },
    {
      id: 'papel',
      icono: '🟦',
      titulo: 'Papel y cartón',
      etiqueta: 'Contenedor azul',
      color: '#1d4ed8',
      descripcion: 'Reciclar papel salva árboles y reduce el consumo de agua. Una tonelada de papel reciclado ahorra 17 árboles y 26,500 litros de agua.',
      ejemplos: ['Periódicos', 'Cajas de cartón', 'Cuadernos', 'Envases de cereales', 'Revistas'],
      tip: 'Aplana las cajas antes de depositarlas para ocupar menos espacio en el contenedor.',
    },
    {
      id: 'plastico',
      icono: '🟨',
      titulo: 'Plástico y latas',
      etiqueta: 'Contenedor amarillo',
      color: '#ca8a04',
      descripcion: 'El plástico tarda cientos de años en degradarse. Reciclarlo reduce drásticamente la contaminación de océanos y suelos.',
      ejemplos: ['Botellas de agua', 'Envases de shampoo', 'Bolsas plásticas', 'Latas de aluminio', 'Envases de yogur'],
      tip: 'Enjuaga los envases antes de reciclarlos para no contaminar otros materiales.',
    },
    {
      id: 'organico',
      icono: '🟫',
      titulo: 'Residuos orgánicos',
      etiqueta: 'Contenedor marrón',
      color: '#92400e',
      descripcion: 'Los residuos orgánicos pueden convertirse en compost, un fertilizante natural que devuelve nutrientes al suelo.',
      ejemplos: ['Restos de frutas', 'Verduras', 'Cáscaras de huevo', 'Posos de café', 'Restos de jardín'],
      tip: 'El compostaje casero es muy sencillo y convierte tu basura orgánica en abono para plantas.',
    },
    {
      id: 'peligroso',
      icono: '🔴',
      titulo: 'Residuos peligrosos',
      etiqueta: 'Puntos limpios',
      color: '#dc2626',
      descripcion: 'Pilas, medicamentos y productos electrónicos contienen sustancias tóxicas. Nunca los tires en la basura común.',
      ejemplos: ['Pilas y baterías', 'Medicamentos caducados', 'Aceite de cocina', 'Pinturas', 'Teléfonos viejos'],
      tip: 'Busca el punto limpio más cercano en tu ciudad para depositarlos de forma segura y responsable.',
    },
  ];

  readonly pasosProceso: ReadonlyArray<PasoReciclaje> = [
    { icono: '🏠', titulo: 'Separación', descripcion: 'Clasificamos los residuos en casa por tipo de material.' },
    { icono: '🚛', titulo: 'Recolección', descripcion: 'El servicio de limpieza recoge los contenedores por separado.' },
    { icono: '🏭', titulo: 'Planta recicladora', descripcion: 'Los materiales se procesan, limpian y transforman.' },
    { icono: '📦', titulo: 'Materia prima', descripcion: 'Se obtiene material reciclado de alta calidad.' },
    { icono: '🛍️', titulo: 'Nuevo producto', descripcion: 'Fabricantes crean productos nuevos con ese material.' },
    { icono: '♻️', titulo: 'Ciclo cerrado', descripcion: 'El ciclo se reinicia reduciendo residuos al mínimo.' },
  ];

  readonly videos: ReadonlyArray<VideoEducativo>;

  readonly hechos: ReadonlyArray<HechoCurioso> = [
    { icono: '🌊', texto: 'Hay una isla de basura plástica en el Pacífico que es 3 veces más grande que Francia.', tag: 'Océanos' },
    { icono: '⚡', texto: 'Reciclar una lata de aluminio ahorra suficiente energía para mantener una TV encendida 3 horas.', tag: 'Energía' },
    { icono: '🌳', texto: 'Cada tonelada de papel reciclado salva 17 árboles y 4,100 kWh de electricidad.', tag: 'Bosques' },
    { icono: '💧', texto: 'Producir una botella plástica consume 2 litros de agua. Reciclarla usa un 88% menos.', tag: 'Agua' },
    { icono: '🐢', texto: 'Más de 1 millón de aves marinas y 100,000 mamíferos mueren por plástico cada año.', tag: 'Biodiversidad' },
    { icono: '🌡️', texto: 'El reciclaje global podría reducir las emisiones de CO₂ en un 3.6 millones de toneladas al año.', tag: 'Clima' },
    { icono: '💼', texto: 'La industria del reciclaje genera más de 1.5 millones de empleos solo en América Latina.', tag: 'Economía' },
    { icono: '🧴', texto: 'Solo el 9% del plástico producido en la historia ha sido reciclado.', tag: 'Datos alarmantes' },
  ];

  readonly actoresEcosistema: ReadonlyArray<ActorEcosistema> = [
    { icono: '👨‍👩‍👧', titulo: 'Ciudadanos', descripcion: 'Primer eslabón: separamos y depositamos los residuos correctamente.' },
    { icono: '🏫', titulo: 'Escuelas', descripcion: 'Educan sobre reciclaje y forman hábitos desde la infancia.' },
    { icono: '🏛️', titulo: 'Municipios', descripcion: 'Gestionan la recolección y los puntos de reciclaje locales.' },
    { icono: '🏭', titulo: 'Plantas recicladoras', descripcion: 'Procesan los materiales y los convierten en materia prima.' },
    { icono: '🏢', titulo: 'Empresas', descripcion: 'Usan materiales reciclados y financian programas verdes.' },
    { icono: '🌿', titulo: 'ONGs ambientales', descripcion: 'Sensibilizan, presionan y generan proyectos de impacto.' },
    { icono: '👷', titulo: 'Recicladores informales', descripcion: 'Recuperan materiales valiosos y generan sustento familiar.' },
    { icono: '📱', titulo: 'Tecnología', descripcion: 'Apps, sensores y big data optimizan rutas y procesos.' },
  ];

  readonly preguntasQuiz: ReadonlyArray<PreguntaQuiz> = [
    {
      enunciado: '¿En qué contenedor va una botella de vidrio de refresco?',
      opciones: ['Contenedor azul', 'Contenedor verde', 'Contenedor amarillo', 'Basura común'],
      correcta: 1,
      explicacion: 'Las botellas de vidrio van en el contenedor verde.',
    },
    {
      enunciado: '¿Cuánto tiempo tarda en degradarse una bolsa plástica?',
      opciones: ['10 años', '50 años', '150 años', 'Entre 400 y 1000 años'],
      correcta: 3,
      explicacion: 'Las bolsas plásticas pueden tardar entre 400 y 1000 años en degradarse.',
    },
    {
      enunciado: '¿Qué es el compostaje?',
      opciones: ['Un tipo de plástico reciclado', 'Proceso de transformar materia orgánica en abono', 'Un método para reciclar vidrio', 'Una planta industrial de reciclaje'],
      correcta: 1,
      explicacion: 'El compostaje convierte residuos orgánicos en fertilizante natural.',
    },
    {
      enunciado: '¿Cuántos árboles se salvan al reciclar una tonelada de papel?',
      opciones: ['5 árboles', '17 árboles', '50 árboles', '100 árboles'],
      correcta: 1,
      explicacion: 'Reciclar una tonelada de papel salva aproximadamente 17 árboles.',
    },
    {
      enunciado: '¿Dónde deben depositarse las pilas y baterías usadas?',
      opciones: ['Basura orgánica', 'Contenedor azul', 'Punto limpio especial', 'Contenedor amarillo'],
      correcta: 2,
      explicacion: 'Las pilas contienen metales pesados tóxicos. Siempre deben ir a un punto limpio.',
    },
  ];

  readonly tipsCasa: ReadonlyArray<string> = [
    'Coloca pequeños contenedores separados en casa para cada tipo de residuo.',
    'Enjuaga los envases antes de reciclarlos para evitar contaminar otros materiales.',
    'Aplana cajas y botellas para ahorrar espacio en los contenedores.',
    'Compra productos con menos embalaje o con envases reciclados.',
    'Usa bolsas reutilizables cuando vayas a comprar.',
    'Lleva las pilas y medicamentos caducados al punto limpio más cercano.',
    'Composta los residuos de cocina si tienes espacio (incluso en macetas).',
    'Busca en tu municipio los puntos limpios para residuos especiales.',
    'Repara antes de tirar: muebles, ropa y electrodomésticos.',
    'Enséñales a los niños a separar desde pequeños; los hábitos duran toda la vida.',
  ];

  constructor(private readonly sanitizer: DomSanitizer) {
    this.videos = [
      {
        etiqueta: '¿Qué es reciclar?',
        titulo: 'Introducción al reciclaje',
        descripcion: 'Una explicación clara y visual sobre qué es el reciclaje, por qué es importante y cómo comenzar desde casa con pasos sencillos.',
        urlSegura: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/T8H8g0eYRjs'),
      },
      {
        etiqueta: 'Los 5 contenedores',
        titulo: 'Cómo separar correctamente la basura',
        descripcion: 'Aprende a identificar cada contenedor de reciclaje y qué materiales van en cada uno para hacerlo de manera correcta y eficiente.',
        urlSegura: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/cXd8xKEeW7U'),
      },
      {
        etiqueta: 'Plástico en océanos',
        titulo: 'La contaminación por plástico',
        descripcion: 'Descubre el impacto devastador del plástico en los océanos y ecosistemas marinos, y qué podemos hacer para revertirlo.',
        urlSegura: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/aWZFhquco9E'),
      },
      {
        etiqueta: 'Economía circular',
        titulo: 'El futuro: economía circular',
        descripcion: 'La economía circular es el modelo que eliminará el concepto de "basura". Conoce cómo funciona y por qué es la solución definitiva.',
        urlSegura: this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/xfYkpCO3vSg'),
      },
    ];
  }

  toggleCategoria(id: string): void {
    this.categoriaAbierta = this.categoriaAbierta === id ? null : id;
  }

  responder(opcionIndex: number): void {
    if (this.respuestaSeleccionada !== null) {
      return;
    }

    this.respuestaSeleccionada = opcionIndex;

    if (opcionIndex === this.preguntasQuiz[this.preguntaActual].correcta) {
      this.puntajeQuiz++;
    }
  }

  siguientePregunta(): void {
    if (this.preguntaActual < this.preguntasQuiz.length - 1) {
      this.preguntaActual++;
      this.respuestaSeleccionada = null;
    } else {
      this.quizFinalizado = true;
    }
  }

  reiniciarQuiz(): void {
    this.preguntaActual = 0;
    this.respuestaSeleccionada = null;
    this.puntajeQuiz = 0;
    this.quizFinalizado = false;
  }
}
