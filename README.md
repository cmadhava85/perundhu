# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Bus Schedule Application

## Sequence Diagram
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Select From and To locations
    Frontend->>Backend: Fetch destination places
    Backend->>Database: Query destination places
    Database-->>Backend: Return destination places
    Backend-->>Frontend: Return destination places
    User->>Frontend: Click Search
    Frontend->>Backend: Fetch bus schedule
    Backend->>Database: Query bus schedule
    Database-->>Backend: Return bus schedule
    Backend-->>Frontend: Return bus schedule
    User->>Frontend: Click on a bus row
    Frontend->>Backend: Fetch stops between From and To
    Backend->>Database: Query stops
    Database-->>Backend: Return stops
    Backend-->>Frontend: Return stops
```

## Class Diagram
```mermaid
classDiagram
    class User {
        +String name
        +String email
    }
    class BusSchedule {
        +String from
        +String to
        +String busName
        +String busNumber
        +String departureTime
        +String arrivalTime
    }
    class Stop {
        +String name
        +String arrivalTime
        +String departureTime
    }
    User --> Frontend
    Frontend --> Backend
    Backend --> Database
    Backend --> BusSchedule
    BusSchedule --> Stop
```

## Architecture Diagram
```mermaid
flowchart TD
    User[User] -->|Mobile Browser| Frontend[React Frontend]
    Frontend -->|REST API Calls| Backend[Spring Boot Backend]
    Backend -->|Relational Queries| Database[MySQL Database]
    Backend -->|GCP Integration| GCP[Google Cloud Platform]
```
