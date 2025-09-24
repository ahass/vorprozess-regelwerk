using VorprozessRegelwerk.Core.Entities;
using VorprozessRegelwerk.Core.Enums;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace VorprozessRegelwerk.Core.Services;

public class DependencyEngine
{
    private readonly ILogger<DependencyEngine> _logger;

    public DependencyEngine(ILogger<DependencyEngine> logger)
    {
        _logger = logger;
    }

    public bool EvaluateCondition(FieldDependency condition, Dictionary<string, object> fieldValues)
    {
        var fieldId = condition.FieldId;
        var operatorType = condition.Operator;
        var conditionValue = condition.ConditionValue;

        if (!fieldValues.ContainsKey(fieldId))
            return false;

        var currentValue = fieldValues[fieldId];

        try
        {
            return operatorType switch
            {
                "equals" => AreEqual(currentValue, conditionValue),
                "not_equals" => !AreEqual(currentValue, conditionValue),
                "in" => IsIn(currentValue, conditionValue),
                "not_in" => !IsIn(currentValue, conditionValue),
                "contains" => Contains(currentValue, conditionValue),
                "greater_than" => IsGreaterThan(currentValue, conditionValue),
                "less_than" => IsLessThan(currentValue, conditionValue),
                "regex_match" => RegexMatch(currentValue, conditionValue),
                "is_empty" => IsEmpty(currentValue),
                "is_not_empty" => !IsEmpty(currentValue),
                _ => throw new ArgumentException($"Unknown operator: {operatorType}")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating condition with operator {Operator}", operatorType);
            return false;
        }
    }

    private static bool AreEqual(object? current, object? condition)
    {
        if (current == null && condition == null) return true;
        if (current == null || condition == null) return false;
        return current.ToString() == condition.ToString();
    }

    private static bool IsIn(object? current, object? condition)
    {
        if (current == null || condition == null) return false;
        
        if (condition is List<object> list)
            return list.Any(item => AreEqual(current, item));
            
        if (condition is string[] array)
            return array.Any(item => AreEqual(current, item));
            
        return false;
    }

    private static bool Contains(object? current, object? condition)
    {
        if (current == null || condition == null) return false;
        return current.ToString()?.ToLower().Contains(condition.ToString()?.ToLower() ?? "") ?? false;
    }

    private static bool IsGreaterThan(object? current, object? condition)
    {
        if (!TryParseDouble(current, out var currentNum) || !TryParseDouble(condition, out var conditionNum))
            return false;
        return currentNum > conditionNum;
    }

    private static bool IsLessThan(object? current, object? condition)
    {
        if (!TryParseDouble(current, out var currentNum) || !TryParseDouble(condition, out var conditionNum))
            return false;
        return currentNum < conditionNum;
    }

    private static bool RegexMatch(object? current, object? condition)
    {
        if (current == null || condition == null) return false;
        try
        {
            return Regex.IsMatch(current.ToString() ?? "", condition.ToString() ?? "");
        }
        catch
        {
            return false;
        }
    }

    private static bool IsEmpty(object? current)
    {
        return current == null || string.IsNullOrWhiteSpace(current.ToString());
    }

    private static bool TryParseDouble(object? value, out double result)
    {
        result = 0;
        return value != null && double.TryParse(value.ToString(), out result);
    }

    public bool ShouldShowField(Field field, Dictionary<string, object> fieldValues)
    {
        var dependencies = field.DependenciesList;
        if (!dependencies.Any())
            return true;

        // All dependencies must be satisfied (AND logic)
        return dependencies.All(dep => EvaluateCondition(dep, fieldValues));
    }

    public List<Field> FilterFieldsByDependencies(List<Field> fields, Dictionary<string, object> fieldValues)
    {
        return fields.Where(field => ShouldShowField(field, fieldValues)).ToList();
    }

    public List<Field> FilterFieldsByRole(List<Field> fields, UserRole role)
    {
        var roleString = role.ToString().ToLower();
        var visibleFields = new List<Field>();

        foreach (var field in fields)
        {
            var roleConfig = field.RoleConfigObject;
            
            if (!roleConfig.Any())
            {
                visibleFields.Add(field);
                continue;
            }

            if (roleConfig.ContainsKey(roleString) && roleConfig[roleString] is Dictionary<string, object> config)
            {
                if (config.TryGetValue("visible", out var visibleObj) && visibleObj is bool visible && visible)
                {
                    // Apply role-specific overrides
                    ApplyRoleOverrides(field, config);
                    visibleFields.Add(field);
                }
            }
            else
            {
                // Default behavior if role not specified
                visibleFields.Add(field);
            }
        }

        return visibleFields;
    }

    private static void ApplyRoleOverrides(Field field, Dictionary<string, object> config)
    {
        if (config.TryGetValue("visibility", out var visibilityObj) && visibilityObj is string visibility)
        {
            if (Enum.TryParse<FieldVisibility>(visibility, true, out var fieldVisibility))
                field.Visibility = fieldVisibility;
        }

        if (config.TryGetValue("requirement", out var requirementObj) && requirementObj is string requirement)
        {
            if (Enum.TryParse<FieldRequirement>(requirement, true, out var fieldRequirement))
                field.Requirement = fieldRequirement;
        }
    }

    public List<Field> FilterFieldsByCustomer(List<Field> fields, string? customerId)
    {
        if (string.IsNullOrEmpty(customerId))
        {
            return fields.Where(f => !f.CustomerSpecific).ToList();
        }

        return fields.Where(field => 
            !field.CustomerSpecific || 
            (field.VisibleForCustomersList.Contains(customerId))
        ).ToList();
    }

    public Dictionary<string, object> RenderTemplateForRole(
        Template template, 
        List<Field> allFields, 
        UserRole role, 
        string? customerId = null, 
        Dictionary<string, object>? fieldValues = null)
    {
        fieldValues ??= new Dictionary<string, object>();

        // Get template fields
        var templateFieldIds = template.TemplateFields.Select(tf => tf.FieldId).ToList();
        var fields = allFields.Where(f => templateFieldIds.Contains(f.Id)).ToList();

        // Apply filters
        fields = FilterFieldsByRole(fields, role);
        fields = FilterFieldsByCustomer(fields, customerId);
        fields = FilterFieldsByDependencies(fields, fieldValues);

        // Convert to response format
        var fieldResponses = fields.Select(field => new Dictionary<string, object>
        {
            ["id"] = field.Id,
            ["name"] = GetFieldNames(field),
            ["type"] = field.Type.ToString().ToLower(),
            ["visibility"] = field.Visibility.ToString().ToLower(),
            ["requirement"] = field.Requirement.ToString().ToLower(),
            ["validation"] = field.ValidationObject,
            ["select_type"] = field.SelectType?.ToString().ToLower(),
            ["options"] = field.OptionsList,
            ["document_mode"] = field.DocumentMode?.ToString().ToLower(),
            ["document_constraints"] = field.DocumentConstraintsObject,
            ["dependencies"] = field.DependenciesList
        }).ToList();

        return new Dictionary<string, object>
        {
            ["id"] = template.Id,
            ["name"] = GetTemplateNames(template),
            ["description"] = GetTemplateDescriptions(template),
            ["fields"] = fieldResponses
        };
    }

    private static Dictionary<string, string> GetFieldNames(Field field)
    {
        // In EF-Konfiguration nicht gemappt – Namen werden aus MultiLanguageTexts im Service zugewiesen
        return new Dictionary<string, string>();
    }

    private static Dictionary<string, string> GetTemplateNames(Template template)
    {
        return template.Names.ToDictionary(n => n.LanguageCode, n => n.TextValue);
    }

    private static Dictionary<string, string> GetTemplateDescriptions(Template template)
    {
        return template.Descriptions.ToDictionary(n => n.LanguageCode, n => n.TextValue);
    }
}