import { telegramBot } from './telegram-bot.js';

class SchedulerService {
  private hourlyInterval: ReturnType<typeof setInterval> | null = null;
  private dailyInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Iniciar el programador de tareas
   */
  startScheduler (): void {
    console.log('⏰ Iniciando programador de tareas...');

    // Reporte horario (cada hora)
    this.hourlyInterval = setInterval(async () => {
      try {
        console.log('📊 Enviando reporte horario...');
        await telegramBot.sendHourlyReport();
      } catch (error) {
        console.error('❌ Error enviando reporte horario:', error);
      }
    }, 60 * 60 * 1000); // Cada hora

    // Reporte diario (cada día a las 9:00 AM)
    this.dailyInterval = setInterval(async () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Solo enviar a las 9:00 AM
      if (hour === 9) {
        try {
          console.log('📈 Enviando reporte diario...');
          await telegramBot.sendDailyReport();
        } catch (error) {
          console.error('❌ Error enviando reporte diario:', error);
        }
      }
    }, 60 * 60 * 1000); // Verificar cada hora

    console.log('✅ Programador de tareas iniciado');
  }

  /**
   * Detener el programador de tareas
   */
  stopScheduler (): void {
    if (this.hourlyInterval) {
      clearInterval(this.hourlyInterval);
      this.hourlyInterval = null;
    }
    
    if (this.dailyInterval) {
      clearInterval(this.dailyInterval);
      this.dailyInterval = null;
    }

    console.log('⏹️ Programador de tareas detenido');
  }

  /**
   * Enviar reporte manual
   */
  async sendManualReport (type: 'hourly' | 'daily'): Promise<boolean> {
    try {
      if (type === 'hourly') {
        return await telegramBot.sendHourlyReport();
      } else {
        return await telegramBot.sendDailyReport();
      }
    } catch (error) {
      console.error(`❌ Error enviando reporte ${type}:`, error);
      return false;
    }
  }
}

export const scheduler = new SchedulerService();