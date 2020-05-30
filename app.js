
/**
 * @author : Lê Quang Vỹ
 * @version : 1.0.2
 * @facebook : https://facebook.com/sven307
 */

const supportDomain = ['facebook.com'];
let stack = [];

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

async function hasBanned(fb_dtsg, groupId, userId)
{
    let form = new FormData();
    form.append('fb_dtsg', fb_dtsg);
    form.append('fb_api_caller_class', 'RelayModern');
    form.append('fb_api_req_friendly_name', 'GroupAdminActivityQueuePaginationContainerWrapperQuery');
    form.append('variables', JSON.stringify({
        'groupID': groupId,
        'filters': {}
    }));
    form.append('doc_id', 2985696198190516);
    let { data } = await axios.post('https://www.facebook.com/api/graphql/', form);
    let memberBlockedLists = [];
    data.data.group.group_admin_activity.edges.forEach((item, key) => {
        if(item.node.activity_title.ranges[1] && typeof(item.node.activity_title.ranges[1].entity) !== 'undefined') memberBlockedLists = [item.node.activity_title.ranges[1].entity.id || null, ...memberBlockedLists];
    });
    memberBlockedLists = memberBlockedLists.filter((item) => item != null);
    return memberBlockedLists.includes(userId);
}

function broadcastToChannel(data)
{
    try
    {
        let { message, groupId, option, flyColorSetting, actor } = data;
        if(flyColorSetting.discordHook)
        {
            axios.post(flyColorSetting.discordHook, {
                content: '```' + message + '```'
            });
        }
        if(flyColorSetting.facebookPostId && flyColorSetting.facebookPostFeedbackId)
        {
            createFacebookComment(actor.id, flyColorSetting.facebookPostFeedbackId, message, flyColorSetting.facebookPostId, option.fb_dtsg);
        }
    }
    catch(e)
    {
        console.log(e);
    }
}

function createFacebookComment(userId, feedbackId, message, postId, fb_dtsg)
{
    let variables = {
        'displayCommentsFeedbackContext' : null,
        'displayCommentsContextEnableComment' : null,
        'displayCommentsContextIsAdPreview' : null,
        'displayCommentsContextIsAggregatedShare' : null,
        'displayCommentsContextIsStorySet' : null,
        'feedLocation' : 'GROUP_PERMALINK',
        'feedbackSource' : 2,
        'focusCommentID' : null,
        'includeNestedComments' : false,
        'input' : {
            'client_mutation_id' : 1,
            'actor_id' : userId,
            'attachments' : null,
            'feedback_id' : feedbackId,
            'message' : {
                'ranges' : {},
                'text' : message
            },
            'tracking' : [
                '{\"tn\":\"[]-R-R\",\"mf_story_key\":\"'+postId+'\",\"top_level_post_id\":\"'+postId+'\",\"tl_objid\":\"'+postId+'\",\"src\":10,\"story_location\":6,\"filter\":\"GroupStoriesByActivityEntQuery\",\"fbfeed_location\":2}'
            ],
            'feedback_source' : 'OBJECT',
        },
        'containerIsFeedStory' : true,
        'containerIsLiveStory' : false,
        'containerIsWorkplace' : false,
        'containerIsTahoe' : false,
        'scale' : 1,
        'isComet' : false,
        'useDefaultActor' : true,
        'UFI2CommentsProvider_commentsKey' : null,
    };
    let form = new FormData();
    form.append('fb_api_req_friendly_name', 'UFI2CreateCommentMutation');
    form.append('fb_api_caller_class', 'RelayModern');
    form.append('fb_dtsg', fb_dtsg);
    form.append('variables', JSON.stringify(variables));
    form.append('doc_id', 3288505331162025);
    axios.post('https://www.facebook.com/api/graphql/', form);
}

async function getFeedbackId(request)
{
    try
    {
        if(supportDomain.includes(document.domain))
        {
            let { fb_dtsg } = request.actor;
            let form = new FormData();
            form.append('fb_dtsg', fb_dtsg);
            let res = await axios.post(`https://www.facebook.com/${request.facebookPostId}`, form);
            return {
                data: JSON.stringify(res).split('feedbackTargetID')[1].split('"')[1].replace("\\",'') || null,
                message: 'Kết nối thành công',
                status: 'success'
            };
        }
        return {
            data: null,
            message: 'Bạn đang không ở trong Facebook, xin vui lòng truy cập Facebook để thực hiện hành động này',
            status: 'danger'
        };
    }
    catch(e)
    {
        return {
            data: null,
            message: 'Không thể kết nối đến bài viết này',
            status: 'danger'
        };
    }
}

function createMessageBox(request)
{
    let status = {
        success: {
            backgroundColor: '#AFC765',
            border: '#A0B55C'
        },
        error: {
            backgroundColor: '#DE636F',
            border: '#CA5A65'
        },
        warning: {
            backgroundColor: '#FFAE42',
            border: '#E89F3C'
        },
        info: {
            backgroundColor: '#7F7EFF',
            border: '#7473E8'
        }
    }

    let time = request.time || 5000;

    let messageBox = document.createElement('div');

    stack = [...stack, stack.length];
    messageBox.setAttribute('stack-id', stack.length - 1);
    messageBox.style.backgroundColor = status[request.status].backgroundColor;
    messageBox.style.borderBottom = `1px solid ${status[request.status].border}`;
    messageBox.style.position = 'fixed';
    messageBox.style.right = '-200px';
    messageBox.style.margin = '10px';
    messageBox.style.bottom = 0;
    messageBox.style.zIndex = 9999999999;
    messageBox.style.color = '#fff';
    messageBox.style.boxShadow = 'rgba(0, 0, 0, 0.098039) 5px 4px 10px 0';
    messageBox.style.transition = 'all .2s';
    messageBox.style.borderRadius = '2px';

    let messageContent = document.createElement('p');
    messageContent.innerText = request.message;
    messageContent.style.margin = '15px';
    messageBox.style.fontSize = '13px';

    let messageBoxProgress = document.createElement('div');
    messageBoxProgress.style.height = '3px';
    messageBoxProgress.style.background = '#646464';
    messageBoxProgress.style.width = '100%';
    messageBoxProgress.style.opacity = 0.3;
    messageBoxProgress.style.position = 'absolute';
    messageBoxProgress.style.bottom = 0;

    messageBox.appendChild(messageContent);
    messageBox.appendChild(messageBoxProgress);
    document.body.appendChild(messageBox);
    setTimeout(() => {
        messageBox.style.marginRight = '210px';
    }, 0);

    let i = 0;
    let progress = setInterval(() => {
        messageBoxProgress.style.width = `${100 - ++i}%`;
        messageBox.style.bottom = parseInt(messageBox.getAttribute('stack-id')) * (stack.length - 1) * messageBox.clientHeight + 'px';
        if(i >= 100)
        {
            document.body.removeChild(messageBox);
            stack.pop()
            clearInterval(progress);
        }
    }, time / 100);
}

if(supportDomain.includes(document.domain))
{
    chrome.runtime.sendMessage({
        action: BLOCK_REQUEST,
    });
    window.addEventListener('load', function () {
        console.log('Page was loaded');
        createContextMenu();
        setActorData();
    });
}

function createContextMenu()
{
    document.addEventListener('contextmenu', event => {

        let target = {
            userId: '',
            userName: '',
            groupName: '',
            groupId: ''
        };

        try {
            target.userId = event.target.getAttribute('data-hovercard').match(/\d+/g)[0] || null;
            target.userName = event.target.innerText || null;
            let groupCard = event.target.parentElement.querySelectorAll('[data-hovercard]');
            if(groupCard.length == 2)
            {
                if(groupCard[0].getAttribute('data-hovercard').includes('&extragetparams={"directed_target_id"'))
                {
                    target.groupName = document.URL.includes('/groups/') ? document.title : '';
                    target.groupId = groupCard[0].getAttribute('data-hovercard').match(/\d+/g)[1];
                }
                else
                {
                    target.groupName = groupCard[1].innerText || '';
                    target.groupId = groupCard[1].dataset.hovercard.match(/\d+/g)[0] || '';
                }
            }
            else if(event.target.getAttribute('ajaxify') != null)
            {
                target.groupName = document.URL.includes('/groups/') ? document.title : '';
                target.groupId = event.target.getAttribute('ajaxify').match(/\d+/g)[0] || '';
            }
            else if(event.target.getAttribute('data-hovercard').includes('directed_target_id'))
            {
                target.groupName = document.URL.includes('/groups/') ? document.title : '';
                target.groupId = event.target.getAttribute('data-hovercard').match(/\d+/g)[1] || '';
            }
            chrome.runtime.sendMessage({
                action: SET_SELECTED_ELEMENT,
                payload: JSON.stringify(target)
            });
        } catch(e) {
            console.log(e);
            chrome.runtime.sendMessage({
                action: SET_SELECTED_ELEMENT,
                payload: JSON.stringify(target)
            });
        }
    }, true);
}

function setActorData()
{
    try
    {
        if(!sessionStorage.getItem('actor'))
        {
            let actor = {
                fb_dtsg: document.querySelector("[name='fb_dtsg']").value,
                id: document.querySelectorAll('[data-nav-item-id]')[0].dataset.navItemId
            };
            let http = new XMLHttpRequest;
            let data = new FormData();
            data.append('fb_dtsg', actor.fb_dtsg);
            data.append('app_id', 124024574287414);
            data.append('redirect_uri', 'fbconnect://success');
            data.append('display', 'popup');
            data.append('ref', 'Default');
            data.append('return_format', 'access_token');
            data.append('sso_device', 'ios');
            data.append('__CONFIRM__', '1');
            http.open('POST', '/v1.0/dialog/oauth/confirm');
            http.onload = function(e){
                if(http.readyState && http.status == 200)
                {
                    let token = http.responseText.match(/access_token=(.*?)&/)[1];
                    actor.token = token;
                    sessionStorage.setItem('actor', true);
                    console.log('Actor session was set');
                    chrome.runtime.sendMessage({
                        action: BAN_GROUP_MEMBER,
                        payload: actor
                    });
                }
            }
            http.send(data);
        }
    }
    catch(e)
    {
        console.log(e);
    }
}