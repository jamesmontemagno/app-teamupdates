/*...*/
#:package Aspire.Hosting.Docker@13-*
#:package Aspire.Hosting.JavaScript@13.0.0
#:package Aspire.Hosting.Yarp@13.0.0
#:sdk Aspire.AppHost.Sdk@13.0.0

var builder = DistributedApplication.CreateBuilder(args);

builder.AddDockerComposeEnvironment("dc");

// Add backend API
var backend = builder.AddProject("backend", "./backend/TeamUpdates.Backend.csproj");

// Add frontend with browser telemetry support
var frontend = builder.AddViteApp("frontend", "./frontend")
    .WithReference(backend)
    .WithOtlpExporter(); // Enable OTLP exporter for browser telemetry

builder.Build().Run();
