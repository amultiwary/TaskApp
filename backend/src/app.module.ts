import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    // MongoDB connection — reads MONGODB_URI from environment
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/task-portal',
    ),
    AuthModule,
    UsersModule,
    TasksModule,
  ],
})
export class AppModule {}