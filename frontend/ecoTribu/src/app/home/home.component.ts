import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'

})
export class HomeComponent {
users = [ 
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "usuario"
}

]
}
