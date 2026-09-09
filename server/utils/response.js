export const success = (res, data = null, message = '操作成功') =>
  res.json({ code: 0, message, data })

export const fail = (res, message = '操作失败', code = 400) =>
  res.status(code).json({ code, message, data: null })
