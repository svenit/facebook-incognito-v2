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

async function broadcastMessage(data, isGroup = false)
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
    form.append('signature_id', '52a4388e');
    form.append('source', 'source:chat:web');
    if(isGroup)
    {
        form.append('thread_fbid', data.thread_fbid);
        form.append('__user', data.my_id);
        form.append('tags[0]', 'web:trigger:fb_header_dock:loaded_from_browser_cookie');
    }
    else
    {
        form.append('other_user_fbid', data.other_user_fbid);
        form.append('specific_to_list[0]', `fbid:${data.other_user_fbid}`);
        form.append('specific_to_list[1]', `fbid:${data.my_id}`);
        form.append('tags[0]', 'web:trigger:fb_header_dock:jewel_thread');
    }
    form.append('timestamp', new Date().getTime());
    form.append('ui_push_phase', 'C3');
    await axios.post(`https://www.facebook.com/messaging/send/`, form);
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));;
