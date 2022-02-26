---
title: "Two Tools for Diagnosing Slow Endpoints in Rails"
date: 2021-03-29T10:31:01-05:00
keywords:
  - rails
  - ruby 
  - performance
audio:
description:
images:
series:
tags:
videos:

---

##Intro

In general, I see two types of slow endpoints when I am doing performance work: endpoints that have bad code causing a slow response, and endpoints that have a bad query causing a slow response. This post will focus on endpoints that have bad code.

Slow endpoints can be identified using an application performance monitor like NewRelic. These endpoints usually either have [N + 1 queries](https://en.wikipedia.org/wiki/N%2B1_redundancy), or they spend lots of time in Ruby. You’ll see them in NewRelic, but if you want to hit an endpoint in real-time with production data, see the tip below about Rack MiniProfiler.

###NewRelic

The transactions monitor is a good place to start. Pick a broad time range (7 days) and look at the “Transaction Traces” that New Relic has captured. If a transaction trace here includes a long query or lots of queries to the DB, it is likely a good transaction to look into.

There will likely also be some obvious problem queries in the top “Most Time Consuming” transactions. Click through each transaction here and take a look at the transaction traces that NewRelic captured.

The example below has two N + 1 problems! First you see that we hit Memcached 62 times, then we hit the relational database 47 times! Eeep! Looks like this is a good endpoint to work on.

![alt text](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/h2xz4cm73c9vtqg45zq8.png) 

“Most Time Consuming” is not a bad thing. If we have a really fast endpoint that is hit tens of thousands of time per minute, it is not really a problem. But if a relatively busy endpoint has a slow average response time, it likely is a problem!

###Rack MiniProfiler

Development and staging data can differ wildly from production data, which makes query performance differ wildly between the environments.

Running Rack MiniProfiler in production gives you a real-time stack trace of live production data! Check out [the Rack MiniProfiler docs on how to run it in a production environment](https://github.com/MiniProfiler/rack-mini-profiler#access-control-in-non-development-environments)

I like to be able to selectively turn Rack MiniProfiler on and off, so I usually set it up so that you have to log in as an admin user and then you have to have turned it on for your session by adding `?rmp=on` to the first request.

Once Rack MiniProfiler is turned on, you can hit one of the problem endpoints that you see in NewRelic and get more detailed information on what is slowing that request down.

###4 Possible Ways to Resolve Slow Endpoints

This is a non-exhaustive list of possible solutions.
* Find an N + 1? Solve it! You’ll see these in either NewRelic or in Rack Mini Profiler. Solving an N + 1 can mean either eager-loading data using [`includes`](https://devdocs.io/rails~5.2/activerecord/querymethods#method-i-includes), or loading the necessary data in a separate query. It’s usually best to start with using `includes`, and if causes performance issues, try using separate queries.
* Add or improve caching
  * Can the data being queried be cached, or can you use Russian Doll Caching to cache view partials?
  * Can you improve the cache usage by selecting multiple records from the cache rather than doing N + 1 queries to the cache? [Check out the docs on `select_multi`](https://devdocs.io/rails~5.2/activesupport/cache/store#method-i-fetch_multi) to see how we might resolve the 62 queries to the cache in the example above.
* Here's an odd one that you'll find in older applications: Do you even need to display this data? Or do you to display this data with the resolution you are showing? Sometimes older pages slow down because we are trying to show a count of all data from the beginning of time!

Remember, performance work can take a few passes to get it right. Try one strategy at a time, deploy, and monitor until your response time is back to an acceptable level.

I'd love to hear your favourite strategies for tackling slow endpoints.
