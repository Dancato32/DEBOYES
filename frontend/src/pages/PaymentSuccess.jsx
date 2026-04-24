import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyPayment } from '../services/api'
import { toast } from '../utils/soundToast'

export default function PaymentSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying | success | failed
  const [orderData, setOrderData] = useState(null)

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    
    if (!reference) {
      setStatus('failed')
      toast.error('No payment reference found')
      return
    }

    const verify = async () => {
      try {
        const res = await verifyPayment(reference)
        setStatus('success')
        setOrderData(res.data)
        toast.success('Payment confirmed! 🎉')
      } catch (error) {
        setStatus('failed')
        toast.error(error?.response?.data?.error || 'Payment verification failed')
      }
    }

    verify()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-[#F0E8D8] max-w-md w-full text-center space-y-8">
        
        {status === 'verifying' && (
          <>
            <div className="mx-auto h-20 w-20 rounded-full bg-brand-cream flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10 text-brand-red animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-brand-deep-dark font-poppins tracking-tight">Verifying Payment...</h2>
            <p className="text-sm text-brand-charcoal font-inter">Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100 shadow-lg shadow-emerald-100/50">
              <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-deep-dark font-poppins tracking-tight">Payment Successful!</h2>
              <p className="text-sm text-brand-charcoal font-inter mt-2">Your order has been placed and paid for.</p>
            </div>
            
            {orderData && (
              <div className="bg-brand-cream/50 rounded-2xl p-5 border border-[#F0E8D8] space-y-3">
                <div className="flex justify-between text-xs font-bold text-brand-charcoal uppercase tracking-widest font-inter">
                  <span>Amount Paid</span>
                  <span className="text-brand-red font-black text-base">₵{parseFloat(orderData.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-brand-charcoal uppercase tracking-widest font-inter">
                  <span>Channel</span>
                  <span className="text-brand-deep-dark font-black">{orderData.channel === 'mobile_money' ? '📱 Mobile Money' : '💳 Card'}</span>
                </div>
              </div>
            )}

            <button 
              onClick={() => navigate(`/track/${orderData?.order_id}`)}
              className="w-full h-14 rounded-2xl bg-brand-red text-white font-black text-xs uppercase tracking-[0.3em] font-inter shadow-2xl shadow-brand-red/30 hover:bg-brand-dark-red transition-all active:scale-[0.97]"
            >
              Track My Order
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="mx-auto h-24 w-24 rounded-full bg-red-50 flex items-center justify-center border-4 border-red-100">
              <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-deep-dark font-poppins tracking-tight">Payment Failed</h2>
              <p className="text-sm text-brand-charcoal font-inter mt-2">Something went wrong with your payment. Your order has been saved — you can try again or contact support.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/customer')}
                className="w-full h-14 rounded-2xl bg-brand-red text-white font-black text-xs uppercase tracking-[0.3em] font-inter shadow-xl hover:bg-brand-dark-red transition-all"
              >
                Back to Menu
              </button>
              <button 
                onClick={() => navigate('/history')}
                className="w-full h-12 rounded-2xl bg-brand-cream text-brand-deep-dark font-black text-xs uppercase tracking-[0.2em] font-inter border border-[#F0E8D8] hover:bg-brand-cream/70 transition-all"
              >
                View Order History
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
