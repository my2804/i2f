namespace i2f.Services
{
    namespace ImageToPDF.Services
    {
        public class TempFileService
        {
            private readonly string _basePath;

            public TempFileService(IWebHostEnvironment env)
            {
                _basePath = Path.Combine(env.ContentRootPath, "TempFiles");
                Directory.CreateDirectory(_basePath);
            }

            public async Task<string> Save(IFormFile file, string sessionId)
            {
                var sessionDir = Path.Combine(_basePath, sessionId);
                Directory.CreateDirectory(sessionDir);

                var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(sessionDir, fileName);

                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                return filePath;
            }

            public string GetOutputPath(string sessionId)
            {
                return Path.Combine(_basePath, sessionId, "output.pdf");
            }

            public void DeleteSession(string sessionId)
            {
                var sessionDir = Path.Combine(_basePath, sessionId);
                if (Directory.Exists(sessionDir))
                    Directory.Delete(sessionDir, recursive: true);
            }
        }
    }
}
