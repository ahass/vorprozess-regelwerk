using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VorprozessRegelwerk.Core.DTOs;
using VorprozessRegelwerk.Core.Entities;
using VorprozessRegelwerk.Core.Enums;
using VorprozessRegelwerk.Core.Interfaces;
using VorprozessRegelwerk.Core.Services;
using VorprozessRegelwerk.Infrastructure.Data;

namespace VorprozessRegelwerk.Infrastructure.Services;

public class TemplateService : ITemplateService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IChangeLogService _changeLogService;
    private readonly DependencyEngine _dependencyEngine;
    private readonly ILogger<TemplateService> _logger;

    public TemplateService(
        ApplicationDbContext context,
        IMapper mapper,
        IChangeLogService changeLogService,
        DependencyEngine dependencyEngine,
        ILogger<TemplateService> logger)
    {
        _context = context;
        _mapper = mapper;
        _changeLogService = changeLogService;
        _dependencyEngine = dependencyEngine;
        _logger = logger;
    }

    public async Task<IEnumerable<TemplateResponseDto>> GetAllTemplatesAsync()
    {
        var templates = await _context.Templates
            .Include(t => t.Names)
            .Include(t => t.Descriptions)
            .Include(t => t.TemplateFields)
            .ToListAsync();

        return templates.Select(MapToResponseDto);
    }

    public async Task<TemplateResponseDto?> GetTemplateByIdAsync(string id)
    {
        var template = await _context.Templates
            .Include(t => t.Names)
            .Include(t => t.Descriptions)
            .Include(t => t.TemplateFields)
            .FirstOrDefaultAsync(t => t.Id == id);

        return template != null ? MapToResponseDto(template) : null;
    }

    public async Task<TemplateResponseDto> CreateTemplateAsync(TemplateCreateDto templateDto, string userId = "system")
    {
        var template = new Template
        {
            CreatedBy = userId,
            UpdatedBy = userId
        };

        _context.Templates.Add(template);
        await _context.SaveChangesAsync();

        // Add multilanguage texts
        await SetMultiLanguageTextAsync("template_name", template.Id, templateDto.Name.ToDictionary());
        if (templateDto.Description != null)
        {
            await SetMultiLanguageTextAsync("template_description", template.Id, templateDto.Description.ToDictionary());
        }

        // Log change
        await _changeLogService.LogChangeAsync("template", template.Id, "created", 
            new Dictionary<string, object> { ["name"] = templateDto.Name.ToDictionary() }, 
            userId, "System User");

        return await GetTemplateByIdAsync(template.Id) ?? throw new InvalidOperationException("Failed to retrieve created template");
    }

    public async Task<TemplateResponseDto?> UpdateTemplateAsync(string id, TemplateUpdateDto templateDto, string userId = "system")
    {
        var template = await _context.Templates
            .Include(t => t.TemplateFields)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (template == null) return null;

        var changes = new Dictionary<string, object>();

        // Update basic properties
        template.UpdatedAt = DateTime.UtcNow;
        template.UpdatedBy = userId;

        // Handle fields update
        if (templateDto.Fields != null)
        {
            // Clear existing relationships
            _context.TemplateFields.RemoveRange(template.TemplateFields);
            
            // Add new relationships
            var newTemplateFields = templateDto.Fields.Select((fieldId, index) => new TemplateField
            {
                TemplateId = id,
                FieldId = fieldId,
                Order = index
            }).ToList();

            await _context.TemplateFields.AddRangeAsync(newTemplateFields);
            changes["fields"] = templateDto.Fields;
        }

        // Update multilanguage texts
        if (templateDto.Name != null)
        {
            await UpdateMultiLanguageTextAsync("template_name", id, templateDto.Name.ToDictionary());
            changes["name"] = templateDto.Name.ToDictionary();
        }

        if (templateDto.Description != null)
        {
            await UpdateMultiLanguageTextAsync("template_description", id, templateDto.Description.ToDictionary());
            changes["description"] = templateDto.Description.ToDictionary();
        }

        await _context.SaveChangesAsync();

        // Log change
        await _changeLogService.LogChangeAsync("template", id, "updated", changes, userId, "System User");

        return await GetTemplateByIdAsync(id);
    }

    public async Task<bool> DeleteTemplateAsync(string id, string userId = "system")
    {
        var template = await _context.Templates.FindAsync(id);
        if (template == null) return false;

        // Delete multilanguage texts
        var texts = await _context.MultiLanguageTexts
            .Where(t => (t.EntityType == "template_name" || t.EntityType == "template_description") && t.EntityId == id)
            .ToListAsync();
        
        _context.MultiLanguageTexts.RemoveRange(texts);
        _context.Templates.Remove(template);
        
        await _context.SaveChangesAsync();

        // Log change
        await _changeLogService.LogChangeAsync("template", id, "deleted", new Dictionary<string, object>(), userId, "System User");

        return true;
    }

    public async Task<TemplateRenderResponseDto> RenderTemplatesAsync(TemplateRenderRequestDto renderRequest)
    {
        var templates = await _context.Templates
            .Include(t => t.Names)
            .Include(t => t.Descriptions)
            .Include(t => t.TemplateFields)
            .Where(t => renderRequest.TemplateIds.Contains(t.Id))
            .ToListAsync();

        // Get all field IDs
        var allFieldIds = templates.SelectMany(t => t.TemplateFields.Select(tf => tf.FieldId)).Distinct().ToList();
        
        // Get fields with names
        var fields = await _context.Fields
            .Include(f => f.Names)
            .Where(f => allFieldIds.Contains(f.Id))
            .ToListAsync();

        // Process each template with dependency engine
        var templateResponses = new List<object>();
        foreach (var template in templates)
        {
            var renderedTemplate = _dependencyEngine.RenderTemplateForRole(
                template,
                fields,
                renderRequest.Role,
                renderRequest.CustomerId,
                new Dictionary<string, object>() // In real usage, this would come from form data
            );
            templateResponses.Add(renderedTemplate);
        }

        // Collect all fields for separate response
        var allFieldsResponse = templateResponses
            .SelectMany(t => ((Dictionary<string, object>)t)["fields"] as List<Dictionary<string, object>> ?? new List<Dictionary<string, object>>())
            .ToList();

        return new TemplateRenderResponseDto
        {
            Templates = templateResponses,
            Fields = allFieldsResponse.Cast<object>().ToList()
        };
    }

    public async Task<object> SimulateTemplateAsync(string templateId, UserRole role, Dictionary<string, object> fieldValues, string? customerId = null)
    {
        var template = await _context.Templates
            .Include(t => t.Names)
            .Include(t => t.Descriptions)
            .Include(t => t.TemplateFields)
            .FirstOrDefaultAsync(t => t.Id == templateId);

        if (template == null) throw new ArgumentException("Template not found");

        var fieldIds = template.TemplateFields.Select(tf => tf.FieldId).ToList();
        var fields = await _context.Fields
            .Include(f => f.Names)
            .Where(f => fieldIds.Contains(f.Id))
            .ToListAsync();

        var renderedTemplate = _dependencyEngine.RenderTemplateForRole(
            template,
            fields,
            role,
            customerId,
            fieldValues
        );

        return new
        {
            template = renderedTemplate,
            field_values = fieldValues,
            visible_field_count = ((List<Dictionary<string, object>>)renderedTemplate["fields"]).Count,
            simulation_info = new
            {
                role = role.ToString().ToLower(),
                customer_id = customerId,
                dependencies_processed = true
            }
        };
    }

    private TemplateResponseDto MapToResponseDto(Template template)
    {
        return new TemplateResponseDto
        {
            Id = template.Id,
            Name = GetMultiLanguageTextDto(template.Names),
            Description = GetMultiLanguageTextDto(template.Descriptions),
            Fields = template.TemplateFields.OrderBy(tf => tf.Order).Select(tf => tf.FieldId).ToList(),
            RoleConfig = template.RoleConfigObject,
            CustomerSpecific = template.CustomerSpecific,
            VisibleForCustomers = template.VisibleForCustomersList,
            CreatedAt = template.CreatedAt,
            UpdatedAt = template.UpdatedAt,
            CreatedBy = template.CreatedBy,
            UpdatedBy = template.UpdatedBy
        };
    }

    private static MultiLanguageTextDto GetMultiLanguageTextDto(ICollection<MultiLanguageText> texts)
    {
        var dict = texts.ToDictionary(t => t.LanguageCode, t => t.TextValue);
        return MultiLanguageTextDto.FromDictionary(dict);
    }

    private async Task SetMultiLanguageTextAsync(string entityType, string entityId, Dictionary<string, string> texts)
    {
        foreach (var (langCode, textValue) in texts.Where(kvp => !string.IsNullOrEmpty(kvp.Value)))
        {
            var mlText = new MultiLanguageText
            {
                EntityType = entityType,
                EntityId = entityId,
                LanguageCode = langCode,
                TextValue = textValue
            };
            await _context.MultiLanguageTexts.AddAsync(mlText);
        }
    }

    private async Task UpdateMultiLanguageTextAsync(string entityType, string entityId, Dictionary<string, string> texts)
    {
        foreach (var (langCode, textValue) in texts)
        {
            var existing = await _context.MultiLanguageTexts
                .FirstOrDefaultAsync(t => t.EntityType == entityType && t.EntityId == entityId && t.LanguageCode == langCode);

            if (existing != null)
            {
                existing.TextValue = textValue;
            }
            else
            {
                await _context.MultiLanguageTexts.AddAsync(new MultiLanguageText
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    LanguageCode = langCode,
                    TextValue = textValue
                });
            }
        }
    }
}