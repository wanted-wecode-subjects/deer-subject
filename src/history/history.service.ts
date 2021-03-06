import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { History } from '../entities/history.entity';
import { DeerService } from '../deer/deer.service';
import { User } from '../entities/user.entity';
import { CreateHistroyDto } from './dto/create-history.dto';
import { HistoryRepository } from './history.repository';
import { UpdateHistroyDto } from './dto/update-history.dto';
import { EventService } from '../event/event.service';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(HistoryRepository)
    private historyRepository: HistoryRepository,
    private deerService: DeerService,
    private eventSevice: EventService
  ) {}

  async createRentalHistory(
    createHistroyDto: CreateHistroyDto,
    user: User,
  ): Promise<{ message: string; history_id: number; use_start_at: Date }> {
    const deer = await this.deerService.findOneById(createHistroyDto.deer_name);
    const history = this.historyRepository.create({
      user,
      deer,
    });
    try {
      const { history_id, use_start_at } = await this.historyRepository.save(
        history,
      );
      return { message: '대여가 완료 되었습니다.', history_id, use_start_at };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getHistoryList(
    user: User,
    limit: number,
    offset: number,
  ): Promise<{ history: History[]; count: number }> {
    const [history, count] = await this.historyRepository.findAndCount({
      where: { user },
      take: limit,
      skip: offset,
    });
    return { count, history };
  }

  async updateReturnHistory(
    id: number,
    updateHistroyDto: UpdateHistroyDto,
    user: User,
  ) {
    const { history, sendData } =
      await this.historyRepository.updateReturnHistory(
        id,
        updateHistroyDto,
        user,
      );
    if (sendData) {
      history.price = await this.eventSevice.calculatePrice(sendData);
    }
    return await this.historyRepository.saveHistory(history);
  }
}
