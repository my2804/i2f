using i2f.Models;

namespace i2f.Services.ImageToPDF.Services
{
    public class ImageValidatorService
    {
        private readonly string[] _allowedTypes = { "image/jpeg", "image/png", "image/webp" };
        private readonly long _maxSizeBytes = 5 * 1024 * 1024;
        private const int MaxCount = 10;

        public ValidationResult ValidateAll(List<IFormFile> files)
        {
            var errors = new List<string>();

            if (files == null || files.Count == 0)
                errors.Add("Please upload at least one image.");

            if (files != null && files.Count > MaxCount)
                errors.Add($"Maximum {MaxCount} images allowed.");

            if (files != null)
            {
                foreach (var file in files)
                {
                    var result = Validate(file);
                    errors.AddRange(result.Errors);
                }
            }

            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }

        public ValidationResult Validate(IFormFile file)
        {
            var errors = new List<string>();

            if (!_allowedTypes.Contains(file.ContentType))
                errors.Add($"{file.FileName} is not a supported format (JPG, PNG, WEBP only).");

            if (file.Length > _maxSizeBytes)
                errors.Add($"{file.FileName} exceeds the 5 MB size limit.");

            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }
    }
}