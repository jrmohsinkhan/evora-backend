const Notification = require('../models/Notification')

const sendNotification = async (recipient, recipientType, title, message, type = 'custom') => {
    const notification = await Notification.create({
        recipient,
        recipientType,
        title,
        message,
        type
    })
    return notification
}

module.exports = { sendNotification }