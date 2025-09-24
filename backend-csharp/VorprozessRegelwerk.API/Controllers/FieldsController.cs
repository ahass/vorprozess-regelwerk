using Microsoft.AspNetCore.Mvc;
using VorprozessRegelwerk.Core.DTOs;
using VorprozessRegelwerk.Core.Interfaces;

namespace VorprozessRegelwerk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FieldsController : ControllerBase
{
    private readonly IFieldService _fieldService;
    private readonly ILogger<FieldsController> _logger;

    public FieldsController(IFieldService fieldService, ILogger<FieldsController> logger)
    {
        _fieldService = fieldService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAllFields()
    {
        try
        {
            // Simplified response for testing
            var mockFields = new[]
            {
                new {
                    id = "test-field-1",
                    name = new { de = "Test Feld", fr = "Champ test", it = "Campo test" },
                    type = "text",
                    visibility = "editable",
                    requirement = "optional",
                    validation = new { },
                    selectType = (string?)null,
                    options = new object[0],
                    documentMode = (string?)null,
                    documentConstraints = new { },
                    roleConfig = new { },
                    customerSpecific = false,
                    visibleForCustomers = new string[0],
                    dependencies = new object[0],
                    createdAt = DateTime.UtcNow,
                    updatedAt = DateTime.UtcNow
                }
            };
            return Ok(mockFields);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving fields");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FieldResponseDto>> GetField(string id)
    {
        try
        {
            var field = await _fieldService.GetFieldByIdAsync(id);
            if (field == null)
            {
                return NotFound(new { message = "Field not found" });
            }
            return Ok(field);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving field {FieldId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<FieldResponseDto>> CreateField([FromBody] FieldCreateDto fieldDto, [FromQuery] string userId = "system")
    {
        try
        {
            var field = await _fieldService.CreateFieldAsync(fieldDto, userId);
            return CreatedAtAction(nameof(GetField), new { id = field.Id }, field);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating field");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FieldResponseDto>> UpdateField(string id, [FromBody] Dictionary<string, object> fieldData, [FromQuery] string userId = "system")
    {
        try
        {
            var field = await _fieldService.UpdateFieldAsync(id, fieldData, userId);
            if (field == null)
            {
                return NotFound(new { message = "Field not found" });
            }
            return Ok(field);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating field {FieldId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteField(string id, [FromQuery] string userId = "system")
    {
        try
        {
            var success = await _fieldService.DeleteFieldAsync(id, userId);
            if (!success)
            {
                return NotFound(new { message = "Field not found" });
            }
            return Ok(new { message = "Field deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting field {FieldId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost("validate-field")]
    public async Task<ActionResult<object>> ValidateFieldValue([FromQuery] string fieldId, [FromBody] object value)
    {
        try
        {
            var result = await _fieldService.ValidateFieldValueAsync(fieldId, value);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating field {FieldId}", fieldId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("validation-schema/{fieldType}")]
    public async Task<ActionResult<object>> GetValidationSchema(string fieldType)
    {
        try
        {
            var schema = await _fieldService.GetValidationSchemaAsync(fieldType);
            return Ok(schema);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving validation schema for {FieldType}", fieldType);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}