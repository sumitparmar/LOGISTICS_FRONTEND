import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupportComponent } from './support.component';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { AdminSupportService } from '../../services/admin-support.service';

class MockAdminSupportService {
  getTickets() {
    return of({ data: [] });
  }

  getTicketById() {
    return of({ data: { messages: [] } });
  }

  replyToTicket() {
    return of({});
  }

  updateStatus() {
    return of({});
  }
}

describe('SupportComponent', () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupportComponent],
      imports: [FormsModule],
      providers: [
        { provide: AdminSupportService, useClass: MockAdminSupportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
