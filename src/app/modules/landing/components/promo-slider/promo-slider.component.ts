import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

interface HomeSlide {
  id: string;
  desktopImage: string;
  mobileImage: string;
  alt: string;
  desktopPosition?: string;
  mobilePosition?: string;
}

@Component({
  selector: 'app-promo-slider',
  templateUrl: './promo-slider.component.html',
  styleUrls: ['./promo-slider.component.scss'],
})
export class PromoSliderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sliderRegion') sliderRegion!: ElementRef<HTMLElement>;

  readonly autoplayDelay = 5000;
  readonly slides: HomeSlide[] = [
    {
      id: 'careful-moves',
      desktopImage: '/assets/images/Movekart%20pics/Media%20(7).jpg',
      mobileImage: '/assets/images/Movekart%20pics/Media.jpg',
      alt: 'MoveKart delivery service helping customers move belongings with care',
      desktopPosition: 'center center',
      mobilePosition: 'center center',
    },
    {
      id: 'safe-packing',
      desktopImage: '/assets/images/Movekart%20pics/Media%20(8).jpg',
      mobileImage: '/assets/images/Movekart%20pics/Media%20(3).jpg',
      alt: 'MoveKart team carefully packing household goods for a safe delivery',
      desktopPosition: 'center center',
      mobilePosition: 'center center',
    },
    {
      id: 'trusted-delivery',
      desktopImage: '/assets/images/Movekart%20pics/Media%20(9).jpg',
      mobileImage: '/assets/images/Movekart%20pics/Media%20(1).jpg',
      alt: 'MoveKart delivery partner carrying a parcel from a branded vehicle',
      desktopPosition: 'center center',
      mobilePosition: 'center center',
    },
    {
      id: 'moving-home',
      desktopImage: '/assets/images/Movekart%20pics/Media%20(10).jpg',
      mobileImage: '/assets/images/Movekart%20pics/Media%20(4).jpg',
      alt: 'MoveKart delivery partner greeting a customer at home with a suitcase',
      desktopPosition: 'center center',
      mobilePosition: 'center center',
    },
    {
      id: 'small-parcels',
      desktopImage: '/assets/images/Movekart%20pics/Media%20(11).jpg',
      mobileImage: '/assets/images/Movekart%20pics/Media%20(6).jpg',
      alt: 'MoveKart handling a small parcel with careful packing and delivery',
      desktopPosition: 'center center',
      mobilePosition: 'center center',
    },
    {
      id: 'frictionless-logistics',
      desktopImage: '/assets/images/Movekart%20pics/Media%20(5).jpg',
      mobileImage: '/assets/images/Movekart%20pics/Media%20(2).jpg',
      alt: 'MoveKart logistics service focused on reliable tracking and customer-first delivery',
      desktopPosition: 'center center',
      mobilePosition: 'center center',
    },
  ];

  activeIndex = 0;
  isHovered = false;
  isFocused = false;

  private autoplayTimer: ReturnType<typeof setTimeout> | null = null;
  private manualPauseTimer: ReturnType<typeof setTimeout> | null = null;
  private pointerStartX: number | null = null;

  ngAfterViewInit(): void {
    this.scheduleAutoplay();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  next(interacted = true): void {
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    this.afterInteraction(interacted);
  }

  previous(): void {
    this.activeIndex =
      (this.activeIndex - 1 + this.slides.length) % this.slides.length;
    this.afterInteraction(true);
  }

  selectSlide(index: number): void {
    if (index === this.activeIndex) {
      this.afterInteraction(true);
      return;
    }

    this.activeIndex = index;
    this.afterInteraction(true);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.selectSlide(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.selectSlide(this.slides.length - 1);
    }
  }

  onPointerDown(event: PointerEvent): void {
    this.pointerStartX = event.clientX;
  }

  onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) return;

    const distance = event.clientX - this.pointerStartX;
    this.pointerStartX = null;

    if (Math.abs(distance) < 44) return;
    distance < 0 ? this.next() : this.previous();
  }

  onPointerCancel(): void {
    this.pointerStartX = null;
  }

  onMouseEnter(): void {
    this.isHovered = true;
  }

  onMouseLeave(): void {
    this.isHovered = false;
    this.scheduleAutoplay();
  }

  onFocusIn(): void {
    this.isFocused = true;
  }

  onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.sliderRegion?.nativeElement.contains(nextTarget)) {
      return;
    }

    this.isFocused = false;
    this.scheduleAutoplay();
  }

  private afterInteraction(interacted: boolean): void {
    if (interacted) {
      this.pauseBrieflyAfterInteraction();
      return;
    }

    this.scheduleAutoplay();
  }

  private pauseBrieflyAfterInteraction(): void {
    if (this.autoplayTimer) clearTimeout(this.autoplayTimer);
    this.autoplayTimer = null;
    if (this.manualPauseTimer) clearTimeout(this.manualPauseTimer);
    this.manualPauseTimer = setTimeout(() => {
      this.manualPauseTimer = null;
      this.scheduleAutoplay();
    }, 7000);
  }

  private scheduleAutoplay(): void {
    if (this.isHovered || this.isFocused) return;

    if (this.autoplayTimer) clearTimeout(this.autoplayTimer);
    this.autoplayTimer = setTimeout(() => {
      this.autoplayTimer = null;
      if (!this.isHovered && !this.isFocused) this.next(false);
      else this.scheduleAutoplay();
    }, this.autoplayDelay);
  }

  private clearTimers(): void {
    if (this.autoplayTimer) clearTimeout(this.autoplayTimer);
    if (this.manualPauseTimer) clearTimeout(this.manualPauseTimer);
    this.autoplayTimer = null;
    this.manualPauseTimer = null;
  }
}
