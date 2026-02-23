import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard) // All task routes require authentication
export class TasksController {
  constructor(private tasksService: TasksService) {}

  /** GET /api/tasks/stats */
  @Get('stats')
  getStats(@Request() req) {
    return this.tasksService.getStats(req.user._id.toString());
  }

  /** GET /api/tasks?status=pending|completed */
  @Get()
  findAll(@Request() req, @Query('status') status?: string) {
    return this.tasksService.findAll(req.user._id.toString(), status);
  }

  /** GET /api/tasks/:id */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.tasksService.findOne(req.user._id.toString(), id);
  }

  /** POST /api/tasks */
  @Post()
  create(@Request() req, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user._id.toString(), dto);
  }

  /** PATCH /api/tasks/:id */
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(req.user._id.toString(), id, dto);
  }

  /** PATCH /api/tasks/:id/toggle */
  @Patch(':id/toggle')
  toggleStatus(@Request() req, @Param('id') id: string) {
    return this.tasksService.toggleStatus(req.user._id.toString(), id);
  }

  /** DELETE /api/tasks/:id */
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.tasksService.remove(req.user._id.toString(), id);
  }
}