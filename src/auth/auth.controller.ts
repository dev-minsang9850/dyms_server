// src/auth/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('find-id')
  async findId(@Body('name') name: string, @Body('phone') phone: string) {
    return this.authService.findId(name, phone);
  }

  @Post('find-password')
  async findPassword(
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('phone') phone: string,
  ) {
    return this.authService.findPassword(email, name, phone);
  }
}
