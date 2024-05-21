const axios = jest.createMockFromModule('axios')

axios.post = async () => {}
axios.isAxiosError = () => false

module.exports = axios
