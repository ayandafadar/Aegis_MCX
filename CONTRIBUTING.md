# Contributing to Aegis-MCX

Thank you for your interest in contributing to Aegis-MCX! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Aegis_MCX.git
   cd Aegis_MCX
   ```

3. Install dependencies:
   ```bash
   make install
   ```

4. Run pre-deployment checks:
   ```bash
   make check
   ```

## Development Workflow

### Local Development

Start the development servers:
```bash
make dev
```

This starts both the API and worker with hot reload enabled.

### Running Tests

```bash
make test
make typecheck
```

### Docker Development

```bash
make docker-build
make docker-up
make docker-logs
```

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Add type annotations for function parameters and return types
- Avoid `any` types when possible
- Run `make typecheck` before committing

### Code Style

- Use 2 spaces for indentation
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Your Name <your.email@example.com>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add rate limiting middleware
fix(worker): handle connection timeout gracefully
docs(readme): update deployment instructions
```

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request with:
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Test results

5. Ensure CI passes:
   - TypeScript type checking
   - Integration tests
   - Lighthouse accessibility audit
   - Security scans

## Testing Guidelines

### Integration Tests

Add tests to `backend/scripts/integration-test.sh` for new endpoints:

```bash
echo "Testing /api/your-endpoint..."
curl --fail --silent "$API_URL/api/your-endpoint" | jq -e '.expected | condition' > /dev/null
echo "✅ Your endpoint test passed"
```

### Accessibility

Ensure new UI components meet WCAG 2.1 AA standards:
- Proper ARIA labels
- Keyboard navigation support
- Sufficient color contrast
- Screen reader compatibility

## Infrastructure Changes

### Docker

- Test builds locally: `make docker-build`
- Verify multi-stage builds work correctly
- Update health checks if needed



## Documentation

Update documentation when:
- Adding new features
- Changing deployment procedures
- Modifying configuration options
- Adding new dependencies

Files to update:
- `README.md` - Overview and quick start
- `DEPLOYMENT.md` - Deployment instructions
- `CONTRIBUTING.md` - This file
- Inline code comments

## Security

- Never commit secrets or credentials
- Use environment variables for configuration
- Run security scans: `npm audit`
- Report vulnerabilities privately

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
