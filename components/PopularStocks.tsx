'use client'

import { TrendingUp } from 'lucide-react'
import { useChatContext } from '@/components/ChatProvider'
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants'

const DISPLAY_COUNT = 20

const PopularStocks = () => {
    const { openChatForTicker } = useChatContext()

    return (
        <section className="w-full">
            <h3 className="mb-4 text-2xl font-semibold text-gray-100">Explore Stocks</h3>
            <div className="flex flex-wrap gap-3">
                {POPULAR_STOCK_SYMBOLS.slice(0, DISPLAY_COUNT).map((ticker) => (
                    <button
                        key={ticker}
                        type="button"
                        onClick={() => openChatForTicker(ticker)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-100 transition-colors hover:border-yellow-500 hover:text-yellow-500"
                    >
                        <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                        {ticker}
                    </button>
                ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">
                Click any ticker to ask Signalist AI about it — real-time data is gathered on demand.
            </p>
        </section>
    )
}

export default PopularStocks
