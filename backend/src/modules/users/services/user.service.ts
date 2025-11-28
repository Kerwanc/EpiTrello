import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserDto } from '../dtos/user.dto';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
    const { username, email, passwordHash, avatarUrl } = createUserDto;

    const existingUserByEmail = await this.userRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingUserByUsername = await this.userRepository.findByUsername(
      username,
    );
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    const user = await this.userRepository.createUser({
      username,
      email,
      passwordHash,
      avatarUrl: avatarUrl || null,
    });

    return this.mapToDto(user);
  }

  async getUserByEmail(email: string): Promise<UserDto | null> {
    const user = await this.userRepository.findByEmail(email);
    return user ? this.mapToDto(user) : null;
  }

  async getUserByUsername(username: string): Promise<UserDto | null> {
    const user = await this.userRepository.findByUsername(username);
    return user ? this.mapToDto(user) : null;
  }

  async getUserById(id: string): Promise<UserDto | null> {
    const user = await this.userRepository.findById(id);
    return user ? this.mapToDto(user) : null;
  }

  async getUserByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async updateUser(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDto | null> {
    const user = await this.userRepository.updateUser(id, updateData);
    return user ? this.mapToDto(user) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.deleteUser(id);
  }

  private mapToDto(user: User): UserDto {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as UserDto;
  }
}
