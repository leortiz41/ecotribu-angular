import { Component } from '@angular/core';

@Component({

  selector: 'app-escuela',
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
