using i2f.Data;
using i2f.Data.ImageToPDF.Data;
using i2f.Models;
using i2f.Services;
using i2f.Services.ImageToPDF.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace i2f.Controllers
{
    [Authorize]
    public class PdfController : Controller
    {
        private readonly ImageValidatorService _validator;
        private readonly TempFileService _tempFile;
        private readonly PdfGeneratorService _pdfGenerator;
        private readonly PdfManagementService _pdfManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public PdfController(
            ImageValidatorService validator,
            TempFileService tempFile,
            PdfGeneratorService pdfGenerator,
            PdfManagementService pdfManager,
            UserManager<ApplicationUser> userManager)
        {
            _validator = validator;
            _tempFile = tempFile;
            _pdfGenerator = pdfGenerator;
            _pdfManager = pdfManager;
            _userManager = userManager;
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
            return File(bytes, "application/pdf", "output.pdf");
        }

        [HttpPost]
        public async Task<IActionResult> SavePdf([FromBody] SavePdfRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var tempPath = _tempFile.GetOutputPath(request.SessionId);
            if (!System.IO.File.Exists(tempPath))
                return NotFound("PDF not found.");

            // Move file to permanent storage
            var permanentDir = Path.Combine("SavedPdfs", user.Id);
            Directory.CreateDirectory(permanentDir);
            var fileName = Guid.NewGuid() + ".pdf";
            var permanentPath = Path.Combine(permanentDir, fileName);
            System.IO.File.Copy(tempPath, permanentPath);

            var savedPdf = new SavedPdf
            {
                UserId = user.Id,
                Title = request.Title,
                FilePath = permanentPath,
                Orientation = request.Orientation,
                PageCount = request.PageCount,
                FileSizeBytes = new FileInfo(tempPath).Length,
                CreatedAt = DateTime.UtcNow
            };

            await _pdfManager.Save(savedPdf);
            _tempFile.DeleteSession(request.SessionId);

            return Ok(new { savedPdf.Id });
        }

        // My PDFs page
        [HttpGet]
        public async Task<IActionResult> MyPdfs(string? search)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var pdfs = await _pdfManager.GetUserPdfs(user.Id, search);
            ViewBag.Search = search;
            return View(pdfs);
        }

        [HttpGet]
        public async Task<IActionResult> DownloadSaved(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var pdf = await _pdfManager.GetById(id, user.Id);
            if (pdf == null || !System.IO.File.Exists(pdf.FilePath))
                return NotFound();

            var bytes = System.IO.File.ReadAllBytes(pdf.FilePath);
            return File(bytes, "application/pdf", pdf.Title + ".pdf");
        }

        [HttpPost]
        public async Task<IActionResult> Rename(int id, string newTitle)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            await _pdfManager.Rename(id, user.Id, newTitle);
            return RedirectToAction("MyPdfs");
        }

        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            await _pdfManager.Delete(id, user.Id);
            return RedirectToAction("MyPdfs");
        }
    }
}