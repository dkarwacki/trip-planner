/**
 * Mobile Chat Input
 * Touch-optimized input field with keyboard handling
 * 
 * Features:
 * - Auto-expanding textarea (1-4 lines max)
 * - Prevents zoom on focus (font-size ≥16px)
 * - Adjusts position when keyboard appears
 * - Large touch targets for buttons (44px)
 * - Suggested prompts as horizontal scrolling chips
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

interface MobileChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestedPrompts?: string[];
  autoFocus?: boolean;
}

export function MobileChatInput({ 
  onSend, 
  disabled = false, 
  placeholder = 'Ask anything...',
  suggestedPrompts = [],
  autoFocus = false
}: MobileChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { keyboardHeight } = useKeyboardHeight();

  // Auto-focus when modal opens
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Auto-resize textarea (max 4 lines)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Max 4 lines (~96px)
      const maxHeight = 96;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile, Enter submits (no Shift+Enter needed)
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div 
      className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 transition-transform duration-200"
      style={{
        transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Suggested prompts - horizontal scroll */}
      {suggestedPrompts.length > 0 && message.trim() === '' && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs text-gray-500 mb-2">Suggested:</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                disabled={disabled}
                className="flex-shrink-0 text-sm px-4 py-2 rounded-full bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ minHeight: '36px' }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input field */}
      <div className="flex gap-3 items-end p-4">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
          rows={1}
          maxLength={500}
          style={{
            // Prevent zoom on iOS when focusing input
            fontSize: '16px',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-blue-600 text-white active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {/* Character count */}
      {message.length > 400 && (
        <p className="text-xs text-gray-500 text-right px-4 pb-2">
          {message.length}/500
        </p>
      )}
    </div>
  );
}

