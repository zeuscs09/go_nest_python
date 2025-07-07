using System.ComponentModel.DataAnnotations;

namespace DotNetApi.DTOs
{
    public class UpdateUserDto
    {
        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        public int? Age { get; set; }

        [StringLength(100)]
        public string? City { get; set; }
    }
} 