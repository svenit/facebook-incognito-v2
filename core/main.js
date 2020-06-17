chrome.runtime.onMessage.addListener(async (request, sender, callback) => {
    switch(request.action)
    {
        case INIT_APP:
            createContextMenu();
            if (chrome.webRequest.onBeforeRequest.hasListener(blockRequest))  {
                chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
            }
            try {
                chrome.webRequest.onBeforeRequest.addListener(blockRequest, {
                    urls: ['<all_urls>']
                }, ['blocking', 'requestBody']);  
            } catch(e) {
                console.log(e);
            }  
        break;
        case SET_SELECTED_ELEMENT:
            sessionStorage.setItem('targetSelected', request.payload);
        break;
        case 'SET_DEAD_BADGE':
            let currentDead = parseInt(localStorage.getItem('dead')) || 0;
            localStorage.setItem('dead', ++currentDead);
            setDeadBadge();
        break;
    }

    function createContextMenu()
    {
        if(!sessionStorage.getItem('isMenuCreated'))
        {
            chrome.contextMenus.create({
                title: 'Fly Color', 
                contexts:['all'], 
                onclick: banUser
            });
            sessionStorage.setItem('isMenuCreated', true);
        }
    }

    function blockRequest(details) {
        try {
            let currentBlocking = localStorage.getItem('blocked') || '';
            details.url = details.url.split('?') ? details.url.split('?')[0] : details.url;
            if(details.url.includes('https://www.facebook.com/api/graphql/') && details.method == 'POST')
            {
                if(details.requestBody.formData.fb_api_req_friendly_name && currentBlocking.split(',').includes(String(details.requestBody.formData.fb_api_req_friendly_name)))
                {
                    return {
                        cancel: true
                    };
                }
            }
            else if(currentBlocking && currentBlocking.split(',').includes(details.url))
            {
                return {
                    cancel: true
                };
            }
            return {
                cancel: false
            }
        }
        catch(e) {
            console.log(e);
        }
    }

    function createMessageBox(message, status, time)
    {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id || null, {action: 'CREATE_MESSAGE_BOX',message, status, time});  
        });
    }

    function setDeadBadge()
    {
        let flyColorSetting = JSON.parse(localStorage.getItem('flyColorSetting')) || {
            showDeadBadge: true
        };
        let currentDead = parseInt(localStorage.getItem('dead')) || 0;
        let text = flyColorSetting.showDeadBadge ? `${currentDead}` : '';  
        chrome.browserAction.setBadgeText({text});
    }

    setDeadBadge();

    async function banUser(info, tab) {
        try
        {
            let flyColorSetting = JSON.parse(localStorage.getItem('flyColorSetting'));
            let actor = JSON.parse(localStorage.getItem('actor'));  
            let targetSelected = JSON.parse(sessionStorage.getItem('targetSelected'));
            if(flyColorSetting !== null && actor !== null && targetSelected !== null)
            {
                let groupId = flyColorSetting.multipleGroups ? targetSelected.groupId : parseInt(flyColorSetting.groupId);
                flyColorSetting.ignoreMemberId = flyColorSetting.ignoreMemberId || '';
                if(flyColorSetting.ignoreMemberId.length == 0 || !flyColorSetting.ignoreMemberId.split("\n").includes(targetSelected.userId))
                {
                    if(groupId && targetSelected.userId != targetSelected.groupId)
                    {
                        if(confirm(`Xóa ${targetSelected.userName} khỏi nhóm ${targetSelected.groupName}?`))
                        {
                            let option = {
                                fb_dtsg_ag: actor.fb_dtsg,
                                fb_dtsg: actor.fb_dtsg,
                                confirmed: true
                            }
                            option.block_user = flyColorSetting.banForever ? confirm(`[ Tùy Chọn ] Chặn ${targetSelected.userName} vĩnh viễn khỏi nhóm ${targetSelected.groupName}?`) : null;
                            let reason = flyColorSetting.showReason ? prompt('Lí do?') : '';   
                            let message = flyColorSetting.message.replace('{{ name }}', targetSelected.userName).replace('{{ uid }}', targetSelected.userId).replace('{{ reason }}', reason || '');
                            let payload = { message, targetSelected, groupId, option, flyColorSetting, actor };
                            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                                chrome.tabs.sendMessage(tabs[0].id || null, {action: 'BAN_USER', payload});  
                            });
                        }
                        return;
                    }
                    return createMessageBox('Không tìm thấy nhóm, xin vui lòng thử lại', 'error');
                }
                return createMessageBox('Người này nằm trong danh sách bất tử, không thể Fly Color', 'warning');
            }
            createMessageBox('Vui lòng cấu hình Fly Color Click trước khi thực hiện hành động này', 'warning');
        }
        catch(e)
        {
            console.log(e);
            createMessageBox('Đã có lỗi xảy ra, xin vui lòng thử lại', 'error');
        }
    }
});

chrome.webRequest.onBeforeSendHeaders.addListener(details => {
    const headersRequest = details.requestHeaders;
    const a = headersRequest.findIndex(e => 'origin' === e.name)
    return -1 === a ? headersRequest.push({name: 'origin', value: 'https://www.facebook.com'}) : headersRequest[a].value = 'https://www.facebook.com', {requestHeaders: headersRequest}
}, {
    urls: ['https://www.facebook.com/messaging/send/', 'https://www.facebook.com/api/graphql']
},['blocking', 'requestHeaders', 'extraHeaders']);

registerExternalMessageListener();

function registerExternalMessageListener() 
{
    chrome.runtime.onMessageExternal.addListener(async (request, sender, sendResponse) => {
        if(request.getPersistedMessages) 
        {
            getPersistedMessages(messages => {
                sendResponse(messages);
            });
        }
        if(request.receivedMessages) 
        {
            setReceivedMessages(request.receivedMessages);
        }
        if(request.removedMessages) 
        {
            setRemovedMessages(request.removedMessages);
        }
        if(request.lastPurgeTime) 
        {
            setLastPurgeTime(request.lastPurgeTime);
        }
        if(request.action == 'AUTO_REP_MESSAGE')
        {
            let actor = JSON.parse(localStorage.getItem('actor'));  
            let setting = JSON.parse(localStorage.getItem('autoRepMessage'));  
            if(setting.status && (request.message.thread_id.split(':')[0] != 'thread' || setting.repInGroup) && (setting.noRepInFacebook != sender.tab.active || !setting.noRepInFacebook))
            {
                let { data } = await axios.get(`https://graph.facebook.com/${request.message.other_user_fbid}/?access_token=${actor.token}`);
                let messageBody = setting.message;
                messageBody = messageBody.replace('{{ name }}', data.name).replace('{{ id }}', data.id);
                let apiKeys = ['~qkU26zH6T8nX4pJ55WYF-e~9xUVwkNt7dyB5AWY', '7At6Fyt1mnnEMqTpIrx1_2S.z6~TEUOo_ayxDa2C'];
                if(setting.chatbotMode)
                {
                    let { data } = await axios.post('https://wsapi.simsimi.com/190410/talk/', {
                        lang: 'vi',
                        utext: request.message.body
                    }, {
                        headers: {
                            'x-api-key': apiKeys[Math.round(Math.random(0, apiKeys.length - 1))]
                        }
                    });
                    let replaceMessages = {
                        'simsimi': actor.name,
                        'Simsimi': actor.name,
                        'SimSimi': actor.name,
                    };
                    for(let i of Object.keys(replaceMessages))
                    {
                        data.atext = data.atext.replace(i, replaceMessages[i]);
                    }
                    messageBody =  (setting.botSign.replace('{{ name }}', data.name).replace('{{ id }}', data.id) || '') + data.atext.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '');
                }
                setTimeout(async () => {
                    await sendMessage({
                        fb_dtsg: actor.fb_dtsg,
                        message: setting.useSticker && !setting.chatbotMode ? null : messageBody,
                        has_attachment: setting.useSticker && !setting.chatbotMode,
                        id: request.message.offline_threading_id,
                        sticker_id: setting.useSticker && !setting.chatbotMode ? setting.stickerId : null,
                        other_user_fbid: request.message.other_user_fbid,
                        my_id: actor.id,
                    });
                    chrome.notifications.create(`${Math.floor(Math.random() * 99999)}`, {
                        type: 'basic',
                        title: 'Thông Báo',
                        message: `Hệ thống đã tự động trả lời tin nhắn của ${data.name}`,
                        iconUrl: chrome.runtime.getURL('assets/images/icon.png')
                    })
                }, setting.delay * 1000);
            }
            console.log(request);
        }
        return true;
    });
}

async function sendMessage(data)
{
    let form = new FormData();
    let randomId = Math.floor(Math.random()*1000);
    form.append('fb_dtsg', data.fb_dtsg);
    form.append('client', 'mercury');
    form.append('action_type', 'ma-type:user-generated-message');
    if(data.message)
    {
        form.append('body', data.message);
    }
    form.append('ephemeral_ttl_mode', 0);
    form.append('sticker_id', data.sticker_id);
    form.append('has_attachment', data.has_attachment);
    form.append('message_id', parseInt(data.id) + randomId);
    form.append('offline_threading_id', parseInt(data.id) + randomId);
    form.append('other_user_fbid', data.other_user_fbid);
    form.append('signature_id', '52a4388e');
    form.append('source', 'source:chat:web');
    form.append('specific_to_list[0]', `fbid:${data.other_user_fbid}`);
    form.append('specific_to_list[1]', `fbid:${data.my_id}`);
    form.append('tags[0]', 'web:trigger:fb_header_dock:jewel_thread');
    form.append('timestamp', new Date().getTime());
    form.append('ui_push_phase', 'C3');
    await axios.post(`https://www.facebook.com/messaging/send/`, form);
}

function getPersistedMessages(callback) 
{
    chrome.storage.local.get(['receivedMessages', 'removedMessages', 'lastPurgeTime'], function (result) {
        callback(result);
    });
}

function setReceivedMessages(messages) 
{
    chrome.storage.local.set({
        'receivedMessages': messages
    });
}

function setRemovedMessages(messages) 
{
    chrome.storage.local.set({
        'removedMessages': messages
    });
}

function setLastPurgeTime(timestamp) 
{
    chrome.storage.local.set({
        'lastPurgeTime': timestamp
    });
}