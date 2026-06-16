import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChatsModule } from './chats/chats.module';
import { WorkspacesModule } from './workspace/workspace.module';
import { SchoolModule } from './school/school.module';
import { UploadModule } from './upload/upload.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'dyms'),
        autoLoadEntities: true,
        synchronize: true, // Auto create/update schema tables in dev/supabase
      }),
    }),
    UsersModule,
    AuthModule,
    ChatsModule,
    WorkspacesModule,
    SchoolModule,
    UploadModule,
    PushModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        const { method, originalUrl } = req;
        console.log(`[REQUEST] ${method} ${originalUrl} | Body: ${JSON.stringify(req.body)}`);
        res.on('finish', () => {
          console.log(`[RESPONSE] ${method} ${originalUrl} => ${res.statusCode}`);
        });
        next();
      })
      .forRoutes('*');
  }
}
