using Microsoft.AspNetCore.Mvc;
using VorprozessRegelwerk.Core.DTOs;
using VorprozessRegelwerk.Core.Enums;
using VorprozessRegelwerk.Core.Interfaces;

namespace VorprozessRegelwerk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController : ControllerBase
{
    private readonly ITemplateService _templateService;
    private readonly ILogger<TemplatesController> _logger;

    public TemplatesController(ITemplateService templateService, ILogger<TemplatesController> logger)
    {
        _templateService = templateService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TemplateResponseDto>>> GetAllTemplates()
    {
        try
        {
            var templates = await _templateService.GetAllTemplatesAsync();
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving templates");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TemplateResponseDto>> GetTemplate(string id)
    {
        try
        {
            var template = await _templateService.GetTemplateByIdAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }
            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving template {TemplateId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<TemplateResponseDto>> CreateTemplate([FromBody] TemplateCreateDto templateDto, [FromQuery] string userId = "system")
    {
        try
        {
            var template = await _templateService.CreateTemplateAsync(templateDto, userId);
            return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TemplateResponseDto>> UpdateTemplate(string id, [FromBody] TemplateUpdateDto templateDto, [FromQuery] string userId = "system")
    {
        try
        {
            var template = await _templateService.UpdateTemplateAsync(id, templateDto, userId);
            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }
            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template {TemplateId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemplate(string id, [FromQuery] string userId = "system")
    {
        try
        {
            var success = await _templateService.DeleteTemplateAsync(id, userId);
            if (!success)
            {
                return NotFound(new { message = "Template not found" });
            }
            return Ok(new { message = "Template deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template {TemplateId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("render")]
    public async Task<ActionResult<TemplateRenderResponseDto>> RenderTemplates([FromBody] TemplateRenderRequestDto renderRequest)
    {
        try
        {
            var result = await _templateService.RenderTemplatesAsync(renderRequest);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rendering templates");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("simulate")]
    public async Task<ActionResult<object>> SimulateTemplate(
        [FromQuery] string templateId,
        [FromQuery] UserRole role,
        [FromBody] Dictionary<string, object> fieldValues,
        [FromQuery] string? customerId = null)
    {
        try
        {
            var result = await _templateService.SimulateTemplateAsync(templateId, role, fieldValues, customerId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating template {TemplateId}", templateId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

    [HttpGet("{id}/export")] 
    public async Task<ActionResult<TemplateExportDto>> ExportTemplate(string id)
    {
        try
        {
            var export = await _templateService.ExportTemplateAsync(id);
            if (export == null)
            {
                return NotFound(new { message = "Template not found" });
            }
            return Ok(export);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting template {TemplateId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }


    [HttpGet("export")] 
    public async Task<ActionResult<IEnumerable<TemplateExportDto>>> ExportTemplates([FromQuery] string ids)
    {
        try
        {
            var idList = string.IsNullOrWhiteSpace(ids)
                ? new List<string>()
                : ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

            if (!idList.Any())
            {
                return BadRequest(new { message = "No template ids provided" });
            }

            var results = new List<TemplateExportDto>();
            foreach (var id in idList)
            {
                var export = await _templateService.ExportTemplateAsync(id);
                if (export != null) results.Add(export);
            }
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting templates {Ids}", ids);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
