import { Pipe, PipeTransform } from '@angular/core';
import { orderReference } from '../utils/order-reference';

@Pipe({ name: 'orderReference' })
export class OrderReferencePipe implements PipeTransform {
  transform(value: unknown): string {
    return orderReference(value);
  }
}
