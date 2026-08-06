import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationPickerModalComponent } from './location-picker-modal.component';

describe('LocationPickerModalComponent', () => {
  let component: LocationPickerModalComponent;
  let fixture: ComponentFixture<LocationPickerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocationPickerModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationPickerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
