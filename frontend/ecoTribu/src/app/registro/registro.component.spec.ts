import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RegistroComponent } from './registro.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';

const authServiceMock = {
  obtenerEscuelas: () => of({ success: true, message: 'Escuelas cargadas.', data: [] }),
  registrarUsuario: () => of({ success: true, message: 'Usuario creado.' }),
};

describe('RegistroComponent', () => {
  let component: RegistroComponent;
  let fixture: ComponentFixture<RegistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
