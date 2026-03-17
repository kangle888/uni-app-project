<template>
  <view class="login-container">
    <view class="login-header">
      <view class="logo-box">
        <text class="logo-text">Campus</text>
      </view>
      <text class="title">校园轻活动</text>
      <text class="subtitle">发现精彩校园生活</text>
    </view>

    <view class="login-box">
      <!-- Tabs -->
      <view class="tabs">
        <view class="tab" :class="{ active: currentTab === 'login' }" @tap="currentTab = 'login'">
          <text>登录</text>
          <view class="line" v-if="currentTab === 'login'"></view>
        </view>
        <view
          class="tab"
          :class="{ active: currentTab === 'register' }"
          @tap="currentTab = 'register'"
        >
          <text>注册</text>
          <view class="line" v-if="currentTab === 'register'"></view>
        </view>
      </view>

      <!-- Form -->
      <view class="form-content">
        <view class="input-group">
          <text class="icon icon-user"></text>
          <input
            type="text"
            v-model="formData.username"
            placeholder="请输入用户名"
            class="input-item"
          />
        </view>

        <view class="input-group">
          <text class="icon icon-lock">🔒</text>
          <input
            type="text"
            :password="!showPassword"
            v-model="formData.password"
            placeholder="请输入密码"
            class="input-item"
          />
          <text class="icon-eye" @tap="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '🙈' }}
          </text>
        </view>

        <!-- Action Button -->
        <button class="action-btn" :loading="loading" @tap="handleSubmit">
          {{ currentTab === 'login' ? '登录' : '注册' }}
        </button>

        <!-- Wechat Login Divider -->
        <!-- <view class="divider" v-if="currentTab === 'login'">
          <text class="line"></text>
          <text class="text">其他登录方式</text>
          <text class="line"></text>
        </view> -->

        <!-- Wechat Login Button -->
        <!-- <button
          v-if="currentTab === 'login'"
          class="wechat-btn"
          open-type="getUserInfo"
          @getuserinfo="handleWechatLogin"
        >
          <text class="wechat-icon">🟢</text>
          <text>微信快捷登录</text>
        </button> -->
      </view>

      <view class="tips">
        <text>登录即表示同意《用户协议》和《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { userLogin, userRegister, getCurrentUserInfo } from '@/services/login'
import { useMemberStore } from '@/stores'

const memberStore = useMemberStore()
const loading = ref(false)
const currentTab = ref('login')
const showPassword = ref(false)

const formData = reactive({
  username: '',
  password: '',
})

const validateForm = () => {
  if (!formData.username) {
    uni.showToast({ title: '请输入用户名', icon: 'none' })
    return false
  }
  if (!formData.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return false
  }
  if (formData.password.length < 6) {
    uni.showToast({ title: '密码至少6位', icon: 'none' })
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    let res: any
    if (currentTab.value === 'login') {
      // 1. 发起登录请求获取 Token
      res = await userLogin(formData)
      const token = res.token || res.data?.token || res

      // 2. 先存入 Token，否则接下来的 requests (getCurrentUserInfo) 拿不到 Header 里的 Authorization 导致 401
      memberStore.setProfile({
        token: token,
        username: formData.username,
      })

      // 3. 携带 Token 获取当前登录人详细信息
      const resUserInfo = await getCurrentUserInfo()

      // 4. 将获取到的详细信息补全并再次存储 (提取 resUserInfo.data 中的实际字段)
      const userData = resUserInfo.data || {}
      memberStore.setProfile({
        ...memberStore.profile,
        nickname: userData.nickname || formData.username,
        avatar: userData.avatar || '',
        mobile: userData.mobile || '',
        email: userData.email || '',
        sex: userData.sex || '',
        collegeName: userData.collegeName || '',
        id: userData.id || '',
      })

      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } else {
      await userRegister(formData)
      uni.showToast({ title: '注册成功，请登录', icon: 'success' })
      setTimeout(() => {
        currentTab.value = 'login'
      }, 1500)
    }
  } catch (error: any) {
    console.error('Login/Register error', error)
    uni.showToast({ title: error.data.message || '操作失败，请重试', icon: 'error' })
  } finally {
    loading.value = false
  }
}

// 处理微信登录
const handleWechatLogin = async (e: any) => {
  console.log('获取用户信息事件:', e)
  if (e.detail.errMsg !== 'getUserInfo:ok') {
    uni.showToast({ title: '需要授权才能登录', icon: 'none' })
    return
  }

  try {
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject,
      })
    })
    console.log('微信登录凭证:', loginRes)
    if (!loginRes.code) {
      throw new Error('获取登录凭证失败')
    }
    uni.showLoading({ title: '登录中' })
    // const res = await wechatLogin({ code: loginRes.code })
    setTimeout(() => {
      uni.hideLoading()
      uni.showToast({ title: '登录成功' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
      }, 1000)
    }, 1000)
  } catch (error) {
    uni.showToast({ title: '微信登录失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Background decorations */
.login-container::before {
  content: '';
  position: absolute;
  top: -10%;
  right: -10%;
  width: 400rpx;
  height: 400rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  filter: blur(40rpx);
}

.login-container::after {
  content: '';
  position: absolute;
  bottom: 10%;
  left: -10%;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  filter: blur(30rpx);
}

.login-header {
  padding: 120rpx 60rpx 60rpx;
  position: relative;
  z-index: 1;

  .logo-box {
    width: 120rpx;
    height: 120rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);

    .logo-text {
      font-size: 36rpx;
      font-weight: 800;
      color: #fff;
      font-style: italic;
    }
  }

  .title {
    display: block;
    font-size: 56rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 16rpx;
    letter-spacing: 2rpx;
  }

  .subtitle {
    display: block;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 1rpx;
  }
}

.login-box {
  flex: 1;
  background: #ffffff;
  border-radius: 60rpx 60rpx 0 0;
  padding: 60rpx 50rpx;
  position: relative;
  z-index: 1;
  box-shadow: 0 -10rpx 30rpx rgba(0, 0, 0, 0.1);

  .tabs {
    display: flex;
    margin-bottom: 60rpx;

    .tab {
      margin-right: 60rpx;
      position: relative;
      padding-bottom: 16rpx;

      text {
        font-size: 32rpx;
        color: #999;
        font-weight: 500;
        transition: all 0.3s;
      }

      &.active {
        text {
          font-size: 40rpx;
          color: #333;
          font-weight: bold;
        }
      }

      .line {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        border-radius: 6rpx;
        background: #667eea;
      }
    }
  }

  .form-content {
    .input-group {
      display: flex;
      align-items: center;
      background: #f5f7fa;
      border-radius: 20rpx;
      padding: 0 30rpx;
      height: 100rpx;
      margin-bottom: 40rpx;
      border: 1px solid transparent;
      transition: all 0.3s;

      &:focus-within {
        border-color: #667eea;
        background: #fff;
        box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.1);
      }

      .icon {
        font-size: 36rpx;
        margin-right: 20rpx;
        color: #999;
      }

      .input-item {
        flex: 1;
        height: 100%;
        font-size: 30rpx;
        color: #333;
      }

      .icon-eye {
        font-size: 32rpx;
        padding: 10rpx;
        color: #999;
      }
    }

    .action-btn {
      width: 100%;
      height: 96rpx;
      background: linear-gradient(to right, #667eea, #764ba2);
      color: #ffffff;
      border-radius: 48rpx;
      font-size: 34rpx;
      font-weight: bold;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 60rpx;
      box-shadow: 0 10rpx 20rpx rgba(102, 126, 234, 0.3);
      transition: all 0.3s;

      &:active {
        transform: scale(0.98);
        box-shadow: 0 4rpx 10rpx rgba(102, 126, 234, 0.2);
      }
    }

    .divider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 50rpx 0;

      .line {
        flex: 1;
        height: 1px;
        background: #eee;
      }

      .text {
        padding: 0 30rpx;
        font-size: 24rpx;
        color: #999;
      }
    }

    .wechat-btn {
      width: 100%;
      height: 96rpx;
      background: #f5f7fa;
      color: #333;
      border-radius: 48rpx;
      font-size: 30rpx;
      font-weight: 500;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;

      .wechat-icon {
        margin-right: 12rpx;
        font-size: 36rpx;
      }

      &:active {
        background: #ebeef5;
      }
    }
  }

  .tips {
    position: absolute;
    bottom: 40rpx;
    left: 0;
    width: 100%;
    text-align: center;

    text {
      font-size: 24rpx;
      color: #999;
    }
  }
}
</style>
