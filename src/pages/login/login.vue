<template>
  <div class="login-content">
    <div class="top">
      <img class="top-img" src="../../static/login/a.png" alt="" />
      <img class="logo-img" src="../../static/login/e.png" alt="" />
      <div class="hello">HELLO!</div>
      <div class="welcome-login">欢迎登录</div>
    </div>
    <div class="login-area">
      <div class="login-box">
        <div class="login-title">账号</div>
        <input type="text" v-model="loginData.loginName" class="login-input" />
      </div>
      <div style="height: 50rpx"></div>
      <div class="login-box">
        <div class="login-title">密码</div>
        <input
          type="password"
          v-model="loginData.password"
          class="login-input"
        />
      </div>
      <img class="account-img" src="../../static/login/f.png" alt="" />
      <img class="password-img-left" src="../../static/login/b.png" alt="" />
      <!-- <img class="password-img-right" src="../../static/login/c.png" alt="" /> -->
      <div class="remember-password">
        <div class="remember-checkbox" @click="toggleCheck">
          <img
            class="checkbox-img"
            v-if="rememberPassword"
            src="../../static/login/d.png"
            alt="Checked"
          />
          <img
            class="uncheckbox-img"
            v-if="!rememberPassword"
            src="../../static/login/g.png"
            alt="Checked"
          />
        </div>
        <span>记住密码</span>
      </div>
    </div>
    <div class="login-btn-area">
      <button
        class="login-btn"
        :class="{ disabled: loading }"
        @click="handleLogin"
        :disabled="loading"
      >
        <span v-if="loading">正在登录...</span>
        <span v-else>登录</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { postLoginAPI } from '@/services/login'
import { useRememberPasswordStore } from '@/stores/modules/rememberPassword'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

// 分享给好友
onShareAppMessage(() => {
  return {
    title: '动善时登录页面', // 分享标题
    path: '/pages/login/login', // 分享路径
  }
})

// 分享到朋友圈
onShareTimeline(() => {
  return {
    title: '动善时登录页面', // 分享标题
    query: '', // 可选：分享携带的参数
  }
})

onMounted(() => {
  // 获取记住密码状态
  const res = rememberPasswordStore.getRememberPasswordStaus()

  if (res.rememberPasswordStatus) {
    rememberPassword.value = res?.rememberPasswordStatus
    loginData.value.loginName = res?.username
    loginData.value.password = res?.password
  }
})

const rememberPasswordStore = useRememberPasswordStore()
const rememberPassword = ref(false) // 记住密码状态
const loginData = ref({
  type: '',
  loginName: '',
  password: '',
})
const loading = ref(false)

// 切换勾选状态
const toggleCheck = () => {
  rememberPassword.value = !rememberPassword.value
}

const handleLogin = async () => {
  console.log('loginData.value', loginData.value)
  //检查用户名和密码是否填写
  if (!loginData.value.loginName || !loginData.value.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  // 如果选择记住密码，则保存密码信息
  if (rememberPassword.value) {
    rememberPasswordStore.setPassword({
      username: loginData.value?.loginName,
      password: loginData.value?.password,
      rememberPasswordStatus: rememberPassword?.value,
    })
  } else {
    // 如果不记住密码，清理之前保存的密码
    rememberPasswordStore.clearPassword()
  }

  if (loading.value) return
  loading.value = true // 开始加载，按钮变灰
  try {
    const res: any = await postLoginAPI(loginData.value)
    if (res?.code === 200) {
      console.log('登陆成功')
      uni.showToast({ title: '登录成功', icon: 'success' })
      uni.switchTab({ url: '/pages/index/index' })
    } else {
      uni.showToast({ title: res?.msg, icon: 'none' })
    }
  } catch (error) {
    console.log('error', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss">
.top {
  position: relative;
  .top-img {
    width: 750rpx;
    height: 575rpx;
  }
  .logo-img {
    position: absolute;
    top: 286.5rpx;
    left: 52rpx;
    width: 96rpx;
    height: 96rpx;
  }
  .hello {
    position: absolute;
    top: 402rpx;
    left: 52rpx;

    width: 220rpx;
    height: 63rpx;
    font-family: Alibaba PuHuiTi, Alibaba PuHuiTi;
    font-weight: 500;
    font-size: 46rpx;
    color: #000000;
    line-height: 54rpx;
  }
  .welcome-login {
    position: absolute;
    top: 465.3rpx;
    left: 52rpx;
    width: 220rpx;
    height: 63rpx;
    font-family: Alibaba PuHuiTi, Alibaba PuHuiTi;
    font-weight: 500;
    font-size: 46rpx;
    color: #000000;
    line-height: 54rpx;
  }
}
.login-area {
  margin-left: 52rpx;
  position: relative;
  .login-box {
    .login-title {
      width: 120rpx;
      height: 42rpx;
      font-family: Alibaba PuHuiTi, Alibaba PuHuiTi;
      font-weight: 400;
      font-size: 31rpx;
      color: #222222;
      line-height: 36rpx;
      margin-bottom: 15.3rpx;
    }
    .login-input {
      width: 644rpx;
      height: 92rpx;
      background: #f6f6f8;
      border-radius: 8rpx 8rpx 8rpx 8rpx;
      padding-left: 73rpx;
    }
  }
  .account-img {
    position: absolute;
    top: 81rpx;
    left: 19.2rpx;
    width: 38.5rpx;
    height: 38.5rpx;
  }
  .password-img-left {
    position: absolute;
    top: 275rpx;
    left: 19.2rpx;
    width: 38.5rpx;
    height: 38.5rpx;
  }
  // .password-img-right {
  //   position: absolute;
  //   top: 275rpx;
  //   right: 80rpx;
  //   width: 38.5rpx;
  //   height: 38.5rpx;
  // }
  .remember-password {
    display: flex;
    align-items: center;
    margin-top: 34.6rpx;
  }

  .remember-checkbox {
    margin-right: 15.4px;
    width: 34.6rpx;
    height: 34.6rpx;
    position: relative;
    cursor: pointer;
  }
  .checkbox-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 34.6rpx;
    height: 34.6rpx;
  }
  .uncheckbox-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 34.6rpx;
    height: 34.6rpx;
  }
}
.login-btn-area {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 48rpx;
  .login-btn {
    width: 644rpx;
    height: 92rpx;
    background: #163172;
    border-radius: 8rpx;
    color: #ffffff;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .login-btn.disabled {
    background-color: #424f71; /* 变灰的颜色 */
    cursor: not-allowed; /* 显示为不可点击状态 */
    color: #ffffff;
  }
}
</style>
