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
        setDefaultValue()
        {
            this.setFeature();
            this.setFlyColor();
            this.setAutoReaction();
            this.setActor();
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
                this.getUserDetail();
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
            return {
                token: data.split('accessToken')[1].split('\\\\\\":\\\\\\"')[1].split('\\\\\\"')[0],
                fb_dtsg: data.split('fb_dtsg')[1].split('\\\\\\" value=\\\\\\"')[1].split('\\\\\\"')[0],
                name: 1,
                id: 1
            };
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
        setFlyColor()
        {
            this.flyColor = JSON.parse(localStorage.getItem('flyColorSetting')) || this.flyColor;
            this.flyColor.showNotiSetting = false;
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