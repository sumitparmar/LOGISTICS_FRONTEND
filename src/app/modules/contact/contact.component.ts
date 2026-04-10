import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      inquiryType: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  submitForm() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    // 🔴 GET LOGGED IN USER
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const payload = {
      userId: user?._id || null,
      name: this.contactForm.value.name,
      email: this.contactForm.value.email,
      phone: this.contactForm.value.phone,
      subject:
        this.contactForm.value.inquiryType +
        ' - ' +
        this.contactForm.value.message,
      priority: 'medium',
    };

    this.http
      .post('http://localhost:5000/api/support/create', payload)
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          this.contactForm.reset();
          console.log('Ticket created', res);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error creating ticket', err);
        },
      });
  }
}
