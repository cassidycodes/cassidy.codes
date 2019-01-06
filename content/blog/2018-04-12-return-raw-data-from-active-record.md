+++
date = "2018-04-12"
title = "Writing Super Fast Queries in Rails"
slug = "2018/04/12/return-raw-data-from-active-record"
+++

At work this week I had to speed up a background job that was clogging up our queue. This job aggregates data on records and posts to our Elastic Search index. It was suffering from all kinds of extra database calls. I had lots of fun working on this query! It’s so satisfying to make things fast.

Here’s a bit of what I learned about building SQL queries that  can get tough with a typical ActiveRecord object.

## A bit about the data

Let’s imaging we have a blog that has many users. Each user has many posts, and posts have many comments. Your database might look like this:

**users**

```
id | name
---|------------------
1  | Sonja Sis
2  | Nicol Hollinghead
3  | Edison Huseman
```

**posts**

id|title|body|user_id
1 | I love dogs | Dogs are great. | 1
2 | I love cats | Cats are better than dogs. | 2
3 | I love both dogs and cats | Pets are fun. | 3

**comments**

```
id | body          | user_id | post_id
---|---------------|---------|--------
1  | Me too!       | 3       | 2
2  | They are not! | 1       | 2
```

Now lets say we want to know how many comments each post has received in the last 90 days, 30 days, and 15 days. We're looking for a data structure like this in the end:

```ruby
{ 1 => { ninety_days:  190,
         thirty_days:  67,
         fifteen_days: 14 },
  2 => { ninety_days:  583,
         thirty_days:  392,
         fifteen_days: 83 } }
```

We could try something like this:

```ruby
class Post < ActiveRecord::Base
  scope :between, (range)-> { where(created_at: range }
end

class MyPostSummary
  def self.summarize
    Post.find_each.with_object({}) do |post, h|
      h[:post_id] = {}
      h[post.id][:ninety_days] =
        post.comments.between(90.days.ago..0.days.ago).count
      h[post.id][:thirty_days] =
        post.comments.between(30.days.ago..0.days.ago).count
      h[:post_id][:fifteen_days] =
        post.comments.between(15.days.ago..0.days.ago).count
  end
end

MyPostSummary.summarize

# { 1 => { ninety_days: 190,
#         thirty_days:  67,
#         fifteen_days: 14 },
#  2 => { ninety_days:  583,
#         thirty_days:  392,
#         fifteen_days: 83 } }
```

Pretty repetitive, right? If we’re building a summary of all of our the posts in our blog, we're going to be doing a lot of unnecessary counting!

## Using `select`

When I first tackled this problem, I thought, “Hmmm, maybe I can use ActiveRecord's `select` to select a count for each period.” This does wonders for saving database queries! I’ll leave out the rest of the class here for brevity. Here’s what that query looks like:

```ruby
# Use SQL to count the comments for each post.
select = <<~SQL
           posts.id,
           Count(IF(comments.created_at >
                    DATE_SUB(CURRENT_TIMESTAMP, 90 DAY),
                    comments.id,
                    NULL)) AS ninety_days,
           Count(IF(DATE_SUB(CURRENT_TIMESTAMP, 30 DAY),
                    comments.id,
                    NULL)) AS thirty_days,
           Count(IF(DATE_SUB(CURRENT_TIMESTAMP, 15 DAY),
                    comments.id,
                    NULL)) AS fifteen_days
         SQL
```

We need a `LEFT OUTER JOIN` here because we want to be sure we get posts back even if they have 0 comments.

Also note the `group` here. Without this, we'd get 1 post record back for each comment and we'd end up with duplicates because posts have many comments!

```ruby
posts = Post.left_outer_joins(:comments)
            .select(select)
            .group("posts.id")

posts.find_each.with_object({}) do |post, h|
  h[:post_id] = {}
  h[post.id][:ninety_days]  = post.ninety_days
  h[post.id][:thirty_days]  = post.thirty_days
  h[post.id][:fifteen_days] = post.fifteen_days
end
```

Ok, great! We’ve solved the problem of counting the going back to the database to count the comments. Now we just do one query that returns a count for us.

Did you know that when you add `SELECT … AS my_select`, ActiveRecord will add a method for that attribute to the object returned? That’s why `post.ninety_days` works in the code above.  I thought that was pretty handy.

I’m still not comfortable with this end result though. We’re loading records into ActiveRecord when all we need from them is the count data and the post id.

## `exec_query` to the rescue!

`exec_query` returns a hash of the column names and values you asked for. This lets you skip active record entirely!

```ruby
query = Post.left_outer_joins(:comments)
            .select(select)
            .group("posts.id")
            .to_sql
result = Post.connection.exec_query(query)
# => [{ "id"           => 1,
#       "ninety_days"  => 190,
#       "thirty_days"  => 67,
#       "fifteen_days" => 14 }...]

result.map!(&symbolize_keys!).group_by(&:id)
# =>
# { 1 => { ninety_days: 190,
#         thirty_days:  67,
#         fifteen_days: 14 },
#  2 => { ninety_days:  583,
#         thirty_days:  392,
#         fifteen_days: 83 }
```

Yay! We got the same result and look at how little code it is! If you’re querying a big dataset, this will save to all kinds of time!

## Wrapping Up

If you need to retrieve data from the database, but don't need any of the functionality of your models, use `exec_query` to skip ActiveRecord and speed things up a bit.

If you _do_ need ActiveRecord, then you can add additional attributes to the object you get back by passing SQL into the `select` method and naming giving it a name with `AS`.

For queries that have complex joins, or ones that you might need to build programmatically, relying on ActiveRecord might get difficult. Take a look at [Arel](https://github.com/rails/arel), a library that forms the abstract syntax tree manager behind ActiveRecord, for situations like this.
