using VorprozessRegelwerk.Core.DTOs;

namespace VorprozessRegelwerk.Core.Interfaces;

public interface IChangeLogService
{
    Task<IEnumerable<ChangeLogResponseDto>> GetChangeLogAsync(int limit = 100, string? entityType = null);
    Task<IEnumerable<ChangeLogResponseDto>> GetEntityChangeLogAsync(string entityId);
    Task LogChangeAsync(string entityType, string entityId, string action, Dictionary<string, object> changes, string userId, string userName);
}