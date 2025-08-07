interface Transaction {
  id: string
  status: 'Success' | 'Failure'
  duration: string
  date: string
  region: string
  amount: string
  transactionId: string
}

const mockTransactions: Transaction[] = [
]

const TransactionHistory = () => {
  return (
    <div className="w-full">
      <h2 className="text-white text-lg font-semibold mb-4 pb-2">
        Transaction History
      </h2>

      <div className="space-y-2">
        {mockTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex flex-col md:flex-row md:items-center md:justify-between p-3 gap-2 md:gap-3"
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.20)',
              backdropFilter: 'blur(2px)'
            }}
          >
            {/* Mobile Layout - 4 column layout */}
            <div className="flex items-center gap-3 md:hidden">
              {/* Green dot */}
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  transaction.status === 'Success' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />

              {/* Duration and Date column */}
              <div className="flex flex-col text-white text-sm flex-1">
                <div className="font-medium">{transaction.duration}</div>
                <div>{transaction.date}</div>
              </div>

              {/* Region column */}
              <div className="text-white text-sm flex-1 text-center">
                {transaction.region}
              </div>

              {/* Amount and Transaction ID column */}
              <div className="flex flex-col text-white text-sm flex-1 text-right">
                <div className="font-medium">{transaction.amount}</div>
                <div>{transaction.transactionId}</div>
              </div>
            </div>

            {/* Desktop Layout - Original horizontal layout with labels */}
            <div className="hidden md:flex md:items-center md:justify-between md:w-full">
              <div className="flex items-center gap-6">
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      transaction.status === 'Success' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium text-white`}
                  >
                    {transaction.status}
                  </span>
                </div>

                {/* Duration and Date - Stacked */}
                <div className="flex flex-col text-white text-sm">
                  <div>
                    <span className="text-gray-400">Duration:</span> {transaction.duration}
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span> {transaction.date}
                  </div>
                </div>
              </div>

              {/* Region - Center */}
              <div className="text-white text-sm">
                <span className="text-gray-400">Region:</span> {transaction.region}
              </div>

              {/* Amount and Transaction ID - Stacked */}
              <div className="flex flex-col text-white text-sm text-right">
                <div>
                  <span className="text-gray-400">Amount:</span> {transaction.amount}
                </div>
                <div>
                  <span className="text-gray-400">Transaction ID:</span> {transaction.transactionId}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockTransactions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
        </div>
      )}
    </div>
  )
}

export default TransactionHistory