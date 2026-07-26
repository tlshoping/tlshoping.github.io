window.addEventListener('error', function (event) {
    sendErrorNotification({
        type: 'JavaScript Error',
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent
    });
});

window.addEventListener('unhandledrejection', function (event) {
    sendErrorNotification({
        type: 'Unhandled Promise Rejection',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        url: window.location.href
    });
});

async function sendErrorNotification(error) {
    if (error.message == "Cannot read properties of undefined (reading 'id')" || error.message == "undefined is not an object (evaluating 'user_data.data.id')") {
        console.log('Error:', error);

        const botLink = shopInfo.bot_username
            ? `https://t.me/${shopInfo.bot_username.replace('@', '')}?start=r`
            : null;

        errorNotification.classList.remove('hide');
        errorNotificationBody.textContent = 'Вы используете старую версию, необходимо обновить бота';
        errorNotificationFooter.innerHTML = botLink
            ? `Отправте команду /start <a href="${botLink}">БОТУ</a>`
            : 'Отправте команду /start боту';

        if (botLink) {
            Telegram.WebApp.openTelegramLink(botLink);
        }
    } else {
        console.log('Error:', error);
        admNotifications(error);
        errorNotification.classList.remove('hide');
        errorNotificationBody.textContent = error.stack;
        setTimeout(() => {
            errorNotification.classList.add('hide');
        }, 10000);
    }
}