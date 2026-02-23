import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(userId: string, dto: CreateTaskDto): Promise<TaskDocument> {
    const task = new this.taskModel({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      description: dto.description || '',
      priority: dto.priority || 'medium',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });
    return task.save();
  }

  async findAll(userId: string, status?: string): Promise<TaskDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (status && ['pending', 'completed'].includes(status)) {
      query.status = status;
    }
    return this.taskModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(userId: string, taskId: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) throw new NotFoundException('Task not found');
    this.assertOwnership(task, userId);
    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.findOne(userId, taskId);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    return task.save();
  }

  /**
   * Toggle status between pending ↔ completed.
   * Automatically manages completedAt timestamp.
   */
  async toggleStatus(userId: string, taskId: string): Promise<TaskDocument> {
    const task = await this.findOne(userId, taskId);

    if (task.status === TaskStatus.PENDING) {
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
    } else {
      task.status = TaskStatus.PENDING;
      task.completedAt = null;
    }

    return task.save();
  }

  async remove(userId: string, taskId: string): Promise<{ deleted: boolean }> {
    const task = await this.findOne(userId, taskId);
    await task.deleteOne();
    return { deleted: true };
  }

  async getStats(userId: string) {
    const oid = new Types.ObjectId(userId);
    const [total, completed, pending] = await Promise.all([
      this.taskModel.countDocuments({ userId: oid }),
      this.taskModel.countDocuments({ userId: oid, status: TaskStatus.COMPLETED }),
      this.taskModel.countDocuments({ userId: oid, status: TaskStatus.PENDING }),
    ]);
    return { total, completed, pending };
  }

  private assertOwnership(task: TaskDocument, userId: string) {
    if (task.userId.toString() !== userId) {
      throw new ForbiddenException('You do not own this task');
    }
  }
}