/**
 * @typedef Transaction
 * @property {number} id
 * @property {string} sourceAccount
 * @property {string} targetAccount
 * @property {number} amount
 * @property {string} category
 * @property {string} time
 */

// Task: Clean & Sort the transactions
//
// Sometimes when a customer is charged, there is a duplicate transaction created. We need to find those transactions so that they can be dealt with.
//
// Everything about the transaction should be identical, except the transaction id and the time at which it occured, as there can be up to a minute delay

/**
 * @param {Transaction[]} transactions
 */
const findDuplicateTransactions = (transactions = []) => {
  const traversed = {}
  // Note: not certain on this part:
  // the output shows: id: 1 - 3 and then only id: 5 - 6
  // if the duplicates array of array item does not care about the order of the category,
  // we can sort by ascending first
  // sort the transactions in descending order first
  // will go with assumption that the order of the arrays matter, meaning:
  // [[1,2,3], [5,6]]
  // if we can ignore the above, then the result would be
  // [[5,6], [1,2,3]]
  const duplicatesMap = transactions
    .sort((a, b) => new Date(b.time) - new Date(a.time)) // sort descending
    // .sort((a, b) => new Date(a.time) - new Date(b.time)) // sort by ascending
    .reduce((acc, curr) => {
      const { sourceAccount, targetAccount, amount, category, time } = curr;
      // key to the traversed hash table as an identifier
      // this is to ensure check if the transaction has the same:
      // 1. sourceAccount
      // 2. targetAccount
      // 3. amount
      // 4. category
      //
      // after that, we need to group up the transactions
      const key = `${sourceAccount}-${targetAccount}-${amount}-${category}`;

      // if traversed before, check the transaction time against traversed[key].time
      if (traversed[key]) {
        if (Math.abs(new Date(time) - new Date(traversed[key].time)) < 60000) {
          const duplicated = (acc[category] || []).find(t => t.id === traversed[key].id);

          // check if there is duplicate in category array
          if (!duplicated) {
            // initialise initial category array
            if (!acc[category]) acc[category] = []

            // push the traversed transaction and current transaction
            acc[category].push(traversed[key], curr);
          } else {
            acc[category].push(curr);
          }
        }
      }

      traversed[key] = curr;
      return acc;
    }, {})

  // sort transaction in ascending after (only if initially sorted descending)
  return Object.values(duplicatesMap).map((value) => {
    value.sort((a, b) => new Date(a.time) - new Date(b.time))
    return value
  })

  // unnecessary to sort if initial sort is ascending
  // return Object.values(duplicatesMap)
}

module.exports = { findDuplicateTransactions }
