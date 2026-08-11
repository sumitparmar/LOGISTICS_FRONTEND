import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

interface Feature {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-secure-info-dialog',
  templateUrl: './secure-info-dialog.component.html',
  styleUrls: ['./secure-info-dialog.component.scss'],
})
export class SecureInfoDialogComponent {
  isVisible = true;
  isClosing = false;
  activeTab = 0;

  tabs = ['Overview', 'Coverage', 'FAQ'];

  features: Feature[] = [
    {
      icon: 'PKG',
      iconBg: 'var(--mk-primary-soft)',
      title: 'Professional Packaging Care',
      description:
        'Every shipment handled carefully by trained delivery partners.',
    },
    {
      icon: 'GPS',
      iconBg: 'var(--mk-info-soft)',
      title: 'Live Tracking',
      description: 'Track your parcel in real time from pickup to delivery.',
    },
    {
      icon: 'INS',
      iconBg: 'var(--mk-success-soft)',
      title: 'Insurance Support',
      description: 'High-value shipments can be protected during transit.',
    },
  ];

  constructor(private dialogRef: MatDialogRef<SecureInfoDialogComponent>) {}

  setTab(index: number): void {
    this.activeTab = index;
  }

  close(): void {
    if (this.isClosing) return;

    this.isClosing = true;

    setTimeout(() => {
      this.dialogRef.close();
    }, 220);
  }

  learnMore(): void {
    this.setTab(2);
  }
}
