export const sendNotification = async (recipient, title, message) => {
    const notification = new Notification({
        recipient,
        title,
        message
    })
    await notification.save()
}