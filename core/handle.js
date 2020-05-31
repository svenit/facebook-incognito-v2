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
                auth: false
            },
            {
                title: 'Fly Color',
                name: 'fly-color',
                icon: 'fas fa-mouse-pointer',
                auth: true
            },
            {
                title: 'Auto Cảm Xúc',
                name: 'auto-reaction',
                icon: 'fas fa-smile',
                auth: true
            },
            {
                title: 'Cá Nhân',
                name: 'profile',
                icon: 'fas fa-user',
                auth: true
            },
            {
                title: 'Đăng Xuất',
                name: 'logout',
                icon: 'fas fa-sign-out-alt',
                auth: true
            },
            {
                title: 'Giới Thiệu',
                name: 'about',
                icon: 'fas fa-info-circle',
                auth: false
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
            showConfigNoti: false
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
            let keys = ['cookie', 'fb_dtsg', 'id', 'token', 'name'];
            return keys.filter((key) => {
                return this.actor[key] != null;
            }).length == keys.length;
        }
    },
    methods: {
        setDefaultValue()
        {
            this.setFeature();
            this.setFlyColor();
            this.setActor();
            this.setAutoReaction();
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
            this.flyColor.showConfigNoti = false;
        },

        async getPostFromFeed()
        {
            try
            {
                let { data } = await axios.get(`https://graph.facebook.com/me/home?access_token=${this.actor.token}`);
                return data.data;
            }
            catch(e)
            {
                console.log(e);
            }
        },

        updateAutoReaction()
        {
            localStorage.setItem('autoReaction', JSON.stringify(this.autoReaction));
            this.showAlert('Cập nhật thành công', 'success');
        },

        setAutoReaction()
        {
            this.autoReaction = JSON.parse(localStorage.getItem('autoReaction')) || this.autoReaction;
        },

        connectToFacebook()
        {
            this.loading = true;
            let actor = JSON.parse(localStorage.getItem('actor'));
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

        setActor()
        {
            this.actor = JSON.parse(localStorage.getItem('actor')) || this.actor;
        },

        logout()
        {
            localStorage.setItem('actor', null);
            this.actor = {};
        }
    },
});

vm.setDefaultValue();

chrome.runtime.onMessage.addListener(async (request, sender, callback) => {
    switch(request.action)
    {
        case 'CONNECT_TO_FACEBOOK_CALLBACK':
            vm.connectToFacebookCallback(request.payload);
        break;
    }
});