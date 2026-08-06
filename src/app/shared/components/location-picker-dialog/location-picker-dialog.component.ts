import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-location-picker-dialog',
  templateUrl: './location-picker-dialog.component.html',
  styleUrls: ['./location-picker-dialog.component.css'],
})
export class LocationPickerDialogComponent {
  selectedLocation: any = null;

  constructor(
    public dialogRef: MatDialogRef<LocationPickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      latitude: number;
      longitude: number;
      address?: string;
      title?: string;
    },
  ) {}

  onLocationSelected(location: any): void {
    this.selectedLocation = location;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close(this.selectedLocation);
  }
}
