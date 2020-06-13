import {
    getPersistedMessages,
    getReducedMessageObject,
    _getViewerAuthorFbt,
    _getOtherAuthorFbt,
    _getUnknownAuthorFbt,
    setReceivedMessages,
    setRemovedMessages,
    setLastPurgeTime
} from './module.js';

const HOOK_MODULES = [
    'RemovedMessageTombstoneContent',
    'MessengerState.bs',
    'MessengerParticipants.bs',
    'MercuryThreadInformer',
    'MercuryIDs',
    'CurrentUser',
];
const NEW_MESSAGE_EVENT = 'new-message';
const REMOVED_MESSAGE_UNSENDABILITY_STATUS = 'deny_tombstone_message';

let receivedMessages = {};
let removedMessages = {};
let Modules = {};

hookMessengerModules(() => {
    loadPersistedMessages();
});

function hookMessengerModules(callback) 
{
    if (window.requireLazy) 
    {
        window.requireLazy(HOOK_MODULES, (...modules) => {
            setHookedModules(...modules);
            Modules.RemovedMessageTombstoneContent.getRemovedMessageTombstoneContent = getTombstoneContent;
            Modules.MercuryThreadInformer.prototype.informNewMessage = informNewMessage;
            Modules.MercuryThreadInformer.prototype.updatedMessage = updatedMessage;
            callback();
        });
    } 
    else 
    {
        console.warn('Failed to inject Unsend Recall for Messenger hook.');
    }
}

function loadPersistedMessages() 
{
    getPersistedMessages((response) => {
        if (response.receivedMessages) 
        {
            receivedMessages = JSON.parse(response.receivedMessages);
        }
        if (response.removedMessages) 
        {
            removedMessages = JSON.parse(response.removedMessages);

        }
        purgeReceivedMessages(response.lastPurgeTime);
    });
}

function getTombstoneContent(message, metadata) 
{
    let messageAuthor = message.author;
    let messageAuthorId = Modules.MercuryIDs.getUserIDFromParticipantID(messageAuthor);
    let currentUserId = Modules.CurrentUser.getID();
    let removedMessage = getRemovedMessage(message);

    if (messageAuthorId === currentUserId) 
    {
        return _getViewerAuthorFbt(removedMessage);
    }

    let threadMeta = Modules.MessengerState.getThreadMetaNow(currentUserId, message.thread_id);
    let messageAuthorName = threadMeta.custom_nickname ? threadMeta.custom_nickname[messageAuthorId] : Modules.MessengerParticipants.getNow(messageAuthor).short_name;

    return threadMeta ? _getOtherAuthorFbt(messageAuthorName, removedMessage) : _getUnknownAuthorFbt(removedMessage);

}
function informNewMessage(threadId, message) 
{
    let messageId = message.message_id;
    receivedMessages[messageId] = getReducedMessageObject(message);
    setReceivedMessages(receivedMessages);

    this.inform(NEW_MESSAGE_EVENT, {
        threadID: threadId,
        message: message
    });
}

function updatedMessage(threadId, messageId, source) 
{
    this.$MercuryThreadInformer11[threadId] || (this.$MercuryThreadInformer11[threadId] = {}),
        this.$MercuryThreadInformer11[threadId][messageId] = {
            source
        }
    this.updatedThread(threadId);
    checkForRemovedMessage(messageId);
}

function checkForRemovedMessage(messageId) 
{
    let currentUserId = Modules.CurrentUser.getID();
    let messages = Modules.MessengerState.getMessagesFromIDs(currentUserId, [messageId]);
    if (messages && messages[0]) 
    {
        let updatedMessage = messages[0];
        if (updatedMessage.message_unsendability_status === REMOVED_MESSAGE_UNSENDABILITY_STATUS) 
        {
            addRemovedMessage(messageId);
        }
    }
}

function getRemovedMessage(message) 
{
    let messageId = message.message_id;
    if (receivedMessages[messageId]) 
    {
        addRemovedMessage(messageId);
    }
    if (removedMessages[messageId]) {
        let message = removedMessages[messageId];
        let messageBody = message.body;
        if (message.has_attachment) 
        {
            let attachment = message.attachments[0];
            let link = "";
            if (attachment.share) 
            {
                link = attachment.share.uri;
            }
            if (attachment.thumbnail_url) 
            {
                link = attachment.thumbnail_url;
            }
            if (attachment.preview_url) 
            {
                link = attachment.preview_url;
            }
            if (attachment.large_preview_url) 
            {
                link = attachment.large_preview_url;
            }
            if (attachment.url) 
            {
                link = attachment.url;
            }
            return message.body.length > 0 ? `${messageBody} ${link}` : link;
        }
        return messageBody;
    }
    return null; 
}

function addRemovedMessage(messageId) 
{
    removedMessages[messageId] = receivedMessages[messageId];
    delete receivedMessages[messageId];
    setRemovedMessages(removedMessages);
    setReceivedMessages(receivedMessages);
}

function purgeReceivedMessages(lastPurgeTime) 
{
    if (!lastPurgeTime) 
    {
        setLastPurgeTime();
        return;
    }

    const ONE_DAY = 1 * 24 * 60 * 60 * 1000;
    const TEN_MINUTES = 10 * 60 * 1000;
    let currentTimestamp = new Date().getTime();
    let oneDayFromLastPurgeTime = lastPurgeTime + ONE_DAY;

    if (currentTimestamp > oneDayFromLastPurgeTime) 
    {
        Object.keys(receivedMessages).forEach(function (key) {
            let message = receivedMessages[key];
            let tenMinutesFromMessageTimestamp = message.timestamp + TEN_MINUTES;
            if (currentTimestamp > tenMinutesFromMessageTimestamp) 
            {
                delete receivedMessages[key];
            }
        });
        setReceivedMessages(receivedMessages);
        setLastPurgeTime();
    }
}

function setHookedModules(...modules) 
{
    modules.forEach(function (module, key) {
        let moduleName = HOOK_MODULES[key].split(".")[0];
        Modules[moduleName] = module;
    });
}
