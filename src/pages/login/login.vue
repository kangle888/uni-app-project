<script setup lang="ts">
import { postLoginByWxPhone } from '@/services/auth'
import { useMemberStore } from '@/stores'

const memberStore = useMemberStore()

// 获取微信登录 code（小程序）
const getWxLoginCode = () =>
  new Promise<string>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success(res) {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('微信登录失败'))
        }
      },
      fail(err) {
        reject(err)
      },
    })
  })

// 点击「手机号一键登录」按钮后触发
const onGetPhoneNumber = async (event: any) => {
  // 用户可能拒绝授权
  if (!event.detail || event.detail.errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({
      title: '已取消授权',
      icon: 'none',
    })
    return
  }

  try {
    // 1. 获取微信登录 code
    const loginCode = await getWxLoginCode()

    // 2. 从事件中拿到手机号授权 code（新接口）
    // 如果你后端用的是 encryptedData/iv 老方案，这里改成传 encryptedData 和 iv
    const phoneCode = event.detail.code

    // 3. 调用后端登录接口，完成手机号登录
    const { result } = await postLoginByWxPhone({
      code: loginCode,
      phoneCode,
    })

    // 4. 把会员信息写入 Pinia，持久化到本地
    memberStore.setProfile(result)

    uni.showToast({
      title: '登录成功',
      icon: 'success',
    })

    // 5. 跳转到首页或上一个页面
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index',
      })
    }, 400)
  } catch (error) {
    console.error('登录失败', error)
    uni.showToast({
      title: '登录失败，请稍后重试',
      icon: 'none',
    })
  }
}
</script>

<template>
  <view class="login">
    <view class="login__logo">
      <image class="login__logo-img" src="/static/images/logo.png" mode="aspectFit" />
    </view>

    <view class="login__title">微信手机号一键登录</view>
    <view class="login__desc">用于创建账号并绑定手机号，我们不会向你泄露任何隐私信息。</view>

    <button class="login__btn" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
      使用微信手机号一键登录
    </button>

    <view class="login__tip">
      登录即代表你已同意
      <text class="login__link">《用户协议》</text>
      和
      <text class="login__link">《隐私政策》</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login {
  min-height: 100vh;
  padding: 80rpx 40rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #ffffff;

  &__logo {
    margin-bottom: 40rpx;

    &-img {
      width: 180rpx;
      height: 180rpx;
      border-radius: 40rpx;
    }
  }

  &__title {
    font-size: 36rpx;
    font-weight: 600;
    margin-bottom: 16rpx;
    color: #333333;
  }

  &__desc {
    font-size: 26rpx;
    color: #999999;
    text-align: center;
    line-height: 1.6;
    margin-bottom: 80rpx;
  }

  &__btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    background: #27ba9b;
    font-size: 30rpx;

    &::after {
      border: none;
    }
  }

  &__tip {
    margin-top: 32rpx;
    font-size: 24rpx;
    color: #999999;
    text-align: center;
  }

  &__link {
    color: #27ba9b;
  }
}
</style>
