/*...*/
#:package Aspire.Hosting.Docker@13-*
#:package Aspire.Hosting.JavaScript@13.0.0
#:package Aspire.Hosting.Yarp@13.0.0
#:sdk Aspire.AppHost.Sdk@13.0.0

var builder = DistributedApplication.CreateBuilder(args);

builder.AddDockerComposeEnvironment("dc");

var frontend = builder.AddViteApp("frontend", "./frontend");

// Add backend API
var backend = builder.AddProject("backend", "./backend/TeamUpdates.Backend.csproj");

builder.AddYarp("app")
       .WithConfiguration(c =>
       {
           if (builder.ExecutionContext.IsRunMode)
           {
               // In run mode, route /api/** to backend
               c.AddRoute("api/{**catch-all}", backend);
               // Forward all other requests to vite dev server
               c.AddRoute("{**catch-all}", frontend);
           }
       })
       .WithExternalHttpEndpoints()
       .PublishWithStaticFiles(frontend);

builder.Build().Run();
