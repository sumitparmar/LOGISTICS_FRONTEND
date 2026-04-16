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
import { AdminRolesService, Role } from '../../../services/admin-roles.service';
export interface UserFormData {
  name: string;
  email: string;
  role: 'user' | 'admin' | 'business';
  isActive: boolean;
  adminRoleId?: string | null;
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
  roles: Role[] = [];
  constructor(
    private fb: FormBuilder,
    private rolesService: AdminRolesService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadRoles();

    if (this.initialData) {
      this.patchInitialData();
    }

    this.form.get('role')?.valueChanges.subscribe((value) => {
      if (value !== 'admin') {
        this.form.patchValue({ adminRoleId: null });
      }
    });
  }

  ngOnChanges(): void {
    if (this.initialData && this.form) {
      this.patchInitialData();
    }
  }

  private loadRoles(): void {
    this.rolesService.getRoles(1, 1000, '').subscribe({
      next: (res: any) => {
        this.roles = (res?.data || []).filter(
          (role: any) => role.name?.toLowerCase() !== 'super admin',
        );
      },
      error: () => {
        this.roles = [];
      },
    });
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', Validators.required],
      adminRoleId: [null],
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
      adminRoleId: (this.initialData as any).adminRole?._id || null,
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

    if (payload.role !== 'admin') {
      payload.adminRoleId = null;
    }

    this.submitForm.emit(payload);
  }
}
