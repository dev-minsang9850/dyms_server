import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { NoticeEntity } from './notice.entity';
import { PushModule } from '../push/push.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoticeEntity]),
    PushModule,
    UsersModule,
  ],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
