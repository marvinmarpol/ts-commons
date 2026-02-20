# ts-commons

> A lightweight, zero-dependency TypeScript utility library — structured for scalability and designed to be shared across multiple repositories.

This repository is a **proof of concept** demonstrating how to architect a centralized TypeScript utility library that can be consumed by other projects directly from GitHub, without publishing to npm.

---

## Why This Exists

As a codebase grows across multiple repositories, teams often end up copy-pasting the same helper functions — date formatters, array groupers, common types — into each project. This library solves that by providing a single source of truth for reusable TypeScript utilities.

**Key design goals:**
- ✅ No bundler required — just native `tsc`
- ✅ No `exports` field to manage in `package.json`
- ✅ Two import styles supported out of the box (flat or module-path)
- ✅ Fully typed with source maps for great IDE "Go to Definition" support
- ✅ Installable directly from GitHub — no npm registry needed

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Available Modules](#available-modules)
  - [Types](#types)
  - [Array Utils](#array-utils)
  - [Date Utils](#date-utils)
- [Local Development](#local-development)
- [How to Contribute](#how-to-contribute)
- [Versioning](#versioning)

---

## Installation

Install directly from GitHub using npm's Git dependency syntax:

```bash
npm install marvinmarpol/ts-commons
```

Or pin to a specific version tag (recommended for production use):

```bash
npm install marvinmarpol/ts-commons#v1.0.0
```

Or add it manually to your `package.json`:

```json
{
  "dependencies": {
    "ts-commons": "github:marvinmarpol/ts-commons#semver:^v1.0.0"
  }
}
```

Then run:

```bash
npm install
```

> **Prerequisite:** Your machine must have Git installed and network access to GitHub. No npm registry account or token required.

---

## Usage

This library supports two import styles — use whichever fits your codebase.

### Flat import — simple, works for most cases

You don't need to know which internal module a function belongs to. Just import from the package root:

```ts
import { formatDate, groupBy, chunk } from 'ts-commons';
import type { PaginatedResponse, ApiResponse } from 'ts-commons';
```

### Module path import — explicit, useful for large bundles

Import directly from a specific module inside `dist/`:

```ts
import { formatDate } from 'ts-commons/dist/utils/date';
import { groupBy, chunk } from 'ts-commons/dist/utils/array';
import type { PaginatedResponse } from 'ts-commons/dist/types';
```

Both styles are fully typed. "Go to Definition" in VS Code will jump directly to the `.ts` source files.

---

## Project Structure

```
ts-commons/
├── src/
│   ├── types/
│   │   ├── common.types.ts        # Shared TypeScript types & interfaces
│   │   └── index.ts
│   ├── utils/
│   │   ├── array/
│   │   │   ├── array.utils.ts     # Array utility functions
│   │   │   ├── array.utils.test.ts
│   │   │   └── index.ts
│   │   ├── date/
│   │   │   ├── date.utils.ts      # Date utility functions
│   │   │   ├── date.utils.test.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts                   # Root barrel — re-exports everything
├── dist/                          # Compiled output (auto-generated)
├── tsconfig.json
└── package.json
```

Each module folder has an `index.ts` barrel file that re-exports its contents using `export *`. The root `src/index.ts` then re-exports everything, making all utilities available from the package root.

---

## Available Modules

### Types

**Import:** `ts-commons` or `ts-commons/dist/types`

Shared TypeScript types and interfaces.

```ts
import type { CommonType, PaginatedResponse, ApiResponse } from 'ts-commons';
```

| Export | Kind | Description |
|---|---|---|
| `CommonType` | `type` | Base type for domain models |
| `PaginatedResponse<T>` | `interface` | Standard paginated list response |
| `ApiResponse<T>` | `interface` | Standard API response envelope |

---

### Array Utils

**Import:** `ts-commons` or `ts-commons/dist/utils/array`

Generic helper functions for array manipulation.

```ts
import { groupBy, chunk, unique, flatten } from 'ts-commons';
```

| Function | Signature | Description |
|---|---|---|
| `groupBy` | `<T>(arr: T[], key: keyof T): Record<string, T[]>` | Groups array items by a key |
| `chunk` | `<T>(arr: T[], size: number): T[][]` | Splits array into chunks of a given size |
| `unique` | `<T>(arr: T[]): T[]` | Removes duplicate values |
| `flatten` | `<T>(arr: T[][]): T[]` | Flattens a 2D array into 1D |

**Examples:**

```ts
import { groupBy, chunk, unique } from 'ts-commons';

// groupBy
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob',   role: 'user' },
  { name: 'Carol', role: 'admin' },
];
groupBy(users, 'role');
// → { admin: [{ name: 'Alice' }, { name: 'Carol' }], user: [{ name: 'Bob' }] }

// chunk
chunk([1, 2, 3, 4, 5], 2);
// → [[1, 2], [3, 4], [5]]

// unique
unique([1, 2, 2, 3, 3, 3]);
// → [1, 2, 3]
```

---

### Date Utils

**Import:** `ts-commons` or `ts-commons/dist/utils/date`

Lightweight date helpers with no external dependencies.

```ts
import { formatDate, parseDate, isDateBefore, getDaysDiff } from 'ts-commons';
```

| Function | Signature | Description |
|---|---|---|
| `formatDate` | `(date: Date, format: string): string` | Formats a Date into a string |
| `parseDate` | `(dateStr: string, format: string): Date` | Parses a date string into a Date |
| `isDateBefore` | `(date: Date, compareDate: Date): boolean` | Checks if a date is before another |
| `getDaysDiff` | `(from: Date, to: Date): number` | Returns the number of days between two dates |

**Examples:**

```ts
import { formatDate, getDaysDiff } from 'ts-commons';

formatDate(new Date('2024-06-01'), 'DD/MM/YYYY');
// → '01/06/2024'

getDaysDiff(new Date('2024-01-01'), new Date('2024-01-31'));
// → 30
```

---

## Local Development

### Prerequisites

- Node.js `>= 18`
- npm `>= 9`

### Setup

```bash
git clone https://github.com/marvinmarpol/ts-commons.git
cd ts-commons
npm install
```

### Run tests

```bash
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Build

```bash
npm run build
```

The compiled output goes into `dist/`. This is what gets installed when another project adds this package as a dependency.

---

## How to Contribute

### Adding a utility to an existing module

1. Add your function to the relevant `*.utils.ts` file (e.g. `src/utils/array/array.utils.ts`)
2. Write tests in the corresponding `*.utils.test.ts` file
3. Nothing else — the barrel `index.ts` already uses `export *`, so your function is exported automatically
4. Update this README to document it

### Adding a new module

1. Create a new folder under `src/utils/`:

```
src/utils/string/
├── string.utils.ts
├── string.utils.test.ts
└── index.ts          ← export * from './string.utils'
```

2. Register it in `src/utils/index.ts`:

```ts
export * from './array';
export * from './date';
export * from './string'; // ← add this
```

3. Document it in this README.

### Guidelines

- Keep functions **pure** — no side effects, no global state
- Every exported function must have **test coverage**
- Prefer **native TypeScript/JavaScript** over third-party dependencies
- Only add things that are **truly generic** — not specific to one use case

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/).

| Change | Bump | Example |
|---|---|---|
| Bug fix | Patch | `v1.0.0` → `v1.0.1` |
| New utility added | Minor | `v1.0.0` → `v1.1.0` |
| Breaking change | Major | `v1.0.0` → `v2.0.0` |

Releases are tagged directly on the `main` branch:

```bash
git tag v1.1.0
git push origin v1.1.0
```

Consumers pinned to `#semver:^v1.0.0` will automatically get minor and patch updates on the next `npm install`.

---

## License

MIT — see [LICENSE](./LICENSE) for details.