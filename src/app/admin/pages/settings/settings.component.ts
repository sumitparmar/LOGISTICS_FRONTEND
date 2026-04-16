import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminSettingsService } from '../../services/admin-settings.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  form!: FormGroup;

  loading = false;
  saving = false;

  settingsData: any = null;
  originalSettings: any = null;

  timezoneOptions = [
    'Asia/Kolkata',
    'UTC',
    'Europe/London',
    'America/New_York',
  ];

  currencyOptions = ['INR', 'USD', 'EUR', 'GBP'];

  constructor(
    private fb: FormBuilder,
    private settingsService: AdminSettingsService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      platformName: ['', [Validators.required, Validators.minLength(2)]],
      supportEmail: ['', [Validators.email]],
      supportPhone: [''],

      timezone: ['Asia/Kolkata', Validators.required],
      currency: ['INR', Validators.required],

      maintenanceMode: [false],
      allowRegistrations: [true],

      newOrderAlerts: [true],
      supportAlerts: [true],

      sessionTimeoutMinutes: [
        60,
        [Validators.required, Validators.min(5), Validators.max(1440)],
      ],
    });
  }

  loadSettings(): void {
    this.loading = true;

    this.settingsService
      .getSettings()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          this.settingsData = res?.data || {};
          this.originalSettings = { ...this.settingsData };

          this.form.patchValue(this.originalSettings);
        },
        error: () => {
          this.toast.error('Failed to load settings');
        },
      });
  }

  onSave(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    this.settingsService
      .updateSettings(this.form.value)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (res: any) => {
          this.settingsData = res?.data || {};
          this.originalSettings = { ...this.settingsData };

          this.form.patchValue(this.originalSettings);

          this.toast.success('Settings updated successfully');
        },
        error: () => {
          this.toast.error('Failed to save settings');
        },
      });
  }

  onReset(): void {
    if (!this.originalSettings) return;

    this.form.patchValue({ ...this.originalSettings });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
