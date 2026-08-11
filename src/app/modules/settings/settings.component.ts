import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { AddressService } from 'src/app/core/services/address.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { ProfileService } from 'src/app/core/services/profile.service';
import { AppTheme, ThemeService } from 'src/app/core/services/theme.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

interface SavedAddress {
  _id: string;
  label?: string;
  name?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  createdAt?: string;
}

interface UserProfile {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  deliveryMode?: string;
  authProvider?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

@Component({
  selector: 'app-user-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  profile: UserProfile | null = null;
  savedAddresses: SavedAddress[] = [];
  currentTheme: AppTheme = this.themeService.currentTheme;

  loadingProfile = true;
  loadingAddresses = true;
  savingProfile = false;
  savingPassword = false;
  deletingAddressId: string | null = null;
  addressPendingDelete: SavedAddress | null = null;
  profileError = '';
  addressError = '';

  private themeSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private addressService: AddressService,
    private themeService: ThemeService,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
    this.loadAddresses();

    this.themeSub = this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedProfileChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  get initials(): string {
    const source = this.profile?.name || this.profile?.email || 'MK';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  get accountStatus(): string {
    if (this.profile?.isPhoneVerified || this.profile?.isEmailVerified) {
      return 'Verified account';
    }

    return 'Verification pending';
  }

  get authLabel(): string {
    const provider = this.profile?.authProvider;
    if (!provider) return 'Standard sign in';
    return provider === 'otp' ? 'OTP sign in' : `${provider} sign in`;
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, [Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(8)]],
      businessName: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  loadProfile(): void {
    this.loadingProfile = true;
    this.profileError = '';

    this.profileService
      .getProfile()
      .pipe(finalize(() => (this.loadingProfile = false)))
      .subscribe({
        next: (res: any) => {
          const user = res?.data || res || this.authService.getUser();
          this.applyProfile(user);
        },
        error: () => {
          const cachedUser = this.authService.getUser();
          if (cachedUser) {
            this.applyProfile(cachedUser);
            this.profileError =
              'Showing saved account details. Refresh to try loading the latest profile.';
            return;
          }

          this.profileError = 'Unable to load your account details.';
        },
      });
  }

  loadAddresses(): void {
    this.loadingAddresses = true;
    this.addressError = '';

    this.addressService
      .getAddresses()
      .pipe(finalize(() => (this.loadingAddresses = false)))
      .subscribe({
        next: (res: any) => {
          this.savedAddresses = res?.data || [];
        },
        error: () => {
          this.addressError = 'Unable to load saved addresses.';
        },
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.hasUnsavedProfileChanges()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    const raw = this.profileForm.getRawValue();
    const payload = {
      name: raw.name,
      phone: raw.phone,
      businessName: raw.businessName || undefined,
    };

    this.profileService
      .updateProfile(payload)
      .pipe(finalize(() => (this.savingProfile = false)))
      .subscribe({
        next: (res: any) => {
          this.applyProfile(res?.data || res);
          this.toast.success('Profile updated successfully');
        },
        error: (error) => {
          this.toast.error(error?.error?.message || 'Failed to update profile');
        },
      });
  }

  resetProfileForm(): void {
    if (!this.profile) return;
    this.applyProfile(this.profile, false);
  }

  changePassword(): void {
    if (this.passwordForm.invalid || !this.passwordsMatch()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.profileService
      .changePassword({ currentPassword, newPassword })
      .pipe(finalize(() => (this.savingPassword = false)))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.toast.success('Password updated successfully');
        },
        error: (error) => {
          this.toast.error(error?.error?.message || 'Failed to change password');
        },
      });
  }

  setTheme(theme: AppTheme): void {
    this.themeService.setTheme(theme);
    this.toast.success(`${theme === 'dark' ? 'Dark' : 'Light'} theme applied`);
  }

  deleteAddress(address: SavedAddress): void {
    if (!address._id || this.deletingAddressId) return;

    this.addressPendingDelete = address;
  }

  cancelDeleteAddress(): void {
    if (this.deletingAddressId) return;
    this.addressPendingDelete = null;
  }

  confirmDeleteAddress(): void {
    const address = this.addressPendingDelete;

    if (!address?._id || this.deletingAddressId) return;

    this.deletingAddressId = address._id;
    this.addressService
      .deleteAddress(address._id)
      .pipe(
        finalize(() => {
          this.deletingAddressId = null;
          this.addressPendingDelete = null;
        }),
      )
      .subscribe({
        next: () => {
          this.savedAddresses = this.savedAddresses.filter(
            (item) => item._id !== address._id,
          );
          this.toast.success('Saved address removed');
        },
        error: (error) => {
          this.toast.error(error?.error?.message || 'Failed to remove address');
        },
      });
  }

  goTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  passwordsMatch(): boolean {
    const value = this.passwordForm.value;
    return !value.newPassword || value.newPassword === value.confirmPassword;
  }

  hasUnsavedProfileChanges(): boolean {
    return !!this.profileForm && this.profileForm.dirty;
  }

  trackAddress(index: number, address: SavedAddress): string {
    return address._id || `${index}`;
  }

  private applyProfile(user: UserProfile | null, updateCache = true): void {
    if (!user) return;

    this.profile = user;
    this.profileForm.patchValue(
      {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
      },
      { emitEvent: false },
    );
    this.profileForm.markAsPristine();

    if (updateCache) {
      this.authService.setUser(user);
    }
  }
}
