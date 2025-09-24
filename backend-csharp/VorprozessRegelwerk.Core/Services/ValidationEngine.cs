using System.Text.RegularExpressions;
using VorprozessRegelwerk.Core.Entities;
using VorprozessRegelwerk.Core.Enums;
using Microsoft.Extensions.Logging;

namespace VorprozessRegelwerk.Core.Services;

public class ValidationEngine
{
    private readonly ILogger<ValidationEngine> _logger;

    public ValidationEngine(ILogger<ValidationEngine> logger)
    {
        _logger = logger;
    }

    public ValidationResult ValidateFieldValue(Field field, object? value)
    {
        var result = new ValidationResult { Valid = true, Errors = new List<string>() };

        if (field.ValidationObject == null || !field.ValidationObject.Any())
            return result;

        try
        {
            // Required field validation
            if (field.Requirement == FieldRequirement.Required && IsValueEmpty(value))
            {
                result.Valid = false;
                result.Errors.Add("Field is required");
                return result;
            }

            // Skip other validations if field is empty and optional
            if (IsValueEmpty(value))
                return result;

            // Type-specific validation
            switch (field.Type)
            {
                case FieldType.Text:
                    ValidateTextField(field, value, result);
                    break;
                case FieldType.Document:
                    ValidateDocumentField(field, value, result);
                    break;
                case FieldType.Select:
                    ValidateSelectField(field, value, result);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating field {FieldId}", field.Id);
            result.Valid = false;
            result.Errors.Add("Validation error occurred");
        }

        return result;
    }

    private void ValidateTextField(Field field, object? value, ValidationResult result)
    {
        var strValue = value?.ToString() ?? "";
        var validation = field.ValidationObject;

        if (validation.TryGetValue("string", out var stringValidationObj) && 
            stringValidationObj is Dictionary<string, object> stringValidation)
        {
            // Length validation
            if (stringValidation.TryGetValue("min_length", out var minLengthObj) && 
                int.TryParse(minLengthObj.ToString(), out var minLength) && 
                strValue.Length < minLength)
            {
                result.Valid = false;
                result.Errors.Add($"Minimum length is {minLength} characters");
            }

            if (stringValidation.TryGetValue("max_length", out var maxLengthObj) && 
                int.TryParse(maxLengthObj.ToString(), out var maxLength) && 
                strValue.Length > maxLength)
            {
                result.Valid = false;
                result.Errors.Add($"Maximum length is {maxLength} characters");
            }

            // Pattern validation
            if (stringValidation.TryGetValue("pattern", out var patternObj) && 
                patternObj is string pattern && !string.IsNullOrEmpty(pattern))
            {
                try
                {
                    if (!Regex.IsMatch(strValue, pattern))
                    {
                        var errorMsg = stringValidation.TryGetValue("pattern_error", out var errorObj) 
                            ? errorObj.ToString() 
                            : "Value does not match required pattern";
                        result.Valid = false;
                        result.Errors.Add(errorMsg ?? "Value does not match required pattern");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Invalid regex pattern: {Pattern}", pattern);
                    result.Valid = false;
                    result.Errors.Add("Invalid pattern configuration");
                }
            }

            // Format validation
            if (stringValidation.TryGetValue("format", out var formatObj) && formatObj is string format)
            {
                ValidateStringFormat(strValue, format, result);
            }
        }

        // Number validation
        if (validation.TryGetValue("number", out var numberValidationObj) && 
            numberValidationObj is Dictionary<string, object> numberValidation)
        {
            ValidateNumberField(strValue, numberValidation, result);
        }

        // Date validation
        if (validation.TryGetValue("date", out var dateValidationObj) && 
            dateValidationObj is Dictionary<string, object> dateValidation)
        {
            ValidateDateField(strValue, dateValidation, result);
        }
    }

    private static void ValidateStringFormat(string value, string format, ValidationResult result)
    {
        switch (format.ToLower())
        {
            case "email":
                var emailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
                if (!Regex.IsMatch(value, emailPattern))
                {
                    result.Valid = false;
                    result.Errors.Add("Invalid email format");
                }
                break;

            case "phone":
                var phonePattern = @"^\+?[\d\s\-\(\)]{10,}$";
                if (!Regex.IsMatch(value, phonePattern))
                {
                    result.Valid = false;
                    result.Errors.Add("Invalid phone number format");
                }
                break;

            case "url":
                var urlPattern = @"^https?://.+";
                if (!Regex.IsMatch(value, urlPattern))
                {
                    result.Valid = false;
                    result.Errors.Add("Invalid URL format");
                }
                break;
        }
    }

    private static void ValidateNumberField(string value, Dictionary<string, object> numberValidation, ValidationResult result)
    {
        if (!double.TryParse(value, out var numValue))
        {
            result.Valid = false;
            result.Errors.Add("Invalid number format");
            return;
        }

        if (numberValidation.TryGetValue("min_value", out var minValueObj) && 
            double.TryParse(minValueObj.ToString(), out var minValue) && 
            numValue < minValue)
        {
            result.Valid = false;
            result.Errors.Add($"Minimum value is {minValue}");
        }

        if (numberValidation.TryGetValue("max_value", out var maxValueObj) && 
            double.TryParse(maxValueObj.ToString(), out var maxValue) && 
            numValue > maxValue)
        {
            result.Valid = false;
            result.Errors.Add($"Maximum value is {maxValue}");
        }

        if (numberValidation.TryGetValue("integer_only", out var integerOnlyObj) && 
            integerOnlyObj is bool integerOnly && integerOnly && 
            numValue != Math.Floor(numValue))
        {
            result.Valid = false;
            result.Errors.Add("Value must be an integer");
        }
    }

    private static void ValidateDateField(string value, Dictionary<string, object> dateValidation, ValidationResult result)
    {
        var dateFormat = dateValidation.TryGetValue("format", out var formatObj) ? formatObj.ToString() : "yyyy-MM-dd";
        
        if (!DateTime.TryParseExact(value, dateFormat, null, System.Globalization.DateTimeStyles.None, out var dateValue))
        {
            result.Valid = false;
            result.Errors.Add("Invalid date format");
            return;
        }

        if (dateValidation.TryGetValue("min_date", out var minDateObj) && 
            DateTime.TryParse(minDateObj.ToString(), out var minDate) && 
            dateValue < minDate)
        {
            result.Valid = false;
            result.Errors.Add($"Date must be after {minDate:yyyy-MM-dd}");
        }

        if (dateValidation.TryGetValue("max_date", out var maxDateObj) && 
            DateTime.TryParse(maxDateObj.ToString(), out var maxDate) && 
            dateValue > maxDate)
        {
            result.Valid = false;
            result.Errors.Add($"Date must be before {maxDate:yyyy-MM-dd}");
        }

        if (dateValidation.TryGetValue("no_future_dates", out var noFutureObj) && 
            noFutureObj is bool noFuture && noFuture && 
            dateValue > DateTime.Today)
        {
            result.Valid = false;
            result.Errors.Add("Future dates are not allowed");
        }

        if (dateValidation.TryGetValue("no_past_dates", out var noPastObj) && 
            noPastObj is bool noPast && noPast && 
            dateValue < DateTime.Today)
        {
            result.Valid = false;
            result.Errors.Add("Past dates are not allowed");
        }
    }

    private void ValidateDocumentField(Field field, object? value, ValidationResult result)
    {
        if (value == null) return;

        var constraints = field.DocumentConstraintsObject;

        // File size validation (assuming value has Size property)
        if (constraints.MaxSizeMb.HasValue && HasProperty(value, "Size"))
        {
            var sizeProperty = value.GetType().GetProperty("Size");
            if (sizeProperty?.GetValue(value) is long size)
            {
                var maxSizeBytes = constraints.MaxSizeMb.Value * 1024 * 1024;
                if (size > maxSizeBytes)
                {
                    result.Valid = false;
                    result.Errors.Add($"File size exceeds {constraints.MaxSizeMb}MB");
                }
            }
        }

        // File format validation
        if (constraints.AllowedFormats?.Any() == true && HasProperty(value, "FileName"))
        {
            var fileNameProperty = value.GetType().GetProperty("FileName");
            if (fileNameProperty?.GetValue(value) is string fileName)
            {
                var extension = Path.GetExtension(fileName).ToLower().TrimStart('.');
                if (!constraints.AllowedFormats.Contains(extension))
                {
                    result.Valid = false;
                    result.Errors.Add($"File format not allowed. Allowed: {string.Join(", ", constraints.AllowedFormats)}");
                }
            }
        }
    }

    private void ValidateSelectField(Field field, object? value, ValidationResult result)
    {
        var validValues = field.OptionsList.Select(opt => opt.Value).ToList();

        if (field.SelectType == SelectType.Multiple)
        {
            if (value is List<string> selectedValues)
            {
                foreach (var selectedValue in selectedValues)
                {
                    if (!validValues.Contains(selectedValue))
                    {
                        result.Valid = false;
                        result.Errors.Add($"Invalid selection: {selectedValue}");
                    }
                }
            }
            else
            {
                result.Valid = false;
                result.Errors.Add("Multiple selection must be a list");
            }
        }
        else
        {
            var selectedValue = value?.ToString() ?? "";
            if (!validValues.Contains(selectedValue))
            {
                result.Valid = false;
                result.Errors.Add($"Invalid selection: {selectedValue}");
            }
        }
    }

    private static bool IsValueEmpty(object? value)
    {
        return value == null || string.IsNullOrWhiteSpace(value.ToString());
    }

    private static bool HasProperty(object obj, string propertyName)
    {
        return obj.GetType().GetProperty(propertyName) != null;
    }

    public Dictionary<string, object> GetValidationSchema(string fieldType)
    {
        return fieldType.ToLower() switch
        {
            "text" => new Dictionary<string, object>
            {
                ["string"] = new Dictionary<string, string>
                {
                    ["min_length"] = "Minimum character length",
                    ["max_length"] = "Maximum character length", 
                    ["pattern"] = "Regular expression pattern",
                    ["pattern_error"] = "Custom error message for pattern mismatch",
                    ["format"] = "Predefined format (email, phone, url)"
                },
                ["number"] = new Dictionary<string, string>
                {
                    ["min_value"] = "Minimum numeric value",
                    ["max_value"] = "Maximum numeric value",
                    ["integer_only"] = "Allow only integers",
                    ["max_decimal_places"] = "Maximum decimal places"
                },
                ["date"] = new Dictionary<string, string>
                {
                    ["format"] = "Date format string",
                    ["min_date"] = "Minimum allowed date (yyyy-MM-dd)",
                    ["max_date"] = "Maximum allowed date (yyyy-MM-dd)",
                    ["no_future_dates"] = "Disallow future dates",
                    ["no_past_dates"] = "Disallow past dates"
                }
            },
            "document" => new Dictionary<string, object>
            {
                ["file"] = new Dictionary<string, string>
                {
                    ["max_size_mb"] = "Maximum file size in MB",
                    ["allowed_extensions"] = "List of allowed file extensions",
                    ["allowed_mime_types"] = "List of allowed MIME types"
                }
            },
            _ => new Dictionary<string, object>()
        };
    }
}

public class ValidationResult
{
    public bool Valid { get; set; }
    public List<string> Errors { get; set; } = new();
}