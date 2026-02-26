import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceDialogComponent } from './price-dialog.component';

describe('PriceDialogComponent', () => {
  let component: PriceDialogComponent;
  let fixture: ComponentFixture<PriceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PriceDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PriceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
