import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ShellComponent } from './shell.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { SocketService } from 'src/app/core/services/socket.service';
import { CustomerNotificationService } from 'src/app/modules/notifications/services/customer-notification.service';

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShellComponent],
      providers: [
        { provide: AuthService, useValue: { getUser: () => null } },
        { provide: Router, useValue: {} },
        { provide: SocketService, useValue: {} },
        { provide: CustomerNotificationService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
