// 课程要求：基于 rem 的响应式方案。根字号见 base.css（按屏幕宽度自适应）。
export default {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 16,
      propList: ['*'],
      minPixelValue: 2,
      exclude: /node_modules/i
    }
  }
}
