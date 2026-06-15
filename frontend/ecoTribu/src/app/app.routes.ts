import { Routes } from '@angular/router';
import { EscuelaComponent } from './escuela/escuela.component';
import { IniciarSesionComponent } from './iniciar-sesion/iniciar-sesion.component';
import { LoginComponent } from './login/login.component';
import { PerfilAdministradorComponent } from './perfil-administrador/perfil-administrador.component';
import { PerfilAlumnoComponent } from './perfil-alumno/perfil-alumno.component';
import { PerfilProfesorComponent } from './perfil-profesor/perfil-profesor.component';
import { RegistroComponent } from './registro/registro.component';
import { EducacionReciclajeComponent } from './educacion-reciclaje/educacion-reciclaje.component';

export const routes: Routes = [
	{ path: '', component: LoginComponent },
	{ path: 'iniciar-sesion', component: IniciarSesionComponent },
	{ path: 'registro', component: RegistroComponent },
	{ path: 'perfil-alumno', component: PerfilAlumnoComponent },
	{ path: 'perfil-profesor', component: PerfilProfesorComponent },
	{ path: 'perfil-administrador', component: PerfilAdministradorComponent },
	{ path: 'escuela', component: EscuelaComponent },
	{ path: 'educacion-reciclaje', component: EducacionReciclajeComponent },
	{ path: 'educacionReciclaje', component: EducacionReciclajeComponent },
	{ path: '**', redirectTo: '' },
];
