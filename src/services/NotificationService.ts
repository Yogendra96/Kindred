class NotificationService {
  static init() {
    console.log('Notification Service Initialized.');
    this.scheduleSimulatedPush();
  }

  static scheduleSimulatedPush() {
    // Simulate a push notification arriving shortly after app start
    setTimeout(() => {
      console.log(
        '📱 PUSH NOTIFICATION: Did you know a plant-based diet cuts your carbon footprint by 73%? Check out the new Vegan Journey!',
      );
    }, 5000);
  }
}

export { NotificationService };
