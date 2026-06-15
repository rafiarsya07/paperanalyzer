// hooks/useStream.js
// Usage:
//   const { streamText, isStreaming, reset } = useStream()
//   await streamText('/api/ask/stream', { question, paper_id }, setText)

import { useState, useRef, useCallback } from 'react'

export function useStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef(null)

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setIsStreaming(false)
  }, [])

  /**
   * streamText(url, body, onToken)
   * @param {string}   url      - e.g. '/api/ask/stream'
   * @param {object}   body     - JSON body to POST
   * @param {function} onToken  - called with each new full text so far
   *                             e.g. setText(prev => prev + token)
   * @returns {Promise<string>} - full response text when done
   */
  const streamText = useCallback(async (url, body, onToken) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsStreaming(true)
    let fullText = ''

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE format: lines starting with "data: "
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()

          if (raw === '[DONE]') {
            setIsStreaming(false)
            return fullText
          }

          try {
            const parsed = JSON.parse(raw)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.token) {
              fullText += parsed.token
              onToken(fullText)  // give caller the cumulative text
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') {
              console.warn('[useStream] parse error:', e.message)
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[useStream] error:', err)
        throw err
      }
    } finally {
      setIsStreaming(false)
    }

    return fullText
  }, [])

  return { streamText, isStreaming, reset }
}