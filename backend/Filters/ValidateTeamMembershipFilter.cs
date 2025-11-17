using Microsoft.EntityFrameworkCore;
using TeamUpdates.Backend.Data;

namespace TeamUpdates.Backend.Filters;

public class ValidateTeamMembershipAttribute : Attribute
{
}

public class ValidateTeamMembershipFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        
        // Get teamId from route parameters
        if (!context.HttpContext.Request.RouteValues.TryGetValue("teamId", out var teamIdObj) ||
            !Guid.TryParse(teamIdObj?.ToString(), out var teamId))
        {
            return Results.BadRequest(new { error = "Invalid team ID" });
        }

        // TODO: Get userId from authenticated user instead of request body
        // For now, we'll get it from the request body or query parameters
        Guid userId;
        if (context.HttpContext.Request.Method == "POST" || context.HttpContext.Request.Method == "PUT")
        {
            // Try to get userId from the request body (this is temporary)
            // In a real implementation, this would come from the authenticated user
            var requestBody = await context.HttpContext.Request.ReadFromJsonAsync<Dictionary<string, object>>();
            if (requestBody == null || !requestBody.TryGetValue("userId", out var userIdObj) ||
                !Guid.TryParse(userIdObj?.ToString(), out userId))
            {
                return Results.BadRequest(new { error = "UserId is required in request body (temporary - will use authenticated user)" });
            }
        }
        else
        {
            // For GET requests, try query parameter
            if (!Guid.TryParse(context.HttpContext.Request.Query["userId"].FirstOrDefault(), out userId))
            {
                return Results.BadRequest(new { error = "UserId is required in query parameter (temporary - will use authenticated user)" });
            }
        }

        // Check if user is a member of the team
        var isMember = await dbContext.TeamMemberships
            .AnyAsync(tm => tm.UserId == userId && tm.TeamId == teamId);

        if (!isMember)
        {
            return Results.Forbid();
        }

        return await next(context);
    }
}
