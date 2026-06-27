import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export const useHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  const impact = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  };

  const notification = async (type: NotificationType = NotificationType.Success) => {
    if (isNative) {
      try {
        await Haptics.notification({ type });
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  };

  const selectionChanged = async () => {
    if (isNative) {
      try {
        await Haptics.selectionChanged();
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  };

  const vibrate = async (duration: number = 300) => {
    if (isNative) {
      try {
        await Haptics.vibrate({ duration });
      } catch (error) {
        console.log("Haptics not available");
      }
    }
  };

  // Convenience methods
  const lightImpact = () => impact(ImpactStyle.Light);
  const mediumImpact = () => impact(ImpactStyle.Medium);
  const heavyImpact = () => impact(ImpactStyle.Heavy);

  const successNotification = () => notification(NotificationType.Success);
  const warningNotification = () => notification(NotificationType.Warning);
  const errorNotification = () => notification(NotificationType.Error);

  return {
    impact,
    notification,
    selectionChanged,
    vibrate,
    lightImpact,
    mediumImpact,
    heavyImpact,
    successNotification,
    warningNotification,
    errorNotification,
    isNative,
  };
};

// Export the ImpactStyle and NotificationType for convenience
export { ImpactStyle, NotificationType };
