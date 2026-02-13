import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../../users/services/user.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    createUser: jest.fn(),
    getUserByEmailWithPassword: jest.fn(),
    getUserById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUser = {
    id: 'user-uuid-123',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const accessToken = 'jwt-token-123';

      mockUserService.createUser.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await authService.register(registerDto);

      expect(result).toEqual({
        accessToken,
        user: mockUser,
      });

      expect(mockUserService.createUser).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        passwordHash: expect.any(String),
        avatarUrl: undefined,
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
      });
    });

    it('should hash the password before creating user', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.createUser.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      await authService.register(registerDto);

      const createUserCall = mockUserService.createUser.mock.calls[0][0];
      const isPasswordHashed = await bcrypt.compare(
        registerDto.password,
        createUserCall.passwordHash,
      );

      expect(isPasswordHashed).toBe(true);
    });

    it('should throw BadRequestException if password is less than 8 characters', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'short',
      };

      await expect(authService.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );

      await expect(authService.register(registerDto)).rejects.toThrow(
        'Password must be at least 8 characters long',
      );

      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if password is empty', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: '',
      };

      await expect(authService.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('should include avatarUrl if provided', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockUserService.createUser.mockResolvedValue({
        ...mockUser,
        avatarUrl: registerDto.avatarUrl,
      });
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      await authService.register(registerDto);

      expect(mockUserService.createUser).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        passwordHash: expect.any(String),
        avatarUrl: registerDto.avatarUrl,
      });
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const userWithPassword = {
        ...mockUser,
        passwordHash: hashedPassword,
      };

      const accessToken = 'jwt-token-123';

      mockUserService.getUserByEmailWithPassword.mockResolvedValue(
        userWithPassword,
      );
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken,
        user: expect.objectContaining({
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        }),
      });

      expect(mockUserService.getUserByEmailWithPassword).toHaveBeenCalledWith(
        loginDto.email,
      );

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserService.getUserByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const userWithPassword = {
        ...mockUser,
        passwordHash: hashedPassword,
      };

      mockUserService.getUserByEmailWithPassword.mockResolvedValue(
        userWithPassword,
      );

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('validateUser', () => {
    it('should return true for valid userId', async () => {
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = await authService.validateUser(mockUser.id);

      expect(result).toBe(true);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return false for invalid userId', async () => {
      mockUserService.getUserById.mockResolvedValue(null);

      const result = await authService.validateUser('invalid-uuid');

      expect(result).toBe(false);
      expect(mockUserService.getUserById).toHaveBeenCalledWith('invalid-uuid');
    });
  });
});
