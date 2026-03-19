import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email.' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'P@ssword1' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password!: string;

  @ApiProperty({ example: 'NewP@ssword1', required: false })
  @IsOptional()
  @IsString()
  newPassword?: string;
}
