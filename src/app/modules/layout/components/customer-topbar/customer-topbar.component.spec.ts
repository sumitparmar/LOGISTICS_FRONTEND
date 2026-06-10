import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerTopbarComponent } from './customer-topbar.component';

describe('CustomerTopbarComponent', () => {
  let component: CustomerTopbarComponent;
  let fixture: ComponentFixture<CustomerTopbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerTopbarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerTopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
