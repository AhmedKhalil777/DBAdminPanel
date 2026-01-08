# Script to add InitialCreate migrations for all DbContexts
# Run this from the project root directory

$projectPath = "src\DBAdminPanel.Sample\DBAdminPanel.Sample.csproj"
$baseDir = "Migrations"

Write-Host "Adding migrations for all DbContexts..." -ForegroundColor Green

# List of all DbContexts
$contexts = @(
    "UserDbContext",
    "ProductDbContext",
    "OrderDbContext",
    "BlogDbContext",
    "CategoryDbContext",
    "EmployeeDbContext",
    "InvoiceDbContext",
    "NotificationDbContext",
    "ECommerceDbContext",
    "OrganizationDbContext"
)

foreach ($context in $contexts) {
    $outputDir = "$baseDir\$($context)Migrations"
    Write-Host ""
    Write-Host "Adding migration for $context..." -ForegroundColor Yellow
    
    try {
        dotnet ef migrations add InitialCreate --context $context --project $projectPath --output-dir $outputDir
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Migration added successfully for $context" -ForegroundColor Green
            
            # Fix namespace issues in generated migration files
            Write-Host "Fixing namespace issues..." -ForegroundColor Cyan
            
            # Fix Designer files
            $designerFiles = Get-ChildItem -Path "src\DBAdminPanel.Sample\$outputDir" -Filter "*InitialCreate.Designer.cs" -Recurse
            foreach ($file in $designerFiles) {
                $content = Get-Content $file.FullName -Raw
                $content = $content -replace "\[DbContext\(typeof\($context\)\)\]", "[DbContext(typeof(Data.$context))]"
                Set-Content -Path $file.FullName -Value $content -NoNewline
                Write-Host "  Fixed: $($file.Name)" -ForegroundColor Gray
            }
            
            # Fix ModelSnapshot files
            $snapshotFiles = Get-ChildItem -Path "src\DBAdminPanel.Sample\$outputDir" -Filter "*ModelSnapshot.cs" -Recurse
            foreach ($file in $snapshotFiles) {
                $content = Get-Content $file.FullName -Raw
                $content = $content -replace "\[DbContext\(typeof\($context\)\)\]", "[DbContext(typeof(Data.$context))]"
                Set-Content -Path $file.FullName -Value $content -NoNewline
                Write-Host "  Fixed: $($file.Name)" -ForegroundColor Gray
            }
            
            Write-Host "Namespace issues fixed for $context" -ForegroundColor Green
        } else {
            Write-Host "Failed to add migration for $context" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "Error adding migration for $context : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Migration creation completed!" -ForegroundColor Green

