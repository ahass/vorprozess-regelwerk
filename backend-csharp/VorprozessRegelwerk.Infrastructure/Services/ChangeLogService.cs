using Microsoft.EntityFrameworkCore;
using VorprozessRegelwerk.Core.DTOs;
using VorprozessRegelwerk.Core.Entities;
using VorprozessRegelwerk.Core.Interfaces;
using VorprozessRegelwerk.Infrastructure.Data;

namespace VorprozessRegelwerk.Infrastructure.Services;

public class ChangeLogService : IChangeLogService
{
    private readonly ApplicationDbContext _context;

    public ChangeLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ChangeLogResponseDto>> GetChangeLogAsync(int limit = 100, string? entityType = null)
    {
        var query = _context.ChangeLogEntries.AsQueryable();

        if (!string.IsNullOrEmpty(entityType))
        {
            query = query.Where(c => c.EntityType == entityType);
        }

        var changelog = await query
            .OrderByDescending(c => c.Timestamp)
            .Take(limit)
            .ToListAsync();

        return changelog.Select(entry => new ChangeLogResponseDto
        {
            Id = entry.Id,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            Action = entry.Action,
            Changes = entry.ChangesObject,
            UserId = entry.UserId,
            UserName = entry.UserName,
            Timestamp = entry.Timestamp
        });
    }

    public async Task<IEnumerable<ChangeLogResponseDto>> GetEntityChangeLogAsync(string entityId)
    {
        var changelog = await _context.ChangeLogEntries
            .Where(c => c.EntityId == entityId)
            .OrderByDescending(c => c.Timestamp)
            .Take(100)
            .ToListAsync();

        return changelog.Select(entry => new ChangeLogResponseDto
        {
            Id = entry.Id,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            Action = entry.Action,
            Changes = entry.ChangesObject,
            UserId = entry.UserId,
            UserName = entry.UserName,
            Timestamp = entry.Timestamp
        });
    }

    public async Task LogChangeAsync(string entityType, string entityId, string action, Dictionary<string, object> changes, string userId, string userName)
    {
        var logEntry = new ChangeLogEntry
        {
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            ChangesObject = changes,
            UserId = userId,
            UserName = userName
        };

        await _context.ChangeLogEntries.AddAsync(logEntry);
        await _context.SaveChangesAsync();
    }
}