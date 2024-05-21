# Respond.io Assessment

## Table of content:
- [Task 1](#facebook-messenger-bot)
- [Task 2](#clean-and-sort-transactions)
- [Task 3](#how-to-solve-high-volume-write-operations)


The tasks' requirements are stated here: [Task Assessment](https://drive.google.com/file/d/1lIf-25aQ1-s2BtJegcPVcWfpPw0M3aF0/view?usp=sharing)

Below is just general notes on thought process for the accessment tasks


<a id="facebook-messenger-bot"></a>
## Task 1: Facebook Messenger Bot
### Requirement
1. Develop an application that connects with a Facebook Page.
2. Process incoming messages (webhooks) from the Facebook Page.

### Steps
1. Create new Meta App using [Facebook Developers Apps Center](https://developers.facebook.com/apps/?show_reminder=true)
2. Create new Facebook Page for testing (can be some arbitrary one that can be deleted later on)
3. Register Webhooks and Messenger `products` into the created app in [Step 1](#create-new-meta-app-using-facebook-developers-apps-center)
    - Webhooks product steps
        - After registering Webhooks product, make sure to subscribe to the `Page` subscription
        - Provide the webhook url via ngrok (`ngrok http http://localhost:${PORT}`)
        - Provide the Verify Token (to be used in your server for verifying the webhook request)
        - Make sure to subscribe to `messages` Webhook
        - Reference here: https://developers.facebook.com/apps/{FB_APP_ID}/webhooks/
    - Messenger product steps
        - Configure Webhook (same as Webhooks step)
        - Generate Access Tokens (just add the new page you created previously)
        - Reference here: https://developers.facebook.com/apps/{FB_APP_ID}/messenger/messenger_api_settings/
4. Generate the Page Access Token using [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer?method=GET&path=me?fields%3Did,name&version=v19.0)
5. Add the .env variables (please reference [.env.example](./.env.example)) for the values needed
6. Start the server:
    ```
    npm run start
    ```
7. Login to Facebook
8. Send a message to the Facebook Page that is tied to the newly created Meta App
    ```
    /desc 346575
    /price 346575
    /shipping 346575
    /buy 346575
    ```
9. FB Page should respond back to user with details / the purchase order email will be sent to `kyapwc@gmail.com`, please update the `handleFBPurchaseNotification` method to your own email
    - this part is abit confusing and I am not sure if I did it correctly as the assesment documentation states:
        - If customer says `/buy product-xyz`, **you** should receive email with the full product description. i.e: name, price, shipping fee, so that you can process the order for the customer
        - From the above statement, I think it means I (not the user) should receive the email to process the order

### Tests
Using Jest & supertest to mock express server.

```
npm run test
```

### Reasonings
Why did I use Redis?
- It is a simple key-value pair database which fits the requirement and ease-of-use
- It will be unnecessary to install postgres/sql/mongo just for this simple application
- In fact, use of a hash table is much easier but I just want to adhere to the requirement of having to use a database for the solution

Why did I use MailerSend instead of SendGrid?
- When connecting to Sendgrid using Google SSO, the Sendgrid authentication step actually stops working
- Even when clearing cache and so on, I am still unable to sign in
    - When I decide to login (I am under assumption they already store my email from Google SSO) it states `email is already registered`. So I couldn't login / register anymore
    - So, I decided to forget password, which requires the sendgrid `username` which I cannot get yet due to the failed signup via Google SSO
    - Reporting this issue and reaching out to sendgrid will take up too much time, so I opted for MailerSend for simplicity sake
- Reference Image below:
    - ![Sendgrid Google SSO Failed Authentication](https://raw.githubusercontent.com/kyapwc/respondio-task/master/assets/sendgrid_fail_login.png)

Why is my eslint config so basic?
- Decided for simple config as its a small project and not needed for full-scale linter

<a id="clean-and-sort-transactions"></a>
## Task 2: Clean & Sort Transactions
### Requirement
1. Find all transactions that have the same `sourceAccount`, `targetAccount`, `category`, `amount`
2. The time difference between each consecutive transaction is less than 1 minute
3. Everything about the transaction should be identical, except the transaction id and the time at which it occured

> Simplified the input using input id as representation to keep it short

input: `[3, 1, 6, 4, 2, 5]`

expected output: `[[1, 2, 3], [5, 6]]`

### Tests
It uses Jest and its in the same git repo under the file [clean_sort_transactions.js](./clean_sort_transactions.js)
```
npm run test -- tests/clean_sort_transactions.test.js
```

### Thought process
Initial sort of the provided `transactions` array in descending order to ensure it becomes easier to compare each transaction

Initialise a `traversed` hash map to store what transactions we have traversed already

Loop through the sorted `transactions` array and specify a `key` that is a combination of:
1. sourceAccount
2. targetAccount
3. amount
4. category

This is used to check initial duplication first before we further check the `transaction.time` against previously traversed transaction time.

Store the results in an map with type of: `Record<string, array>` and during the return, we can just do a simple `Object.values(duplicatesMap)`

<a id="how-to-solve-high-volume-write-operations"></a>
## Task 3: How to solve the high volume of write operations in RDS MySQL databases?
> Note: My background is mainly lies in the logistics industry so the examples I provide is mostly from logistics standpoint and can differ slightly

I think this subject is quite broad in itself as there are alot of factors that can affect this aspect. What I can think of are:

1. Ensure the indexes you currently have in your database does not significantly affect your WRITE operations as too many indexes can improve the read speed but also affect the write speed
2. If possible to normalise the existing tables for not-so-important columns, please do so, an example is:
    - An example table:
        ```
        Orders table (id, merchantName, merchantPhone, itemName, itemLength, itemWidth, itemHeight, pickupTime, dropoffTime, pickupAddress, pickupLatitude, pickupLongitude, dropoffAddress, dropoffLatitude, dropoffLongitude)
        ```
    - We can normalise it to:
        ```
        Merchant(id, name, phone, createdAt, updatedAt)
        Item(id, orderId, name, length, width, height) // many to 1 with Order table
        Waypoint(id, time, address, latitude, longitude, orderId) // many to 1 with Order table
        Order(id, merchantId)
        ```
    - By doing the above, we can significantly reduce the writes that occur on a singular table and it helps by reducing the need to update a table with more columns and makes the writes more *focused*
    - Furthermore, the sql transaction size is much smaller as it is spread across multiple tables
    - However, please do not normalise the database tables too much as it can lead to alot of issues, especially in the context of `EAV-patterned` tables which significantly reduces the `read` operations depending on context.
3. Batch inserts / updates instead of doing the writes one at a time. This can effectively reduce the amount of write into a single batch query.
4. Simplest way is to regularly check RDS performance insight to check which `WRITE` operations cost the most and which ones block the other operations the most. From that analysis, just fix the query using `EXPLAIN ANALYZE`.
5. If you are using an ORM (like prisma / sequelize), make sure to understand what queries are being written under the hood and how those ORMs are communicating with the database, sometimes it is safer to write raw queries to facilitate better write speeds
6. Use of more optimal storage types (not the most cost-effective strategy and should be used as last resort, depending on business requirements)
7. Use of `READ` replicas for all the reading that is required in your application and only reserve the MASTER/PRIMARY RDS instance for write operations
    - There can be a small delay between write / read instances (maybe few milliseconds) and the ORM you use should be able to provide a way to force the query to use the MASTER/PRIMARY instance
