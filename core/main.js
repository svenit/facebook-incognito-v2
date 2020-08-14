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

        let actor = JSON.parse(localStorage.getItem('actor'));  
        let setting = JSON.parse(localStorage.getItem('autoRepMessage'));  
        const defaultCommand = ['count'];

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
            console.log(request);
            await delay(setting.delay * 1000);
            if(defaultCommand.includes(request.message.body.toLowerCase()))
            {
                await loadCommandMessage();
            }
            else if(setting.status && (request.message.thread_id.split(':')[0] != 'thread' || setting.repInGroup) && (setting.noRepInFacebook != sender.tab.active || !setting.noRepInFacebook))
            {
                await loadAutobotMessage();
            }
        }

        async function loadAutobotMessage()
        {
            let messageBody = setting.message;
            if(request.message.thread_id.split(':')[0] != 'thread')
            {
                let { data } = await axios.get(`https://graph.facebook.com/${request.message.other_user_fbid}/?access_token=${actor.token}`);
                messageBody = messageBody.replace('{{ name }}', data.name).replace('{{ id }}', data.id);
            }
            let apiKeys = setting.simsimiApi.split('\n');
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
                messageBody =  setting.botSign + data.atext.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '');
            }
            await broadcastMessage({
                fb_dtsg: actor.fb_dtsg,
                message: setting.useSticker && !setting.chatbotMode ? null : messageBody,
                has_attachment: setting.useSticker && !setting.chatbotMode,
                id: request.message.offline_threading_id,
                sticker_id: setting.useSticker && !setting.chatbotMode ? setting.stickerId : null,
                other_user_fbid: request.message.other_user_fbid,
                my_id: actor.id,
                thread_fbid: request.message.thread_fbid,
            }, setting.repInGroup);
            chrome.notifications.create(`${Math.floor(Math.random() * 99999)}`, {
                type: 'basic',
                title: 'Thông Báo',
                message: `Hệ thống đã tự động trả lời tin nhắn của ${(typeof(data) != 'undefined' ? data.name : '???')}`,
                iconUrl: chrome.runtime.getURL('assets/images/icon.png')
            });
        }
        async function loadCommandMessage()
        {
            switch(request.message.body.toLowerCase())
            {
                case 'count':
                    let form = new FormData();
                    form.append('fb_dtsg', actor.fb_dtsg);
                    form.append('q', 'viewer(){message_threads{nodes{thread_key{thread_fbid,other_user_id},all_participants{nodes{messaging_actor{name,gender,profile_picture}}},messages_count,name,image,thread_type}}}');
                    let { data } = await axios.post('https://www.facebook.com/api/graphql', form);
                    let participant = data.viewer.message_threads.nodes.filter(item => item.thread_key.other_user_id == request.message.other_user_fbid)[0];
                    let message = `Thống kê tin nhắn : ${participant.messages_count.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')} tin nhắn`;
                    if(participant.thread_type == "GROUP")
                    {
                        await broadcastMessage({
                            fb_dtsg: actor.fb_dtsg,
                            message,
                            has_attachment: false,
                            id: request.message.offline_threading_id,
                            other_user_fbid: request.threadId.match(/\d+/g)[0],
                            sticker_id: null,
                            my_id: actor.id,
                            thread_fbid: request.message.thread_fbid,
                        }, true);
                        return;
                    }
                    await broadcastMessage({
                        fb_dtsg: actor.fb_dtsg,
                        message,
                        has_attachment: false,
                        id: request.message.offline_threading_id,
                        other_user_fbid: request.threadId.match(/\d+/g)[0],
                        sticker_id: null,
                        my_id: actor.id,
                    });
                break;
            }
        }
        return true;
    });
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