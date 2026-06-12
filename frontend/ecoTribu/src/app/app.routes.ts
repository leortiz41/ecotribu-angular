import { Routes } from '@angular/router';
import { EscuelaComponent } from './escuela/escuela.component';
import { IniciarSesionComponent } from './iniciar-sesion/iniciar-sesion.component';
import { LoginComponent } from './login/login.component';
import { RegistroComponent } from './registro/registro.component';

export const routes: Routes = [
	{ path: '', component: LoginComponent },
	{ path: 'iniciar-sesion', component: IniciarSesionComponent },
	{ path: 'register', component: RegistroComponent },
	{ path: 'educativo', component: EscuelaComponent },
	{ path: '**', redirectTo: '' },
];
