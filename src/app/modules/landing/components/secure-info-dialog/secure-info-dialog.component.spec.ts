import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecureInfoDialogComponent } from './secure-info-dialog.component';

describe('SecureInfoDialogComponent', () => {
  let component: SecureInfoDialogComponent;
  let fixture: ComponentFixture<SecureInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SecureInfoDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecureInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
