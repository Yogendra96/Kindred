import logger from './LoggerService';

const log = logger.withTag('NotificationService');

class NotificationService {
  static init() {
    log.info('Notification Service Initialized.');
    if (process.env.NODE_ENV !== 'test') {
      this.scheduleSimulatedPush();
    }
  }

  static scheduleSimulatedPush() {
    // Simulate a push notification arriving shortly after app start
    setTimeout(() => {
      log.info(
        '📱 PUSH NOTIFICATION: Did you know a plant-based diet cuts your carbon footprint by 73%? Check out the new Vegan Journey!',
      );
    }, 5000);
  }

  static async displayNotification(notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<void> {
    log.info(`📱 NOTIFICATION: ${notification.title} - ${notification.body}`, notification.data);
  }
}

export { NotificationService };
