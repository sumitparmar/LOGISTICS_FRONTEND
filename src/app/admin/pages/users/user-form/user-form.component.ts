import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface UserFormData {
  name: string;
  email: string;
  role: 'user' | 'admin' | 'business';
  isActive: boolean;
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit, OnChanges {
  @Input() initialData: UserFormData | null = null;
  @Input() submitting = false;

  @Output() submitForm = new EventEmitter<UserFormData>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();

    if (this.initialData) {
      this.patchInitialData();
    }
  }

  ngOnChanges(): void {
    if (this.initialData && this.form) {
      this.patchInitialData();
    }
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', Validators.required],
      isActive: [true],
    });
  }

  private patchInitialData(): void {
    if (!this.initialData) return;

    this.form.patchValue({
      name: this.initialData.name || '',
      email: this.initialData.email || '',
      role: this.initialData.role || 'user',
      isActive: this.initialData.isActive ?? true,
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: UserFormData = {
      ...this.form.value,
    };

    this.submitForm.emit(payload);
  }
}
