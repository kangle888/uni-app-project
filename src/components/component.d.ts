/**
 * declare module '@vue/runtime-core'
 *   现调整为
 * declare module 'vue'
 */
import XtxSwiper from './XtxSwiper.vue'
import XtGuess from './XtGuess.vue'

declare module 'vue' {
  export interface GlobalComponents {
    XtxSwiper: typeof XtxSwiper
    XtGuess: typeof XtGuess
  }
}

// 组件实例类型
export type XtxSwiperInstance = InstanceType<typeof XtGuess>
