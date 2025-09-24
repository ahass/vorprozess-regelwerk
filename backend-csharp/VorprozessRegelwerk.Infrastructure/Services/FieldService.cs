using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VorprozessRegelwerk.Core.DTOs;
using VorprozessRegelwerk.Core.Entities;
using VorprozessRegelwerk.Core.Interfaces;
using VorprozessRegelwerk.Core.Services;
using VorprozessRegelwerk.Infrastructure.Data;
using Newtonsoft.Json;

namespace VorprozessRegelwerk.Infrastructure.Services;

public class FieldService : IFieldService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IChangeLogService _changeLogService;
    private readonly ValidationEngine _validationEngine;
    private readonly ILogger<FieldService> _logger;

    public FieldService(
        ApplicationDbContext context,
        IMapper mapper,
        IChangeLogService changeLogService,
        ValidationEngine validationEngine,
        ILogger<FieldService> logger)
    {
        _context = context;
        _mapper = mapper;
        _changeLogService = changeLogService;
        _validationEngine = validationEngine;
        _logger = logger;
    }

    public async Task<IEnumerable<FieldResponseDto>> GetAllFieldsAsync()
    {
        var fields = await _context.Fields
            .Include(f => f.Names)
            .ToListAsync();

        return fields.Select(MapToResponseDto);
    }

    public async Task<FieldResponseDto?> GetFieldByIdAsync(string id)
    {
        var field = await _context.Fields
            .Include(f => f.Names)
            .FirstOrDefaultAsync(f => f.Id == id);

        return field != null ? MapToResponseDto(field) : null;
    }

    public async Task<FieldResponseDto> CreateFieldAsync(FieldCreateDto fieldDto, string userId = "system")
    {
        var field = new Field
        {
            Type = fieldDto.Type,
            Visibility = fieldDto.Visibility,
            Requirement = fieldDto.Requirement,
            SelectType = fieldDto.SelectType,
            DocumentMode = fieldDto.DocumentMode
        };

        // Set JSON properties
        if (fieldDto.Validation != null)
        {
            field.ValidationObject = ConvertValidationToObject(fieldDto.Validation);
        }

        if (fieldDto.Options != null)
        {
            field.OptionsList = fieldDto.Options.Select(opt => new SelectOption
            {
                Id = opt.Id,
                Label = new MultiLanguageText(), // Placeholder, wird später gesetzt
                Value = opt.Value
            }).ToList();
        }

        if (fieldDto.DocumentConstraints != null)
        {
            field.DocumentConstraintsObject = new DocumentConstraints
            {
                MaxSizeMb = fieldDto.DocumentConstraints.MaxSizeMb,
                AllowedFormats = fieldDto.DocumentConstraints.AllowedFormats,
                AllowedMimeTypes = fieldDto.DocumentConstraints.AllowedMimeTypes
            };
        }

        _context.Fields.Add(field);
        await _context.SaveChangesAsync();

        // Set multilanguage text for field name
        await SetMultiLanguageTextAsync("field_name", field.Id, fieldDto.Name.ToDictionary());

        // Log change
        var changes = JsonConvert.DeserializeObject<Dictionary<string, object>>(JsonConvert.SerializeObject(fieldDto)) ?? new Dictionary<string, object>();
        await _changeLogService.LogChangeAsync("field", field.Id, "created", changes, userId, "System User");

        return await GetFieldByIdAsync(field.Id) ?? throw new InvalidOperationException("Failed to retrieve created field");
    }

    public async Task<FieldResponseDto?> UpdateFieldAsync(string id, Dictionary<string, object> fieldData, string userId = "system")
    {
        var field = await _context.Fields.FirstOrDefaultAsync(f => f.Id == id);
        if (field == null) return null;

        var changes = new Dictionary<string, object>();

        // Update field properties
        if (fieldData.TryGetValue("type", out var typeObj) && Enum.TryParse<Core.Enums.FieldType>(typeObj.ToString(), true, out var fieldType))
        {
            field.Type = fieldType;
            changes["type"] = fieldType.ToString();
        }

        if (fieldData.TryGetValue("visibility", out var visibilityObj) && Enum.TryParse<Core.Enums.FieldVisibility>(visibilityObj.ToString(), true, out var visibility))
        {
            field.Visibility = visibility;
            changes["visibility"] = visibility.ToString();
        }

        if (fieldData.TryGetValue("requirement", out var requirementObj) && Enum.TryParse<Core.Enums.FieldRequirement>(requirementObj.ToString(), true, out var requirement))
        {
            field.Requirement = requirement;
            changes["requirement"] = requirement.ToString();
        }

        if (fieldData.TryGetValue("validation", out var validationObj))
        {
            field.ValidationObject = ConvertToDict(validationObj);
            changes["validation"] = field.ValidationObject;
        }

        if (fieldData.TryGetValue("select_type", out var selectTypeObj) && Enum.TryParse<Core.Enums.SelectType>(selectTypeObj.ToString(), true, out var selectType))
        {
            field.SelectType = selectType;
            changes["select_type"] = selectType.ToString();
        }

        if (fieldData.TryGetValue("options", out var optionsObj))
        {
            field.Options = JsonConvert.SerializeObject(optionsObj);
            changes["options"] = optionsObj;
        }

        if (fieldData.TryGetValue("document_mode", out var docModeObj) && Enum.TryParse<Core.Enums.DocumentMode>(docModeObj.ToString(), true, out var documentMode))
        {
            field.DocumentMode = documentMode;
            changes["document_mode"] = documentMode.ToString();
        }

        if (fieldData.TryGetValue("document_constraints", out var docConstraintsObj))
        {
            field.DocumentConstraints = JsonConvert.SerializeObject(docConstraintsObj);
            changes["document_constraints"] = docConstraintsObj;
        }

        if (fieldData.TryGetValue("dependencies", out var dependenciesObj))
        {
            field.Dependencies = JsonConvert.SerializeObject(dependenciesObj);
            changes["dependencies"] = dependenciesObj;
        }

        if (fieldData.TryGetValue("role_config", out var roleConfigObj))
        {
            field.RoleConfig = JsonConvert.SerializeObject(roleConfigObj);
            changes["role_config"] = roleConfigObj;
        }

        if (fieldData.TryGetValue("customer_specific", out var customerSpecificObj) && customerSpecificObj is bool customerSpecific)
        {
            field.CustomerSpecific = customerSpecific;
            changes["customer_specific"] = customerSpecific;
        }

        if (fieldData.TryGetValue("visible_for_customers", out var visibleForCustomersObj))
        {
            field.VisibleForCustomers = JsonConvert.SerializeObject(visibleForCustomersObj);
            changes["visible_for_customers"] = visibleForCustomersObj;
        }

        field.UpdatedAt = DateTime.UtcNow;

        // Update multilanguage text if provided
        if (fieldData.TryGetValue("name", out var nameObj))
        {
            var nameDict = ConvertToDict(nameObj);
            if (nameDict.Any())
            {
                await UpdateMultiLanguageTextAsync("field_name", id, nameDict.ToDictionary(kvp => kvp.Key, kvp => kvp.Value?.ToString() ?? ""));
                changes["name"] = nameDict;
            }
        }

        await _context.SaveChangesAsync();

        // Log change
        await _changeLogService.LogChangeAsync("field", id, "updated", changes, userId, "System User");

        return await GetFieldByIdAsync(id);
    }

    public async Task<bool> DeleteFieldAsync(string id, string userId = "system")
    {
        var field = await _context.Fields.FindAsync(id);
        if (field == null) return false;

        // Delete multilanguage texts
        var texts = await _context.MultiLanguageTexts
            .Where(t => t.EntityType == "field_name" && t.EntityId == id)
            .ToListAsync();

        _context.MultiLanguageTexts.RemoveRange(texts);
        _context.Fields.Remove(field);

        await _context.SaveChangesAsync();

        // Log change
        await _changeLogService.LogChangeAsync("field", id, "deleted", new Dictionary<string, object>(), userId, "System User");

        return true;
    }

    public async Task<object> ValidateFieldValueAsync(string fieldId, object value)
    {
        var field = await _context.Fields.FindAsync(fieldId);
        if (field == null) throw new ArgumentException("Field not found");

        var result = _validationEngine.ValidateFieldValue(field, value);

        return new
        {
            field_id = fieldId,
            value = value,
            valid = result.Valid,
            errors = result.Errors
        };
    }

    public Task<object> GetValidationSchemaAsync(string fieldType)
    {
        var schema = _validationEngine.GetValidationSchema(fieldType);

        return Task.FromResult<object>(new
        {
            field_type = fieldType,
            validation_options = schema
        });
    }

    private FieldResponseDto MapToResponseDto(Field field)
    {
        return new FieldResponseDto
        {
            Id = field.Id,
            Name = GetMultiLanguageTextDto(field.Names),
            Type = field.Type,
            Visibility = field.Visibility,
            Requirement = field.Requirement,
            Validation = field.ValidationObject,
            SelectType = field.SelectType,
            Options = field.OptionsList.Select(opt => new Dictionary<string, object>
            {
                ["id"] = opt.Id,
                ["label"] = new Dictionary<string, string>(), // Placeholder for multilang
                ["value"] = opt.Value
            }).ToList(),
            DocumentMode = field.DocumentMode,
            DocumentConstraints = ConvertToDict(field.DocumentConstraintsObject),
            RoleConfig = field.RoleConfigObject,
            CustomerSpecific = field.CustomerSpecific,
            VisibleForCustomers = field.VisibleForCustomersList,
            Dependencies = field.DependenciesList.Select(dep => new Dictionary<string, object>
            {
                ["field_id"] = dep.FieldId,
                ["operator"] = dep.Operator,
                ["condition_value"] = dep.ConditionValue ?? ""
            }).ToList(),
            CreatedAt = field.CreatedAt,
            UpdatedAt = field.UpdatedAt
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

    private static Dictionary<string, object> ConvertValidationToObject(FieldValidationDto validation)
    {
        var result = new Dictionary<string, object>();

        if (validation.String != null)
        {
            var stringValidation = new Dictionary<string, object>();
            if (validation.String.MinLength.HasValue) stringValidation["min_length"] = validation.String.MinLength.Value;
            if (validation.String.MaxLength.HasValue) stringValidation["max_length"] = validation.String.MaxLength.Value;
            if (!string.IsNullOrEmpty(validation.String.Pattern)) stringValidation["pattern"] = validation.String.Pattern;
            if (!string.IsNullOrEmpty(validation.String.PatternError)) stringValidation["pattern_error"] = validation.String.PatternError;
            if (!string.IsNullOrEmpty(validation.String.Format)) stringValidation["format"] = validation.String.Format;
            
            if (stringValidation.Any()) result["string"] = stringValidation;
        }

        if (validation.Number != null)
        {
            var numberValidation = new Dictionary<string, object>();
            if (validation.Number.MinValue.HasValue) numberValidation["min_value"] = validation.Number.MinValue.Value;
            if (validation.Number.MaxValue.HasValue) numberValidation["max_value"] = validation.Number.MaxValue.Value;
            numberValidation["integer_only"] = validation.Number.IntegerOnly;
            if (validation.Number.MaxDecimalPlaces.HasValue) numberValidation["max_decimal_places"] = validation.Number.MaxDecimalPlaces.Value;
            
            if (numberValidation.Any()) result["number"] = numberValidation;
        }

        return result;
    }

    private static Dictionary<string, object> ConvertToDict(object? obj)
    {
        if (obj == null) return new Dictionary<string, object>();
        
        var json = JsonConvert.SerializeObject(obj);
        return JsonConvert.DeserializeObject<Dictionary<string, object>>(json) ?? new Dictionary<string, object>();
    }
}