import { Routes } from '@angular/router';
import { EscuelaComponent } from './escuela/escuela.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
	{ path: '', component: LoginComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: HomeComponent },
	{ path: 'educativo', component: EscuelaComponent },
	{ path: 'mapa', component: HomeComponent },
	{ path: 'donacion', component: HomeComponent },
	{ path: '**', redirectTo: '' },
];
