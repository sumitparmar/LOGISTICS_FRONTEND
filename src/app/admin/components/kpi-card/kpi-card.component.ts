import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
})
export class KpiCardComponent implements OnChanges {
  @Input() title!: string;
  @Input() value!: number;
  @Input() growth!: number;
  @Input() subtitle!: string;
  @Input() icon!: string;
  @Input() variant!: 'users' | 'orders' | 'revenue';

  displayValue = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.animateValue(this.value || 0);
    }
  }

  private animateValue(target: number) {
    const duration = 800;
    const start = this.displayValue || 0;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      this.displayValue = Math.floor(start + (target - start) * progress);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.displayValue = target;
      }
    };

    requestAnimationFrame(step);
  }

  getSparklinePoints(): string {
    const isPositive = this.growth >= 0;

    const values = isPositive ? [10, 16, 14, 22, 28] : [28, 22, 18, 16, 10];

    return values.map((v, i) => `${i * 25},${30 - v}`).join(' ');
  }
}
