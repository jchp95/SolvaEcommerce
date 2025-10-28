using Microsoft.AspNetCore.Mvc;
using Meilisearch;
using TiendaOnline.Server.Models;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using TiendaOnline.Server.Context;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using TiendaOnline.Server.Services;

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly MeilisearchClient _client;
    private readonly ApplicationDbContext _context;
    private readonly MeiliProductIndexService _meiliService;

    public SearchController(ApplicationDbContext context, MeilisearchClient client, MeiliProductIndexService meiliService)
    {
        _context = context;
        _client = client;
        _meiliService = meiliService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        try
        {
            var index = _client.Index("products");
            var searchResult = await index.SearchAsync<SearchProductDto>(q);

            return Ok(new
            {
                Results = searchResult.Hits
            });
        }
        catch (Meilisearch.MeilisearchApiError e) when (e.Message.Contains("index_not_found"))
        {
            return BadRequest(new
            {
                Message = "Search index is not ready. Please try again later.",
                Error = e.Message
            });
        }
        catch (Exception e)
        {
            return StatusCode(500, new
            {
                Message = "An error occurred during search",
                Error = e.Message
            });
        }
    }

    [HttpPost("create-index")]
    public async Task<IActionResult> CreateIndex()
    {
        try
        {
            await _client.CreateIndexAsync("products", "id");
            return Ok(new { Message = "Products index created successfully" });
        }
        catch (Meilisearch.MeilisearchApiError e) when (e.Message.Contains("index_already_exists"))
        {
            return Ok(new { Message = "Products index already exists" });
        }
        catch (Exception e)
        {
            return StatusCode(500, new
            {
                Message = "Failed to create index",
                Error = e.Message
            });
        }
    }

    [HttpPost("reindex")]
    public async Task<IActionResult> ReindexProducts()
    {
        try
        {
            // First ensure index exists
            await CreateIndex();

            // Get all products with related data
            var products = await _context.Products
                .ToListAsync();

            // Get categories separately
            var categoryIds = products.Select(p => p.CategoryId).Distinct();
            var categories = await _context.Categories
                .Where(c => categoryIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => c.Name);

            // Map to DTO
            var productsToIndex = products.Select(p => new SearchProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                CategoryName = categories.TryGetValue(p.CategoryId, out var name) ? name : null,
                IdentityId = p.IdentityId,
                Slug = GenerateSlug(p.Name)
            }).ToList();

            var index = _client.Index("products");

            // Add documents to index
            var task = await index.AddDocumentsAsync(productsToIndex);

            return Ok(new
            {
                Message = $"Successfully reindexed {productsToIndex.Count} products",
                TaskStatus = task.Status
            });
        }
        catch (Exception e)
        {
            return StatusCode(500, new
            {
                Message = "Failed to reindex products",
                Error = e.Message
            });
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetIndexStatus()
    {
        try
        {
            var index = _client.Index("products");
            var stats = await index.GetStatsAsync();
            return Ok(stats);
        }
        catch (Meilisearch.MeilisearchApiError e) when (e.Message.Contains("index_not_found"))
        {
            return NotFound(new
            {
                Message = "Products index does not exist",
                Error = e.Message
            });
        }
        catch (Exception e)
        {
            return StatusCode(500, new
            {
                Message = "Failed to get index status",
                Error = e.Message
            });
        }
    }

    [HttpPost("clean-orphan-index")]
    public async Task<IActionResult> CleanOrphanIndex()
    {
        try
        {
            var index = _client.Index("products");

            // 1. Obtener todos los IDs válidos de la base de datos
            var validIds = await _context.Products.Select(p => p.Id).ToListAsync();

            // 2. Obtener todos los documentos del índice usando DocumentsQuery
            var query = new Meilisearch.QueryParameters.DocumentsQuery { Limit = 10000 };
            var allDocs = await index.GetDocumentsAsync<SearchProductDto>(query);
            var orphanIds = allDocs.Results
                .Where(doc => !validIds.Contains(doc.Id))
                .Select(doc => doc.Id)
                .ToList();

            // 3. Eliminar solo los huérfanos
            if (orphanIds.Count > 0)
            {
                await index.DeleteDocumentsAsync(orphanIds);
            }

            return Ok(new
            {
                Message = $"Índices huérfanos eliminados: {orphanIds.Count}",
                OrphanIds = orphanIds
            });
        }
        catch (Exception e)
        {
            return StatusCode(500, new
            {
                Message = "Error al limpiar índices huérfanos",
                Error = e.Message
            });
        }
    }

    public static string GenerateSlug(string input)
    {
        // Convert to lowercase
        string slug = input.ToLowerInvariant();

        // Replace spaces with hyphens
        slug = Regex.Replace(slug, @"\s", "-");

        // Remove invalid characters
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");

        // Trim excess hyphens
        slug = Regex.Replace(slug, @"\-+", "-").Trim('-');

        return slug;
    }
}