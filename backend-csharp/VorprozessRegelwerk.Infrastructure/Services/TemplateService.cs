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
            .Include(t => t.TemplateFields)
            .ToListAsync();
        return templates.Select(MapToResponseDto);
    }

    public async Task<TemplateResponseDto?> GetTemplateByIdAsync(string id)
    {
        var template = await _context.Templates
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
            // Normalize incoming field ids (dedupe, trim, remove empties)
            var incomingFieldIds = templateDto.Fields
                .Where(fid => !string.IsNullOrWhiteSpace(fid))
                .Select(fid => fid.Trim())
                .Distinct()
                .ToList();

            // Validate that field ids exist
            var existingFieldIds = await _context.Fields
                .Where(f => incomingFieldIds.Contains(f.Id))
                .Select(f => f.Id)
                .ToListAsync();

            var missingFieldIds = incomingFieldIds.Except(existingFieldIds).ToList();
            if (missingFieldIds.Any())
            {
                _logger.LogWarning("UpdateTemplateAsync: ignoring {MissingCount} missing field ids: {Missing}", missingFieldIds.Count, string.Join(",", missingFieldIds));
            }

            // Clear existing relationships and persist to avoid FK issues in SQLite
            _context.TemplateFields.RemoveRange(template.TemplateFields);
            await _context.SaveChangesAsync();
            
            // Add new relationships only for existing field ids
            var newTemplateFields = existingFieldIds.Select((fieldId, index) => new TemplateField
            {
                TemplateId = id,
                FieldId = fieldId,
                Order = index
            }).ToList();

            if (newTemplateFields.Any())
            {
                await _context.TemplateFields.AddRangeAsync(newTemplateFields);
            }

            changes["fields"] = existingFieldIds;
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
            .Include(t => t.TemplateFields)
            .Where(t => renderRequest.TemplateIds.Contains(t.Id))
            .ToListAsync();

        // Get all field IDs
        var allFieldIds = templates.SelectMany(t => t.TemplateFields.Select(tf => tf.FieldId)).Distinct().ToList();
        
        // Get fields with names
        var fields = await _context.Fields
            .Where(f => allFieldIds.Contains(f.Id))
            .ToListAsync();

        // Enrich fields with names from MultiLanguageTexts
        var fieldNameLookup = await _context.MultiLanguageTexts
            .Where(t => t.EntityType == "field_name" && allFieldIds.Contains(t.EntityId))
            .GroupBy(t => t.EntityId)
            .ToDictionaryAsync(g => g.Key, g => g.ToDictionary(x => x.LanguageCode, x => x.TextValue));

        foreach (var field in fields)
        {
            if (fieldNameLookup.TryGetValue(field.Id, out var names))
            {
                field.Names = names.Select(kvp => new MultiLanguageText
                {
                    EntityType = "field_name",
                    EntityId = field.Id,
                    LanguageCode = kvp.Key,
                    TextValue = kvp.Value
                }).ToList();
            }
        }

        // Process each template with dependency engine
        var templateResponses = new List<object>();
        foreach (var template in templates)
        {
            // Enrich template with names/descriptions
            var nameDict = await _context.MultiLanguageTexts
                .Where(t => t.EntityType == "template_name" && t.EntityId == template.Id)
                .ToDictionaryAsync(t => t.LanguageCode, t => t.TextValue);
            template.Names = nameDict.Select(kvp => new MultiLanguageText
            {
                EntityType = "template_name",
                EntityId = template.Id,
                LanguageCode = kvp.Key,
                TextValue = kvp.Value
            }).ToList();

            var descDict = await _context.MultiLanguageTexts
                .Where(t => t.EntityType == "template_description" && t.EntityId == template.Id)
                .ToDictionaryAsync(t => t.LanguageCode, t => t.TextValue);
            template.Descriptions = descDict.Select(kvp => new MultiLanguageText
            {
                EntityType = "template_description",
                EntityId = template.Id,
                LanguageCode = kvp.Key,
                TextValue = kvp.Value
            }).ToList();

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
            .Include(t => t.TemplateFields)
            .FirstOrDefaultAsync(t => t.Id == templateId);

        if (template == null) throw new ArgumentException("Template not found");

        var fieldIds = template.TemplateFields.Select(tf => tf.FieldId).ToList();
        var fields = await _context.Fields
            .Where(f => fieldIds.Contains(f.Id))
            .ToListAsync();

        // Enrich fields with names
        var fieldNameLookup = await _context.MultiLanguageTexts
            .Where(t => t.EntityType == "field_name" && fieldIds.Contains(t.EntityId))
            .GroupBy(t => t.EntityId)
            .ToDictionaryAsync(g => g.Key, g => g.ToDictionary(x => x.LanguageCode, x => x.TextValue));

        foreach (var field in fields)
        {
            if (fieldNameLookup.TryGetValue(field.Id, out var names))
            {
                field.Names = names.Select(kvp => new MultiLanguageText
                {
                    EntityType = "field_name",
                    EntityId = field.Id,
                    LanguageCode = kvp.Key,
                    TextValue = kvp.Value
                }).ToList();
            }
        }

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
        var nameDict = _context.MultiLanguageTexts
            .Where(t => t.EntityType == "template_name" && t.EntityId == template.Id)
            .ToDictionary(t => t.LanguageCode, t => t.TextValue);

        var descDict = _context.MultiLanguageTexts
            .Where(t => t.EntityType == "template_description" && t.EntityId == template.Id)
            .ToDictionary(t => t.LanguageCode, t => t.TextValue);

        return new TemplateResponseDto
        {
            Id = template.Id,
            Name = MultiLanguageTextDto.FromDictionary(nameDict),
            Description = descDict.Any() ? MultiLanguageTextDto.FromDictionary(descDict) : null,
            Fields = template.TemplateFields.Select(tf => tf.FieldId).ToList(),
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