# GitHub Copilot Configuration for Perundhu

This directory contains GitHub Copilot prompts, instructions, and chat modes tailored for the Perundhu Bus Tracker project.

## Directory Structure

```
.copilot/
├── prompts/              # Reusable prompts for specific tasks
│   ├── playwright-generate-test.prompt.md
│   ├── java-junit.prompt.md
│   ├── java-refactoring-extract-method.prompt.md
│   ├── java-springboot.prompt.md
│   ├── sql-code-review.prompt.md
│   └── sql-optimization.prompt.md
├── instructions/         # Development guidelines applied automatically
│   ├── react-typescript.instructions.md
│   └── java-springboot.instructions.md
├── chatmodes/           # Custom chat modes for specialized assistance
│   ├── expert-react-frontend-engineer.chatmode.md
│   ├── software-engineer-agent-v1.chatmode.md
│   └── principal-software-engineer.chatmode.md
└── README.md            # This file
```

## Tech Stack

### Frontend
- **Framework**: React 18.3 + TypeScript 5.6
- **Build Tool**: Vite 5.4
- **Routing**: React Router v6
- **State Management**: React Context + Custom Hooks
- **UI Libraries**: Material UI, TailwindCSS
- **Maps**: Leaflet (OpenStreetMap)
- **i18n**: React i18next
- **Testing**: Vitest, React Testing Library, Playwright
- **Linting**: ESLint

### Backend
- **Language**: Java 17 LTS
- **Framework**: Spring Boot 3.4.5
- **Build Tool**: Gradle
- **Database**: MySQL
- **Migration**: Flyway
- **Security**: Spring Security (OAuth2 JWT)
- **Architecture**: Hexagonal/Ports & Adapters
- **Testing**: JUnit 5, Mockito, ArchUnit

## How to Use

### Prompts
Prompts are reusable commands for specific tasks. Access them via:
- GitHub Copilot Chat sidebar
- Type `@workspace /` and select from available prompts
- Examples:
  - Generate Playwright tests
  - Review SQL for performance
  - Refactor Java methods

### Instructions
Instructions are automatically applied based on file patterns:
- `react-typescript.instructions.md` → Applied to `frontend/**/*.{ts,tsx,jsx}`
- `java-springboot.instructions.md` → Applied to `backend/**/*.java`

These guide Copilot's code suggestions and responses.

### Chat Modes
Chat modes provide specialized assistance:
- **Expert React Frontend Engineer**: Deep expertise in React 18, TypeScript, performance
- **Software Engineer Agent**: Autonomous execution mode for complex tasks
- **Principal Software Engineer**: Architectural guidance and code reviews

Activate via: `@workspace #chatmode-name`

## Adding New Items

### New Prompt
Create a `.prompt.md` file in `prompts/` with frontmatter:
```markdown
---
mode: 'ask' or 'agent'
description: 'Brief description'
---

# Prompt Title

Your prompt content here...
```

### New Instruction
Create a `.instructions.md` file in `instructions/` with frontmatter:
```markdown
---
description: 'Brief description'
applyTo: 'file/pattern/**/*.ext'
---

# Instruction Title

Your guidelines here...
```

### New Chat Mode
Create a `.chatmode.md` file in `chatmodes/` with frontmatter:
```markdown
---
description: 'Brief description'
tools: ['codebase', 'edit/editFiles', 'runTests', ...]
---

# Chat Mode Title

Your specialized instructions here...
```

## Best Practices

1. **Keep prompts focused**: Each prompt should solve one specific problem
2. **Use clear instructions**: Be explicit about what you want Copilot to do
3. **Include examples**: Show both good and bad patterns
4. **Test your prompts**: Verify they work as expected before committing
5. **Document assumptions**: Explain project-specific conventions
6. **Update regularly**: Keep instructions in sync with project evolution

## Resources

- [GitHub Copilot Documentation](https://docs.github.com/copilot)
- [Awesome Copilot Collection](https://github.com/github/awesome-copilot)
- [Copilot Instructions Guide](https://github.blog/developer-skills/github/how-to-use-github-copilot-instructions/)
