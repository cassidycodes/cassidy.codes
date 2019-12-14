---
title: "Don't Trust the Cops: Sometimes Rubocop is Wrong"
date: 2019-12-14T10:22:00-05:00
keywords:
  - Linting
  - Rubocop
  - Style Guide
  - Select
  - Count
audio:
description: Rubocop autocorrect doesn't always speak Rails!
images:
series:
  - Ruby
  - Ruby on Rails
  - Linting
tags:
videos:

---

My team at work recently upgraded our version of [Rubocop](https://github.com/rubocop-hq/rubocop), the popular linter
used to enforce good Ruby code style. With the upgrade we got a whole bunch of new suggestions and warnings about style
violations.

One of them that tripped us up was the
[Performance/Count](https://github.com/rubocop-hq/rubocop-performance/blob/master/lib/rubocop/cop/performance/count.rb)
rule.

According to the Rubocop docs:

> This cop is used to identify usages of `count` on an `Enumerable` that follow calls to `select` or `reject`. Querying
logic can instead be passed to the `count` call.

So in plain Ruby, the cop sees that you are filtering an array with `select` or `reject` and _then_ calling `count` on
it. This is inefficient because `count` can actually do all this work for you.

But! What if you're in a Rails project and you have some code that looks like this?

```ruby
@users.select { |u| u.admin? }.count
```

Rubocop will autocorrect this to:

```ruby
@users.count { |u| u.admin? }
```

Looks okay? Well, this will likely execute a SQL count that ignores the block!!! Rubocop incorrectly assumes that
`@users` is an `Array`. Why else would you be calling `select` on it, right?

In our case, though, `@users` was actually an ActiveRecord object that hadn't been loaded yet! Since ActiveRecord
lazy-loads things, sending count to this object executes an SQL `COUNT` that ignores the block passed in!

Here's what it looks like in action:

```ruby
User.count { |u| u.admin? }
# (0.4ms)  SELECT COUNT(*) FROM "users"
# => 320
User.count
# (0.6ms)  SELECT COUNT(*) FROM "users"
# => 320
```

See how we got the same number each time here? This is because ActiveRecord ignores the block passed into count without
raising an error and counts _all_ users!.

The correct thing to do here is to pass your filter parameters into a `where` _and then_ do a `count`.

```ruby
User.where(type: 'admin').count
# (0.3ms)  SELECT COUNT(*) FROM "users" WHERE "users"."type" = $1  [["type", "Admin"]]
# => 10
```

## TL;DR
* ActiveRecord count works like this: https://devdocs.io/rails~4.2/activerecord/calculations#method-i-count
* Ruby count works like this: https://devdocs.io/ruby~2.3/enumerable#method-i-count
* These are two different count methods that can be called on objects that look similar.
* Passing a block to an ActiveRecord count will not raise an error, but will return inaccurate results.
