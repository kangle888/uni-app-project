<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'

onLaunch((options) => {
  console.log('App Launch', options)

  // #ifdef MP-WEIXIN
  // 处理小程序码扫码进入
  // 通过小程序码进入时，scene 参数会传递邀请码
  if (options?.scene) {
    const scene = options.scene
    // 1047: 扫描小程序码
    // 1048: 长按图片识别小程序码
    // 1049: 手机相册选取小程序码
    if (scene === 1047 || scene === 1048 || scene === 1049) {
      // scene 参数就是邀请码（在生成小程序码时，scene 参数设置为邀请码）
      const sceneValue = options.query?.scene
      if (sceneValue) {
        const inviteCode = String(sceneValue).trim().toUpperCase()
        if (inviteCode.length === 8) {
          // 保存邀请码，稍后处理
          const memberStore = useMemberStore()
          memberStore.setPendingInviteCode(inviteCode)

          // 检查登录状态
          if (memberStore.profile?.token) {
            // 已登录，直接跳转到首页处理加入
            setTimeout(() => {
              uni.switchTab({
                url: '/pages/index/index',
                fail: () => {
                  uni.navigateTo({
                    url: '/pages/index/index',
                  })
                },
              })
            }, 300)
          } else {
            // 未登录，跳转到登录页
            setTimeout(() => {
              uni.navigateTo({
                url: '/pages/login/login',
              })
            }, 300)
          }
        }
      }
    }
  }
  // #endif
})
onShow(() => {
  console.log('App Show')
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
// 字体图标
@import '@/styles/fonts.scss';

view,
navigator,
input,
scroll-view {
  box-sizing: border-box;
}

button::after {
  border: none;
}

swiper,
scroll-view {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

image {
  width: 100%;
  height: 100%;
  vertical-align: middle;
}

// 两行省略
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
