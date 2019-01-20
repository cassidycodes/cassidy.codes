+++
title="Async Jobs Trasaction Block Rails"
date=2019-01-19
draft=true
+++

# Asynchronous Jobs with Acts As State Machine

Last week a coworker and I were stumped on a problem in Rails that took us a bit to figure out and I'd like to share it with you here.

We were working with [Acts as State Machine](https://github.com/aasm/aasm) (AASM), an implementation of a [state machine](https://en.wikipedia.org/wiki/Finite-state_machine) in Ruby. Essentially, this lets us define state changes that can trigger callbacks on the model.

I'll start here with a quick overview of what AASM is then dig into the `transaction` block in Rails.

## What is AASM?

Lets say you are building an online store and you want to be able to approve new products before they go live on your store. You might have a class that looks like this:

```ruby
class Product < ApplicationRecord
  include AASM

  aasm do
    state :pending, initial: true
    state :published

    event :approve do
      transitions from: :pending, to: :published
    end
  end
end
```

Now you can use the state machine to transition a product from "pending" to "published" using AASM.

```ruby
p = Product.new
# => #<Product id: nil, state: "pending", created_at: nil, updated_at: nil>
p.approve!
# =>   (0.2ms)  begin transaction
#      SQL (25.4ms)  INSERT INTO "products" ("state", "created_at", "updated_at") VALUES (?, ?, ?)  [["state", "published"], ["created_at", "2019-01-15 02:08:01.067900"], ["updated_at", "2019-01-15 02:08:01.067900"]]
#      (1.4ms)  commit transaction
```

When we approve the new product, AASM changes the state to `published` in the database. 

Now lets say that when a new product is approved, you want to create some metadata and notify the person who added the product. You could use one of AASM's callbacks to do this:


```ruby
class Product < ApplicationRecord
  include AASM

  has_one :product_meta

  aasm do
    state :pending, initial: true
    state :published

    event :approve, after_commit: :notify_product_owner do
      transitions from: :pending, to: :published
    end
  end

  private

  def notify_product_owner
    meta = ProductMeta.create((product: self, note: 'A very good product.')
    NotifyProductOwnerWoker.perform_async(meta.id)
  end
end
```

AASM will call the `notify_product_owner` method during the `after_commit` callback and enqueue a new job. Lets say our `NotifiyProductOwnerWorker` looks something like this.

```ruby
class NotifyProductOwnerWorker
  include Sidekiq::Worker

  def perform(product_meta_id)
    meta = ProductMeta.find!(product_meta_id)
    logger.info(meta.note)
  end
end
```

I realize that this example is a little contrived, but you get the idea.

Now, in a normal ActiveRecord callback, this would work perfectly well. But, look what we get from Sidekiq when it tries to process that job:

```
2019-01-20T21:00:13.456Z 88944 TID-ov6xe11gc NotifyProductOwnerWorkerWorker JID-2b0c4a4e4757f0b7a3c65fbb INFO: start
2019-01-20T21:00:13.535Z 88944 TID-ov6xe11gc NotifyProductOwnerWorkerWorker JID-2b0c4a4e4757f0b7a3c65fbb INFO: fail: 0.078 sec
2019-01-20T21:00:13.535Z 88944 TID-ov6xe11gc WARN: {"context":"Job raised exception","job":{"class":"NotifyProductOwnerWorkerWorker","args":[16],"retry":true,"queue":"default","jid":"2b0c4a4e4757f0b7a3c65fbb","created_at":1548018013.436509,"enqueued_at":1548018013.4369972},"jobstr":"{\"class\":\"NotifyProductOwnerWorkerWorker\",\"args\":[16],\"retry\":true,\"queue\":\"default\",\"jid\":\"2b0c4a4e4757f0b7a3c65fbb\",\"created_at\":1548018013.436509,\"enqueued_at\":1548018013.4369972}"}
2019-01-20T21:00:13.535Z 88944 TID-ov6xe11gc WARN: ActiveRecord::RecordNotFound: Couldn't find ProductMeta with 'id'=16
2019-01-20T21:00:13.535Z 88944 TID-ov6xe11gc WARN: /Users/cassidy/.rbenv/versions/2.3.0/lib/ruby/gems/2.3.0/gems/activerecord-4.2.8/lib/active_record/core.rb:155:in `find'
/Users/cassidy/code/example/aasm-example/app/workers/notify_product_owner_worker_worker.rb:5:in `perform'jkj
```

Oh no! Sidekiq can't find our metadata! When my coworker and I were debugging this, we even stuck a `ProductMeta.exists?(meta.id)` before we enqueued the worker:

```ruby
def create_meta_notify_product_owner
  meta = ProductMeta.create(product: self, note: 'A very good product.')
  Rails.logger.info(
    "product_meta id: #{meta.id} exists? #{ProductMeta.exists?(meta.id)}"
  )
  NotifyProductOwnerWorkerWorker.perform_async(meta.id)
end
```

Here's what the Rails logs look like for that: 

```
(0.1ms)  begin transaction
SQL (1.4ms)  INSERT INTO "products" ("state", "created_at", "updated_at") VALUES (?, ?, ?)  [["state", "pending"], ["created_at", "2019-01-20 21:17:57.039093"], ["updated_at", "2019-01-20 21:17:57.039093"]]
(2.7ms)  commit transaction
(0.1ms)  begin transaction
SQL (2.0ms)  UPDATE "products" SET "state" = ?, "updated_at" = ? WHERE "products"."id" = ?  [["state", "published"], ["updated_at", "2019-01-20 21:17:57.050228"], ["id", 19]]
(1.2ms)  commit transaction
(0.1ms)  begin transaction
SQL (1.6ms)  INSERT INTO "product_meta" ("product_id", "note", "created_at", "updated_at") VALUES (?, ?, ?, ?)  [["product_id", 19], ["note", "A very good product."], ["created_at", "2019-01-20 21:17:57.103837"], ["updated_at", "2019-01-20 21:17:57.103837"]]
(2.9ms)  commit transaction
ProductMeta Exists (1.0ms)  SELECT  1 AS one FROM "product_meta" WHERE "product_meta"."id" = ? LIMIT 1  [["id", 5]]
product_meta id: 5 exists? true
=> true
```

So according to the model code, the ProductMeta record exists, but the Sidekiq worker can't find it!

## What is a Transaction?

AASM uses what's called a transaction to during the state transitions. Transactions are  mentioned the [readme](https://github.com/aasm/aasm#transaction-support), but it's easy to gloss over if you don't know what you're looking for.

The MySQL docs give a [great definition here](https://dev.mysql.com/doc/refman/5.6/en/glossary.html#glos_transaction):

> Transactions are atomic units of work that can be committed or rolled back. When a transaction makes multiple changes to the database, either all the changes succeed when the transaction is committed, or all the changes are undone when the transaction is rolled back.

>Database transactions, as implemented by InnoDB, have properties that are collectively known by the acronym ACID, for atomicity, consistency, isolation, and durability. 

OK, so a transaction is a single unit of work that needs to be done all together. Think of it like a bank transaction. Once you say "Give me $100", the bank has to record that debit on your account and give you the cash. Both of those things together constitute a transaction.

Also, there's a really great acronym in that definition. If you don't know what ACID is, [checkout the definition](https://dev.mysql.com/doc/refman/5.6/en/glossary.html#glos_acid).

## What is a Transaction in Rails?

In Rails land, a transaction is a way of accessing your database's transaction syntax. With one caveat: it's not SQL, which means that we can have additional code that isn't related to the database inside the `transaction` block. 

Here's the example from the [Active Record Transactions](https://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html) docs:

```ruby
ActiveRecord::Base.transaction do
  david.withdrawal(100)
  mary.deposit(100)
end
```

## Transactions in AASM

Now back to our original problem. We now know that AASM will execute callbacks inside of a transaction. This means that our code above is essentially doing enqueuing the worker inside of the transaction block.

```ruby
ActiveRecord::Base.transaction do
  meta = ProductMeta.create(product: self, note: 'A very good product.')
  NotifyProductOwnerWoker.perform_async(meta.id)
end
```

## So what's going on here?

Why does the metadata exist in the database for one part of the code, but not for the other? The answer, of course, is in the [Rails docs for transactions](https://api.rubyonrails.org/classes/ActiveRecord/Transactions/ClassMethods.html):

>## Transactions are not distributed across database connections

>A transaction acts on a single database connection. If you have multiple class-specific databases, the transaction will not protect interaction among them. One workaround is to begin a transaction on each class whose models you alter:

>```
>Student.transaction do
>  Course.transaction do
>    course.enroll(student)
>    student.units += course.units
>  end
>end
>```

>This is a poor solution, but fully distributed transactions are beyond the scope of Active Record.

Honestly, if you read that and think, "But we're only using one database!", you're right. The docs here are a little confusing. Database connections are separate from using "class-specific" databases! But it remains true that the changes are not distributed across database connections until the transaction block is done.

In the [MySQL docs](https://dev.mysql.com/doc/refman/5.6/en/savepoint.html) says that "`InnoDB` does _**not**_ release the row locks that were stored in memory after the savepoint".

Aha! So that's why `ProductMeta.exists?` works when the job still fails! Our model is using a connection to the database that hasn't released the savepoint yet. What's a "savepoint" you say? It's essentially a way of saying to the DB, "OK, I'm done, you can take this transaction and commit it." So as far as our Ruby code is concerned, the record exists, but the rows won't be released until _after_ we finish the current transaction.

## What's the solution then?

It's been a long trip to get here. We've waded through docs for AASM, MySQL and Rails. We learned about transactions in MySQL and in Rails.
