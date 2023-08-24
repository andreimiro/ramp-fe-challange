import { useCallback, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<
    Transaction[]
  > | null>(null)

  const fetchAll = useCallback(async () => {
    const response = await fetchWithCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
        "paginatedTransactions",
        {
          page: paginatedTransactions?.nextPage ?? 0
        }
    )

    setPaginatedTransactions((previousResponse) => {
      if (response === null) {
        return previousResponse
      }

      if (previousResponse === null) {
        return response
      }

      //Bug 4: Merged old data with new data.
      return {
        data: [...previousResponse.data, ...response.data],
        nextPage: response.nextPage
      }
    })
  }, [fetchWithCache, paginatedTransactions])

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData }
}
