import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface SupportTopic {
  icon: string;
  title: string;
  value: string;
  description: string;
  prompt: string;
}

interface ContactChannel {
  icon: string;
  title: string;
  value: string;
  href: string;
  description: string;
}

interface ContactFaq {
  question: string;
  answer: string;
}

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
  selectedTopic = '';
  activeFaqIndex = 0;

  readonly heroImage = {
    src: '/assets/images/movekart-contact-support.png',
    alt: 'Support specialist coordinating delivery assistance',
  };

  readonly businessImage = {
    src: '/assets/images/movekart-about-hero.png',
    alt: 'Courier partner confirming a delivery beside a loaded van',
  };

  readonly supportTopics: SupportTopic[] = [
    {
      icon: 'DL',
      title: 'Delivery Issues',
      value: 'Delivery Issue',
      description: 'Pickup, assignment, delay, cancellation, or delivery completion help.',
      prompt: 'I need help with a delivery issue. Order details: ',
    },
    {
      icon: 'TR',
      title: 'Tracking Support',
      value: 'Tracking Support',
      description: 'Locate a shipment or understand live delivery status updates.',
      prompt: 'I need help tracking my shipment. Tracking/order reference: ',
    },
    {
      icon: 'BP',
      title: 'Business Partnership',
      value: 'Business Partnership',
      description: 'Talk to us about delivery APIs, fulfillment workflows, and volume plans.',
      prompt: 'I want to discuss a business partnership. Business name and monthly delivery volume: ',
    },
    {
      icon: 'DR',
      title: 'Driver Onboarding',
      value: 'Driver Onboarding',
      description: 'Join the courier network or get help with onboarding status.',
      prompt: 'I need help with driver onboarding. City and vehicle type: ',
    },
  ];

  readonly inquiryTypes = this.supportTopics.map((topic) => topic.value);

  readonly contactChannels: ContactChannel[] = [
    {
      icon: 'CS',
      title: 'Customer Support',
      value: 'support@MoveKartlogistics.com',
      href: 'mailto:support@MoveKartlogistics.com',
      description: 'Delivery issues, tracking help, refunds, and order support.',
    },
    {
      icon: 'BI',
      title: 'Business Inquiries',
      value: 'business@MoveKartlogistics.com',
      href: 'mailto:business@MoveKartlogistics.com',
      description: 'Partnerships, APIs, bulk deliveries, and business demos.',
    },
    {
      icon: 'CP',
      title: 'Courier Support',
      value: 'partners@MoveKartlogistics.com',
      href: 'mailto:partners@MoveKartlogistics.com',
      description: 'Courier onboarding, partner support, and network questions.',
    },
  ];

  readonly serviceHighlights = [
    'Live delivery support',
    'Business logistics consultation',
    'Courier partner onboarding',
    'Tracking and order resolution',
  ];

  readonly faqs: ContactFaq[] = [
    {
      question: 'How fast will MoveKart respond?',
      answer:
        'Support requests are captured immediately and routed by inquiry type so the right team can respond.',
    },
    {
      question: 'Can I request a business demo?',
      answer:
        'Yes. Use the business demo button and the form will prepare a business partnership request for you.',
    },
    {
      question: 'Do I need an account to contact support?',
      answer:
        'No. Logged-in customers get their user ID attached automatically, but anyone can submit the form.',
    },
  ];

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
      message: ['', [Validators.required, Validators.minLength(12)]],
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
          this.selectedTopic = '';
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

  chooseTopic(value: string): void {
    const topic = this.supportTopics.find((item) => item.value === value);
    this.selectedTopic = value;
    this.successMessage = '';
    this.errorMessage = '';
    this.contactForm.patchValue({
      inquiryType: value,
      message: topic?.prompt || this.contactForm.value.message,
    });
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  requestBusinessDemo(): void {
    this.chooseTopic('Business Partnership');
  }

  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? -1 : index;
  }
}
