# Local Development Setup

This guide explains how to run the Angular application locally with the backend API.

## Prerequisites

1. .NET backend running (typically on `http://localhost:5085`)
2. Node.js and npm installed
3. Angular CLI installed globally or via npm

## Environment Configuration

The application uses environment files to configure the API URL:

- **`environment.ts`** - Default environment (uses relative path `/DBAdminPanel`)
- **`environment.local.ts`** - Local development environment (uses proxy)

## Running Locally

1. Start your .NET backend application (e.g., on `http://localhost:5085`)

2. Run the Angular app with local configuration:
   ```bash
   npm run start:local
   ```
   or
   ```bash
   ng serve --configuration local
   ```

3. **IMPORTANT**: Access the Angular app at `http://localhost:4200` (NOT `http://localhost:7277/DBAdminPanel/`)
   - The dev server runs on port 4200
   - Uses `index.local.html` with `base href="/"` (no path prefix)
   - API requests go directly to `http://localhost:5085/DBAdminPanel/*` (full URL)
   - This avoids CORS issues and works seamlessly with the backend
   
   **Note**: If you access `http://localhost:7277/DBAdminPanel/`, you'll get the production build from the backend, which uses `base href="/DBAdminPanel/"` and will try to load assets from the backend server.

## Configuration Details

- **Local HTML**: `src/index.local.html` uses `base href="/"` instead of `/DBAdminPanel/`
- **API URL**: `environment.local.ts` uses full URL `http://localhost:5085/DBAdminPanel`
- **Routes**: Work from root path (`/`) when using local configuration

## Proxy Configuration

The proxy configuration is in `proxy.conf.json`:
- Forwards `/DBAdminPanel` requests to `http://localhost:5085`
- Handles CORS issues during development
- Change the target port if your backend runs on a different port

## Changing Backend Port

If your backend runs on a different port (e.g., `http://localhost:7277`):

1. Update `proxy.conf.json`:
   ```json
   {
     "/DBAdminPanel": {
       "target": "http://localhost:7277",
       ...
     }
   }
   ```

2. Or update `environment.local.ts` if not using proxy:
   ```typescript
   apiUrl: 'http://localhost:7277/DBAdminPanel'
   ```

## Troubleshooting

- **CORS errors**: Make sure you're using the proxy configuration or the backend has CORS enabled
- **404 errors**: Verify the backend is running and accessible
- **API not found**: Check that the backend URL and port are correct

