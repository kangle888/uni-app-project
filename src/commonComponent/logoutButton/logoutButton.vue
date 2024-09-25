<template>
  <div class="logout" @click="handleLoginOut">
    <img class="login-out-img" src="../../static/images/quit.png" alt="" />
  </div>
</template>

<script setup lang="ts">
// import { useRememberPasswordStore } from '@/stores/modules/rememberPassword'

// const rememberPasswordStore = useRememberPasswordStore()

const handleLoginOut = () => {
  console.log('退出登录')
  // rememberPasswordStore.clearToken()
  uni.redirectTo({
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
  width: 125rpx;
  height: 53.8rpx;
}
</style>
