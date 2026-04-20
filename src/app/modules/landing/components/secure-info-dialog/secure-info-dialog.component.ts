import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
interface Feature {
  emoji: string;
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
      emoji: '📦',
      iconBg: 'rgba(255, 171, 31, 0.15)',
      title: 'Professional Packaging Care',
      description:
        'Every shipment handled carefully by trained delivery partners.',
    },
    {
      emoji: '📍',
      iconBg: 'rgba(77, 116, 255, 0.15)',
      title: 'Live Tracking',
      description: 'Track your parcel in real time from pickup to delivery.',
    },
    {
      emoji: '💰',
      iconBg: 'rgba(34, 197, 94, 0.12)',
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
    console.log('Learn more clicked');
  }
}
