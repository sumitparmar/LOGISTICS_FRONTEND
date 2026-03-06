import { environment } from 'src/environments/environment';

export function getCurrencySymbol(): string {
  switch (environment.currency) {
    case 'INR':
      return '₹';

    case 'USD':
      return '$';

    case 'EUR':
      return '€';

    default:
      return environment.currency;
  }
}
