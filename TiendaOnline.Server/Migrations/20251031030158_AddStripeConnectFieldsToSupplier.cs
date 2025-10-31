using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TiendaOnline.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddStripeConnectFieldsToSupplier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "StripeAccountCreatedAt",
                table: "Suppliers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "StripeAccountEnabled",
                table: "Suppliers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StripeAccountId",
                table: "Suppliers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StripeAccountCreatedAt",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "StripeAccountEnabled",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "StripeAccountId",
                table: "Suppliers");
        }
    }
}
