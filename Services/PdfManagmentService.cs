using Microsoft.EntityFrameworkCore;
using i2f.Data;
using i2f.Models;

namespace i2f.Services
{
    public class PdfManagementService
    {
        private readonly AppDbContext _db;

        public PdfManagementService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<SavedPdf>> GetUserPdfs(string userId, string? search = null)
        {
            var query = _db.SavedPdfs
                .Where(p => p.UserId == userId);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(p => p.Title.Contains(search));

            return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        }

        public async Task<SavedPdf?> GetById(int id, string userId)
        {
            return await _db.SavedPdfs
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
        }

        public async Task Save(SavedPdf pdf)
        {
            _db.SavedPdfs.Add(pdf);
            await _db.SaveChangesAsync();
        }

        public async Task Rename(int id, string userId, string newTitle)
        {
            var pdf = await GetById(id, userId);
            if (pdf == null) return;

            pdf.Title = newTitle;
            pdf.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task Delete(int id, string userId)
        {
            var pdf = await GetById(id, userId);
            if (pdf == null) return;

            if (File.Exists(pdf.FilePath))
                File.Delete(pdf.FilePath);

            _db.SavedPdfs.Remove(pdf);
            await _db.SaveChangesAsync();
        }
    }
}