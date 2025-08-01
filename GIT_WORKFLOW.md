# Git Workflow & Branching Strategy

## 🎯 Overview

This document outlines the Git workflow and branching strategy for the EduFlow project, ensuring consistent development practices and smooth collaboration.

## 🌿 Branching Strategy

### **Main Branches**

#### **`main` (Production)**

- **Purpose**: Production-ready code
- **Protection**: Direct commits disabled
- **Merge**: Only via Pull Requests from `develop`
- **Deployment**: Automatic deployment to production

#### **`develop` (Development)**

- **Purpose**: Integration branch for features
- **Protection**: Direct commits disabled
- **Merge**: Only via Pull Requests from feature branches
- **Deployment**: Automatic deployment to staging

### **Feature Branches**

#### **`feature/` (Feature Development)**

- **Format**: `feature/description-of-feature`
- **Examples**:
  - `feature/teacher-dashboard`
  - `feature/payment-integration`
  - `feature/admin-reports`
- **Base**: `develop`
- **Merge**: Pull Request to `develop`

#### **`bugfix/` (Bug Fixes)**

- **Format**: `bugfix/description-of-fix`
- **Examples**:
  - `bugfix/login-validation`
  - `bugfix/payment-webhook`
- **Base**: `develop`
- **Merge**: Pull Request to `develop`

#### **`hotfix/` (Critical Production Fixes)**

- **Format**: `hotfix/description-of-fix`
- **Examples**:
  - `hotfix/security-vulnerability`
  - `hotfix/critical-payment-issue`
- **Base**: `main`
- **Merge**: Pull Request to both `main` and `develop`

#### **`release/` (Release Preparation)**

- **Format**: `release/version-number`
- **Examples**:
  - `release/v1.0.0`
  - `release/v1.1.0`
- **Base**: `develop`
- **Merge**: Pull Request to both `main` and `develop`

## 🔄 Workflow Process

### **1. Starting a New Feature**

```bash
# Ensure you're on develop and it's up to date
git checkout develop
git pull origin develop

# Create and switch to new feature branch
git checkout -b feature/teacher-dashboard

# Start development...
```

### **2. During Development**

```bash
# Make your changes
git add .
git commit -m "feat: add teacher dashboard layout

- Create responsive dashboard grid
- Add balance summary card
- Implement transaction history table
- Add loading states and error handling"

# Push to remote
git push origin feature/teacher-dashboard
```

### **3. Creating a Pull Request**

1. **Push your branch** to remote
2. **Create Pull Request** on GitHub/GitLab
3. **Fill PR template**:
   - Description of changes
   - Screenshots (if UI changes)
   - Testing checklist
   - Related issues
4. **Request review** from team members
5. **Address feedback** and update PR

### **4. Merging Process**

```bash
# After PR is approved and merged to develop
git checkout develop
git pull origin develop

# Delete local feature branch
git branch -d feature/teacher-dashboard

# Delete remote feature branch
git push origin --delete feature/teacher-dashboard
```

## 📝 Commit Message Convention

### **Format**

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### **Types**

- **`feat`**: New feature
- **`fix`**: Bug fix
- **`docs`**: Documentation changes
- **`style`**: Code style changes (formatting, etc.)
- **`refactor`**: Code refactoring
- **`test`**: Adding or updating tests
- **`chore`**: Maintenance tasks

### **Scopes**

- **`auth`**: Authentication related
- **`dashboard`**: Dashboard components
- **`payment`**: Payment integration
- **`admin`**: Admin features
- **`api`**: API routes
- **`db`**: Database changes
- **`ui`**: UI components
- **`config`**: Configuration changes

### **Examples**

```bash
# Feature commit
git commit -m "feat(dashboard): add teacher balance summary card

- Display current balance with growth indicator
- Show monthly contribution breakdown
- Add quick action buttons for payments
- Implement responsive design for mobile"

# Bug fix commit
git commit -m "fix(auth): resolve login validation error

- Fix email validation regex
- Add proper error messages
- Update form validation logic"

# Documentation commit
git commit -m "docs: update API documentation

- Add payment endpoint documentation
- Update authentication flow guide
- Include error code references"
```

## 🚀 Release Process

### **1. Prepare Release Branch**

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0
```

### **2. Update Version**

- Update `package.json` version
- Update changelog
- Update documentation

### **3. Create Release PR**

```bash
git add .
git commit -m "chore(release): prepare v1.0.0

- Update version to 1.0.0
- Update changelog with new features
- Update documentation"
git push origin release/v1.0.0
```

### **4. Merge Release**

- Create PR from `release/v1.0.0` to `main`
- Create PR from `release/v1.0.0` to `develop`
- Merge both PRs
- Create Git tag: `git tag v1.0.0`

## 🔧 Git Configuration

### **Recommended Git Config**

```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch
git config --global init.defaultBranch main

# Set pull strategy
git config --global pull.rebase false

# Set commit template
git config --global commit.template .gitmessage
```

### **Create Commit Template**

Create `.gitmessage` file:

```
# <type>(<scope>): <description>
#
# <body>
#
# <footer>
```

## 🛡️ Branch Protection Rules

### **Main Branch Protection**

- **Require pull request reviews**: 1 approval minimum
- **Dismiss stale PR approvals**: Enabled
- **Require status checks**: Build and test must pass
- **Require branches to be up to date**: Enabled
- **Restrict pushes**: Only allow specific people
- **Allow force pushes**: Disabled
- **Allow deletions**: Disabled

### **Develop Branch Protection**

- **Require pull request reviews**: 1 approval minimum
- **Dismiss stale PR approvals**: Enabled
- **Require status checks**: Build and test must pass
- **Require branches to be up to date**: Enabled
- **Restrict pushes**: Only allow specific people
- **Allow force pushes**: Disabled
- **Allow deletions**: Disabled

## 📋 Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## 📝 Description

Brief description of changes made.

## 🎯 Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## 🧪 Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing completed

## 📸 Screenshots (if applicable)

Add screenshots for UI changes.

## 📋 Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No console errors
- [ ] No linting errors

## 🔗 Related Issues

Closes #(issue number)
```

## 🚨 Emergency Procedures

### **Hotfix Process**

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Make urgent changes
git add .
git commit -m "fix(security): patch critical vulnerability

- Update authentication validation
- Add input sanitization
- Fix SQL injection vulnerability"

# Push and create PR to main
git push origin hotfix/critical-security-fix
```

### **Revert Process**

```bash
# Revert specific commit
git revert <commit-hash>

# Revert merge commit
git revert -m 1 <merge-commit-hash>

# Push revert
git push origin <branch-name>
```

## 📊 Best Practices

### **Do's**

- ✅ Keep commits atomic and focused
- ✅ Write descriptive commit messages
- ✅ Update documentation with changes
- ✅ Test before pushing
- ✅ Review your own code before requesting review
- ✅ Keep branches up to date with base branch

### **Don'ts**

- ❌ Commit directly to main/develop
- ❌ Push broken code
- ❌ Use vague commit messages
- ❌ Mix unrelated changes in one commit
- ❌ Force push to shared branches
- ❌ Ignore CI/CD failures

## 🔍 Useful Git Commands

```bash
# View branch structure
git log --graph --oneline --all

# See what files changed
git diff --name-only

# Stash changes temporarily
git stash
git stash pop

# Reset to previous commit (be careful!)
git reset --hard HEAD~1

# View commit history
git log --oneline -10

# Check branch status
git status
git branch -a
```

This workflow ensures consistent development practices, proper code review, and smooth collaboration across the team.
