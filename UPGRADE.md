# Upgrade Summary

This document outlines the major changes made during the upgrade of the NestJS RealWorld Example App from legacy versions to the latest stable versions.

## Version Updates

### Core Framework
- **NestJS**: 7.0.5 → 10.x (latest stable)
  - `@nestjs/common`: ^7.0.5 → ^10.0.0
  - `@nestjs/core`: ^7.0.5 → ^10.0.0
  - `@nestjs/platform-express`: ^7.0.5 → ^10.0.0
  - `@nestjs/microservices`: ^7.0.5 → ^10.0.0
  - `@nestjs/websockets`: ^7.0.5 → ^10.0.0
  - `@nestjs/testing`: ^7.0.5 → ^10.0.0
  - `@nestjs/swagger`: ^4.4.0 → ^7.0.0
  - `@nestjs/typeorm`: ^7.0.0 → ^10.0.0

### TypeScript & Build Tools
- **TypeScript**: ^3.8.3 → ^5.6.0
- **ts-node**: ^8.9.1 → ^10.9.0
- **ts-jest**: ^25.4.0 → ^29.2.0

### Database
- **TypeORM**: ^0.2.24 → ^0.3.20
- **mysql**: ^2.18.1 → **mysql2**: ^3.11.0 (Breaking: Changed driver)

### Testing
- **Jest**: ^25.5.3 → ^29.7.0
- **supertest**: ^3.4.2 → ^7.0.0
- **@types/jest**: ^25.2.1 → ^29.5.0
- **@types/supertest**: Added ^6.0.0

### Dependencies
- **argon2**: ^0.26.2 → ^0.41.0
- **class-transformer**: ^0.2.3 → ^0.5.1
- **class-validator**: ^0.11.1 → ^0.14.0
- **crypto-js**: ^4.0.0 → ^4.2.0
- **jsonwebtoken**: ^8.5.1 → ^9.0.0
- **passport-jwt**: ^4.0.0 → ^4.0.1
- **reflect-metadata**: ^0.1.13 → ^0.2.0
- **rxjs**: ^6.5.5 → ^7.8.0
- **slug**: ^1.1.0 → ^9.0.0
- **swagger-ui-express**: ^4.1.4 → ^5.0.0
- **nodemon**: ^1.19.4 → ^3.1.0

### Type Definitions Added
- `@types/express`: ^5.0.0
- `@types/jsonwebtoken`: ^9.0.0
- `@types/passport-jwt`: ^4.0.0

### Removed Dependencies
- **crypto**: Removed (Node.js built-in, should not be a dependency)
- **atob**, **deep-extend**, **extend**: Removed (security patches no longer needed)

## Breaking Changes

### 1. TypeORM 0.3.x Migration

#### Connection → DataSource
```typescript
// Before (TypeORM 0.2.x)
import { Connection } from 'typeorm';
constructor(private readonly connection: Connection) {}

// After (TypeORM 0.3.x)
import { DataSource } from 'typeorm';
constructor(private readonly dataSource: DataSource) {}
```

#### findOne() Method Changes
```typescript
// Before
await repository.findOne(id);
await repository.findOne({ field: value });

// After
await repository.findOne({ where: { id } });
await repository.findOne({ where: { field: value } });
```

#### getRepository() Deprecation
```typescript
// Before
const qb = await getRepository(Entity).createQueryBuilder('alias');

// After (use injected repository)
const qb = this.repository.createQueryBuilder('alias');
```

#### find() Options Changes
```typescript
// Before
await repository.find({ field: value });

// After
await repository.find({ where: { field: value } });
```

### 2. NestJS Changes

#### HttpException Import Path
```typescript
// Before
import { HttpException } from '@nestjs/common/exceptions/http.exception';

// After
import { HttpException } from '@nestjs/common';
```

#### Swagger DocumentBuilder
```typescript
// Before
const options = new DocumentBuilder()
  .setBasePath('api')
  .build();

// After (setBasePath removed)
const config = new DocumentBuilder()
  .build();
```

### 3. class-transformer Changes

#### Function Rename
```typescript
// Before
import { plainToClass } from 'class-transformer';
const object = plainToClass(metatype, value);

// After
import { plainToInstance } from 'class-transformer';
const object = plainToInstance(metatype, value);
```

### 4. MySQL Driver Change
The project now uses `mysql2` instead of `mysql` as required by TypeORM 0.3.x.

### 5. TypeScript Configuration Updates
- Target updated to ES2021
- Added `esModuleInterop`, `resolveJsonModule`, and other modern options
- Enabled `skipLibCheck` for faster compilation
- Added `incremental` compilation support

### 6. Jest Configuration Updates
```json
// Updated transform from old preprocessor path
"transform": {
  "^.+\\.(t|j)s$": "ts-jest"
}
```

## Code Changes Made

### Modified Files
1. `package.json` - Updated all dependencies
2. `tsconfig.json` - Modernized TypeScript configuration
3. `jest.json` - Updated for Jest 29
4. `src/app.module.ts` - Changed Connection to DataSource, added inline TypeORM config
5. `src/main.ts` - Removed deprecated Swagger setBasePath
6. `src/user/user.service.ts` - Updated findOne calls, removed getRepository
7. `src/user/user.controller.ts` - Fixed HttpException import
8. `src/user/auth.middleware.ts` - Fixed HttpException import
9. `src/article/article.service.ts` - Updated findOne calls, removed getRepository
10. `src/profile/profile.service.ts` - Updated findOne calls, fixed imports
11. `src/shared/pipes/validation.pipe.ts` - Changed plainToClass to plainToInstance
12. `ormconfig.json.example` - Updated entity paths

## Migration Notes

### Database Configuration
The TypeORM configuration is now inline in `app.module.ts` but can still be overridden via environment variables:
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 3306)
- `DB_USERNAME` (default: root)
- `DB_PASSWORD` (default: '')
- `DB_DATABASE` (default: nestjsrealworld)

### Installation
After pulling these changes:
```bash
npm install
```

### Compilation
```bash
npm run prestart:prod
```

### Running the Application
```bash
# Development
npm run start:watch

# Production
npm run start:prod
```

## Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Notes
- All deprecated APIs have been replaced with their modern equivalents
- The project successfully compiles with TypeScript 5.6
- No breaking changes to the API endpoints
- All business logic remains unchanged
- NestJS 10 was chosen over 11 for full ecosystem compatibility (@nestjs/typeorm supports up to v10)

## Troubleshooting

### Compilation Errors
If you encounter TypeScript errors, ensure you've run `npm install` to get the correct type definitions.

### Database Connection Issues
Ensure you have `mysql2` installed and your database configuration is correct. The `mysql` driver is no longer supported with TypeORM 0.3.x.

### Peer Dependency Warnings
If you see peer dependency warnings, they can generally be safely ignored as all versions have been tested to work together.

