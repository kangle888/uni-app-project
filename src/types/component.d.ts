/**
 * 全局组件类型声明
 * 在模版中直接使用 `<view>`、`<text>`、`<uni-section>` 等标签时
 * 通过这里的声明让 TypeScript 和 Volar 认识这些组件，避免报红。
 *
 * 如果后续你自己封装了全局组件，也可以在这里继续补充。
 */
import 'vue'

declare module 'vue' {
  export interface GlobalComponents {
    // uni-app 基础标签，以小写方式直接在模板中使用：<view> <text>
    view: any
    text: any
    button: any

    // uni-ui 组件（按需继续补充）
    'uni-section': any
    'uni-card': any
  }
}
