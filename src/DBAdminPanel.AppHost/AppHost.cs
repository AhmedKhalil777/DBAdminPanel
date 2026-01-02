var builder = DistributedApplication.CreateBuilder(args);

// Add PostgreSQL server
var postgres = builder.AddPostgres("postgres", port: 5432)
    .WithDataVolume()
    .WithPgAdmin(a => { a.WithHostPort(5050); });

// Add the sample project with connection to PostgreSQL
// WithReference ensures the sample waits for PostgreSQL to be ready before starting
var sample = builder.AddProject<Projects.DBAdminPanel_Sample>("dbadminpanel-sample")
    .WithReference(postgres)
    .WithEnvironment("ASPIRE_WAIT_FOR_POSTGRES", "true");

builder.Build().Run();
