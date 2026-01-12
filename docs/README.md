# Backpocket Documentation

Welcome to the Backpocket documentation. This is the source of truth for all platforms.

## Quick Links

| Document | Description |
|----------|-------------|
| **[PRODUCT-SPEC.md](./PRODUCT-SPEC.md)** | Complete product specification — API, types, features, implementation |
| **[FEATURE-MATRIX.md](./FEATURE-MATRIX.md)** | Feature parity tracker across Web, Mobile, and Extension |
| **[ROADMAP.md](./ROADMAP.md)** | Planned features and integrations |

## For Developers

### Getting Started

See the [main README](../README.md) for setup instructions.

### API Reference

All API documentation is consolidated in [PRODUCT-SPEC.md](./PRODUCT-SPEC.md#4-api-reference):

- **tRPC Endpoints** — Full request/response documentation
- **Type Definitions** — Single source of truth from `@backpocket/types`
- **Error Handling** — Error codes and handling patterns

### Platform-Specific Notes

Each platform has unique considerations documented in the spec:

- **Web App** — [Section 7.1](./PRODUCT-SPEC.md#71-web-app-nextjs)
- **Mobile App** — [Section 7.2](./PRODUCT-SPEC.md#72-mobile-app-expo)
- **Browser Extension** — [Section 7.3](./PRODUCT-SPEC.md#73-browser-extension-wxt)

## Contributing

When making changes:

1. **API changes** — Update PRODUCT-SPEC.md Section 4
2. **Type changes** — Update both `packages/types/` and PRODUCT-SPEC.md Section 5
3. **New features** — Update FEATURE-MATRIX.md and relevant platform sections
4. **Breaking changes** — Add to the Changelog (Section 9)
