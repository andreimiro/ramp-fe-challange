import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isFilteredByEmployee, setIsFilteredByEmployee] = useState(false) // Bug 6: Added filter in order to manage when is filtered by employee

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()

  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
      async (employeeId: string) => {
        paginatedTransactionsUtils.invalidateData()

        // Bug 3: Checked if the selected value is the "All Employees" option
        if (employeeId === EMPTY_EMPLOYEE.id) {
          // Bug 6
          setIsFilteredByEmployee(false);
          await loadAllTransactions();
        } else {
          // Bug 6
          setIsFilteredByEmployee(true);
          await transactionsByEmployeeUtils.fetchById(employeeId)
        }
      },
      [paginatedTransactionsUtils, transactionsByEmployeeUtils, loadAllTransactions]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />
          {/*Bug 6*/}
          {transactions !== null && !isFilteredByEmployee && paginatedTransactions?.nextPage !== null && (
              <button
                  className="RampButton"
                  disabled={paginatedTransactionsUtils.loading}
                  onClick={async () => {
                    await loadAllTransactions()
                  }}
              >
                View More
              </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
