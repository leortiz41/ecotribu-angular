import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes'; 



@Component({

  selector: 'app-escuela',
  imports: [FormsModule],
  templateUrl: './escuela.component.html',
  styleUrl: './escuela.component.css'
})
export class EscuelaComponent {
  escuela = [
    {
      "id": 1,
      "name": "Escuela Primaria",
      "address": "Calle Principal 123",
      "phone": "555-1234"
    }
  ]

}
