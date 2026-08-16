import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface InvoiceFile {
  blob: Blob;
  filename: string;
}

export type InvoiceShareResult =
  | { status: 'shared' }
  | { status: 'cancelled' }
  | { status: 'unsupported' };

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  constructor(private api: ApiService) {}

  download(orderId: string): Observable<InvoiceFile> {
    return this.api.downloadFile(`/invoices/${orderId}/download`).pipe(
      map((response: HttpResponse<Blob>) => ({
        blob: response.body || new Blob([], { type: 'application/pdf' }),
        filename: this.filenameFrom(response.headers.get('Content-Disposition')),
      })),
    );
  }

  save(file: InvoiceFile): void {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.filename;
    anchor.rel = 'noopener';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async share(file: InvoiceFile, orderReference: string): Promise<InvoiceShareResult> {
    const shareNavigator = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };

    if (!shareNavigator.share || typeof File === 'undefined') {
      return { status: 'unsupported' };
    }

    const sharedFile = new File([file.blob], file.filename, {
      type: 'application/pdf',
    });
    if (!shareNavigator.canShare?.({ files: [sharedFile] })) {
      return { status: 'unsupported' };
    }

    try {
      await shareNavigator.share({
        files: [sharedFile],
        title: `MoveKart invoice ${orderReference}`,
        text: `MoveKart invoice for order ${orderReference}`,
      });
      return { status: 'shared' };
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { status: 'cancelled' };
      }
      throw error;
    }
  }

  private filenameFrom(contentDisposition: string | null): string {
    const fallback = 'MoveKart-Invoice.pdf';
    if (!contentDisposition) return fallback;
    const match = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (!match?.[1]) return fallback;
    const safe = match[1].replace(/[^a-zA-Z0-9._-]/g, '-');
    return safe || fallback;
  }
}
