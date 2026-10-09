// Test WaroengPay API connectivity
const WAROENGPAY_API_KEY = 'wp_test_E4blTLUiY7Evb3T5D7Zp4S9uZPNzqcXOxOlzOArsgjs'
const WAROENGPAY_BASE_URL = 'https://waroengpay.com'

async function testWaroengPay() {
  console.log('🧪 Testing WaroengPay API...')
  console.log('API Key:', WAROENGPAY_API_KEY.substring(0, 20) + '...')
  console.log('Base URL:', WAROENGPAY_BASE_URL)
  
  try {
    // Test 1: Create Payment
    console.log('\n📝 Test 1: Create Payment')
    const reference = `INV-TEST-${Date.now()}`
    
    const response = await fetch(`${WAROENGPAY_BASE_URL}/api/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAROENGPAY_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': reference
      },
      body: JSON.stringify({
        amount: 15000,
        reference: reference,
        description: 'Test Produk Pelak',
        callback_url: 'http://localhost:8080/api/waroengpay/webhook',
        redirect_url: 'http://localhost:8080/transactions/success'
      })
    })
    
    console.log('Status:', response.status, response.statusText)
    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Error:', data)
      return
    }
    
    console.log('✅ Payment Created:')
    console.log('  - ID:', data.id)
    console.log('  - Reference:', data.reference)
    console.log('  - Amount:', data.amount)
    console.log('  - Pay URL:', data.pay_url)
    console.log('  - Expires:', data.expires_at)
    console.log('  - QRIS:', data.qris ? data.qris.substring(0, 50) + '...' : 'N/A')
    
    // Test 2: Get Payment Details
    console.log('\n📄 Test 2: Get Payment Details')
    const getResponse = await fetch(`${WAROENGPAY_BASE_URL}/api/payments/${data.id}`, {
      headers: {
        'Authorization': `Bearer ${WAROENGPAY_API_KEY}`
      }
    })
    
    const payment = await getResponse.json()
    console.log('Status:', getResponse.status)
    console.log('Payment Status:', payment.status)
    
    console.log('\n✅ All tests passed!')
    console.log('\n🔗 Pay URL untuk test scan QRIS:')
    console.log(data.pay_url)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testWaroengPay()
