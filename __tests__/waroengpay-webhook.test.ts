import crypto from 'crypto'
import {
  isWaroengPayTimestampFresh,
  verifyWaroengPaySignature,
} from '@/lib/waroengpay-signature'

const SECRET = 'whsec_test_unit_test_secret'

function sign(timestamp: string, body: string, secret = SECRET): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex')
}

describe('verifyWaroengPaySignature', () => {
  const timestamp = '1700000000'
  const body = JSON.stringify({ event: 'payment.paid', data: { id: 'WRG-TEST' } })

  it('menerima signature yang benar', () => {
    expect(
      verifyWaroengPaySignature(timestamp, body, sign(timestamp, body), SECRET)
    ).toBe(true)
  })

  it('menolak signature dengan secret berbeda', () => {
    const wrong = sign(timestamp, body, 'whsec_lain')
    expect(verifyWaroengPaySignature(timestamp, body, wrong, SECRET)).toBe(false)
  })

  it('menolak body yang diubah setelah ditandatangani', () => {
    const signature = sign(timestamp, body)
    expect(
      verifyWaroengPaySignature(timestamp, body + ' ', signature, SECRET)
    ).toBe(false)
  })

  it('menolak timestamp yang diubah setelah ditandatangani', () => {
    const signature = sign(timestamp, body)
    expect(
      verifyWaroengPaySignature('1700000001', body, signature, SECRET)
    ).toBe(false)
  })

  it('menolak signature kosong', () => {
    expect(verifyWaroengPaySignature(timestamp, body, '', SECRET)).toBe(false)
  })

  it('menolak bila secret tidak dikonfigurasi', () => {
    expect(
      verifyWaroengPaySignature(timestamp, body, sign(timestamp, body), '')
    ).toBe(false)
  })

  it('menolak signature dengan panjang berbeda (tidak melempar error)', () => {
    expect(verifyWaroengPaySignature(timestamp, body, 'deadbeef', SECRET)).toBe(false)
  })
})

describe('isWaroengPayTimestampFresh', () => {
  const now = 1700000000

  it('menerima timestamp saat ini', () => {
    expect(isWaroengPayTimestampFresh(String(now), now)).toBe(true)
  })

  it('menerima timestamp 299 detik lalu', () => {
    expect(isWaroengPayTimestampFresh(String(now - 299), now)).toBe(true)
  })

  it('menerima timestamp 299 detik di masa depan', () => {
    expect(isWaroengPayTimestampFresh(String(now + 299), now)).toBe(true)
  })

  it('menolak timestamp lebih dari 300 detik', () => {
    expect(isWaroengPayTimestampFresh(String(now - 301), now)).toBe(false)
    expect(isWaroengPayTimestampFresh(String(now + 301), now)).toBe(false)
  })

  it('menolak header kosong atau bukan angka', () => {
    expect(isWaroengPayTimestampFresh('', now)).toBe(false)
    expect(isWaroengPayTimestampFresh('abc', now)).toBe(false)
  })
})
