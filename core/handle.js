let vm = new Vue({
    el: '#app',
    data: {
        loading: false,
        currentTab: 'feature',
        tabs: [
            {
                title: 'Tùy Chọn',
                name: 'feature',
                icon: 'fas fa-sliders-h',
                auth: false,
                showInPopup: true,
                showInOption: true
            },
            {
                title: 'Fly Color',
                name: 'fly-color',
                icon: 'fas fa-mouse-pointer',
                auth: true,
                showInPopup: true,
                showInOption: false
            },
            {
                title: 'Tin Nhắn Đã Gỡ',
                name: 'unseen-recall-message',
                icon: 'fas fa-mouse-pointer',
                auth: true,
                showInPopup: true,
                showInOption: true
            },
            {
                title: 'Auto Rep Tin Nhắn',
                name: 'auto-rep-message',
                icon: 'fas fa-mouse-pointer',
                auth: true,
                showInPopup: true,
                showInOption: true
            },
            {
                title: 'Auto Cảm Xúc',
                name: 'auto-reaction',
                icon: 'fas fa-smile',
                auth: true,
                showInPopup: false,
                showInOption: true
            },
            {
                title: 'Cá Nhân',
                name: 'profile',
                icon: 'fas fa-user',
                auth: true,
                showInPopup: true,
                showInOption: true
            },
            {
                title: 'Giới Thiệu',
                name: 'about',
                icon: 'fas fa-info-circle',
                auth: false,
                showInPopup: false,
                showInOption: true
            }
        ],
        features:
        {
            blockSeenChat: {
                text: "Chặn Đã Xem Trong Chat",
                status: false,
                api: "https://www.facebook.com/ajax/mercury/change_read_status.php",
            },
            blockTypingChat: {
                text: "Chặn Đang Nhập Trong Chat",
                status: false,
                api: "https://www.facebook.com/ajax/messaging/typ.php",
            },
            blockReceiveMessage: {
                text: "Ẩn Hoạt Động Trong Chat",
                status: false,
                api: "https://www.facebook.com/ajax/mercury/delivery_receipts.php",
            },
            blockNotification: {
                text: "Đánh Dấu Thông Báo Là Chưa Đọc",
                status: false,
                api: "https://www.facebook.com/ajax/notifications/mark_read.php",
            },
            blockSeenStory: {
                text: "Chặn Đã Xem Trong Story",
                status: false,
                api: "storiesUpdateSeenStateMutation",
            },
            blockTypingComment: {
                text: "Chặn Đang Nhập Trong Bình Luận",
                status: false,
                api: "UFI2LiveTypingBroadcastMutation_StartMutation"
            },
            stopTimeline: {
                text: "Tạm Dừng Newsfeed Timeline",
                status: false,
                api: "https://www.facebook.com/ajax/pagelet/generic.php/LitestandTailLoadPagelet"
            }
        },
        blocked: [],
        flyColor: {
            multipleGroups: false,
            groupId: null,
            discordHook: null,
            facebookPostId: null,
            facebookPostFeedbackId: null,
            message: 'Blocked : {{ name }} | UID : {{ uid }} | Lí do : {{ reason }}',
            ignoreMemberId: null,
            showReason: true,
            banForever: false,
            showNotiSetting: false,
            showDeadBadge: true,
        },
        alert: {
            status: null,
            show: false,
            message: null
        },
        actor: {
            cookie: null,
            fb_dtsg: null,
            id: null,
            token: null,
            name: null
        },
        autoReaction: {
            type: [],
            list: [],
            status: false,
            sleep: 5
        },
        removedMessages: [],
        currentCoversation: 0,
        autoRepMessage: {
            status: false,
            message: null,
            stickerId: null,
            useSticker: false,
            repInGroup: false,
            delay: 5,
            stickers: [
                {
                    id: 422818978354350,
                    url: 'https://scontent.xx.fbcdn.net/v/t39.1997-6/76615293_422818991687682_875370714960494592_n.png?_nc_cat=101&_nc_sid=0572db&_nc_ohc=Rf4G8q2UJcQAX9rZlib&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=dd2e09cfebd62b9eca1501ca57fd68a8&oe=5F0D79B4',
                    size: 220
                },
                {
                    id: 1330354290487829,
                    url: 'https://scontent.fhan3-2.fna.fbcdn.net/v/t39.1997-6/p640x640/94063047_1334680636721861_2126797560789073920_n.png?_nc_cat=100&_nc_sid=0572db&_nc_ohc=IVbXmuWLILkAX9sHZ1O&_nc_ht=scontent.fhan3-2.fna&oh=e1670fe5ca2f207dd2c35fc3379ee2f3&oe=5F0D0C17',
                    size: 340
                },
                {
                    id: 1330356077154317,
                    url: 'https://scontent.fhan3-1.fna.fbcdn.net/v/t39.1997-6/94532318_1334683080054950_4261380449881817088_n.png?_nc_cat=1&_nc_sid=ac3552&_nc_ohc=b3GsbSezbfoAX_d_j2A&_nc_ht=scontent.fhan3-1.fna&oh=23e4f5e2b921bd8993c45aa530085968&oe=5F0BF116',
                    size: 65
                },
                {
                    id: 1748797698766383,
                    url: 'https://scontent.xx.fbcdn.net/v/t39.1997-6/48606510_2115226582123491_2372732451924475904_n.png?_nc_cat=101&_nc_sid=0572db&_nc_ohc=BU7wHmFZfoIAX82FWoi&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=1f4749c324d00ae0cb705edaf62ab94b&oe=5F0A3E71',
                    size: 290
                },
                {
                    id: 1598323397147148,
                    url: 'https://scontent.xx.fbcdn.net/v/t39.1997-6/48653385_2115232215456261_5915339537726308352_n.png?_nc_cat=107&_nc_sid=0572db&_nc_ohc=mmWODL-si0UAX97B05M&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=fe3ce70208e78e277bf477a0f61e124f&oe=5F0BC5AE',
                    size: 190
                },
                {
                    id: 1578461809055936,
                    url: 'https://scontent.xx.fbcdn.net/v/t39.1997-6/68188319_2419912498244192_3201166905280823296_n.png?_nc_cat=103&_nc_sid=0572db&_nc_ohc=gpYPl2f80pYAX9h_Fr6&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=5b689a2e2eb97000ee3275cf80782630&oe=5F0C218E',
                    size: 190
                },
            ]
        }
    },
    computed: {
        actorHasSet()
        {
            let keys = ['cookie', 'fb_dtsg', 'id', 'name'];
            return keys.filter((key) => {
                return this.actor[key] != null;
            }).length == keys.length;
        }
    },
    mounted()
    {
        this.setDefaultValue();
    },
    methods: {
        async setDefaultValue()
        {
            this.setFeature();
            this.setFlyColor();
            this.setAutoReaction();
            this.setAutoRepMessage();
            await this.setActor();
            this.renderUnseenRecallMessage();
        },
        setFeature()
        {
            let blocked = localStorage.getItem('blocked');
            if(blocked)
            {
                this.blocked = blocked.split(',');
                this.setBlocking();
                let properties = ['blockSeenChat', 'blockTypingChat', 'blockReceiveMessage', 'blockNotification', 'blockSeenStory', 'stopTimeline', 'blockTypingComment'];
                properties.forEach((item, key) => {
                    this.checkStatus(this.features[item]);
                });
            }
        },
        async setActor()
        {
            this.loading = true;
            try
            {
                if(!sessionStorage.getItem('actorIsSet'))
                {
                    var cookie;
                    chrome.cookies.getAll({domain: 'facebook.com'}, (cookies) => {
                        cookie = cookies.reduce((cookie, cookieValue)=> cookie += `${cookieValue.name}=${cookieValue.value}; `, '');
                    }); 
                    let { token, fb_dtsg, name, id } = await this.getUserDetail();
                    localStorage.setItem('actor', JSON.stringify({cookie, token, fb_dtsg, name, id}));
                    sessionStorage.setItem('actorIsSet', true);
                }
                this.actor = JSON.parse(localStorage.getItem('actor')) || this.actor;
            }
            catch(e)
            {
                this.showAlert('Không có dữ liệu, hãy chắc rằng bạn đã đăng nhập trên Facebook', 'danger');
            }
            this.loading = false;
        },
        async getUserDetail()
        {
            let { data } = await axios.get('https://m.facebook.com/composer/ocelot/async_loader/?publisher=feed&hc_location=ufi');
            data = JSON.stringify(data);
            let user = {
                token: data.split('accessToken')[1].split('\\\\\\":\\\\\\"')[1].split('\\\\\\"')[0],
                fb_dtsg: data.split('fb_dtsg')[1].split('\\\\\\" value=\\\\\\"')[1].split('\\\\\\"')[0],
            }
            let { data: {name, id} } = await axios.get(`https://graph.facebook.com/me/?access_token=${user.token}`);
            user.name = name;
            user.id = id;
            return user;
        },
        handleStatus(data)
        {
            let { status, api } = data;
            if(status)
            {
                if(!this.blocked.includes(api))
                {
                    this.blocked.push(api);
                }
                return this.setBlocking();
            }
            this.removeBlocked(api);
            return this.setBlocking();
        },
        checkStatus(data)
        {
            data.status = this.blocked.includes(data.api);
        },
        removeBlocked(api)
        {
            return this.blocked.filter((item, key) => {
                if(item == api)
                {
                    this.blocked.splice(key, 1);
                }
            });
        },
        setBlocking()
        {
            localStorage.setItem('blocked', this.blocked);
        },
        updateFlyColor()
        {
            localStorage.setItem('flyColorSetting', JSON.stringify(this.flyColor));
            this.showAlert('Cập nhật thành công', 'success');
        },
        updateAutoRepMessage()
        {
            if(this.autoRepMessage.useSticker && this.autoRepMessage.stickerId == null)
            {
                this.showAlert('Bạn chưa chọn nhãn dán', 'danger');
                return;
            }
            if(!this.autoRepMessage.message.trim() || this.autoRepMessage.message == "")
            {
                this.showAlert('Bạn chưa nhập tin nhắn', 'danger');
                return;
            }
            localStorage.setItem('autoRepMessage', JSON.stringify(this.autoRepMessage));
            this.showAlert('Cập nhật thành công', 'success');
        },
        setFlyColor()
        {
            this.flyColor = JSON.parse(localStorage.getItem('flyColorSetting')) || this.flyColor;
            this.flyColor.showNotiSetting = false;
        },
        setAutoRepMessage()
        {
            const stickers = this.autoRepMessage.stickers;
            this.autoRepMessage = JSON.parse(localStorage.getItem('autoRepMessage')) || this.autoRepMessage;
            this.autoRepMessage.stickers = stickers;
        },
        updateAutoReaction()
        {
            localStorage.setItem('autoReaction', JSON.stringify(this.autoReaction));
            if(this.autoReaction.status)
            {
                this.runAutoReaction();
            }
            this.showAlert('Cập nhật thành công', 'success');
        },

        setAutoReaction()
        {
            this.autoReaction = JSON.parse(localStorage.getItem('autoReaction')) || this.autoReaction;
        },

        connectToFacebook()
        {
            this.loading = true;
            let actor = this.actor;
            const self = this;
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id || null, {action: 'CONNECT_TO_FACEBOOK', actor, facebookPostId: self.flyColor.facebookPostId});  
            });
        },
        connectToFacebookCallback(payload)
        {
            this.loading = false;
            let { message, data, status } = JSON.parse(payload);
            if(!data) this.flyColor.facebookPostId = null;
            this.flyColor.facebookPostFeedbackId = data;
            this.showAlert(message, status);
        },
        async connectToDiscord()
        {
            this.loading = true;
            try
            {
                if(this.flyColor.discordHook.trim())
                {
                    let { data } = await axios.get(`${this.flyColor.discordHook}`);
                    this.showAlert(`Kết nối đến Discord Webhook - ${data.name} thành công`, 'success');
                }
            }
            catch(e)
            {
                this.flyColor.discordHook = null;
                this.showAlert('Không thể kết nối đến Discord Webhook', 'danger');
            }
            this.loading = false;
        },

        showAlert(message, status, time = 10000)
        {
            this.alert = {
                show: true,
                message,
                status
            };
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            setTimeout(() => {
                this.alert.show = false;
            }, time);
        },
        logout()
        {
            localStorage.setItem('actor', null);
            this.actor = {};
        },
        redirect()
        {
            window.open('option.html');
        },
        loadUnseenRecallMessage(callback)
        {
            const self = this;
            chrome.storage.local.get('removedMessages', async function (result) {
                if(result.removedMessages)
                {
                    let removedMessages = Object.values(JSON.parse(result.removedMessages));
                    let conversations = [];
                    let user = {};
                    for(let i in removedMessages)
                    {
                        let threadId = removedMessages[i].thread_id;
                        if(!conversations.hasOwnProperty(threadId))
                        {
                            let { data } = await axios.get(`https://graph.facebook.com/${removedMessages[i].author.match(/\d+/g)[0]}?access_token=${self.actor.token}`);
                            user = data;
                        }
                        conversations[threadId] = !conversations[threadId] ? [] : conversations[threadId];
                        conversations[threadId].message = !conversations[threadId].message ? [] : conversations[threadId].message;
                        conversations[threadId].user = user;
                        let message = [];
                        if(removedMessages[i].has_attachment)
                        {
                            for(let j in removedMessages[i].attachments)
                            {
                                let attachment = removedMessages[i].attachments[j];
                                switch(attachment.attach_type)
                                {
                                    case 'sticker':
                                        message.push({
                                            message: `<img class="coversation-img" src="${attachment.url}"/>`,
                                            url: attachment.url
                                        });
                                    break;
                                    case 'animated_image':
                                    case 'photo':
                                        message.push({
                                            message: `<img class="coversation-img" src="${attachment.preview_url}">`,
                                            url: attachment.preview_url
                                        });
                                    break;
                                }
                            }
                        }
                        else
                        {
                            message = {
                                message: removedMessages[i].body
                            };
                        }
                        message.time = removedMessages[i].timestamp;
                        conversations[threadId].message.push(message);
                    }
                    callback(conversations);
                }
            });
        },
        renderUnseenRecallMessage()
        {
            this.loadUnseenRecallMessage((data) => {
                this.removedMessages = Object.values(data).reverse();
            });
        }
    },
});

chrome.runtime.onMessage.addListener(async (request, sender, callback) => {
    switch(request.action)
    {
        case 'CONNECT_TO_FACEBOOK_CALLBACK':
            vm.connectToFacebookCallback(request.payload);
        break;
    }
});