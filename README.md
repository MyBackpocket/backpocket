# <img src="./docs/assets/Backpocket-Logo-32.png" alt="Backpocket Logo" height="32" align="absmiddle" /> Backpocket

Save content for yourself, organize it into a personal library, and optionally publish a read-only collection at your own URL.

## Documentation

📚 **[Product Specification](./docs/PRODUCT-SPEC.md)** — Complete API reference, types, and implementation guide

| Document | Description |
|----------|-------------|
| [PRODUCT-SPEC.md](./docs/PRODUCT-SPEC.md) | Unified specification for all platforms |
| [FEATURE-MATRIX.md](./docs/FEATURE-MATRIX.md) | Feature parity tracker |
| [ROADMAP.md](./docs/ROADMAP.md) | Planned features and integrations |

## Apps

| App | Description | Stack |
|-----|-------------|-------|
| [`backpocket-web`](./apps/backpocket-web) | Web application | Next.js, Supabase, tRPC |
| [`backpocket-mobile`](./apps/backpocket-mobile) | iOS & Android app | Expo, React Native |
| [`backpocket-browser-extension`](./apps/backpocket-browser-extension) | Browser extension | WXT, React |

## Packages

| Package | Description |
|---------|-------------|
| [`@backpocket/types`](./packages/types) | Shared TypeScript types |
| [`@backpocket/utils`](./packages/utils) | Shared utility functions |
| [`@backpocket/tsconfig`](./packages/tsconfig) | Shared TypeScript configurations |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Bun](https://bun.sh/) v1.3+

### Installation

```bash
# Clone the repository
git clone https://github.com/MyBackpocket/backpocket.git
cd backpocket

# Install dependencies
bun install
```

### Development

```bash
# Run all apps in development mode
bun dev

# Run specific apps
bun dev:web        # Web app only
bun dev:mobile     # Mobile app only
bun dev:extension  # Browser extension only
```

### Build

```bash
# Build all apps
bun build

# Build specific apps
bun build:web
bun build:mobile
bun build:extension
```

### Other Commands

```bash
bun lint          # Lint all packages
bun lint:fix      # Lint and auto-fix
bun format        # Format with Biome
bun typecheck     # Type check all packages
bun test          # Run tests
bun clean         # Clean all build artifacts
```

## Project Structure

```
backpocket/
├── apps/
│   ├── backpocket-web/          # Next.js web app
│   ├── backpocket-mobile/       # Expo mobile app
│   └── backpocket-browser-extension/  # WXT browser extension
├── packages/
│   ├── types/                   # Shared TypeScript types
│   ├── utils/                   # Shared utilities
│   └── tsconfig/                # Shared TS configs
├── biome.json                   # Biome linter/formatter config
├── turbo.json                   # Turborepo config
└── package.json                 # Root package.json
```

## Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Linting/Formatting**: [Biome](https://biomejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## License

[MIT](./LICENSE)
