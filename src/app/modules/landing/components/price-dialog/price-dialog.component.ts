import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-price-dialog',
  templateUrl: './price-dialog.component.html',
})
export class PriceDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<PriceDialogComponent>,
    private router: Router,
  ) {}

  book() {
    this.dialogRef.close();
    this.router.navigate(['/auth/login']);
  }
}
