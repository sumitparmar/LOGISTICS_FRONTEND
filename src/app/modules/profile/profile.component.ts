import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly maxUploadBytes = 2 * 1024 * 1024;
  private readonly maxStoredPhotoLength = 90000;
  private readonly allowedPhotoTypes = ['image/png', 'image/jpeg', 'image/webp'];
  private photoMessageTimer?: ReturnType<typeof setTimeout>;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  loading = false;
  photoSaving = false;
  profilePhotoPreview = '';
  savedProfilePhoto = '';
  cropSource = '';
  cropZoom = 1.15;
  cropOffsetX = 0;
  cropOffsetY = 0;
  photoError = '';
  photoMessage = '';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.clearPhotoMessageTimer();
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
        this.savedProfilePhoto = user?.profilePhoto || '';
        this.authService.setUser(user);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  updateProfile() {
    if (this.loading || this.profileForm.invalid) return;

    this.loading = true;

    const raw = this.profileForm.getRawValue();
    const payload = {
      name: raw.name,
      phone: raw.phone,
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res: any) => {
        const user = res?.data || payload;
        this.authService.setUser(user);
        this.profilePhotoPreview = user?.profilePhoto || '';
        this.savedProfilePhoto = user?.profilePhoto || '';
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

  get hasPendingPhotoChange(): boolean {
    return (
      this.profileForm?.get('profilePhoto')?.value !== this.savedProfilePhoto
    );
  }

  get cropImageTransform(): string {
    return `translate(${this.cropOffsetX}%, ${this.cropOffsetY}%) scale(${this.cropZoom})`;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.photoError = '';
    this.clearPhotoMessage();

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
      this.cropSource = String(reader.result || '');
      this.cropZoom = 1.15;
      this.cropOffsetX = 0;
      this.cropOffsetY = 0;
      this.setPhotoMessage('Adjust the crop, then apply it before saving.');
      input.value = '';
    };

    reader.onerror = () => {
      this.photoError = 'Unable to read this image. Try another photo.';
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoError = '';
    this.setPhotoMessage(
      this.savedProfilePhoto ? 'Photo marked for removal. Save to apply.' : '',
    );
    this.profilePhotoPreview = '';
    this.cropSource = '';
    this.profileForm.patchValue({ profilePhoto: '' });
    this.profileForm.markAsDirty();
  }

  cancelCrop(): void {
    this.cropSource = '';
    this.photoError = '';
    this.setPhotoMessage(
      this.hasPendingPhotoChange ? 'Preview ready. Save to update.' : '',
    );
  }

  applyCrop(): void {
    if (!this.cropSource) return;

    this.photoError = '';
    this.resizeProfilePhoto(this.cropSource, {
      zoom: this.cropZoom,
      offsetX: this.cropOffsetX,
      offsetY: this.cropOffsetY,
    })
      .then((photo) => {
        if (photo.length > this.maxStoredPhotoLength) {
          this.photoError = 'This photo is too detailed. Try a smaller image.';
          return;
        }

        this.profilePhotoPreview = photo;
        this.profileForm.patchValue({ profilePhoto: photo });
        this.profileForm.markAsDirty();
        this.cropSource = '';
        this.setPhotoMessage('Crop applied. Save to update.');
      })
      .catch(() => {
        this.photoError = 'Unable to crop this image. Try another photo.';
      });
  }

  savePhoto(): void {
    if (
      this.loading ||
      this.photoSaving ||
      !this.hasPendingPhotoChange
    ) {
      return;
    }

    this.photoSaving = true;
    this.photoError = '';
    this.clearPhotoMessage();

    const profilePhoto = this.profileForm.get('profilePhoto')?.value || '';

    this.profileService.updateProfilePhoto(profilePhoto).subscribe({
      next: (res: any) => {
        const user = res?.data || {};
        this.authService.setUser(user);
        this.profilePhotoPreview = user?.profilePhoto || '';
        this.savedProfilePhoto = user?.profilePhoto || '';
        this.setPhotoMessage(
          this.profilePhotoPreview ? 'Photo saved.' : 'Photo removed.',
        );
        this.profileForm.markAsPristine();
        this.photoSaving = false;
      },
      error: (error) => {
        this.photoError =
          error?.error?.message || 'Unable to save photo. Please try again.';
        this.photoSaving = false;
      },
    });
  }

  private resizeProfilePhoto(
    source: string,
    cropOptions?: { zoom: number; offsetX: number; offsetY: number },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const size = 240;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          reject();
          return;
        }

        const crop = cropOptions
          ? this.getManualAvatarCrop(image, cropOptions)
          : this.getSmartAvatarCrop(image);

        canvas.width = size;
        canvas.height = size;
        context.drawImage(
          image,
          crop.x,
          crop.y,
          crop.size,
          crop.size,
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

  private setPhotoMessage(message: string): void {
    this.clearPhotoMessageTimer();
    this.photoMessage = message;

    if (!message) return;

    this.photoMessageTimer = setTimeout(() => {
      this.photoMessage = '';
      this.photoMessageTimer = undefined;
    }, 3500);
  }

  private clearPhotoMessage(): void {
    this.clearPhotoMessageTimer();
    this.photoMessage = '';
  }

  private clearPhotoMessageTimer(): void {
    if (!this.photoMessageTimer) return;

    clearTimeout(this.photoMessageTimer);
    this.photoMessageTimer = undefined;
  }

  private getManualAvatarCrop(
    image: HTMLImageElement,
    options: { zoom: number; offsetX: number; offsetY: number },
  ): { x: number; y: number; size: number } {
    const shortestSide = Math.min(image.width, image.height);
    const zoom = Math.min(Math.max(options.zoom || 1, 1), 3);
    const cropSize = shortestSide / zoom;
    const maxX = Math.max(0, (image.width - cropSize) / 2);
    const maxY = Math.max(0, (image.height - cropSize) / 2);
    const centerX = (image.width - cropSize) / 2;
    const centerY = (image.height - cropSize) / 2;
    const offsetX = (Math.min(Math.max(options.offsetX, -40), 40) / 40) * maxX;
    const offsetY = (Math.min(Math.max(options.offsetY, -40), 40) / 40) * maxY;

    return {
      x: Math.max(0, Math.min(centerX + offsetX, image.width - cropSize)),
      y: Math.max(0, Math.min(centerY + offsetY, image.height - cropSize)),
      size: cropSize,
    };
  }

  private getSmartAvatarCrop(image: HTMLImageElement): {
    x: number;
    y: number;
    size: number;
  } {
    const fallbackSize = Math.min(image.width, image.height);
    const fallback = {
      x: (image.width - fallbackSize) / 2,
      y: (image.height - fallbackSize) / 2,
      size: fallbackSize,
    };

    const sampleSize = 160;
    const sampleCanvas = document.createElement('canvas');
    const sampleContext = sampleCanvas.getContext('2d', {
      willReadFrequently: true,
    });

    if (!sampleContext || image.width < 24 || image.height < 24) {
      return fallback;
    }

    sampleCanvas.width = sampleSize;
    sampleCanvas.height = sampleSize;
    sampleContext.drawImage(image, 0, 0, sampleSize, sampleSize);

    const data = sampleContext.getImageData(0, 0, sampleSize, sampleSize).data;
    let minX = sampleSize;
    let minY = sampleSize;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    for (let y = 0; y < sampleSize; y += 1) {
      for (let x = 0; x < sampleSize; x += 1) {
        const index = (y * sampleSize + x) * 4;
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];
        const isTransparent = alpha < 20;
        const isEmptyLightArea = red > 238 && green > 238 && blue > 238;

        if (!isTransparent && !isEmptyLightArea) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          found = true;
        }
      }
    }

    if (!found) {
      return fallback;
    }

    const scaleX = image.width / sampleSize;
    const scaleY = image.height / sampleSize;
    const contentX = minX * scaleX;
    const contentY = minY * scaleY;
    const contentWidth = Math.max((maxX - minX + 1) * scaleX, 1);
    const contentHeight = Math.max((maxY - minY + 1) * scaleY, 1);
    const contentCenterX = contentX + contentWidth / 2;
    const contentCenterY = contentY + contentHeight / 2;
    const paddedContentSize = Math.max(contentWidth, contentHeight) * 1.28;
    const cropSize = Math.min(
      Math.max(paddedContentSize, Math.min(image.width, image.height) * 0.45),
      Math.min(image.width, image.height),
    );

    return {
      x: Math.max(0, Math.min(contentCenterX - cropSize / 2, image.width - cropSize)),
      y: Math.max(0, Math.min(contentCenterY - cropSize / 2, image.height - cropSize)),
      size: cropSize,
    };
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
