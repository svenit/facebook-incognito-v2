
/**
 * @author : Lê Quang Vỹ
 * @version : 1.0.2
 * @facebook : https://facebook.com/sven307
 */

const supportDomain = ['facebook.com'];
let stack = [];

if(supportDomain.includes(document.domain))
{
    chrome.runtime.sendMessage({
        action: INIT_APP,
    });
    window.addEventListener('load', function () {
        console.log('Page was loaded');
        createContextMenu();
        injectHook(chrome.extension.getURL('hook.js'));
    });
}
function injectHook(url) 
{
    var hookScript = document.createElement('script');
    hookScript.type = 'module';
    hookScript.src = url;
    (document.head || document.body || document.documentElement).appendChild(hookScript);
    alert(url);
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    switch(request.action)
    {
        case 'CREATE_MESSAGE_BOX':
            createMessageBox(request);
        break;
        case 'CONNECT_TO_FACEBOOK':
            let feedbackId = await getFeedbackId(request);
            chrome.runtime.sendMessage({
                action: 'CONNECT_TO_FACEBOOK_CALLBACK',
                payload: JSON.stringify(feedbackId)
            });
        break;
        case 'BAN_USER':
            try
            {
                let { message, targetSelected, groupId, option, flyColorSetting, actor } = request.payload;
                let form = new FormData();
                form.append('fb_dtsg_ag', option.fb_dtsg_ag);
                form.append('fb_dtsg', option.fb_dtsg);
                form.append('confirmed', option.confirmed);
                createMessageBox({status: 'info', message: `Đang thực hiện [ Fly Color ] - ${targetSelected.userName} ra khỏi nhóm ${targetSelected.groupName}`});
                let { data } = await axios.post(`https://www.facebook.com/ajax/groups/remove_member/?group_id=${groupId}&member_id=${targetSelected.userId}&source=profile_browser&is_undo=0`, form);
                if(data == '' && await hasBanned(option.fb_dtsg, groupId, targetSelected.userId))
                {
                    createMessageBox({status: 'success', message});
                    broadcastToChannel(request.payload);
                    chrome.runtime.sendMessage({
                        action: 'SET_DEAD_BADGE'
                    });
                    return;
                }
                createMessageBox({status: 'error', message: `${targetSelected.userName} không thuộc nhóm bạn quản lý hoặc đã bị block trước đó`});
            }
            catch(e)
            {
                createMessageBox({status: 'error', message: 'Đã có lỗi xảy ra, xin vui lòng thử lại'});
            }
        break;
    }
});
