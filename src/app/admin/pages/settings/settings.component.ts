import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, Observable, Subject } from 'rxjs';
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
    if (this.showUnsavedChangesConfirm) {
      this.stayOnSettings();
    }
  }

  form!: FormGroup;
  loading = false;
  saving = false;
  showMaintenanceConfirm = false;
  showUnsavedChangesConfirm = false;
  pendingSave = false;
  private pendingDeactivateDecision?: Subject<boolean>;
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

  canDeactivate(): boolean | Observable<boolean> {
    if (!this.form || !this.form.dirty) {
      return true;
    }

    this.showUnsavedChangesConfirm = true;
    document.body.style.overflow = 'hidden';
    this.pendingDeactivateDecision = new Subject<boolean>();

    return this.pendingDeactivateDecision.asObservable();
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
      invoice: this.fb.group({
        legalName: ['', [Validators.maxLength(160)]],
        registeredAddress: ['', [Validators.maxLength(500)]],
        state: ['', [Validators.maxLength(80)]],
        stateCode: ['', [Validators.pattern(/^\d{1,2}$/)]],
        gstin: ['', [Validators.pattern(/^[0-9A-Z]{15}$/i)]],
        pan: ['', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/i)]],
        sacCode: ['', [Validators.maxLength(20)]],
        prefix: ['', [Validators.pattern(/^[A-Z0-9]{2,10}$/i)]],
        financialYearStartMonth: [4, [Validators.required, Validators.min(1), Validators.max(12)]],
        templateVersion: ['1.0', [Validators.required, Validators.maxLength(20)]],
        supportEmail: ['', [Validators.email]],
        supportPhone: ['', [Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
      }),
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

  stayOnSettings(): void {
    this.resolvePendingNavigation(false);
  }

  discardChangesAndLeave(): void {
    this.form.markAsPristine();
    this.resolvePendingNavigation(true);
  }

  private resolvePendingNavigation(leavePage: boolean): void {
    this.showUnsavedChangesConfirm = false;
    document.body.style.overflow = '';
    this.pendingDeactivateDecision?.next(leavePage);
    this.pendingDeactivateDecision?.complete();
    this.pendingDeactivateDecision = undefined;
  }

  private executeSave(): void {
    this.saving = true;

    const payload = {
      ...this.form.value,
      platformName: this.form.value.platformName?.trim(),
      supportEmail: this.form.value.supportEmail?.trim(),
      supportPhone: this.form.value.supportPhone?.trim(),
      invoice: {
        ...this.form.value.invoice,
        legalName: this.form.value.invoice?.legalName?.trim(),
        registeredAddress: this.form.value.invoice?.registeredAddress?.trim(),
        state: this.form.value.invoice?.state?.trim(),
        stateCode: this.form.value.invoice?.stateCode?.trim(),
        gstin: this.form.value.invoice?.gstin?.trim().toUpperCase(),
        pan: this.form.value.invoice?.pan?.trim().toUpperCase(),
        sacCode: this.form.value.invoice?.sacCode?.trim(),
        prefix: this.form.value.invoice?.prefix?.trim().toUpperCase(),
        templateVersion: this.form.value.invoice?.templateVersion?.trim(),
        supportEmail: this.form.value.invoice?.supportEmail?.trim(),
        supportPhone: this.form.value.invoice?.supportPhone?.trim(),
      },
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
    this.pendingDeactivateDecision?.complete();
  }
}
