# Next.js template

This is a Next.js template with shadcn/ui.

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `dev`               | Start the development server         |
| `build` / `start`   | Build and run the production server  |
| `lint` / `lint:fix` | Run ESLint (optionally with autofix) |
| `format`            | Format files with Prettier           |
| `format:check`      | Check formatting without writing     |
| `typecheck`         | Type-check the project with `tsc`    |
| `check:fix`         | Run format, lint fix, and typecheck  |
| `clean`             | Remove build artifacts               |

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from '@/components/ui/button'
```
