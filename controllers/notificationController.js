import Notification from "../models/NotificationModel";

// notificationController.js
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        userId: req.user.id,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.json(notifications);

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({
      message: "Notification marked as read",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to update notification",
      error: error.message,
    });
  }
};

export const sendNotification = async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      type,
      roleToDisplay,
      relatedId,
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        message: "userId, title, and message are required",
      });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || "general",

      // NEW FIELDS
      roleToDisplay: roleToDisplay || [],
      relatedId: relatedId || null,
    });

    return res.status(201).json({
      message: "Notification sent successfully",
      notification,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to send notification",
      error: error.message,
    });
  }
};