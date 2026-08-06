import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationPickerDialogComponent } from './location-picker-dialog.component';

describe('LocationPickerDialogComponent', () => {
  let component: LocationPickerDialogComponent;
  let fixture: ComponentFixture<LocationPickerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocationPickerDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationPickerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
