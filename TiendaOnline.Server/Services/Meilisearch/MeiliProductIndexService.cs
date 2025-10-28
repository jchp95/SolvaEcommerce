using Meilisearch;
using System.Threading.Tasks;
using TiendaOnline.Server.Models;
using System.Text.RegularExpressions;

namespace TiendaOnline.Server.Services
{
    public class MeiliProductIndexService
    {
        private readonly MeilisearchClient _client;
        public MeiliProductIndexService(MeilisearchClient client)
        {
            _client = client;
        }

        public async Task AddOrUpdateProductAsync(SearchProductDto dto)
        {
            var index = _client.Index("products");
            await index.AddDocumentsAsync(new[] { dto });
        }

        public async Task DeleteProductAsync(int id)
        {
            var index = _client.Index("products");
            await index.DeleteDocumentsAsync(new[] { id.ToString() });
        }

        public static string GenerateSlug(string input)
        {
            string slug = input.ToLowerInvariant();
            slug = Regex.Replace(slug, @"\s", "-");
            slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");
            slug = Regex.Replace(slug, @"\-+", "-").Trim('-');
            return slug;
        }
    }
}
