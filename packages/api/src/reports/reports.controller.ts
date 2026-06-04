import { Controller, Get, Query, UseGuards, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('attendance')
  @Roles('ADMIN', 'COACH')
  getAttendance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getAttendanceReport(from, to);
  }

  @Get('fines')
  @Roles('ADMIN', 'COACH', 'TREASURER')
  getFines(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getFinesReport(from, to, categoryId);
  }

  @Get('export')
  @Roles('ADMIN', 'TREASURER')
  async exportCsv(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.reportsService.exportCsv(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="mannschaftskasse-export.csv"');
    res.send(csv);
  }
}
