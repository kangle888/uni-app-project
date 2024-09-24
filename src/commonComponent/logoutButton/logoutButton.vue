<template>
  <div class="logout" @click="handleLoginOut">
    <img class="login-out-img" src="../../static/images/退出.svg" alt="" />
  </div>
</template>

<script setup lang="ts">
import { useRememberPasswordStore } from '@/stores/modules/rememberPassword'

const rememberPasswordStore = useRememberPasswordStore()

const handleLoginOut = () => {
  console.log('退出登录')
  rememberPasswordStore.clearToken()
  uni.navigateTo({
    url: '/pages/login/login',
  })
}
</script>

<style lang="scss">
.logout {
  position: fixed;
  right: 48rpx;
  bottom: 95rpx;
  z-index: 999;
}
.login-out-img {
  width: 100rpx;
  height: 100rpx;
}
</style>
