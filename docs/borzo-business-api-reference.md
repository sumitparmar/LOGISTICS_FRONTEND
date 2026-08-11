# Borzo Business API Reference

MoveKart uses Borzo Business APIs for delivery/order integration.

Canonical documentation:
https://borzodelivery.com/in/business-api/doc

Implementation rule:
- Treat Borzo documentation as the source of truth for API payloads, status fields, validation, pricing, order creation, tracking, cancellation, and webhook/socket-related behavior.
- Do not hardcode Borzo payload assumptions when a documented field/contract exists.
- Before changing Borzo-facing request/response handling, verify the current API contract against the official documentation.
- Keep frontend behavior aligned with backend Borzo integration and Indian logistics use cases.
