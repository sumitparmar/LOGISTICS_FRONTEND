import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminSettingsService } from '../../services/admin-settings.service';
import { ToastService } from '../../services/toast.service';
import { PendingChangesComponent } from 'src/app/core/guards/pending-changes.guard';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent
  implements OnInit, OnDestroy, PendingChangesComponent
{
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.showMaintenanceConfirm) {
      this.closeMaintenanceModal();
    }
  }

  form!: FormGroup;
  loading = false;
  saving = false;
  showMaintenanceConfirm = false;
  pendingSave = false;
  settingsData: any = null;
  originalSettings: any = null;
  auditLogs: any[] = [];
  timezoneOptions = [
    'Asia/Kolkata',
    'UTC',
    'Europe/London',
    'America/New_York',
  ];

  currencyOptions = ['INR', 'USD', 'EUR', 'GBP'];

  get canSave(): boolean {
    return (
      !!this.form &&
      this.form.dirty &&
      this.form.valid &&
      !this.loading &&
      !this.saving
    );
  }

  get canReset(): boolean {
    return !!this.form && this.form.dirty && !this.loading && !this.saving;
  }

  constructor(
    private fb: FormBuilder,
    private settingsService: AdminSettingsService,
    private toast: ToastService,
  ) {}

  canDeactivate(): boolean {
    if (!this.form || !this.form.dirty) {
      return true;
    }

    return window.confirm('You have unsaved changes. Leave this page anyway?');
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadSettings();
    this.loadAuditLogs();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      platformName: ['', [Validators.required, Validators.minLength(2)]],

      supportEmail: ['', [Validators.email]],

      supportPhone: ['', [Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
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
          this.form.markAsPristine();
          this.form.markAsUntouched();
        },
        error: () => {
          this.toast.error('Failed to load settings');
        },
      });
  }

  loadAuditLogs(): void {
    this.settingsService.getAuditLogs().subscribe({
      next: (res: any) => {
        this.auditLogs = res?.data || [];
      },
      error: () => {
        this.auditLogs = [];
      },
    });
  }

  onSave(): void {
    if (!this.canSave) {
      this.form.markAllAsTouched();
      return;
    }

    const turningMaintenanceOn =
      this.form.value.maintenanceMode &&
      !this.originalSettings?.maintenanceMode;

    if (turningMaintenanceOn) {
      this.openMaintenanceModal();
      return;
    }

    this.executeSave();
  }

  onReset(): void {
    if (!this.originalSettings) return;

    this.form.patchValue({ ...this.originalSettings });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private openMaintenanceModal(): void {
    this.showMaintenanceConfirm = true;
    this.pendingSave = true;
    document.body.style.overflow = 'hidden';
  }

  closeMaintenanceModal(): void {
    this.showMaintenanceConfirm = false;
    this.pendingSave = false;
    document.body.style.overflow = '';
  }

  confirmMaintenanceSave(): void {
    this.closeMaintenanceModal();
    this.executeSave();
  }

  cancelMaintenanceSave(): void {
    this.closeMaintenanceModal();

    this.form.patchValue({
      maintenanceMode: false,
    });
  }

  private executeSave(): void {
    this.saving = true;

    const payload = {
      ...this.form.value,
      platformName: this.form.value.platformName?.trim(),
      supportEmail: this.form.value.supportEmail?.trim(),
      supportPhone: this.form.value.supportPhone?.trim(),
    };

    this.settingsService
      .updateSettings(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (res: any) => {
          this.settingsData = res?.data || {};
          this.originalSettings = { ...this.settingsData };

          this.form.patchValue(this.originalSettings);
          this.form.markAsPristine();
          this.form.markAsUntouched();

          this.toast.success('Settings updated successfully');
          this.loadAuditLogs();
        },
        error: () => {
          this.toast.error('Failed to save settings');
        },
      });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
