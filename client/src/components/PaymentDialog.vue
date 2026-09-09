<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CreditCard, Lock } from '@element-plus/icons-vue'
import { payOrder } from '@/api/order'

const props = defineProps({ modelValue: Boolean, order: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'paid'])
const formRef = ref(); const loading = ref(false)
const form = reactive({ cardNumber: '', cardholder: '', expiry: '', cvv: '' })
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const cardDigits = computed(() => form.cardNumber.replace(/\D/g, ''))
const cardBrand = computed(() => cardDigits.value.startsWith('4') ? 'Visa' : /^5[1-5]/.test(cardDigits.value) ? 'Mastercard' : '')
const cardClass = computed(() => cardBrand.value === 'Visa' ? 'visa' : cardBrand.value === 'Mastercard' ? 'mastercard' : 'unknown')

function luhn(number) {
  let sum = 0; let doubleDigit = false
  for (let index = number.length - 1; index >= 0; index -= 1) {
    let digit = Number(number[index]); if (doubleDigit) { digit *= 2; if (digit > 9) digit -= 9 }; sum += digit; doubleDigit = !doubleDigit
  }
  return sum % 10 === 0
}
function validCard(rule, value, callback) {
  const supported = /^(?:4\d{12}(?:\d{3}){0,2}|5[1-5]\d{14})$/.test(cardDigits.value)
  if (!supported || !luhn(cardDigits.value)) callback(new Error('请输入有效的 Visa 或 Mastercard 测试卡号'))
  else callback()
}
function validExpiry(rule, value, callback) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value)
  if (!match) return callback(new Error('请输入 MM/YY 格式的有效期'))
  const now = new Date(); const year = 2000 + Number(match[2]); const month = Number(match[1])
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return callback(new Error('信用卡已过期'))
  callback()
}
const rules = {
  cardNumber: [{ required: true, message: '请输入卡号', trigger: 'blur' }, { validator: validCard, trigger: 'blur' }],
  cardholder: [{ required: true, message: '请输入持卡人姓名', trigger: 'blur' }, { min: 2, message: '姓名至少 2 个字符', trigger: 'blur' }],
  expiry: [{ required: true, message: '请输入有效期', trigger: 'blur' }, { validator: validExpiry, trigger: 'blur' }],
  cvv: [{ required: true, message: '请输入 CVV', trigger: 'blur' }, { pattern: /^\d{3,4}$/, message: 'CVV 为 3 或 4 位数字', trigger: 'blur' }]
}
function formatCard(value) { return value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() }
function formatExpiry(value) { const digits = value.replace(/\D/g, '').slice(0, 4); return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits }
function reset() { Object.assign(form, { cardNumber: '', cardholder: '', expiry: '', cvv: '' }); formRef.value?.clearValidate() }
async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await payOrder(props.order.id, { payment_brand: cardBrand.value, payment_last4: cardDigits.value.slice(-4) })
    ElMessage.success('模拟支付成功，等待商家发货')
    visible.value = false
    emit('paid')
  } finally { loading.value = false }
}
watch(() => form.cardNumber, value => { const formatted = formatCard(value); if (formatted !== value) form.cardNumber = formatted })
watch(() => form.expiry, value => { const formatted = formatExpiry(value); if (formatted !== value) form.expiry = formatted })
watch(() => form.cvv, value => { const digits = value.replace(/\D/g, '').slice(0, 4); if (digits !== value) form.cvv = digits })
watch(visible, value => { if (value) reset() })
</script>

<template>
  <el-dialog v-model="visible" title="模拟信用卡支付" width="510px" :close-on-click-modal="false" destroy-on-close>
    <div class="payment-summary"><span>应付金额</span><strong>¥{{ Number(order?.total_price || 0).toFixed(2) }}</strong></div>
    <div class="security-note"><el-icon><Lock /></el-icon>仅供课程演示：请使用测试卡号；完整卡号、有效期和 CVV 不会上传或保存。</div>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-form-item label="信用卡号" prop="cardNumber"><el-input v-model="form.cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="23"><template #prefix><span class="card-brand" :class="cardClass"><template v-if="cardBrand === 'Visa'">VISA</template><template v-else-if="cardBrand === 'Mastercard'"><i></i><i></i></template><el-icon v-else><CreditCard /></el-icon></span></template></el-input><div class="brand-hint"><span v-if="cardBrand">已识别：{{ cardBrand }}</span><span v-else>4 开头识别 Visa，51–55 开头识别 Mastercard</span></div></el-form-item>
      <el-form-item label="持卡人姓名" prop="cardholder"><el-input v-model="form.cardholder" autocomplete="cc-name" placeholder="测试用户" /></el-form-item>
      <div class="split-fields"><el-form-item label="有效期" prop="expiry"><el-input v-model="form.expiry" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="MM/YY" /></el-form-item><el-form-item label="CVV" prop="cvv"><el-input v-model="form.cvv" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="3 或 4 位" show-password /></el-form-item></div>
      <div class="test-cards">测试卡：Visa 4242 4242 4242 4242；Mastercard 5555 5555 5555 4444</div>
    </el-form>
    <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" :loading="loading" @click="submit">确认模拟支付 ¥{{ Number(order?.total_price || 0).toFixed(2) }}</el-button></template>
  </el-dialog>
</template>

<style scoped>
.payment-summary { display: flex; align-items: baseline; justify-content: space-between; padding: .9rem 1rem; border-radius: .65rem; background: #fff3ef; color: #667085; }.payment-summary strong { color: #e64545; font-size: 1.55rem; }.security-note { display: flex; gap: .4rem; margin: .85rem 0 1.15rem; color: #667085; font-size: .78rem; line-height: 1.55; }.security-note .el-icon { flex: 0 0 auto; margin-top: .05rem; color: #ec552f; }.split-fields { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }.brand-hint, .test-cards { margin-top: .35rem; color: #98a2b3; font-size: .72rem; line-height: 1.45; }.test-cards { margin-top: -.25rem; }.card-brand { display: grid; width: 2rem; height: 1.15rem; place-items: center; border-radius: .2rem; background: #eef2f6; color: #667085; font-size: .5rem; font-weight: 900; letter-spacing: -.04em; }.card-brand.visa { background: #1a3e8b; color: #fff; font-style: italic; }.card-brand.mastercard { position: relative; display: flex; width: 1.9rem; background: transparent; }.card-brand.mastercard i { width: .8rem; height: .8rem; border-radius: 50%; background: #e64938; }.card-brand.mastercard i + i { margin-left: -.25rem; background: #f1a230; mix-blend-mode: multiply; }.card-brand.unknown { font-size: .9rem; }.el-dialog :deep(.el-button--primary) { background: #ec552f; border-color: #ec552f; }
</style>
