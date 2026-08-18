import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
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
    this.successMessage = '';
    this.errorMessage = '';

    // 🔴 GET LOGGED IN USER
    const user = JSON.parse(localStorage.getItem('LOGISTICS_USER') || '{}');

    const payload = {
      userId: user?._id || user?.id || null,
      name: this.contactForm.value.name,
      email: this.contactForm.value.email,
      phone: this.contactForm.value.phone,
      subject: this.contactForm.value.inquiryType,
      message: this.contactForm.value.message,
      priority: 'medium',
    };

    this.http
      .post(`${environment.apiBaseUrl}/support/create`, payload)
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          this.contactForm.reset();
          this.successMessage =
            'Your support request has been submitted. Our team will contact you shortly.';
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage =
            err?.error?.message || 'Unable to submit support request.';
        },
      });
  }
}
