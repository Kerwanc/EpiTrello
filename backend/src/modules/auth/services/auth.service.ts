import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../users/services/user.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password, avatarUrl } = registerDto;

    if (!password || password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userService.createUser({
      username,
      email,
      passwordHash,
      avatarUrl,
    });

    const accessToken = this.generateJwt(user.id);

    return {
      accessToken,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.userService.getUserByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userDto = this.mapUserToDto(user);
    const accessToken = this.generateJwt(user.id);

    return {
      accessToken,
      user: userDto,
    };
  }

  async validateUser(userId: string): Promise<boolean> {
    const user = await this.userService.getUserById(userId);
    return !!user;
  }

  private generateJwt(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  private mapUserToDto(user: any) {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
