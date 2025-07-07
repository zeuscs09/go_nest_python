using Microsoft.EntityFrameworkCore;
using DotNetApi.Data;
using DotNetApi.Models;
using DotNetApi.DTOs;

namespace DotNetApi.Services
{
    public class UserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync(int limit = 10, int offset = 0)
        {
            return await _context.Users
                .OrderBy(u => u.Id)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User> CreateUserAsync(CreateUserDto createUserDto)
        {
            var user = new User
            {
                Name = createUserDto.Name,
                Email = createUserDto.Email,
                Age = createUserDto.Age,
                City = createUserDto.City,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<User?> UpdateUserAsync(int id, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                return null;

            user.Name = updateUserDto.Name;
            user.Email = updateUserDto.Email;
            user.Age = updateUserDto.Age;
            user.City = updateUserDto.City;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return user;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return true;
        }
    }
} 