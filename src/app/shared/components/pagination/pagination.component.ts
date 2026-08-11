import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent {
  @Input() total: number = 0;
  @Input() totalPagesOverride?: number;
  @Input() page: number = 1;
  @Input() limit: number = 5;

  @Input() limitOptions: number[] = [5, 10, 20, 50];
  @Input() showSummary: boolean = true;
  @Input() showPageSize: boolean = true;
  @Input() pageSizeLabel: string = 'Rows per page';

  @Output() pageChange = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();

  get totalPages(): number {
    if (this.totalPagesOverride && this.totalPagesOverride > 0) {
      return this.totalPagesOverride;
    }

    return Math.max(Math.ceil(this.total / this.safeLimit), 1);
  }

  get safeLimit(): number {
    return Math.max(Number(this.limit) || 1, 1);
  }

  get safePage(): number {
    return Math.min(Math.max(Number(this.page) || 1, 1), this.totalPages);
  }

  get startItem(): number {
    if (!this.total) {
      return 0;
    }

    return (this.safePage - 1) * this.safeLimit + 1;
  }

  get endItem(): number {
    return Math.min(this.safePage * this.safeLimit, this.total);
  }

  get pageItems(): Array<number | 'ellipsis'> {
    const totalPages = this.totalPages;
    const current = this.safePage;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, totalPages, current]);

    if (current > 1) {
      pages.add(current - 1);
    }

    if (current < totalPages) {
      pages.add(current + 1);
    }

    if (current <= 4) {
      [2, 3, 4, 5].forEach((p) => pages.add(p));
    }

    if (current >= totalPages - 3) {
      [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach(
        (p) => pages.add(p),
      );
    }

    const sorted = Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);

    return sorted.reduce<Array<number | 'ellipsis'>>((items, value, index) => {
      if (index > 0 && value - sorted[index - 1] > 1) {
        items.push('ellipsis');
      }

      items.push(value);
      return items;
    }, []);
  }

  next() {
    if (this.safePage < this.totalPages) {
      this.pageChange.emit(this.safePage + 1);
    }
  }

  prev() {
    if (this.safePage > 1) {
      this.pageChange.emit(this.safePage - 1);
    }
  }

  goTo(page: number) {
    if (page !== this.safePage) {
      this.pageChange.emit(page);
    }
  }

  changeLimit(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.limitChange.emit(value);
  }
}
