# Contributing Guide

This project uses a small, opinionated style guide and accessibility standards. Please follow these guidelines when contributing code or content.

## Code Style

- Keep changes minimal and focused: avoid unrelated refactors in a single PR.
- Prefer descriptive names; avoid single-letter or abbreviated variables unless the abbreviation is more well-known than its meaning (i.e. "html" instead of "hypertext markup language").
- Follow existing Angular patterns (signals, components, template syntax).
- No inline styles: use component-scoped SCSS for component-specific styles and `src/styles.scss` for app-wide styles.

## Angular Best Practices

### Component Architecture

- Use standalone components (already enabled project-wide).
- Keep components focused: one responsibility per component.
- Prefer composition over inheritance.
- Use signal-based inputs and outputs for component communication:
  - `input()` and `input.required()` for passing data from parent to child.
  - `output()` for emitting events from child to parent.
  - Only use `@Input()`, `@Output()`, and RxJS when absolutely necessary for legacy compatibility.
- Use dependency injection via `inject()` function rather than constructor injection when possible.
- Use signal-based (`Field` / `field`) forms instead of template-driven (`FormsModule` / `ngModel`) or
  reactive (`ReactiveFormsModule` / `formControl`) forms

### State Management

- Use Angular signals for reactive state (`signal()`, `computed()`, `effect()`).
- Use `.set()` or `.update()` to change signal values.
- Keep component state local when possible; lift state only when shared across multiple components.
- Use `toSignal()` to convert Observables to signals when integrating with RxJS.

### Templates

- Use Angular control flow syntax: `@if`, `@for`, `@switch` instead of structural directives `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use `track` expressions resolving to unique values in `@for` loops for performance.
- Keep template logic minimal; move complex logic to the component class or services.
- Handle async state change with signals over `async` pipe when practical.

### Services

- Mark services as `providedIn: 'root'` for tree-shakeable singletons.
- Use services for shared business logic and data access.

### Performance

- This is a Zoneless application. All change detection should be triggered by setting signals.
- Avoid non-signal function calls in templates; use signals, computed signals, or pipes.

### TypeScript

- Enable strict mode and address type errors (prefer `unknown` over `any` for tight types).
- Use interfaces for data models.
- Leverage type inference where possible; add explicit types for public APIs.
- Use `readonly` for immutable class members.

## Accessibility

- Interactive elements must be keyboard-operable (Enter/Space, Arrow keys as appropriate).
- Manage focus explicitly when opening/closing menus or dialogs.
- Use appropriate ARIA attributes and roles (e.g., `aria-haspopup`, `aria-expanded`, `role="menu"`, `role="menuitem"`).
- Ensure color contrast meets WCAG AA. Use theme variables (e.g., `--primary-color`, `--primary-hover`, `--panel-bg`).

## Testing & Validation

- Run unit tests and linters locally before pushing.
- For UI changes, manually verify keyboard navigation and focus management.
- Unit tests are allowed a more relaxed standard on typing since you often need to test scenarios that aren't supported.
  In such scenarios `any` is an acceptable typing.

## Folder & Style Structure

- Component styles: `src/app/<component>/<component>.scss`.
- Global styles: `src/styles.scss`.

## Commit & PR Guidelines

- Reference relevant issues in commits/PRs.
- Include a brief summary of changes and screenshots/GIFs for UI changes.
- Confirm adherence to style + accessibility in the PR checklist.

## Local Commands

```pwsh
npm run test
npm run lint
npm start
```

If something is unclear or needs updates, please propose improvements in a PR to this file.
