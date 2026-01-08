# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for building and publishing DBAdminPanel packages to NuGet.

## Prerequisites

1. A GitHub repository with the DBAdminPanel code
2. A NuGet account with API key
3. GitHub repository access with Actions enabled

## Setup Steps

### 1. Get Your NuGet API Key

**Important**: You must have the packages already created on NuGet.org OR use a global scope API key.

#### Option A: Global Scope (Recommended for First-Time Publishing)

1. Go to [NuGet.org](https://www.nuget.org/)
2. Sign in to your account
3. Click on your username → **API Keys**
4. Click **Create** to generate a new API key
5. Set:
   - **Key Name**: `DBAdminPanel GitHub Actions`
   - **Expiration**: Choose appropriate expiration (or leave blank for no expiration)
   - **Select Scopes**: 
     - ✅ **Select scope**: Choose **Push new packages and package versions** (Global scope)
     - This allows pushing any package under your account
6. Click **Create**
7. **Copy the API key** (you won't be able to see it again!)

#### Option B: Package-Specific Scope (After Packages Exist)

1. Go to [NuGet.org](https://www.nuget.org/)
2. Sign in to your account
3. Click on your username → **API Keys**
4. Click **Create** to generate a new API key
5. Set:
   - **Key Name**: `DBAdminPanel GitHub Actions`
   - **Expiration**: Choose appropriate expiration (or leave blank for no expiration)
   - **Select Scopes**: 
     - ✅ **Select a package**: Choose `DBAdminPanel` and `DBAdminPanel.SourceGenerator`
     - Or select **Glob pattern**: `DBAdminPanel*`
6. Click **Create**
7. **Copy the API key** (you won't be able to see it again!)

**Note**: For first-time publishing, you MUST use Option A (Global scope). Package-specific scopes only work for packages that already exist on NuGet.org.

### 2. Add Secret to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `NUGET_API_KEY`
   - **Secret**: Paste your NuGet API key
5. Click **Add secret**

### 3. Verify Workflow File

The workflow file (`.github/workflows/build-and-publish.yml`) should be in your repository. It will:
- Build on push to `main` branch
- Build on pull requests
- Publish to NuGet on releases

## Publishing a Release

### Method 1: Create a GitHub Release

1. Go to your repository on GitHub
2. Click **Releases** → **Create a new release**
3. Create a new tag (e.g., `v1.0.0`)
4. Fill in release title and description
5. Click **Publish release**
6. The workflow will automatically:
   - Extract version from tag (removes `v` prefix if present)
   - Build both packages
   - Publish to NuGet

### Method 2: Manual Workflow Dispatch

1. Go to **Actions** tab in your repository
2. Select **Build and Publish to NuGet** workflow
3. Click **Run workflow**
4. Enter version (e.g., `1.0.0`)
5. Click **Run workflow**
6. The workflow will build and publish with the specified version

### Method 3: Use Project File Version

If you don't specify a version, the workflow will use the version from the `.csproj` files.

## Workflow Behavior

### Build Job

Runs on:
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch
- Release creation

Actions:
- Sets up .NET and Node.js
- Installs Angular CLI
- Builds Angular UI
- Builds .NET solution
- Runs tests (if any)
- Creates NuGet packages
- Uploads artifacts

### Publish Job

Runs only when:
- A GitHub release is created, OR
- Manual workflow dispatch with version specified

Actions:
- Downloads build artifacts
- Determines version (from tag, input, or project file)
- Updates package versions
- Rebuilds and repacks with correct version
- Publishes to NuGet:
  - `DBAdminPanel.SourceGenerator`
  - `DBAdminPanel`

## Versioning

### Semantic Versioning

We recommend using [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., `1.0.0`)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Version Sources (in order of precedence)

1. **GitHub Release Tag**: `v1.0.0` → `1.0.0`
2. **Manual Input**: Version specified in workflow dispatch
3. **Project File**: Version from `.csproj` `<PackageVersion>` element

## Fixing npm Lock File Issues

If you encounter `npm ci` errors about package.json and package-lock.json being out of sync:

1. **Navigate to the Angular UI directory**:
   ```bash
   cd src/DBAdminPanel/dbadminpanel-ui
   ```

2. **Update the lock file**:
   ```bash
   npm install
   ```

3. **Commit the updated lock file**:
   ```bash
   git add package-lock.json
   git commit -m "Update package-lock.json"
   git push
   ```

The workflow now has a fallback that uses `npm install` if `npm ci` fails, but it's best practice to keep the lock file in sync.

## Troubleshooting

### Issue: Workflow fails with "NuGet API key not found"

**Solution**: 
- Ensure `NUGET_API_KEY` secret is set in repository settings
- Go to **Settings** → **Secrets and variables** → **Actions**
- Verify the secret name is exactly `NUGET_API_KEY` (case-sensitive)

### Issue: 403 Forbidden - API key invalid or expired

**Solution**:
1. **Verify API key is correct**:
   - Go to [NuGet.org API Keys](https://www.nuget.org/account/apikeys)
   - Check if the key exists and is not expired
   - If expired, create a new key and update the GitHub secret

2. **Check API key scope**:
   - For **first-time publishing**: Use **Global scope** (Push new packages and package versions)
   - For **existing packages**: Can use package-specific scope
   - Package-specific scopes only work if the package already exists on NuGet.org

3. **Verify package ownership**:
   - Ensure you own the packages `DBAdminPanel` and `DBAdminPanel.SourceGenerator` on NuGet.org
   - If packages don't exist, you must use a Global scope API key to create them

4. **Check package ID matches**:
   - Verify the package ID in `.csproj` matches what the API key has permission for
   - Package IDs are case-sensitive

5. **Recreate API key**:
   - Delete the old API key on NuGet.org
   - Create a new one with Global scope
   - Update the `NUGET_API_KEY` secret in GitHub

### Issue: Package already exists on NuGet

**Solution**: 
- The workflow uses `--skip-duplicate` flag, so it won't fail
- To publish a new version, increment the version number
- NuGet doesn't allow overwriting existing versions

### Issue: Angular build fails

**Solution**:
- Check Node.js version (should be 20.x)
- Ensure `package-lock.json` is committed
- Check for npm dependency issues

### Issue: Version not updating correctly

**Solution**:
- Check that tag format is correct (e.g., `v1.0.0` or `1.0.0`)
- Verify project file has `<PackageVersion>` element
- Check workflow logs for version detection

### Issue: Packages not appearing on NuGet

**Solution**:
- Wait a few minutes (NuGet indexing can take time)
- Check NuGet API key has correct permissions
- Verify package names match exactly
- Check workflow logs for errors

## Best Practices

1. **Always test locally** before creating a release
2. **Use release tags** for production versions
3. **Keep version numbers** in sync between both packages
4. **Review workflow logs** after publishing
5. **Verify packages** on NuGet.org after publishing
6. **Update changelog** with each release

## Workflow File Location

The workflow file is located at:
```
.github/workflows/build-and-publish.yml
```

You can customize it to:
- Add additional build steps
- Change trigger conditions
- Add notifications
- Customize versioning logic

## Security Notes

- **Never commit** NuGet API keys to the repository
- Use GitHub Secrets for all sensitive information
- Rotate API keys periodically
- Use scoped API keys (only for specific packages)
- Set appropriate expiration dates

## Support

If you encounter issues:
1. Check workflow logs in the **Actions** tab
2. Verify all secrets are set correctly
3. Ensure repository has Actions enabled
4. Check NuGet API key permissions
5. Open an issue on GitHub

---

**Happy Publishing! 🚀**

