import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private readonly maxUploadBytes = 2 * 1024 * 1024;
  private readonly maxStoredPhotoLength = 90000;
  private readonly allowedPhotoTypes = ['image/png', 'image/jpeg', 'image/webp'];

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  loading = false;
  profilePhotoPreview = '';
  photoError = '';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  initForms() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      profilePhoto: [''],
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
        const user = res.data;
        this.profileForm.patchValue(user);
        this.profilePhotoPreview = user?.profilePhoto || '';
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  updateProfile() {
    if (this.loading || this.profileForm.invalid) return;

    this.loading = true;

    const payload = this.profileForm.getRawValue();

    this.profileService.updateProfile(payload).subscribe({
      next: (res: any) => {
        const user = res?.data || payload;
        this.authService.setUser(user);
        window.dispatchEvent(new CustomEvent('movekart:user-updated'));
        this.profilePhotoPreview = user?.profilePhoto || '';
        this.profileForm.markAsPristine();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get initials(): string {
    const source =
      this.profileForm?.get('name')?.value ||
      this.profileForm?.get('email')?.value ||
      'U';

    return String(source).trim().charAt(0).toUpperCase() || 'U';
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.photoError = '';

    if (!this.allowedPhotoTypes.includes(file.type)) {
      this.photoError = 'Use a JPG, PNG or WebP image.';
      input.value = '';
      return;
    }

    if (file.size > this.maxUploadBytes) {
      this.photoError = 'Please select an image under 2 MB.';
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.resizeProfilePhoto(String(reader.result || ''))
        .then((photo) => {
          if (photo.length > this.maxStoredPhotoLength) {
            this.photoError = 'This photo is too detailed. Try a smaller image.';
            input.value = '';
            return;
          }

          this.profilePhotoPreview = photo;
          this.profileForm.patchValue({ profilePhoto: photo });
          this.profileForm.markAsDirty();
          input.value = '';
        })
        .catch(() => {
          this.photoError = 'Unable to read this image. Try another photo.';
          input.value = '';
        });
    };

    reader.onerror = () => {
      this.photoError = 'Unable to read this image. Try another photo.';
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoError = '';
    this.profilePhotoPreview = '';
    this.profileForm.patchValue({ profilePhoto: '' });
    this.profileForm.markAsDirty();
  }

  private resizeProfilePhoto(source: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const size = 180;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject();
          return;
        }

        const shortestSide = Math.min(image.width, image.height);
        const sourceX = (image.width - shortestSide) / 2;
        const sourceY = (image.height - shortestSide) / 2;

        canvas.width = size;
        canvas.height = size;
        context.drawImage(
          image,
          sourceX,
          sourceY,
          shortestSide,
          shortestSide,
          0,
          0,
          size,
          size,
        );

        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };

      image.onerror = () => reject();
      image.src = source;
    });
  }
  changePassword() {
    if (this.loading || this.passwordForm.invalid) return;

    this.loading = true;

    this.profileService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
