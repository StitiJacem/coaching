import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DietBuilder } from './diet-builder';

describe('DietBuilder', () => {
  let component: DietBuilder;
  let fixture: ComponentFixture<DietBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DietBuilder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DietBuilder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
