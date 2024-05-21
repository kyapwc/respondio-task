const { findDuplicateTransactions } = require('../clean_sort_transactions')

/**
 * @param {string} id
 * @param {string} sourceAccount
 * @param {string} targetAccount
 * @param {number} amount
 * @param {string} category
 * @param {string} time
 *
 * @returns {import('../clean_sort_transactions').Transaction} transaction object
 */
const generateTransaction = (id, sourceAccount, targetAccount, amount, category, time) => ({
  id,
  sourceAccount,
  targetAccount,
  amount,
  category,
  time,
})

describe('CleanSortTransactions - Task 2', () => {
  describe('.findDuplicateTransactions', () => {
    it('should find duplicate transactions and sort appropriately', () => {
      const input = [
        generateTransaction(3, 'A', 'B', 100, 'eating_out', '2018-03-02T10:34:30.000Z'),
        generateTransaction(1, 'A', 'B', 100, 'eating_out', '2018-03-02T10:33:00.000Z'),
        generateTransaction(6, 'A', 'C', 250, 'other', '2018-03-02T10:33:05.000Z'),
        generateTransaction(4, 'A', 'B', 100, 'eating_out', '2018-03-02T10:36:00.000Z'),
        generateTransaction(2, 'A', 'B', 100, 'eating_out', '2018-03-02T10:33:50.000Z'),
        generateTransaction(5, 'A', 'C', 250, 'other', '2018-03-02T10:33:00.000Z'),
      ]

      const result = findDuplicateTransactions(input)

      expect(result).toMatchObject([
        [
          generateTransaction(1, 'A', 'B', 100, 'eating_out', '2018-03-02T10:33:00.000Z'),
          generateTransaction(2, 'A', 'B', 100, 'eating_out', '2018-03-02T10:33:50.000Z'),
          generateTransaction(3, 'A', 'B', 100, 'eating_out', '2018-03-02T10:34:30.000Z'),
        ],
        [
          generateTransaction(5, 'A', 'C', 250, 'other', '2018-03-02T10:33:00.000Z'),
          generateTransaction(6, 'A', 'C', 250, 'other', '2018-03-02T10:33:05.000Z'),
        ]
      ])
    })

    it('should find duplicate transactions and sort appropriately #2', () => {
      const input = [
        generateTransaction(1, 'A', 'B', 100, 'eating_out', '2018-03-02T10:30:30.000Z'),
        generateTransaction(2, 'A', 'B', 100, 'eating_out', '2018-03-02T10:31:20.000Z'), // duplicate of 1
        generateTransaction(3, 'A', 'B', 100, 'eating_out', '2018-03-02T10:31:50.000Z'), // duplicate of 1
        generateTransaction(4, 'A', 'B', 100, 'eating_out', '2018-03-02T10:32:30.000Z'), // duplicate of 1

        generateTransaction(5, 'A', 'B', 100, 'chilling', '2018-03-02T10:30:30.000Z'),
        generateTransaction(6, 'A', 'B', 100, 'chilling', '2018-03-02T10:31:10.000Z'), // duplicate of 5
        generateTransaction(7, 'A', 'B', 100, 'chilling', '2018-03-02T10:31:25.000Z'), // duplicate of 5

        generateTransaction(8, 'A', 'B', 100, 'fun', '2018-03-02T10:34:30.000Z'), // non-duplicate
        generateTransaction(9, 'A', 'B', 100, 'play', '2018-03-02T10:34:30.000Z'), // non-duplicate
        generateTransaction(10, 'A', 'B', 100, 'others', '2018-03-02T10:34:30.000Z'), // non-duplicate
        generateTransaction(11, 'A', 'C', 100, 'others', '2018-03-02T10:34:30.000Z'), // non-duplicate
        generateTransaction(12, 'A', 'B', 150, 'others', '2018-03-02T10:34:30.000Z'), // non-duplicate
      ]
      const result = findDuplicateTransactions(input)

      expect(result).toMatchObject([
        [
          generateTransaction(1, 'A', 'B', 100, 'eating_out', '2018-03-02T10:30:30.000Z'),
          generateTransaction(2, 'A', 'B', 100, 'eating_out', '2018-03-02T10:31:20.000Z'), // duplicate of 1
          generateTransaction(3, 'A', 'B', 100, 'eating_out', '2018-03-02T10:31:50.000Z'), // duplicate of 1
          generateTransaction(4, 'A', 'B', 100, 'eating_out', '2018-03-02T10:32:30.000Z'), // duplicate of 1
        ],
        [
          generateTransaction(5, 'A', 'B', 100, 'chilling', '2018-03-02T10:30:30.000Z'),
          generateTransaction(6, 'A', 'B', 100, 'chilling', '2018-03-02T10:31:10.000Z'), // duplicate of 5
          generateTransaction(7, 'A', 'B', 100, 'chilling', '2018-03-02T10:31:25.000Z'), // duplicate of 5
        ],
      ])
    })
  })
})
