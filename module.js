const EXTENSION_ID = "dbhodakoonpcglkjcphdkklibellpfjc";

export function getPersistedMessages(callback) {
    chrome.runtime.sendMessage(EXTENSION_ID, {
        getPersistedMessages: true
    }, (response) => {
        callback(response);
    });
}

export function setReceivedMessages(receivedMessages) {
    chrome.runtime.sendMessage(EXTENSION_ID, {
        receivedMessages: JSON.stringify(receivedMessages)
    });
}

export function setRemovedMessages(removedMessages) {
    chrome.runtime.sendMessage(EXTENSION_ID, {
        removedMessages: JSON.stringify(removedMessages)
    });
}

export function setLastPurgeTime() {
    chrome.runtime.sendMessage(EXTENSION_ID, {
        lastPurgeTime: new Date().getTime()
    });
}

export function _getViewerAuthorFbt(removedMessage) {
    return `You removed a message ${getRemovedMessageText(removedMessage)}`;
}

export function _getOtherAuthorFbt(name, removedMessage) {
    return `${name} removed a message ${getRemovedMessageText(removedMessage)}`;
}

export function _getUnknownAuthorFbt(removedMessage) {
    return `A contact removed a message ${getRemovedMessageText(removedMessage)}`;
}

function getRemovedMessageText(removedMessage) {
    return removedMessage ? `: ${removedMessage}` : '';
}

export function getReducedMessageObject({
    message_id,
    thread_id,
    offline_threading_id,
    author,
    body,
    has_attachment,
    attachments,
    timestamp
}) {
    return {
        message_id,
        thread_id,
        offline_threading_id,
        author,
        body,
        has_attachment,
        attachments,
        timestamp
    };
}