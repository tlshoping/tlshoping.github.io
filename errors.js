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
    console.log('Error:', error);
    errorNotification.classList.remove('hide');
    errorNotificationBody.textContent = error.stack;
    setTimeout(() => {
        errorNotification.classList.add('hide');
    }, 10000);
}