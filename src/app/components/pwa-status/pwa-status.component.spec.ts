import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PwaStatusComponent } from './pwa-status.component';

describe('PwaStatusComponent', () => {
  let component: PwaStatusComponent;
  let fixture: ComponentFixture<PwaStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PwaStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PwaStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
