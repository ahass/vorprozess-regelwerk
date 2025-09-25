using VorprozessRegelwerk.Core.DTOs;
using VorprozessRegelwerk.Core.DTOs;
using VorprozessRegelwerk.Core.Enums;
using VorprozessRegelwerk.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VorprozessRegelwerk.Core.Interfaces;

public interface ITemplateService
{
    Task<IEnumerable<TemplateResponseDto>> GetAllTemplatesAsync();
    Task<TemplateResponseDto?> GetTemplateByIdAsync(string id);
    Task<TemplateResponseDto> CreateTemplateAsync(TemplateCreateDto templateDto, string userId = "system");
    Task<TemplateResponseDto?> UpdateTemplateAsync(string id, TemplateUpdateDto templateDto, string userId = "system");
    Task<bool> DeleteTemplateAsync(string id, string userId = "system");
    Task<TemplateRenderResponseDto> RenderTemplatesAsync(TemplateRenderRequestDto renderRequest);
    Task<object> SimulateTemplateAsync(string templateId, UserRole role, Dictionary<string, object> fieldValues, string? customerId = null);

    // NEW: Export
    Task<TemplateExportDto?> ExportTemplateAsync(string id);
}

using VorprozessRegelwerk.Core.Entities;
using VorprozessRegelwerk.Core.Enums;

namespace VorprozessRegelwerk.Core.Interfaces;

public interface ITemplateService
{
    Task<IEnumerable<TemplateResponseDto>> GetAllTemplatesAsync();
    Task<TemplateResponseDto?> GetTemplateByIdAsync(string id);
    Task<TemplateResponseDto> CreateTemplateAsync(TemplateCreateDto templateDto, string userId = "system");
    Task<TemplateResponseDto?> UpdateTemplateAsync(string id, TemplateUpdateDto templateDto, string userId = "system");
    Task<bool> DeleteTemplateAsync(string id, string userId = "system");
    Task<TemplateRenderResponseDto> RenderTemplatesAsync(TemplateRenderRequestDto renderRequest);
    Task<object> SimulateTemplateAsync(string templateId, UserRole role, Dictionary<string, object> fieldValues, string? customerId = null);
}