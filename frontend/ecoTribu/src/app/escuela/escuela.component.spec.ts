import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EscuelaComponent } from './escuela.component';

describe('EscuelaComponent', () => {
  let component: EscuelaComponent;
  let fixture: ComponentFixture<EscuelaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EscuelaComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EscuelaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
