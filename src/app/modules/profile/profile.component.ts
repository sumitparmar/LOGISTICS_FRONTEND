import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  loading = false;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  initForms() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.required]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  loadProfile() {
    this.loading = true;

    this.profileService.getProfile().subscribe({
      next: (res: any) => {
        this.profileForm.patchValue(res.data);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  updateProfile() {
    if (this.profileForm.invalid) return;

    const payload = this.profileForm.getRawValue();

    this.profileService.updateProfile(payload).subscribe();
  }

  changePassword() {
    if (this.passwordForm.invalid) return;

    this.profileService
      .changePassword(this.passwordForm.value)
      .subscribe(() => this.passwordForm.reset());
  }
}
