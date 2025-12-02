# Workspace Directory

This directory is where AI agents write new code, experiments, and refactors before integrating into the main project.

## Structure

```
workspace/
├── backend/          # New backend features and experiments
│   ├── models/       # Database model prototypes
│   ├── routers/      # API endpoint drafts
│   ├── services/     # Business logic
│   └── tests/        # Backend tests
│
├── frontend/         # New frontend components and pages
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── services/     # API services
│   └── tests/        # Frontend tests
│
└── tests/           # Integration and E2E tests
    ├── integration/
    └── e2e/
```

## Usage

### For Agents

Agents should:
1. Write new code here first
2. Test thoroughly
3. Move working code to `backend/` or `src/` when ready
4. Document what was created

### For Developers

Developers can:
1. Review AI-generated code here
2. Test features before integration
3. Refactor or improve before moving to main project
4. Use as a sandbox for experiments

## Guidelines

### Code Quality

- All code must pass linting
- All code must have tests
- All code must be documented
- Follow project conventions

### Integration Process

1. **Generate**: Agent writes code in workspace
2. **Test**: Run tests to verify functionality
3. **Review**: Developer reviews code quality
4. **Integrate**: Move to main project if approved
5. **Commit**: Version control the changes

### Cleanup

Periodically clean up:
- Experimental code that didn't work
- Outdated implementations
- Temporary files

```bash
# Remove all workspace content (careful!)
rm -rf workspace/*

# Or selectively remove old experiments
find workspace/ -mtime +7 -delete
```

## Safety

This directory is isolated from the main project:
- Changes here don't affect `backend/` or `src/`
- Can be deleted without losing project code
- Safe for experimentation
- Version controlled separately

## Examples

### Example 1: New API Endpoint

```
workspace/backend/routers/grades.py
workspace/backend/tests/test_grades.py
```

After testing, move to:
```
backend/app/routers/grades.py
backend/tests/routers/test_grades.py
```

### Example 2: New React Component

```
workspace/frontend/components/CourseCard.tsx
workspace/frontend/tests/CourseCard.test.tsx
```

After testing, move to:
```
src/components/CourseCard.tsx
src/components/__tests__/CourseCard.test.tsx
```

## Status

Track what's in workspace:

```bash
# List all files
find workspace/ -type f

# Count by type
find workspace/ -name "*.py" | wc -l    # Python files
find workspace/ -name "*.tsx" | wc -l   # React files
find workspace/ -name "*.test.*" | wc -l # Test files

# Recent changes
find workspace/ -mtime -1               # Modified in last 24h
```

## Notes

- Keep workspace organized
- Document why code is here
- Move to main project when ready
- Don't commit broken code
- Test before integrating