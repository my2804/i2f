using FluentValidation;
using FluentValidation.Results;
using i2f.Models;
using i2f.Services;
using i2f.Services.ImageToPDF.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace i2f.Controllers
{
  

namespace ImageToPDF.Controllers
    {
        [Authorize]
        public class PdfController : Controller
        {
            private readonly ImageValidatorService _validator;
            private readonly TempFileService _tempFile;
            private readonly PdfGeneratorService _pdfGenerator;

            public PdfController(
                ImageValidatorService validator,
                TempFileService tempFile,
                PdfGeneratorService pdfGenerator)
            {
                _validator = validator;
                _tempFile = tempFile;
                _pdfGenerator = pdfGenerator;
            }

            [HttpGet]
            public IActionResult Index() => View();

            [HttpPost]
            public async Task<IActionResult> Upload(List<IFormFile> images)
            {
                var result = _validator.ValidateAll(images);
                if (!result.IsValid)
                    return BadRequest(result.Errors);

                var sessionId = Guid.NewGuid().ToString();
                var entries = new List<ImageEntry>();
                int order = 0;

                foreach (var file in images)
                {
                    var path = await _tempFile.Save(file, sessionId);
                    entries.Add(new ImageEntry
                    {
                        FileId = Guid.NewGuid().ToString(),
                        SessionId = sessionId,
                        FileName = file.FileName,
                        ContentType = file.ContentType,
                        SizeBytes = file.Length,
                        SortOrder = order++,
                        TempFilePath = path
                    });
                }

                return Ok(new { sessionId, images = entries });
            }

            [HttpPost]
            public IActionResult Convert([FromBody] PdfRequest request)
            {
                var outputPath = _pdfGenerator.Generate(request);
                return Ok(new { outputPath });
            }

            [HttpGet]
            public IActionResult Download(string sessionId)
            {
                var path = _tempFile.GetOutputPath(sessionId);
                if (!System.IO.File.Exists(path))
                    return NotFound();

                var bytes = System.IO.File.ReadAllBytes(path);
                _tempFile.DeleteSession(sessionId);
                return File(bytes, "application/pdf", "output.pdf");
            }
        }
    }
}
