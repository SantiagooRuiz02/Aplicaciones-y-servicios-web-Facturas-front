import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumeralComponent } from './numeral.component';

describe('NumeralComponent', () => {
  let component: NumeralComponent;
  let fixture: ComponentFixture<NumeralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumeralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumeralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
