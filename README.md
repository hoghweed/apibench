# apibench

A simple, modern API project using Fastify, MongoDB, TypeScript, and robust structure ideal for benchmarking, learning, or prototyping.

---

## Table of Contents
- [apibench](#apibench)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Architecture](#architecture)
  - [Key Features and Capabilities](#key-features-and-capabilities)
  - [Project Structure](#project-structure)
  - [Environment Variables](#environment-variables)
  - [Fastify Plugins](#fastify-plugins)
  - [API Routes](#api-routes)
    - [**POST /api/users**](#post-apiusers)
    - [**GET /api/users?created=asc|desc**](#get-apiuserscreatedascdesc)
    - [**OpenAPI Docs**](#openapi-docs)
    - [**Health Endpoints**](#health-endpoints)
  - [Development Infrastructure](#development-infrastructure)
  - [Scripts and Commands](#scripts-and-commands)
  - [Getting Started](#getting-started)
  - [Testing Your API with `/reference`](#testing-your-api-with-reference)
  - [Screenshots](#screenshots)
  - [License](#license)
  - [Contributors](#contributors)

---

## Project Overview

**apibench** is a sample RESTful API designed as a reference or starting point for secure and scalable API backends. It demonstrates clean architecture, password hashing, validation, error handling, plugin isolation, OpenAPI integration, and containerized infrastructure. It is suitable for both rapid prototyping and benchmarking.

---

## Architecture

- Built with **Fastify**, known for its speed and powerful plugin system.
- Models, validations, and response types are defined with **TypeScript** and **zod**.
- Uses **MongoDB** as the primary data store, managed via the official `mongodb` Node.js client.
- Infrastructure runs in containers using **Docker Compose**, with optional local GUI for database management.
- All configuration is environment-driven and supports best practices for cloud and local workflows.

**Good practices:**
- Encapsulation: Business logic, validation, and persistence are modularized using Fastify plugins.
- Extensibility: Adding new routes or swapping backend resources (like a different DB) can be done with minimal changes.
- Observability: Health checks and logging are built in.

---

## Key Features and Capabilities

- User registration, password salting & hashing, and user listing.
- Slugify logic for usernames, with support for auto-generation from name.
- Duplicate user protection.
- Exposes OpenAPI/Swagger docs at `/reference` using plugin integration.
- Health probes for Kubernetes/Docker (`/healthz`, `/liveness`).
- Database connection pooling and process shutdown hooks.
- All configuration can be customized via `.env`.
- Clear plugin boundaries for database, error handling, validation, config, and Swagger.

---

## Project Structure

```
apibench/
├── .env                      # Main environment config
├── compose.yaml              # Docker Compose infrastructure setup
├── src/
│   ├── app.ts                # Main Fastify app creation and plugin loading
│   ├── server.ts             # Application lifecycle and server startup
│   ├── env.ts                # Loads env vars
│   ├── plugins/              # Fastify plugin modules (db, configuration, error, swagger)
│   ├── routes/               # API route modules (users-create, users-get)
│   ├── errors/               # Application-specific error classes
│   └── types.ts              # Zod and TypeScript models/types
├── package.json
└── ... (see project tree for remaining files)
```

---

## Environment Variables

Defined in `.env` (sample values shown):

| Variable             | Description                         | Example                         |
|----------------------|-------------------------------------|---------------------------------|
| NODE_ENV             | Node environment                    | development                    |
| APPLICATION_NAME     | Service/application identifier      | apibench                       |
| APPLICATION_PORT     | Port for Fastify server             | 4111                            |
| CLOSE_GRACE_DELAY    | Graceful shutdown delay (ms)        | 1000                            |
| DB_URL               | MongoDB connection string           | mongodb://apibench:apibench@localhost:27018 |
| DB_NAME              | MongoDB database name               | apibench                        |
| LOG_LEVEL            | Fastify log level (debug, info...)  | debug, info, warn, error, silent|

---

## Fastify Plugins

The application benefits from Fastify's plugin architecture for maintainability and encapsulation. Major plugins in use:

- **@fastify/autoload**: Automatically loads plugins/routes from directories.
- **arecibo**: Health and liveness checking plugin.
- **fastify-type-provider-zod**: Integrates Zod with Fastify for runtime validation and OpenAPI generation.
- **@scalar/fastify-api-reference**: Serves OpenAPI documentation at `/reference`.
- **@fastify/one-line-logger**: Conditional, for clean log formatting (enabled based on LOG_LEVEL).
- **Custom plugins** in `/src/plugins/`:
  - `db.ts`: MongoDB client with graceful shutdown and collection registry.
  - `configuration.ts`: Loads and attaches configuration to Fastify instance.
  - `error.ts`: Custom error serialization and handling logic.
  - `swagger.ts`: Sets up aggregation of OpenAPI doc routes and UI.

---

## API Routes

All API endpoints are prefixed with `/api`.

### **POST /api/users**
- **Purpose:** Create a new user account.
- **Body:**  
  - `name: string` (min 5 chars)
  - `email: string` (valid email)
  - `password: string` (min 8 chars; stored salted/hashed)
  - `username: string` (optional; slugified, auto-generated if missing)
  - `isActive: boolean` (optional, default: true)
- **Behavior:**
  - Slugifies username or generates from name if missing.
  - Hashes password using bcrypt.
  - Checks for username uniqueness; returns 409 on duplicate.
  - Timestamps for created/updated set by server.
- **Success:** `201 Created` with user (no password field, includes string id)
- **Error:** `409 Conflict` (duplicate username), `400` for validation errors

### **GET /api/users?created=asc|desc**
- **Purpose:** List all users, sorted by creation time.
- **Query:**  
  - `created: 'asc' | 'desc'` (sort direction, required)
- **Response:**  
  - Array of users, each omitting password.
  - Ordered by time as specified.
- **Error:**
  - `400` for query or server issues.

### **OpenAPI Docs**
- **GET /reference**
- OpenAPI schema and live UI generated from code/schema.

### **Health Endpoints**
- **GET /healthz** (readiness)  
- **GET /liveness** (liveness)

---

## Development Infrastructure

The repository includes a Docker Compose stack for local dev and CI:

- **ab-mongo**: MongoDB container (with auth, persistent volume, healthcheck)
- **ab-mongo-express**: Web GUI for MongoDB admin at [http://localhost:8082](http://localhost:8082) (`admin`/`password` for basic auth)
- **ab-wait-for-dependencies**: Waits for DB and GUI services to be healthy before proceeding

All services are networked under `ab-network` and data persists in the `./data` directory.

---

## Scripts and Commands

Key npm/pnpm scripts (`package.json`):

| Script               | Description                                                          |
|----------------------|----------------------------------------------------------------------|
| `dev`                | Start Fastify in dev mode, reload on changes, loads `.env`           |
| `build`              | Build TypeScript project into `/dist`                                |
| `start`              | Run dev infra and then application (uses Docker Compose dependencies)|
| `test`               | Run tests with Vitest (auto-loads `.env`)                            |
| `test:coverage`      | Run tests and collect code coverage                                  |
| `lint`               | Run Biome for linting                                                |
| `format`             | Run Biome for formatting                                             |
| `run:infra`          | Launch dev infrastructure via Docker Compose                         |
| `run:infra:stop`     | Stop dev infrastructure containers                                   |

---

## Getting Started

1. **Install dependencies:**  
   ```sh
   pnpm boostrap
   ```
2. **Setup environment:**  
   Edit `.env` as needed.
3. **Start app in development:**  
   ```sh
   pnpm start
   ```
   this will start automatically the infrastructure as well

4. **Explore API and docs:**  
   - API: [http://localhost:4111/api/users](http://localhost:4111/api/users)
   - Docs: [http://localhost:4111/reference](http://localhost:4111/reference)
   - MongoDB GUI: [http://localhost:8082](http://localhost:8082) (`admin`/`password`)

---

## Testing Your API with `/reference`

The application automatically generates and serves full OpenAPI (Swagger) documentation at the `/reference` endpoint. This interactive documentation allows you to:

- Explore all available API routes and their schemas.
- Try API calls directly from your browser using the "Try it out" feature.
- View request/response formats, possible status codes, and sample payloads.

**To use:**
1. Start the server as described above.
2. Open [http://localhost:4111/reference](http://localhost:4111/reference) in your browser.
3. Expand endpoints, fill in example data, and test your API live.

This is a fast way to verify the API works as expected and to share API exploration with your team.

---

## Screenshots

> _Add your screenshots here!_
>
> **API Reference Example:**  
> ![API Reference UI](screenshots/api-reference.png)
>
> **MongoDB GUI Example:**  
> ![MongoDB GUI](screenshots/mongo-gui.png)
>
> **User Creation Request/Response:**  
> ![User Creation](screenshots/create-user.png)
>
> _To add your own screenshots, simply save images in the `screenshots/` directory and update these markdown paths._

---

## License

MIT © Manuel S. Martone

---

## Contributors

- [Manuel S. Martone](mailto:manuel.martone@gmail.com)
