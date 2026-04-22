# Contributing to OpenMemo

First off, thank you for considering contributing to OpenMemo! It's people like you that make OpenMemo such a great tool for the AI community.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for OpenMemo. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

* **Use a clear and descriptive title** for the issue to identify the problem.
* **Describe the exact steps which reproduce the problem** in as many details as possible.
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
* **Explain which behavior you expected to see instead and why.**
* **Include screenshots or animated GIFs** which help you demonstrate the steps or the unexpected behavior.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for OpenMemo, including completely new features and minor improvements to existing functionality.

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
* **Describe the current behavior and explain which behavior you expected to see instead** and why.
* **Explain why this enhancement would be useful** to most OpenMemo users.

### Your First Code Contribution

Unsure where to begin contributing to OpenMemo? You can start by looking through these `beginner` and `help-wanted` issues:

* Beginner issues - issues which should only require a few lines of code, and a test or two.
* Help wanted issues - issues which should be a bit more involved than beginner issues.

### Pull Requests

The process described here has several goals:

- Maintain OpenMemo's quality
- Fix bugs and deliver features as quickly as possible
- Keep the overhead low for maintainers
- Make the contribution process as easy as possible for contributors

#### 1. Fork the Project
Fork the repo on GitHub and clone your fork locally.

#### 2. Create a Branch
Create a branch for your changes: `git checkout -b feature/your-feature-name` or `bugfix/your-bug-name`.

#### 3. Make Changes and Test
Implement your changes. Ensure you include relevant tests and that all existing tests pass.

#### 4. Follow Style Guidelines
* We use [Prettier](https://prettier.io/) for code formatting.
* We follow the [NestJS Coding Style](https://docs.nestjs.com/).
* Use descriptive variable and function names.
* Ensure all new functions and classes have appropriate documentation.

#### 5. Commit Your Changes
Keep your commits concise and descriptive. We prefer [Conventional Commits](https://www.conventionalcommits.org/).

#### 6. Submit a Pull Request
Submit a pull request to the `main` branch. Provide a clear description of the changes and link to any relevant issues.

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### Documentation Styleguide

* Use [Markdown](https://daringfireball.net/projects/markdown/).
* Keep documentation up to date with code changes.

## Setting Up Your Development Environment

1. Clone the repository: `git clone https://github.com/udaykumar-dhokia/OpenMemo.git`
2. Navigate to the backend: `cd OpenMemo/backend`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure your database.
5. Run migrations: `npx prisma migrate dev`
6. Start the dev server: `npm run start:dev`

Thank you for your contributions!
