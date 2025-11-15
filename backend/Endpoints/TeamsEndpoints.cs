using Microsoft.EntityFrameworkCore;
using TeamUpdates.Backend.Data;
using TeamUpdates.Backend.Entities;

namespace TeamUpdates.Backend.Endpoints;

public static class TeamsEndpoints
{
    public static RouteGroupBuilder MapTeamsEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (AppDbContext db) =>
        {
            var teams = await db.Teams
                .Where(t => t.IsPublic)
                .Select(t => new { t.Id, t.Name, t.IsPublic, t.CreatedAt })
                .ToListAsync();
            return Results.Ok(teams);
        });

        group.MapGet("/{teamId:guid}", async (Guid teamId, AppDbContext db) =>
        {
            var team = await db.Teams.FindAsync(teamId);
            if (team == null)
                return Results.NotFound(new { error = "Team not found" });
            
            // TODO: Check if user is member for private teams
            if (!team.IsPublic)
            {
                return Results.NotFound(new { error = "Team not found" });
            }
            
            return Results.Ok(new { team.Id, team.Name, team.IsPublic, team.CreatedAt });
        });

        group.MapPost("/{teamId:guid}/join", async (Guid teamId, Guid userId, AppDbContext db) =>
        {
            var team = await db.Teams.FindAsync(teamId);
            if (team == null)
                return Results.NotFound(new { error = "Team not found" });
            
            var existingMembership = await db.TeamMemberships
                .FirstOrDefaultAsync(tm => tm.UserId == userId && tm.TeamId == teamId);
            
            if (existingMembership != null)
                return Results.Ok(new { message = "Already a member" });
            
            var membership = new TeamMembership
            {
                UserId = userId,
                TeamId = teamId,
                JoinedAt = DateTime.UtcNow
            };
            
            db.TeamMemberships.Add(membership);
            await db.SaveChangesAsync();
            
            return Results.Ok(new { message = "Joined team successfully" });
        });

        return group;
    }
}
