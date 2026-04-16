import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DietaryProfile } from './dietary-profile';

describe('DietaryProfile', () => {
  let component: DietaryProfile;
  let fixture: ComponentFixture<DietaryProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DietaryProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DietaryProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
