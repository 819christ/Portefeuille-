// Capacitor Local Notifications Service
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const requestNotificationPermissions = async () => {
  if (!Capacitor.isNativePlatform()) return true;
  const { display } = await LocalNotifications.checkPermissions();
  if (display !== 'granted') {
    const request = await LocalNotifications.requestPermissions();
    return request.display === 'granted';
  }
  return true;
};

export const schedulePlanNotification = async (planId, planData) => {
  if (!Capacitor.isNativePlatform()) return;
  
  const hasPerm = await requestNotificationPermissions();
  if (!hasPerm) return;

  // Convert nextDueDate to Date object
  const dueDate = new Date(planData.nextDueDate);
  // Schedule for 9 AM on the due date, or exactly at due date if it has time
  // If it's in the past, don't schedule
  if (dueDate.getTime() <= Date.now()) return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: `Rappel : ${planData.label || 'Planification'}`,
          body: `Votre ${planData.type === 'deposit' ? 'dépôt' : 'retrait'} de ${planData.amount} FCFA est prévu aujourd'hui.`,
          id: planId, // Use planId as notification ID for easy cancellation
          schedule: { at: dueDate },
          sound: null, // default sound
          actionTypeId: '',
          extra: null
        }
      ]
    });
  } catch (error) {
    console.warn('Erreur lors de la programmation de la notification', error);
  }
};

export const cancelPlanNotification = async (planId) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: planId }] });
  } catch (error) {
    console.warn('Erreur lors de l\'annulation de la notification', error);
  }
};

export const rescheduleAllPlans = async (plans) => {
  if (!Capacitor.isNativePlatform()) return;
  
  const pendingPlans = plans.filter(p => p.status === 'pending');
  if (pendingPlans.length === 0) return;

  const notifications = pendingPlans.map(p => {
    const dueDate = new Date(p.nextDueDate);
    if (dueDate.getTime() > Date.now()) {
      return {
        title: `Rappel : ${p.label || 'Planification'}`,
        body: `Votre ${p.type === 'deposit' ? 'dépôt' : 'retrait'} de ${p.amount} FCFA est prévu aujourd'hui.`,
        id: p.id,
        schedule: { at: dueDate }
      };
    }
    return null;
  }).filter(n => n !== null);

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (error) {
      console.warn('Erreur lors de la reprogrammation globale', error);
    }
  }
};
