using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TiendaOnline.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelSupplier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessLicense",
                table: "Suppliers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdDocument",
                table: "Suppliers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxCertificate",
                table: "Suppliers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessLicense",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "IdDocument",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "TaxCertificate",
                table: "Suppliers");
        }
    }
}
