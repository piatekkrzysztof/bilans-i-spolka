'use client'

/**
 * Stan konfiguratora: Zustand + parametry w URL.
 *
 * Store tworzony per drzewo (kontekst), nie globalnie - przy SSR każde żądanie ma własny stan,
 * a na stronie głównej hero i pełny konfigurator nie dzielą przypadkiem wartości.
 */
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { createStore, type StoreApi, useStore } from 'zustand'
import { calculateQuote, type PriceList, type Quote } from '@/domain/pricing'
import { normalizeQuote, type QuoteInput } from '@/domain/quote'
import { serializeQuoteParams } from '@/domain/quote-params'

export type DisplayMode = 'net' | 'gross'

interface QuoteState {
  input: QuoteInput
  quote: Quote
  display: DisplayMode
  priceList: PriceList
  update: (patch: Partial<QuoteInput>) => void
  toggleAddon: (id: string) => void
  setDisplay: (mode: DisplayMode) => void
}

const QuoteContext = createContext<StoreApi<QuoteState> | null>(null)

function createQuoteStore(initial: QuoteInput, priceList: PriceList) {
  const quote = calculateQuote(initial, priceList)
  return createStore<QuoteState>()((set, get) => ({
    input: quote.input,
    quote,
    display: 'net',
    priceList,
    update: patch => {
      const next = calculateQuote({ ...get().input, ...patch }, get().priceList)
      set({ input: next.input, quote: next })
    },
    toggleAddon: id => {
      const { addons } = get().input
      get().update({ addons: addons.includes(id) ? addons.filter(a => a !== id) : [...addons, id] })
    },
    setDisplay: display => set({ display }),
  }))
}

export function QuoteProvider({
  initial,
  priceList,
  syncUrl = false,
  children,
}: {
  initial: QuoteInput
  priceList: PriceList
  /** Na /wycena każda zmiana trafia do adresu, żeby link można było wysłać wspólnikowi. */
  syncUrl?: boolean
  children: ReactNode
}) {
  const [store] = useState(() => createQuoteStore(normalizeQuote(initial), priceList))

  useEffect(() => {
    if (!syncUrl) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = store.subscribe((state, previous) => {
      if (state.input === previous.input) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        const url = `${window.location.pathname}?${serializeQuoteParams(state.input).toString()}`
        window.history.replaceState(window.history.state, '', url)
      }, 150)
    })
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [store, syncUrl])

  return <QuoteContext.Provider value={store}>{children}</QuoteContext.Provider>
}

export function useQuote<T>(selector: (state: QuoteState) => T): T {
  const store = useContext(QuoteContext)
  if (!store) throw new Error('useQuote musi być użyte wewnątrz <QuoteProvider>')
  return useStore(store, selector)
}
