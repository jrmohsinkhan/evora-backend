import Notification from '../models/Notification'

export const sendNotification = async (recipient, recipientType, title, message, type = 'custom') => {
    const notification = await Notification.create({
        recipient,
        recipientType,
        title,
        message,
        type
    })
    return notification
}