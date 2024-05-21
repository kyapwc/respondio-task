const axios = jest.createMockFromModule('axios')

axios.post = async () => ({ data: { success: true } })
axios.isAxiosError = () => false

module.exports = axios
