import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchOrderMessages, sendOrderMessage, markOrderMessagesRead } from '../services/api'
import useOrderTracking from '../hooks/useOrderTracking'
import { toast } from '../utils/soundToast'

export default function ChatDialog({ orderId, orderStatus, onClose, incomingMessages: propIncomingMessages }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  // Use the tracking hook for real-time messages if not provided by parent
  const { incomingMessage: hookIncomingMessage, readEvent } = useOrderTracking(!propIncomingMessages ? orderId : null)

  // Load history & Mark as read initially
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetchOrderMessages(orderId)
        setMessages(res.data.messages)
        // Mark as read immediately on open
        markOrderMessagesRead(orderId)
      } catch (err) {
        toast.error('Failed to load chat history')
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [orderId])

  // Handle incoming messages
  useEffect(() => {
    const newMsg = propIncomingMessages ? propIncomingMessages[propIncomingMessages.length - 1] : hookIncomingMessage
    if (newMsg) {
      if (!messages.find(m => m.id === newMsg.id)) {
        setMessages(prev => [...prev, { ...newMsg, is_me: false }])
        // If we are looking at the chat, mark new incoming messages as read
        markOrderMessagesRead(orderId).catch(() => {})
      }
    }
  }, [propIncomingMessages, hookIncomingMessage])

  // Handle Read Events (When the OTHER party reads OUR messages)
  useEffect(() => {
    if (readEvent) {
      // Mark all OUR messages as read in the local state
      setMessages(prev => prev.map(m => m.is_me ? { ...m, is_read: true } : m))
    }
  }, [readEvent])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return

    setSending(true)
    try {
      const res = await sendOrderMessage(orderId, { content: text })
      const newMsg = {
        id: res.data.id || Date.now(),
        sender_name: 'Me',
        content: text,
        created_at: new Date().toISOString(),
        is_me: true,
        is_read: false
      }
      setMessages(prev => [...prev, newMsg])
      setText('')
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-brand-deep-dark/40 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ y: 100, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 100, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <header className="px-8 py-6 bg-brand-red text-white flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold font-poppins tracking-tight uppercase">Chat with {orderStatus === 'on_the_way' ? 'Rider' : 'Customer'}</h2>
            <p className="text-[10px] opacity-80 font-black uppercase tracking-widest mt-1">Order #{orderId}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 bg-brand-cream/10 no-scrollbar"
        >
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-brand-charcoal font-bold text-sm uppercase tracking-widest">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col ${m.is_me ? 'items-end' : 'items-start'}`}
              >
                <div className={`
                  max-w-[85%] px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm
                  ${m.is_me 
                    ? 'bg-brand-red text-white' 
                    : 'bg-white text-brand-deep-dark border border-[#F0E8D8]'}
                `}>
                  {m.content}
                </div>
                <div className="flex items-center gap-1.5 mt-1 opacity-60">
                  <span className="text-[9px] font-bold text-brand-charcoal uppercase tracking-tighter">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {m.is_me && (
                    <span className="text-[9px] font-black text-brand-red uppercase tracking-widest">
                      • {m.is_read ? 'Seen' : 'Sent'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-6 bg-white border-t border-[#F0E8D8] flex gap-4">
          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 bg-brand-cream/30 border-none rounded-2xl px-6 py-4 text-sm font-inter focus:ring-2 focus:ring-brand-red/20 outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-brand-red text-white p-4 rounded-2xl shadow-lg shadow-brand-red/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
