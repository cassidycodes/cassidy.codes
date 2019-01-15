+++
title = "Concatenating MySQL Results with Group_concat and Concat_ws"
slug = "2018/05/26/concatenating-mysql-results-with-group-by"
date = "2018-05-26"
+++
Recently, I needed to build a query that would transform data in our database into a format that we posted to ElasticSearch. I'll use the example of blog posts here since they're easy for everyone to grasp. Imagine that each post can have many tags and you want one field on ElasticSearch with the tag ids and another field that has the tag names and description.

Here's what the database might look like:

*posts*

```
id | title
---|------------------------------
1  | Blogging about dogs is fun!
2  | Look at these cute dogs
3  | Wow how about these cute dogs
```

*post_tags*

```
post_id | tag_id
--------|-------
1       | 1
1       | 2
2       | 1
2       | 3
3       | 1
```

*tags*

```
id | name | description
---|------|-----------------
1  | dogs | Posts about dogs
2  | cute | Cute things
3  | omg  | OMG CUTE
```

And here is the result we're looking for:

```
id | title                       | tag_ids | tag_names_descriptions
---|-----------------------------|---------|------------------------------------------
1  | Blogging about dogs is fun! | 1, 2    | dogs, cute, Posts about dogs, Cute things
```

## Starting Query

Let's start by retrieving a join table of our posts and tags. We'll limit this to one post to keep our tables small for this example.

```sql
SELECT post.id,
       post.title,
       tag.id          AS tag_id,
       tag.name        AS tag_name,
       tag.description AS tag_description
FROM   posts post
       INNER JOIN posts_tags pt
               ON pt.post_id = post.id
       INNER JOIN tags tag
               ON tag.id = pt.tag_id
LIMIT  1;
```

```
id | title                       | tag_id | tag_name | tag_description
---|-----------------------------|--------|----------|-----------------
1  | Blogging about dogs is fun! | 1      | dogs     | Posts about dogs
2  | Blogging about dogs is fun! | 2      | cute     | Cute things
```

Ok, great, we have a table with our post and its tags, but we have duplicate rows! We can use `GROUP BY` to group these row by the post id, but then we'll lose the tag data in the second row and get a result that looks like this:

```
id | title                       | tag_id | tag_name | tag_description
---|-----------------------------|--------|----------|-----------------
1  | Blogging about dogs is fun! | 1      | dogs     | Posts about dogs
```

## Group_concat

We can use the `Group_concat` function to concatenate data from multiple rows when we use `GROUP BY`:

```sql
SELECT post.id,
       post.title,
       Group_concat(tag.id) AS tag_ids,
       tag.name             AS tag_name,
       tag.description      AS tag_description
FROM   posts post
       INNER JOIN posts_tags pt
               ON pt.post_id = post.id
       INNER JOIN tags tag
               ON tag.id = pt.tag_id
GROUP  BY post.id
LIMIT  1;  
```

```
id | title                       | tag_ids | tag_name | tag_description
---|-----------------------------|---------|----------|-----------------
1  | Blogging about dogs is fun! | 1, 2    | dogs     | Posts about dogs
```

Take a look at [the MySQL Docs for Group_concat](https://dev.mysql.com/doc/refman/8.0/en/group-by-functions.html#function_group-concat) you can do some cool things with it like ensure the values are unique, sort the values, and choose a custom separator.

But what about our tag_name and tag_description? Here, we need to concatenate two separate columns into one!

## Concat_ws

We know that `Group_concat` gives us a string, so if we look under String Functions in the MySQL docs, we'll find [`Concat_ws`](https://dev.mysql.com/doc/refman/8.0/en/string-functions.html#function_concat-ws). `Concat_ws` lets us concatenate two or more strings with a separator between them. The separator is a comma by default, but for legibility, we want a space too, so let's use the `SEPARATOR` option. Here are our steps:

Concatenate the tag name:

```sql
Group_concat(tag.name SEPARATOR ", ")
```

Concatenate the tag description:

```sql
Group_concat(tag.description SEPARATOR ", ")
```

And concatenate both of those!

```sql
Concat_ws(
  ", "
  Group_concat(tag.name SEPARATOR ", "),
  Group_concat(tag.description SEPARATOR ", ")
)
```

### Putting it all together

```sql
SELECT post.id,
       post.title,
       Group_concat(tag.id) AS tag_ids,
       Concat_ws(
         ", "
         Group_concat(tag.name SEPARATOR ", "),
         Group_concat(tag.description SEPARATOR ", ")
       )                    AS tag_names_descriptions
FROM   posts post
       INNER JOIN posts_tags pt
               ON pt.post_id = post.id
       INNER JOIN tags tag
               ON tag.id = pt.tag_id
GROUP  BY post.id
LIMIT  1;
```

```
id | title                       | tag_ids | tag_name   | tag_descriptions
---|-----------------------------|---------|------------|------------------------------
1  | Blogging about dogs is fun! | 1, 2    | dogs, cute | Posts about dogs, Cute things
```

## Nice work!

In this post, we've learned how to use `Group_concat` to concatenate data in a column when using `GROUP BY`. `Group_concat` lets us keep data that would otherwise disappear when we group things.

We also learned how to combine data from multiple columns by using `Concat_ws` together with `Group_concat`. With this function, we can join multiple columns and rows together into one value.
