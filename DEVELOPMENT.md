# Development Guide - EduFlow

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Initial Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and configure environment variables
4. Run the development server: `npm run dev`

## 📋 Code Quality Tools

### ESLint

- **Configuration**: `eslint.config.mjs`
- **Purpose**: Code linting and error detection
- **Commands**:
  - `npm run lint` - Check for linting errors
  - `npm run lint:fix` - Fix auto-fixable issues

### Prettier

- **Configuration**: `.prettierrc`
- **Purpose**: Code formatting
- **Commands**:
  - `npm run format` - Format all files
  - `npm run format:check` - Check formatting without changes

### Husky

- **Configuration**: `.husky/` directory
- **Purpose**: Git hooks for code quality
- **Hooks**:
  - `pre-commit`: Runs lint-staged to check staged files
  - `pre-push`: Runs lint and format checks before push

### Lint-Staged

- **Configuration**: `package.json` lint-staged section
- **Purpose**: Run linters on staged files only
- **Automatically runs**:
  - ESLint with auto-fix
  - Prettier formatting

## 🔧 VS Code Setup

### Recommended Extensions

The project includes `.vscode/extensions.json` with recommended extensions:

- Prettier - Code formatter
- ESLint - JavaScript linting
- Tailwind CSS IntelliSense
- TypeScript support

### Settings

The project includes `.vscode/settings.json` with:

- Auto-format on save
- ESLint auto-fix on save
- Tailwind CSS support
- TypeScript preferences

## 📝 Development Workflow

### Before Committing

1. Ensure all tests pass: `npm test` (when implemented)
2. Run linting: `npm run lint`
3. Check formatting: `npm run format:check`
4. The pre-commit hook will automatically run these checks

### Code Style Guidelines

- Use single quotes for strings
- Use semicolons
- 2 spaces for indentation
- 80 character line length
- Trailing commas in objects and arrays
- Prefer const over let, avoid var

### TypeScript Guidelines

- Use strict TypeScript configuration
- Avoid `any` type when possible
- Use proper type annotations
- Prefer interfaces over types for object shapes

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting

# Git Hooks (automatic)
# pre-commit: Runs lint-staged
# pre-push: Runs lint and format checks
```

## 🔍 Troubleshooting

### Common Issues

1. **ESLint errors after formatting**
   - Run `npm run lint:fix` to auto-fix issues
   - Check for manual fixes needed

2. **Prettier conflicts**
   - Run `npm run format` to format all files
   - Ensure VS Code Prettier extension is installed

3. **Husky hooks not working**
   - Ensure Husky is installed: `npm install`
   - Check file permissions on `.husky/` directory

4. **TypeScript errors**
   - Run `npm run build` to check for type errors
   - Ensure all imports are properly typed

## 📚 Additional Resources

- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
