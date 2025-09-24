using Microsoft.AspNetCore.Mvc;
using VorprozessRegelwerk.Core.DTOs;
using VorprozessRegelwerk.Core.Interfaces;

namespace VorprozessRegelwerk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChangeLogController : ControllerBase
{
    private readonly IChangeLogService _changeLogService;
    private readonly ILogger<ChangeLogController> _logger;

    public ChangeLogController(IChangeLogService changeLogService, ILogger<ChangeLogController> logger)
    {
        _changeLogService = changeLogService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ChangeLogResponseDto>>> GetChangeLog([FromQuery] int limit = 100, [FromQuery] string? entityType = null)
    {
        try
        {
            var changelog = await _changeLogService.GetChangeLogAsync(limit, entityType);
            return Ok(changelog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving change log");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{entityId}")]
    public async Task<ActionResult<IEnumerable<ChangeLogResponseDto>>> GetEntityChangeLog(string entityId)
    {
        try
        {
            var changelog = await _changeLogService.GetEntityChangeLogAsync(entityId);
            return Ok(changelog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving change log for entity {EntityId}", entityId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}