import { Routes } from '@angular/router';
import { EscuelaComponent } from './escuela/escuela.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
	{ path: '', component: LoginComponent },
	{ path: 'iniciar-sesion', component: LoginComponent },
	{ path: 'register', redirectTo: '' },
	{ path: 'educativo', component: EscuelaComponent },
	{ path: 'mapa', redirectTo: '' },
	{ path: 'donacion', redirectTo: '' },
	{ path: '**', redirectTo: '' },
];
